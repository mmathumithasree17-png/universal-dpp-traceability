const crypto = require('crypto');
const AuditRecord = require('../models/AuditRecord');

const GENESIS_PREV_HASH = '0'.repeat(64);

// In-memory Promise mutex for concurrency safety
let auditMutex = Promise.resolve();

function withAuditLock(fn) {
  const next = auditMutex.then(fn, fn);
  auditMutex = next.catch(() => {});
  return next;
}

/**
 * Strips secrets, passwords, tokens, API keys, and private keys from audit payloads
 */
function sanitizeSecrets(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeSecrets);
  
  const secretKeywords = [
    'password', 
    'token', 
    'secret', 
    'apikey', 
    'api_key', 
    'authorization', 
    'credential', 
    'privatekey', 
    'private_key'
  ];

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (secretKeywords.some(w => k.toLowerCase().includes(w))) {
      clean[k] = '[REDACTED_SECRET]';
    } else if (v && typeof v === 'object') {
      clean[k] = sanitizeSecrets(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Deterministic JSON stringifier with recursively sorted keys (RFC 8785 canonical style)
 */
function canonicalStringify(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj)
    .filter(k => !['_id', '__v', 'createdAt', 'updatedAt', 'tamperedForDemo', 'originalRecordData'].includes(k))
    .sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

/**
 * Compute SHA-256 cryptographic hash of an audit record
 */
function computeRecordHash({
  previousRecordHash,
  auditId,
  sequenceNumber,
  timestamp,
  actionType,
  entityType,
  entityId,
  actor,
  previousValues,
  newValues,
  summary
}) {
  const ts = new Date(timestamp).toISOString();
  const prevValsClean = sanitizeSecrets(previousValues);
  const newValsClean = sanitizeSecrets(newValues);

  const payload = [
    previousRecordHash || GENESIS_PREV_HASH,
    auditId,
    String(sequenceNumber),
    ts,
    actionType,
    entityType,
    entityId,
    actor || 'System Agent',
    canonicalStringify(prevValsClean),
    canonicalStringify(newValsClean),
    (summary || '').trim()
  ].join('|');

  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Record a new tamper-evident audit log entry (hash-linked to previous record)
 */
async function recordAuditEvent({
  auditId: providedAuditId,
  actionType,
  entityType,
  entityId,
  actor = 'System Agent',
  userId,
  previousValues = null,
  previousState = null,
  newValues = null,
  newState = null,
  summary = '',
  description = '',
  ipAddress = '127.0.0.1',
  timestamp: providedTimestamp
}) {
  return withAuditLock(async () => {
    // 1. Fetch all existing records to determine sequence and previous hash
    const allRecords = await AuditRecord.find({});
    const sorted = allRecords.sort((a, b) => 
      (a.sequenceNumber || 0) - (b.sequenceNumber || 0) || 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const sequenceNumber = latest ? (latest.sequenceNumber || sorted.length) + 1 : 1;
    const previousRecordHash = latest 
      ? (latest.currentRecordHash || latest.hashSignature || GENESIS_PREV_HASH)
      : GENESIS_PREV_HASH;

    const auditId = providedAuditId || 'AUD-' + Date.now().toString().slice(-6);
    const timestamp = providedTimestamp ? new Date(providedTimestamp) : new Date();
    const finalActor = actor || userId || 'System Agent';
    const finalSummary = summary || description || `${actionType} on ${entityType} ${entityId}`;

    const prevVals = sanitizeSecrets(previousValues || previousState || null);
    const newVals = sanitizeSecrets(newValues || newState || null);

    // 2. Compute canonical SHA-256 hash on server
    const currentRecordHash = computeRecordHash({
      previousRecordHash,
      auditId,
      sequenceNumber,
      timestamp,
      actionType,
      entityType,
      entityId,
      actor: finalActor,
      previousValues: prevVals,
      newValues: newVals,
      summary: finalSummary
    });

    // 3. Persist Audit Record
    const record = await AuditRecord.create({
      auditId,
      sequenceNumber,
      timestamp,
      actionType,
      entityType,
      entityId,
      actor: finalActor,
      userId: finalActor,
      previousValues: prevVals,
      previousState: prevVals,
      newValues: newVals,
      newState: newVals,
      previousRecordHash,
      currentRecordHash,
      hashSignature: currentRecordHash,
      summary: finalSummary,
      description: finalSummary,
      ipAddress: ipAddress || '127.0.0.1',
      tamperedForDemo: false,
    });

    return record;
  });
}

/**
 * Verify cryptographic hash chain across the entire audit log
 */
async function verifyAuditChain() {
  const allRecords = await AuditRecord.find({});
  const sorted = allRecords.sort((a, b) => 
    (a.sequenceNumber || 0) - (b.sequenceNumber || 0) || 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (sorted.length === 0) {
    return {
      isValid: true,
      status: 'VERIFIED',
      totalRecords: 0,
      verifiedCount: 0,
      firstMismatch: null,
      message: 'Audit ledger is empty (Genesis state).',
      verifiedAt: new Date().toISOString()
    };
  }

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const seq = record.sequenceNumber || (i + 1);

    // Check 1: Previous Hash Linkage
    if (i === 0) {
      if (record.previousRecordHash && record.previousRecordHash !== GENESIS_PREV_HASH) {
        expectedPrevHash = record.previousRecordHash;
      }
    } else {
      const storedPrev = record.previousRecordHash;
      if (storedPrev !== expectedPrevHash) {
        return {
          isValid: false,
          status: 'INTEGRITY_FAILURE',
          totalRecords: sorted.length,
          verifiedCount: i,
          firstMismatch: {
            index: i,
            sequenceNumber: seq,
            auditId: record.auditId,
            reason: `Broken chain link at Block #${seq} (${record.auditId}): previousRecordHash does not match previous block's currentRecordHash.`,
            expectedPreviousHash: expectedPrevHash,
            actualPreviousHash: storedPrev,
            timestamp: record.timestamp,
            entityType: record.entityType,
            entityId: record.entityId,
            actor: record.actor,
            summary: record.summary,
            tamperedForDemo: Boolean(record.tamperedForDemo)
          },
          verifiedAt: new Date().toISOString()
        };
      }
    }

    // Check 2: Content Hash Integrity (detects if any field inside this block was altered)
    const recomputedHash = computeRecordHash({
      previousRecordHash: record.previousRecordHash || expectedPrevHash,
      auditId: record.auditId,
      sequenceNumber: seq,
      timestamp: record.timestamp,
      actionType: record.actionType,
      entityType: record.entityType,
      entityId: record.entityId,
      actor: record.actor,
      previousValues: record.previousValues || record.previousState,
      newValues: record.newValues || record.newState,
      summary: record.summary || record.description
    });

    const storedHash = record.currentRecordHash || record.hashSignature;

    if (recomputedHash !== storedHash) {
      return {
        isValid: false,
        status: 'INTEGRITY_FAILURE',
        totalRecords: sorted.length,
        verifiedCount: i,
        firstMismatch: {
          index: i,
          sequenceNumber: seq,
          auditId: record.auditId,
          reason: `Cryptographic digest mismatch at Block #${seq} (${record.auditId}): Record content was modified after signing.`,
          expectedHash: storedHash,
          actualRecomputedHash: recomputedHash,
          timestamp: record.timestamp,
          entityType: record.entityType,
          entityId: record.entityId,
          actor: record.actor,
          summary: record.summary,
          tamperedForDemo: Boolean(record.tamperedForDemo)
        },
        verifiedAt: new Date().toISOString()
      };
    }

    expectedPrevHash = storedHash;
  }

  return {
    isValid: true,
    status: 'VERIFIED',
    totalRecords: sorted.length,
    verifiedCount: sorted.length,
    latestHash: expectedPrevHash,
    message: `All ${sorted.length} cryptographic audit blocks verified without tamper or chain breakage.`,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Controlled test helper: Simulates an unauthorized alteration in an old audit record
 */
async function tamperAuditRecordForTesting({ auditId, fieldToTamper = 'summary', tamperedValue = 'UNAUTHORIZED_ALTERATION: Data modified by database intruder.' }) {
  const record = await AuditRecord.findOne({ auditId });
  if (!record) {
    throw new Error(`Audit record with ID "${auditId}" not found for tamper test.`);
  }

  // Backup original values if not already backed up
  const originalRecordData = record.originalRecordData || {
    summary: record.summary,
    actor: record.actor,
    previousValues: record.previousValues,
    newValues: record.newValues,
    currentRecordHash: record.currentRecordHash,
  };

  const update = {
    [fieldToTamper]: tamperedValue,
    tamperedForDemo: true,
    originalRecordData,
  };

  const updated = await AuditRecord.findByIdAndUpdate(record._id, update, { new: true });
  return updated;
}

/**
 * Controlled test helper: Restores the tampered audit record back to pristine state
 */
async function restoreAuditRecordForTesting({ auditId }) {
  const record = await AuditRecord.findOne({ auditId });
  if (!record) {
    throw new Error(`Audit record with ID "${auditId}" not found to restore.`);
  }

  if (!record.originalRecordData) {
    // Already in original state or no backup
    await AuditRecord.findByIdAndUpdate(record._id, { tamperedForDemo: false });
    return record;
  }

  const restored = await AuditRecord.findByIdAndUpdate(record._id, {
    ...record.originalRecordData,
    tamperedForDemo: false,
    originalRecordData: null,
  }, { new: true });

  return restored;
}

/**
 * Ensures initial or legacy seed records form an unbroken canonical SHA-256 hash chain
 */
async function ensureInitialChainIntegrity() {
  const records = await AuditRecord.find({});
  if (records.length === 0) return;

  const sorted = records.sort((a, b) => 
    (a.sequenceNumber || 0) - (b.sequenceNumber || 0) || 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  let prevHash = GENESIS_PREV_HASH;
  let needsFix = false;

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const seq = i + 1;
    if (!r.sequenceNumber || r.sequenceNumber !== seq || r.previousRecordHash !== prevHash || !r.currentRecordHash) {
      needsFix = true;
      break;
    }
    prevHash = r.currentRecordHash;
  }

  if (!needsFix) return;

  console.log('[AuditService] Aligning existing audit records into a verified SHA-256 hash chain...');
  prevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const seq = i + 1;
    const prevVals = r.previousValues || r.previousState || null;
    const newVals = r.newValues || r.newState || null;
    const sum = r.summary || r.description || `Audit entry ${r.auditId}`;

    const computedHash = computeRecordHash({
      previousRecordHash: prevHash,
      auditId: r.auditId,
      sequenceNumber: seq,
      timestamp: r.timestamp,
      actionType: r.actionType,
      entityType: r.entityType,
      entityId: r.entityId,
      actor: r.actor,
      previousValues: prevVals,
      newValues: newVals,
      summary: sum
    });

    await AuditRecord.findByIdAndUpdate(r._id, {
      sequenceNumber: seq,
      previousRecordHash: prevHash,
      currentRecordHash: computedHash,
      hashSignature: computedHash,
      previousValues: prevVals,
      previousState: prevVals,
      newValues: newVals,
      newState: newVals,
      summary: sum,
      description: sum,
      tamperedForDemo: false,
    });

    prevHash = computedHash;
  }

  console.log(`[AuditService] Successfully initialized unbroken hash chain across ${sorted.length} audit records.`);
}

module.exports = {
  recordAuditEvent,
  verifyAuditChain,
  tamperAuditRecordForTesting,
  restoreAuditRecordForTesting,
  ensureInitialChainIntegrity,
  computeRecordHash,
  sanitizeSecrets,
  GENESIS_PREV_HASH,
};

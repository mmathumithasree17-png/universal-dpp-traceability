const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

/**
 * GET /api/audit
 * Fetch audit trail with multi-criteria filtering and verification status
 */
async function getAllAuditRecords(req, res) {
  try {
    const { 
      actionType, 
      entityType, 
      entityId, 
      actor, 
      user, 
      startDate, 
      endDate, 
      search,
      tamperedOnly 
    } = req.query;

    let query = {};
    if (actionType && actionType !== 'ALL') query.actionType = actionType;
    if (entityType && entityType !== 'ALL') query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const audits = await AuditRecord.find(query);
    let filtered = audits;

    // Filter by actor / user
    const actorFilter = actor || user;
    if (actorFilter) {
      const a = actorFilter.toLowerCase();
      filtered = filtered.filter(doc => doc.actor && doc.actor.toLowerCase().includes(a));
    }

    // Filter by Date Range
    if (startDate) {
      const sDate = new Date(startDate);
      filtered = filtered.filter(doc => new Date(doc.timestamp) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      if (endDate.length === 10) eDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => new Date(doc.timestamp) <= eDate);
    }

    // Filter by tampered only
    if (tamperedOnly === 'true' || tamperedOnly === true) {
      filtered = filtered.filter(doc => Boolean(doc.tamperedForDemo));
    }

    // Search query across fields
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(doc =>
        (doc.auditId && doc.auditId.toLowerCase().includes(s)) ||
        (doc.entityId && doc.entityId.toLowerCase().includes(s)) ||
        (doc.entityType && doc.entityType.toLowerCase().includes(s)) ||
        (doc.actor && doc.actor.toLowerCase().includes(s)) ||
        (doc.summary && doc.summary.toLowerCase().includes(s)) ||
        (doc.currentRecordHash && doc.currentRecordHash.toLowerCase().includes(s)) ||
        (doc.previousRecordHash && doc.previousRecordHash.toLowerCase().includes(s))
      );
    }

    // Sort descending by sequenceNumber or timestamp
    const sorted = filtered.sort((a, b) => 
      (b.sequenceNumber || 0) - (a.sequenceNumber || 0) || 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Get current verification status of the entire chain
    const verification = await auditService.verifyAuditChain();

    return res.status(200).json({ 
      success: true, 
      count: sorted.length, 
      verification,
      data: sorted 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/audit/verify
 * Runs full cryptographic hash recomputation across the complete chain
 */
async function verifyAuditIntegrity(req, res) {
  try {
    const result = await auditService.verifyAuditChain();
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/audit/:id
 * Fetch single audit record by auditId
 */
async function getAuditRecordById(req, res) {
  try {
    const { id } = req.params;
    const record = await AuditRecord.findOne({ $or: [{ auditId: id }, { _id: id }] });
    if (!record) {
      return res.status(404).json({ success: false, message: `Audit record "${id}" not found.` });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/audit/tamper-demo
 * Controlled test endpoint: Simulates an unauthorized alteration of an old record
 */
async function simulateTamper(req, res) {
  try {
    const { auditId, fieldToTamper, tamperedValue } = req.body;
    let targetAuditId = auditId;

    if (!targetAuditId) {
      // Pick an earlier record in the chain if none specified
      const all = await AuditRecord.find({});
      if (all.length > 0) {
        targetAuditId = all[0].auditId;
      } else {
        return res.status(400).json({ success: false, message: 'No audit records exist to tamper.' });
      }
    }

    const tampered = await auditService.tamperAuditRecordForTesting({
      auditId: targetAuditId,
      fieldToTamper: fieldToTamper || 'summary',
      tamperedValue: tamperedValue || 'UNAUTHORIZED_ALTERATION: Data modified by database intruder without updating SHA-256 signature.',
    });

    const verificationAfterTamper = await auditService.verifyAuditChain();

    return res.status(200).json({
      success: true,
      message: `Simulated unauthorized modification on record ${targetAuditId}. Hash chain verification will now detect an integrity failure.`,
      tamperedRecord: tampered,
      verificationResult: verificationAfterTamper,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/audit/restore-demo
 * Controlled test endpoint: Restores the tampered record to its original state
 */
async function restoreTamper(req, res) {
  try {
    const { auditId } = req.body;
    let targetAuditId = auditId;

    if (!targetAuditId) {
      // Find the tampered record
      const tamperedDoc = await AuditRecord.findOne({ tamperedForDemo: true });
      if (tamperedDoc) {
        targetAuditId = tamperedDoc.auditId;
      }
    }

    if (!targetAuditId) {
      return res.status(400).json({ success: false, message: 'No currently tampered audit record found to restore.' });
    }

    const restored = await auditService.restoreAuditRecordForTesting({ auditId: targetAuditId });
    const verificationAfterRestore = await auditService.verifyAuditChain();

    return res.status(200).json({
      success: true,
      message: `Record ${targetAuditId} successfully restored to pristine state. Hash chain verification passes.`,
      restoredRecord: restored,
      verificationResult: verificationAfterRestore,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Disallowed mutation guard (Prevents application users from editing or deleting audit records)
 */
function disallowAuditModification(req, res) {
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Audit records are append-only. Direct modification or deletion is strictly disallowed.',
  });
}

module.exports = {
  getAllAuditRecords,
  verifyAuditIntegrity,
  getAuditRecordById,
  simulateTamper,
  restoreTamper,
  disallowAuditModification,
};

const crypto = require('crypto');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const MaterialBatch = require('../models/MaterialBatch');
const Component = require('../models/Component');
const Assembly = require('../models/Assembly');
const Product = require('../models/Product');
const Shipment = require('../models/Shipment');
const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

// Allowed status values by entity type
const ALLOWED_STATUSES = {
  MATERIAL_BATCH: ['ACTIVE', 'DEFECTIVE', 'QUARANTINED', 'EXHAUSTED'],
  COMPONENT: ['AVAILABLE', 'ASSEMBLED', 'DEFECTIVE', 'QUARANTINED', 'SCRAPPED'],
  ASSEMBLY: ['PASSED', 'FAILED', 'IN_PROGRESS', 'QUARANTINED'],
  PRODUCT: ['MANUFACTURED', 'QC_APPROVED', 'IN_STORAGE', 'SHIPPED', 'RECALLED', 'QUARANTINED'],
  SHIPMENT: ['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'HELD_RECALL'],
};

/**
 * Find and verify target entity existence
 */
async function findTargetEntity(targetType, targetId) {
  const cleanId = String(targetId).trim();
  let entity = null;
  let modelName = '';

  switch (targetType) {
    case 'MATERIAL_BATCH':
      entity = await MaterialBatch.findOne({ batchId: cleanId });
      if (!entity) entity = await MaterialBatch.findById(cleanId);
      modelName = 'MaterialBatch';
      break;

    case 'COMPONENT':
      entity = await Component.findOne({ componentId: cleanId });
      if (!entity) entity = await Component.findById(cleanId);
      modelName = 'Component';
      break;

    case 'ASSEMBLY':
      entity = await Assembly.findOne({ assemblyId: cleanId });
      if (!entity) entity = await Assembly.findById(cleanId);
      modelName = 'Assembly';
      break;

    case 'PRODUCT':
      entity = await Product.findOne({ passportId: cleanId });
      if (!entity) entity = await Product.findOne({ serialNumber: cleanId });
      if (!entity) entity = await Product.findById(cleanId);
      modelName = 'Product';
      break;

    case 'SHIPMENT':
      entity = await Shipment.findOne({ shipmentId: cleanId });
      if (!entity) entity = await Shipment.findById(cleanId);
      modelName = 'Shipment';
      break;

    default:
      throw new Error(`Invalid targetType: ${targetType}. Must be one of MATERIAL_BATCH, COMPONENT, ASSEMBLY, PRODUCT, SHIPMENT.`);
  }

  return { entity, modelName };
}

/**
 * Determine legitimate status transition based on event type & inspection result
 */
function deduceStatusTransition(targetType, eventType, inspectionResult, explicitResultingStatus, currentStatus) {
  // If explicitly requested, validate against entity's allowed enum
  if (explicitResultingStatus) {
    const allowed = ALLOWED_STATUSES[targetType] || [];
    if (!allowed.includes(explicitResultingStatus)) {
      throw new Error(
        `Invalid resultingStatus "${explicitResultingStatus}" for target ${targetType}. Allowed values: ${allowed.join(', ')}`
      );
    }
    return explicitResultingStatus;
  }

  // Deduce automatically if event legitimately implies a transition
  switch (eventType) {
    case 'MATERIAL_RECEIVED':
    case 'MATERIAL_RECEIPT':
      return 'ACTIVE';

    case 'MATERIAL_APPROVED':
      return 'ACTIVE';

    case 'MATERIAL_REJECTED':
      return 'DEFECTIVE';

    case 'MATERIAL_INSPECTED':
      if (inspectionResult === 'FAILED') return 'DEFECTIVE';
      if (inspectionResult === 'PASSED') return 'ACTIVE';
      return currentStatus;

    case 'COMPONENT_MANUFACTURED':
    case 'COMPONENT_MACHINED':
    case 'STAMPING':
    case 'WINDING':
    case 'IMPREGNATION':
    case 'ROTOR_BALANCING':
      return 'AVAILABLE';

    case 'COMPONENT_INSPECTED':
      if (inspectionResult === 'FAILED') return 'DEFECTIVE';
      if (inspectionResult === 'PASSED') return 'AVAILABLE';
      return currentStatus;

    case 'REWORK_STARTED':
      return targetType === 'PRODUCT' ? 'QUARANTINED' : 'QUARANTINED';

    case 'REWORK_COMPLETED':
      return targetType === 'PRODUCT' ? 'QC_APPROVED' : 'AVAILABLE';

    case 'ASSEMBLY_STARTED':
      return 'IN_PROGRESS';

    case 'ASSEMBLY_COMPLETED':
    case 'FINAL_ASSEMBLY':
      return 'PASSED';

    case 'FINAL_QUALITY_INSPECTION':
    case 'DYNO_TESTING':
      if (inspectionResult === 'FAILED') return 'QUARANTINED';
      if (inspectionResult === 'PASSED') return 'QC_APPROVED';
      return currentStatus;

    case 'PRODUCT_APPROVED':
      return 'QC_APPROVED';

    case 'PRODUCT_QUARANTINED':
    case 'QUARANTINE_TRIGGERED':
      return 'QUARANTINED';

    case 'SHIPMENT_CREATED':
    case 'PACKAGING':
      return targetType === 'SHIPMENT' ? 'PREPARING' : 'IN_STORAGE';

    case 'SHIPMENT_DISPATCHED':
    case 'DISPATCH':
      return targetType === 'SHIPMENT' ? 'IN_TRANSIT' : 'SHIPPED';

    case 'DEFECT_DISCOVERED':
    case 'DEFECT_DETECTED':
      return 'QUARANTINED';

    default:
      return currentStatus;
  }
}

/**
 * GET /api/events
 * Fetch events with multi-criteria filtering and chronological ordering
 */
async function getAllEvents(req, res) {
  try {
    const { 
      targetId, 
      targetType,
      eventType, 
      status, 
      inspectionResult,
      operator,
      startDate,
      endDate,
      search 
    } = req.query;

    let query = {};
    if (targetId) query.targetId = targetId;
    if (targetType) query.targetType = targetType;
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (inspectionResult) query.inspectionResult = inspectionResult;

    const events = await ManufacturingEvent.find(query);
    let filtered = events;

    // Filter by operator (case-insensitive substring)
    if (operator) {
      const op = operator.toLowerCase();
      filtered = filtered.filter(e => e.operator && e.operator.toLowerCase().includes(op));
    }

    // Filter by Date Range
    if (startDate) {
      const sDate = new Date(startDate);
      filtered = filtered.filter(e => new Date(e.timestamp) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      // set to end of day if just a date string
      if (endDate.length === 10) eDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => new Date(e.timestamp) <= eDate);
    }

    // Search term across multiple fields
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(e =>
        (e.eventId && e.eventId.toLowerCase().includes(s)) ||
        (e.targetId && e.targetId.toLowerCase().includes(s)) ||
        (e.eventType && e.eventType.toLowerCase().includes(s)) ||
        (e.station && e.station.toLowerCase().includes(s)) ||
        (e.machine && e.machine.toLowerCase().includes(s)) ||
        (e.operator && e.operator.toLowerCase().includes(s)) ||
        (e.remarks && e.remarks.toLowerCase().includes(s)) ||
        (e.notes && e.notes.toLowerCase().includes(s)) ||
        (e.defectDetails && e.defectDetails.toLowerCase().includes(s))
      );
    }

    // Sort chronologically descending (newest first)
    const sorted = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Summary statistics
    const stats = {
      total: sorted.length,
      successCount: sorted.filter(e => e.status === 'SUCCESS').length,
      alertCount: sorted.filter(e => e.status === 'ALERT' || e.status === 'FAILED').length,
      passedInspections: sorted.filter(e => e.inspectionResult === 'PASSED').length,
      failedInspections: sorted.filter(e => e.inspectionResult === 'FAILED').length,
    };

    return res.status(200).json({ 
      success: true, 
      count: sorted.length, 
      stats,
      data: sorted 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/events
 * Record a manufacturing lifecycle event with reference validation, status transitions,
 * duplicate protection (idempotency), and audit ledger logging.
 */
async function createEvent(req, res) {
  try {
    const { 
      eventId, 
      eventType, 
      targetType, 
      targetId, 
      station, 
      machine, 
      operator, 
      inspectionResult, 
      notes, 
      defectDetails, 
      supportingEvidence, 
      previousStatus: clientPrevStatus, 
      resultingStatus: clientResultingStatus, 
      parametersRecorded, 
      status, 
      remarks, 
      timestamp,
      idempotencyKey: providedKey 
    } = req.body;

    // 1. Validate required fields
    if (!eventType) {
      return res.status(400).json({ success: false, message: 'Field "eventType" is required.' });
    }
    if (!targetType) {
      return res.status(400).json({ success: false, message: 'Field "targetType" is required.' });
    }
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Field "targetId" is required.' });
    }
    if (!station) {
      return res.status(400).json({ success: false, message: 'Field "station" is required.' });
    }

    // 2. Prevent invalid references to nonexistent records
    const { entity: targetRecord, modelName } = await findTargetEntity(targetType, targetId);
    if (!targetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: `Validation Error: Target entity of type "${targetType}" with ID "${targetId}" does not exist in persistent records.` 
      });
    }

    // 3. Compute or verify Idempotency Key to avoid duplicate events on retries
    const eventTime = timestamp ? new Date(timestamp) : new Date();
    const timeMinute = eventTime.toISOString().slice(0, 16); // minute-level granularity
    const computedKey = providedKey || crypto
      .createHash('sha256')
      .update(`${targetType}|${targetId}|${eventType}|${operator || ''}|${station}|${machine || ''}|${timeMinute}`)
      .digest('hex');

    // Check for duplicate submission
    const existingEvent = await ManufacturingEvent.findOne({ 
      $or: [
        { idempotencyKey: computedKey },
        ...(eventId ? [{ eventId }] : [])
      ]
    });

    if (existingEvent) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: `Duplicate event detected. Event ${existingEvent.eventId} already recorded.`,
        data: existingEvent,
      });
    }

    // 4. Validate and determine Status Transitions
    const currentStatus = targetRecord.status || targetRecord.shippingStatus || null;
    const previousStatus = clientPrevStatus || currentStatus;
    
    let resultingStatus = null;
    try {
      resultingStatus = deduceStatusTransition(
        targetType, 
        eventType, 
        inspectionResult, 
        clientResultingStatus, 
        currentStatus
      );
    } catch (transitionErr) {
      return res.status(400).json({ success: false, message: transitionErr.message });
    }

    // 5. Build and save the Manufacturing Event
    const finalEventId = eventId || 'EVT-' + Date.now().toString().slice(-6);
    const eventStatus = status || (inspectionResult === 'FAILED' ? 'ALERT' : 'SUCCESS');

    const newEvent = await ManufacturingEvent.create({
      eventId: finalEventId,
      eventType,
      targetType,
      targetId,
      timestamp: eventTime,
      station,
      machine: machine || station,
      operator: operator || 'Station Operator',
      inspectionResult: inspectionResult || 'N/A',
      notes: notes || remarks || '',
      defectDetails: defectDetails || null,
      supportingEvidence: supportingEvidence || null,
      previousStatus,
      resultingStatus,
      parametersRecorded: parametersRecorded || {},
      status: eventStatus,
      remarks: remarks || notes || `${eventType} executed at ${station}.`,
      idempotencyKey: computedKey,
    });

    // 6. Update related record status only when event legitimately requires it
    let recordUpdated = false;
    if (resultingStatus && resultingStatus !== currentStatus) {
      if (targetType === 'MATERIAL_BATCH') {
        const updates = { status: resultingStatus };
        if (eventType === 'MATERIAL_APPROVED') updates.qualityPassed = true;
        if (eventType === 'MATERIAL_REJECTED') updates.qualityPassed = false;
        await MaterialBatch.findByIdAndUpdate(targetRecord._id, updates);
        recordUpdated = true;
      } else if (targetType === 'COMPONENT') {
        const updates = { status: resultingStatus };
        if (inspectionResult === 'FAILED') updates.qualityCheckPassed = false;
        if (inspectionResult === 'PASSED') updates.qualityCheckPassed = true;
        await Component.findByIdAndUpdate(targetRecord._id, updates);
        recordUpdated = true;
      } else if (targetType === 'ASSEMBLY') {
        await Assembly.findByIdAndUpdate(targetRecord._id, { status: resultingStatus });
        recordUpdated = true;
      } else if (targetType === 'PRODUCT') {
        await Product.findByIdAndUpdate(targetRecord._id, { status: resultingStatus });
        recordUpdated = true;
      } else if (targetType === 'SHIPMENT') {
        await Shipment.findByIdAndUpdate(targetRecord._id, { shippingStatus: resultingStatus });
        recordUpdated = true;
        // If shipment is dispatched, cascade SHIPPED status to contained products
        if (resultingStatus === 'IN_TRANSIT' && Array.isArray(targetRecord.products)) {
          for (const prod of targetRecord.products) {
            const pDoc = await Product.findOne({ passportId: prod.passportId });
            if (pDoc && pDoc.status !== 'QUARANTINED') {
              await Product.findByIdAndUpdate(pDoc._id, { status: 'SHIPPED' });
            }
          }
        }
      }
    }

    // 7. Record event creation in Audit History via hash-linked audit service
    await auditService.recordAuditEvent({
      actionType: recordUpdated ? 'STATUS_CHANGE' : 'CREATE',
      entityType: 'Event',
      entityId: finalEventId,
      actor: operator || 'Station Operator',
      previousValues: { status: previousStatus },
      newValues: { 
        status: resultingStatus,
        eventId: finalEventId,
        eventType,
        targetId,
        station
      },
      summary: `Manufacturing event [${eventType}] logged for ${targetType} ${targetId}. Resulting status: ${resultingStatus || 'UNCHANGED'}.`,
    });

    return res.status(201).json({ 
      success: true, 
      data: newEvent,
      recordUpdated,
      previousStatus,
      resultingStatus
    });
  } catch (err) {
    console.error('[Event Creation Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/events/lookups
 * Helper endpoint returning list of valid targets across all entity types for rapid event logging
 */
async function getTargetLookups(req, res) {
  try {
    const [batches, components, assemblies, products, shipments] = await Promise.all([
      MaterialBatch.find({}),
      Component.find({}),
      Assembly.find({}),
      Product.find({}),
      Shipment.find({}),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        MATERIAL_BATCH: batches.map(b => ({ id: b.batchId, label: `${b.batchId} - ${b.materialName} (${b.category})`, status: b.status })),
        COMPONENT: components.map(c => ({ id: c.componentId, label: `${c.componentId} - ${c.componentName} (${c.componentType})`, status: c.status })),
        ASSEMBLY: assemblies.map(a => ({ id: a.assemblyId, label: `${a.assemblyId} - ${a.assemblyName}`, status: a.status })),
        PRODUCT: products.map(p => ({ id: p.passportId, label: `${p.passportId} - ${p.modelName} [SN: ${p.serialNumber}]`, status: p.status, serialNumber: p.serialNumber })),
        SHIPMENT: shipments.map(s => ({ id: s.shipmentId, label: `${s.shipmentId} - ${s.destinationClient} (${s.trackingNumber})`, status: s.shippingStatus })),
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/events/:id
 * Fetch single event by eventId
 */
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const event = await ManufacturingEvent.findOne({ eventId: id });
    if (!event) {
      return res.status(404).json({ success: false, message: `Event "${id}" not found.` });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllEvents,
  createEvent,
  getEventById,
  getTargetLookups,
};

const MaterialBatch = require('../models/MaterialBatch');
const auditService = require('../services/auditService');

async function getAllBatches(req, res) {
  try {
    const { status, category, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const batches = await MaterialBatch.find(query);
    let filtered = batches;
    if (search) {
      const s = search.toLowerCase();
      filtered = batches.filter(b => 
        (b.batchId && b.batchId.toLowerCase().includes(s)) ||
        (b.materialName && b.materialName.toLowerCase().includes(s)) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(s))
      );
    }
    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getBatchById(req, res) {
  try {
    const { id } = req.params;
    const batch = await MaterialBatch.findOne({ $or: [{ batchId: id }, { _id: id }] });
    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${id} not found.` });
    }
    return res.status(200).json({ success: true, data: batch });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createBatch(req, res) {
  try {
    const { batchId, materialName, category, supplierName, supplierLotNumber, quantity, unit } = req.body;
    if (!batchId || !materialName || !supplierName || !supplierLotNumber) {
      return res.status(400).json({ success: false, message: 'batchId, materialName, supplierName, and supplierLotNumber are required.' });
    }

    const existing = await MaterialBatch.findOne({ batchId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Batch ${batchId} already exists.` });
    }

    const created = await MaterialBatch.create({
      ...req.body,
      receivedDate: req.body.receivedDate || new Date(),
    });

    await auditService.recordAuditEvent({
      actionType: 'CREATE',
      entityType: 'MaterialBatch',
      entityId: batchId,
      actor: 'Receiving Dock Operator',
      newValues: created,
      summary: `Material batch ${batchId} registered from supplier ${supplierName}.`
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function quarantineBatch(req, res) {
  try {
    const { id } = req.params;
    const { reason, defectId } = req.body;
    const batch = await MaterialBatch.findOne({ $or: [{ batchId: id }, { _id: id }] });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const updated = await MaterialBatch.findByIdAndUpdate(batch._id, {
      status: 'QUARANTINED',
      qualityPassed: false,
      defectId: defectId || null,
      quarantinedAt: new Date(),
      notes: reason ? `${batch.notes || ''} [QUARANTINED: ${reason}]` : batch.notes,
    }, { new: true });

    await auditService.recordAuditEvent({
      actionType: 'QUARANTINE_EXECUTED',
      entityType: 'MaterialBatch',
      entityId: batch.batchId,
      actor: 'Quality Assurance Lead',
      previousValues: { status: batch.status },
      newValues: { status: 'QUARANTINED', reason },
      summary: `Batch ${batch.batchId} quarantined: ${reason || 'Suspect anomaly detected'}.`
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllBatches,
  getBatchById,
  createBatch,
  quarantineBatch,
};

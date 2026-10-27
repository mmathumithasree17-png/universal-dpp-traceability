const Assembly = require('../models/Assembly');
const auditService = require('../services/auditService');

async function getAllAssemblies(req, res) {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;

    const assemblies = await Assembly.find(query);
    let filtered = assemblies;
    if (search) {
      const s = search.toLowerCase();
      filtered = assemblies.filter(a =>
        (a.assemblyId && a.assemblyId.toLowerCase().includes(s)) ||
        (a.assemblyName && a.assemblyName.toLowerCase().includes(s)) ||
        (a.assemblyLine && a.assemblyLine.toLowerCase().includes(s))
      );
    }
    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getAssemblyById(req, res) {
  try {
    const { id } = req.params;
    const assembly = await Assembly.findOne({ $or: [{ assemblyId: id }, { _id: id }] });
    if (!assembly) {
      return res.status(404).json({ success: false, message: `Assembly ${id} not found.` });
    }
    return res.status(200).json({ success: true, data: assembly });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createAssembly(req, res) {
  try {
    const { assemblyId, assemblyName, assemblyType, components, assemblyLine, workstation, operator, qualityChecks, status, notes } = req.body;
    if (!assemblyId || !assemblyName || !assemblyLine) {
      return res.status(400).json({ success: false, message: 'assemblyId, assemblyName, and assemblyLine are required.' });
    }

    const existing = await Assembly.findOne({ assemblyId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Assembly with ID ${assemblyId} already exists.` });
    }

    const newAssembly = await Assembly.create({
      assemblyId,
      assemblyName,
      assemblyType: assemblyType || 'EV Traction Powertrain',
      components: components || [],
      assemblyLine,
      workstation: workstation || 'WS-01',
      assembledAt: new Date(),
      operator: operator || 'AutoCell-01',
      qualityChecks: qualityChecks || { passedAll: true },
      status: status || 'PASSED',
      notes: notes || '',
    });

    await auditService.recordAuditEvent({
      actionType: 'CREATE',
      entityType: 'Assembly',
      entityId: assemblyId,
      actor: operator || 'Assembly Cell Supervisor',
      newValues: newAssembly,
      summary: `Powertrain assembly ${assemblyId} (${assemblyName}) completed on line ${assemblyLine}.`
    });

    return res.status(201).json({ success: true, data: newAssembly });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllAssemblies,
  getAssemblyById,
  createAssembly,
};

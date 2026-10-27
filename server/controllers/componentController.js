const Component = require('../models/Component');
const Product = require('../models/Product');
const Assembly = require('../models/Assembly');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const auditService = require('../services/auditService');

async function getAllComponents(req, res) {
  try {
    const { status, componentType, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (componentType) query.componentType = componentType;

    const components = await Component.find(query);
    let filtered = components;
    if (search) {
      const s = search.toLowerCase();
      filtered = components.filter(c =>
        (c.componentId && c.componentId.toLowerCase().includes(s)) ||
        (c.componentName && c.componentName.toLowerCase().includes(s)) ||
        (c.serialNumber && c.serialNumber.toLowerCase().includes(s))
      );
    }
    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getComponentById(req, res) {
  try {
    const { id } = req.params;
    const component = await Component.findOne({ $or: [{ componentId: id }, { _id: id }] });
    if (!component) {
      return res.status(404).json({ success: false, message: `Component ${id} not found.` });
    }
    return res.status(200).json({ success: true, data: component });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createComponent(req, res) {
  try {
    const {
      componentId = 'CMP-' + Date.now().toString().slice(-6),
      componentName,
      componentType = 'Stator',
      materialBatches = [],
      lineId = 'CELL-PRECISION-COMPONENT-02',
      operatorId = 'Component Specialist: Marcus Vance',
      qualityCheckPassed = true,
      status = 'AVAILABLE',
      serialNumber,
      notes = '',
      passportId, // Target product passport or 'ALL'
      assemblyId = 'ASM-MVTEC-POWERTRAIN-401'
    } = req.body;

    if (!componentName) {
      return res.status(400).json({ success: false, message: 'componentName is required.' });
    }

    const finalCompId = componentId || ('CMP-' + Math.floor(100000 + Math.random() * 900000));
    const finalSerial = serialNumber || (`SN-${finalCompId}`);

    const existing = await Component.findOne({ componentId: finalCompId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Component with ID ${finalCompId} already exists.` });
    }

    const newComponent = await Component.create({
      componentId: finalCompId,
      componentName,
      componentType: componentType || 'Other',
      materialBatches: Array.isArray(materialBatches) ? materialBatches : (materialBatches ? [materialBatches] : []),
      productionDate: new Date(),
      lineId,
      operatorId,
      qualityCheckPassed: qualityCheckPassed !== undefined ? qualityCheckPassed : true,
      status: status || 'AVAILABLE',
      serialNumber: finalSerial,
      targetProductId: passportId || null,
      assemblyId: assemblyId || null,
      notes: notes || '',
    });

    // Automatically bind the new component to Product Passport(s)
    const targetProductQuery = (passportId && passportId !== 'ALL')
      ? { $or: [{ passportId }, { serialNumber: passportId }] }
      : {};
    const targetProducts = await Product.find(targetProductQuery);

    for (const prod of targetProducts) {
      const comps = prod.componentsUsed || [];
      if (!comps.some(c => c.componentId === finalCompId)) {
        comps.push({
          componentId: finalCompId,
          componentName,
          componentType,
          serialNumber: finalSerial,
        });
        await Product.updateOne({ _id: prod._id }, { componentsUsed: comps });
      }
    }

    // Also attach to Assembly
    const targetAssemblies = assemblyId
      ? await Assembly.find({ assemblyId })
      : await Assembly.find({});
    for (const asm of targetAssemblies) {
      const comps = asm.componentsUsed || [];
      if (!comps.some(c => c.componentId === finalCompId)) {
        comps.push({
          componentId: finalCompId,
          componentName,
          componentType,
          serialNumber: finalSerial,
        });
        await Assembly.updateOne({ _id: asm._id }, { componentsUsed: comps });
      }
    }

    // Log shop-floor Manufacturing Event
    await ManufacturingEvent.create({
      eventId: 'EVT-' + Date.now().toString().slice(-6),
      eventType: 'COMPONENT_MANUFACTURED',
      targetType: 'COMPONENT',
      targetId: finalCompId,
      station: lineId,
      operator: operatorId,
      status: 'SUCCESS',
      remarks: `Component ${componentName} (${finalCompId}) fabricated on ${lineId} and bound to DPP registry.`,
      timestamp: new Date()
    });

    // Record Cryptographic Audit Record
    await auditService.recordAuditEvent({
      actionType: 'CREATE',
      entityType: 'Component',
      entityId: finalCompId,
      actor: operatorId,
      newValues: newComponent,
      summary: `Component ${finalCompId} (${componentName}) manufactured on line ${lineId} and linked to DPP.`
    });

    return res.status(201).json({
      success: true,
      data: newComponent,
      attachedProductsCount: targetProducts.length
    });
  } catch (err) {
    console.error('Error creating component:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllComponents,
  getComponentById,
  createComponent,
};

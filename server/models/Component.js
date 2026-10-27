const { createModel } = require('./modelAdapter');

const Component = createModel('Component', {
  componentId: { type: String, required: true, unique: true, index: true },
  componentName: { type: String, required: true },
  componentType: { type: String, default: 'Stator' },
  materialBatches: [{
    batchId: { type: String },
    materialName: { type: String },
    quantityUsed: { type: Number, default: 1 },
    unit: { type: String, default: 'kg' }
  }],
  productionDate: { type: Date, default: Date.now },
  lineId: { type: String, default: 'CELL-PRECISION-COMPONENT-02' },
  operatorId: { type: String, default: 'OP-AUTOMATED' },
  qualityCheckPassed: { type: Boolean, default: true },
  status: { type: String, default: 'AVAILABLE' },
  serialNumber: { type: String },
  targetProductId: { type: String },
  assemblyId: { type: String },
  notes: { type: String }
});

module.exports = Component;

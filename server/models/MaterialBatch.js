const { createModel } = require('./modelAdapter');

const MaterialBatch = createModel('MaterialBatch', {
  batchId: { type: String, required: true, unique: true, index: true },
  materialName: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Conductor', 'RareEarthMagnet', 'SiliconSteel', 'AlloySteel', 'InsulationResin', 'DieCastAluminum', 'Electronics', 'Other']
  },
  supplierName: { type: String, required: true },
  supplierLotNumber: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  receivedDate: { type: Date, default: Date.now },
  purityOrGrade: { type: String },
  certificateOfAnalysis: { type: String },
  carbonFootprintKgCO2e: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'DEFECTIVE', 'QUARANTINED', 'EXHAUSTED'],
    default: 'ACTIVE'
  },
  qualityPassed: { type: Boolean, default: true },
  defectId: { type: String, default: null },
  quarantinedAt: { type: Date, default: null },
  notes: { type: String }
});

module.exports = MaterialBatch;

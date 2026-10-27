const { createModel } = require('./modelAdapter');

const Defect = createModel('Defect', {
  defectId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'METALLURGICAL_FLAW',
      'INSULATION_BREAKDOWN',
      'DIMENSIONAL_VARIANCE',
      'THERMAL_OVERHEATING',
      'ASSEMBLY_TORQUE_ERROR',
      'SUPPLIER_CONTAMINATION',
      'CALIBRATION_DRIFT',
      'OTHER'
    ],
    default: 'METALLURGICAL_FLAW'
  },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'],
    default: 'OPEN'
  },
  sourceType: {
    type: String,
    enum: ['MATERIAL_BATCH', 'COMPONENT', 'PRODUCT', 'EVENT'],
    default: 'MATERIAL_BATCH'
  },
  sourceId: { type: String, required: true, index: true },
  affectedBatchId: { type: String, index: true },
  rootCause: { type: String, required: true },
  reportedBy: { type: String, default: 'Automated In-Line Eddy Current Sensor' },
  identifiedDate: { type: Date, default: Date.now },
  discoveryTime: { type: Date, default: Date.now },
  notes: { type: String },
  quarantineTriggered: { type: Boolean, default: true },
  
  // Aggregated Counts
  affectedProductsCount: { type: Number, default: 0 },
  affectedShipmentsCount: { type: Number, default: 0 },
  inStockCount: { type: Number, default: 0 },
  alreadyShippedCount: { type: Number, default: 0 },
  
  containmentAction: { type: String },
  suggestedNextSteps: [{ type: String }],
  resolutionNotes: { type: String },
  idempotencyKey: { type: String, index: true },
  traversalLatencyMs: { type: Number, default: 0 },
  
  // Full report snapshot
  impactSummary: { type: Object, default: {} },
  details: { type: Object, default: {} }
});

module.exports = Defect;

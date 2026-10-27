const { createModel } = require('./modelAdapter');

const ALL_EVENT_TYPES = [
  // Material events
  'MATERIAL_RECEIVED',
  'MATERIAL_RECEIPT',
  'MATERIAL_INSPECTED',
  'MATERIAL_APPROVED',
  'MATERIAL_REJECTED',
  // Component manufacturing events
  'COMPONENT_MANUFACTURED',
  'COMPONENT_MACHINED',
  'COMPONENT_INSPECTED',
  'STAMPING',
  'WINDING',
  'IMPREGNATION',
  'ROTOR_BALANCING',
  // Rework events
  'REWORK_STARTED',
  'REWORK_COMPLETED',
  // Assembly events
  'ASSEMBLY_STARTED',
  'ASSEMBLY_COMPLETED',
  'FINAL_ASSEMBLY',
  // Inspection & Testing events
  'FINAL_QUALITY_INSPECTION',
  'DYNO_TESTING',
  // Product status events
  'PRODUCT_APPROVED',
  'PRODUCT_QUARANTINED',
  'QUARANTINE_TRIGGERED',
  // Shipping & Dispatch events
  'SHIPMENT_CREATED',
  'SHIPMENT_DISPATCHED',
  'PACKAGING',
  'DISPATCH',
  // Defects & CAPA
  'DEFECT_DISCOVERED',
  'DEFECT_DETECTED',
  'CORRECTIVE_ACTION_RECORDED',
];

const ManufacturingEvent = createModel('ManufacturingEvent', {
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { 
    type: String, 
    required: true,
    enum: ALL_EVENT_TYPES
  },
  targetType: { 
    type: String, 
    required: true,
    enum: ['MATERIAL_BATCH', 'COMPONENT', 'ASSEMBLY', 'PRODUCT', 'SHIPMENT']
  },
  targetId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  station: { type: String, required: true },
  machine: { type: String, default: null },
  operator: { type: String, default: 'Automated Line Operator' },
  inspectionResult: {
    type: String,
    enum: ['PASSED', 'FAILED', 'WARNING', 'PENDING', 'N/A'],
    default: 'N/A'
  },
  notes: { type: String, default: '' },
  defectDetails: { type: String, default: null },
  supportingEvidence: { type: String, default: null },
  previousStatus: { type: String, default: null },
  resultingStatus: { type: String, default: null },
  parametersRecorded: { type: Object, default: {} },
  status: { 
    type: String, 
    enum: ['SUCCESS', 'WARNING', 'ALERT', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  remarks: { type: String, default: '' },
  idempotencyKey: { type: String, default: null, index: true }
});

module.exports = ManufacturingEvent;
module.exports.ALL_EVENT_TYPES = ALL_EVENT_TYPES;

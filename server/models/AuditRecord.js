const { createModel } = require('./modelAdapter');

const AuditRecord = createModel('AuditRecord', {
  auditId: { type: String, required: true, unique: true, index: true },
  sequenceNumber: { type: Number, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  actionType: { 
    type: String, 
    required: true,
    enum: [
      'CREATE', 
      'UPDATE', 
      'STATUS_CHANGE', 
      'DEFECT_FLAGGED', 
      'RECALL_INITIATED', 
      'QUARANTINE_EXECUTED', 
      'PASSPORT_VERIFIED'
    ]
  },
  entityType: { 
    type: String, 
    required: true,
    enum: ['Product', 'MaterialBatch', 'Component', 'Assembly', 'Shipment', 'Defect', 'Event']
  },
  entityId: { type: String, required: true, index: true },
  actor: { type: String, default: 'System Agent' },
  userId: { type: String },
  previousValues: { type: Object, default: null },
  previousState: { type: Object, default: null },
  newValues: { type: Object, default: null },
  newState: { type: Object, default: null },
  previousRecordHash: { type: String, default: '0000000000000000000000000000000000000000000000000000000000000000' },
  currentRecordHash: { type: String, required: true },
  hashSignature: { type: String, required: true },
  summary: { type: String, required: true },
  description: { type: String },
  ipAddress: { type: String, default: '127.0.0.1' },
  tamperedForDemo: { type: Boolean, default: false },
  originalRecordData: { type: Object, default: null },
});

module.exports = AuditRecord;

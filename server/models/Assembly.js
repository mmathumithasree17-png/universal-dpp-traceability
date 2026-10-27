const { createModel } = require('./modelAdapter');

const Assembly = createModel('Assembly', {
  assemblyId: { type: String, required: true, unique: true, index: true },
  assemblyName: { type: String, required: true },
  assemblyType: { type: String, default: 'EV Traction Powertrain' },
  components: [{
    componentId: { type: String, required: true },
    componentName: { type: String, required: true },
    componentType: { type: String }
  }],
  assemblyLine: { type: String, required: true },
  workstation: { type: String, default: 'WS-01' },
  assembledAt: { type: Date, default: Date.now },
  operator: { type: String, default: 'AutoCell-01' },
  qualityChecks: {
    torqueCheckNm: { type: Number },
    insulationResistanceMOhm: { type: Number },
    dynamicBalanceGmm: { type: Number },
    passedAll: { type: Boolean, default: true }
  },
  status: { 
    type: String, 
    enum: ['PASSED', 'FAILED', 'IN_PROGRESS', 'QUARANTINED'],
    default: 'PASSED'
  },
  notes: { type: String }
});

module.exports = Assembly;

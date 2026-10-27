const { createModel } = require('./modelAdapter');

const Product = createModel('Product', {
  passportId: { type: String, required: true, unique: true, index: true },
  serialNumber: { type: String, required: true, unique: true, index: true },
  modelName: { type: String, required: true },
  productCategory: { type: String, default: 'EV Powertrain / High-Performance Traction Motor' },
  assemblyId: { type: String, required: true, index: true },
  facilityLocation: { type: String, default: 'Gigafactory Cleanroom Plant 4 - Detroit, MI' },
  manufacturedDate: { type: Date, default: Date.now },
  
  // Specifications
  specifications: {
    ratedPowerKw: { type: Number, default: 350 },
    maxRpm: { type: Number, default: 20000 },
    peakTorqueNm: { type: Number, default: 520 },
    efficiencyRating: { type: String, default: 'IE5 Ultra-Premium' },
    nominalVoltageV: { type: Number, default: 800 },
    coolingMethod: { type: String, default: 'Direct Stator Oil-Cooled & Rotor Internal Glycol' },
    totalWeightKg: { type: Number, default: 48.5 }
  },

  // Sustainability & EU DPP Compliance
  sustainability: {
    totalCarbonFootprintKgCO2e: { type: Number, default: 185.4 },
    recycledMaterialPercentage: { type: Number, default: 34.2 },
    recyclabilityRatePercentage: { type: Number, default: 96.5 },
    euBatteryDppCompliant: { type: Boolean, default: true },
    circularityIndex: { type: Number, default: 0.88 },
    repairabilityScore: { type: String, default: 'Class A (Modular Disassembly in <15 min)' }
  },

  // Traceability & Lineage Arrays
  componentsUsed: [{
    componentId: { type: String, required: true },
    componentName: { type: String, required: true },
    componentType: { type: String },
    serialNumber: { type: String }
  }],
  materialBatchesUsed: [{
    batchId: { type: String, required: true },
    materialName: { type: String, required: true },
    category: { type: String },
    supplierName: { type: String }
  }],

  complianceCertificates: [{ type: String }],
  status: { 
    type: String, 
    enum: ['MANUFACTURED', 'QC_APPROVED', 'IN_STORAGE', 'SHIPPED', 'RECALLED', 'QUARANTINED'],
    default: 'MANUFACTURED'
  },
  quarantineReason: { type: String, default: null },
  shipmentId: { type: String, default: null },
  qrPayload: { type: String },

  // Quality Inspection Records
  qualityInspections: [{
    inspectionId: { type: String },
    station: { type: String },
    inspector: { type: String },
    date: { type: Date },
    result: { type: String }, // 'PASSED' | 'FAILED' | 'WARNING'
    parameters: { type: Object },
    notes: { type: String }
  }],

  // Rework & Containment History
  reworkHistory: [{
    reworkId: { type: String },
    date: { type: Date },
    station: { type: String },
    technician: { type: String },
    actionTaken: { type: String },
    result: { type: String },
    verifiedBy: { type: String },
    notes: { type: String }
  }]
});

module.exports = Product;

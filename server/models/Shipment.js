const { createModel } = require('./modelAdapter');

const Shipment = createModel('Shipment', {
  shipmentId: { type: String, required: true, unique: true, index: true },
  trackingNumber: { type: String, required: true },
  carrier: { type: String, required: true },
  originCompany: { type: String, default: 'AeroDrive Powertrains Inc.' },
  originFacility: { type: String, default: 'Gigafactory Cleanroom Plant 4 - Detroit, MI' },
  destinationCompany: { type: String, required: true },
  destinationClient: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  dispatchDate: { type: Date, default: Date.now },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date, default: null },
  products: [{
    passportId: { type: String, required: true },
    serialNumber: { type: String, required: true },
    modelName: { type: String }
  }],
  shippingStatus: { 
    type: String, 
    enum: ['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'HELD_RECALL'],
    default: 'PREPARING'
  },
  temperatureControlled: { type: Boolean, default: true },
  recalledProductCount: { type: Number, default: 0 },
  checklist: [{
    id: { type: String, required: true },
    stage: { type: String, default: 'GENERAL' }, // RAW_MATERIAL, COMPONENT, ASSEMBLY, FINISHED_PRODUCT, PACKAGING, DELIVERY
    title: { type: String, required: true },
    description: { type: String },
    checked: { type: Boolean, default: false },
    checkedAt: { type: String, default: null },
    checkedBy: { type: String, default: null },
    notes: { type: String, default: '' }
  }],
  qrPayload: { type: String },
  notes: { type: String }
});

module.exports = Shipment;

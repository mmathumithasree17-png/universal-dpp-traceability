const os = require('os');
const Shipment = require('../models/Shipment');
const Product = require('../models/Product');
const Assembly = require('../models/Assembly');
const Component = require('../models/Component');
const MaterialBatch = require('../models/MaterialBatch');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
          return net.address;
        }
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '10.1.0.173';
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  const host = (req && req.headers && (req.headers['x-forwarded-host'] || req.get('host'))) || '';
  const proto = (req && req.headers && (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'))) || 'http';
  
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('10.') && !host.startsWith('192.') && !host.startsWith('172.')) {
    return `${proto}://${host}`;
  }
  const lanIp = getLanIp();
  const port = process.env.PORT || 5001;
  return `http://${lanIp}:${port}`;
}

const DEFAULT_CHECKLIST_ITEMS = [
  {
    id: 'chk-raw-1',
    stage: 'RAW_MATERIAL',
    title: 'Raw Material Quality & CoA Verification',
    description: 'Supplier certificates of analysis verified; chemical purity, spectrographic flux, and alloy grade confirmed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Verified against raw material lot standards.'
  },
  {
    id: 'chk-comp-2',
    stage: 'COMPONENT',
    title: 'Component Machining & Dynamic Balance QC',
    description: 'Stator core hairpin winding insulation tested; dynamic rotor shaft balancing within G2.5 tolerance.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Sub-component NDT and dimensional scans passed.'
  },
  {
    id: 'chk-asm-3',
    stage: 'ASSEMBLY',
    title: 'Powertrain Assembly & High-Voltage Integration',
    description: 'Automated assembly torque verified; 800V dielectric hi-pot test and internal coolant loop leak test passed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Powertrain assembly cell quality sign-off.'
  },
  {
    id: 'chk-prod-4',
    stage: 'FINISHED_PRODUCT',
    title: 'Finished Product Dyno & DPP QR Registration',
    description: 'Full rated power dyno test passed with zero thermal throttling; serialized QR passport bound to physical casing.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Digital Product Passport published.'
  },
  {
    id: 'chk-pack-5',
    stage: 'PACKAGING',
    title: 'Secure Packaging & Environmental Tamper Seals',
    description: 'Climate-controlled shock absorbent casing applied; nitrogen-purged moisture barrier and cryptographic seal tags locked.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Ready for outbound freight transport.'
  },
  {
    id: 'chk-recv-6',
    stage: 'DELIVERY',
    title: 'Consignment Receipt & Custody Acceptance',
    description: 'Consignment received at destination facility; seal integrity verified and delivery acceptance signed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Final recipient confirmation.'
  }
];

async function getAllShipments(req, res) {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.shippingStatus = status;

    const shipments = await Shipment.find(query);
    let filtered = shipments;
    if (search) {
      const s = search.toLowerCase();
      filtered = shipments.filter(shp =>
        (shp.shipmentId && shp.shipmentId.toLowerCase().includes(s)) ||
        (shp.trackingNumber && shp.trackingNumber.toLowerCase().includes(s)) ||
        (shp.destinationClient && shp.destinationClient.toLowerCase().includes(s)) ||
        (shp.destinationCompany && shp.destinationCompany.toLowerCase().includes(s)) ||
        (shp.originCompany && shp.originCompany.toLowerCase().includes(s))
      );
    }
    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getShipmentById(req, res) {
  try {
    const { id } = req.params;
    let shipment = null;
    if (id && id !== 'latest') {
      shipment = await Shipment.findOne({ $or: [{ shipmentId: id }, { trackingNumber: id }, { _id: id }] });
    }
    if (!shipment) {
      const allShipments = await Shipment.find({});
      if (allShipments.length > 0) {
        shipment = allShipments[allShipments.length - 1];
      }
    }
    if (!shipment) {
      return res.status(404).json({ success: false, message: `Shipment ${id} not found.` });
    }
    return res.status(200).json({ success: true, data: shipment });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createShipment(req, res) {
  try {
    const {
      originCompany = 'AeroDrive Powertrains Inc.',
      originFacility = 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
      destinationCompany,
      destinationClient,
      destinationAddress,
      carrier,
      trackingNumber,
      products = [],
      shippingStatus = 'IN_TRANSIT',
      checklist = [],
      notes = ''
    } = req.body;

    const finalDestCompany = destinationCompany || destinationClient || 'OEM Partner Facility';
    if (!carrier) {
      return res.status(400).json({ success: false, message: 'Carrier name is required.' });
    }

    const shipmentId = req.body.shipmentId || ('SHP-' + Date.now().toString().slice(-6));
    const finalTracking = trackingNumber || ('TRK-' + Date.now().toString().slice(-8));

    // Resolve products from database if only strings / serial numbers were passed
    let resolvedProducts = [];
    if (Array.isArray(products) && products.length > 0) {
      for (const p of products) {
        if (typeof p === 'string') {
          const found = await Product.findOne({ $or: [{ passportId: p }, { serialNumber: p }] });
          if (found) {
            resolvedProducts.push({
              passportId: found.passportId,
              serialNumber: found.serialNumber,
              modelName: found.modelName,
            });
          } else {
            resolvedProducts.push({
              passportId: p.startsWith('DPP-') ? p : `DPP-${p}`,
              serialNumber: p,
              modelName: 'AeroDrive HP-350 Electric Motor',
            });
          }
        } else if (p && typeof p === 'object') {
          resolvedProducts.push({
            passportId: p.passportId || `DPP-${p.serialNumber || Date.now()}`,
            serialNumber: p.serialNumber || p.passportId || 'SN-UNKNOWN',
            modelName: p.modelName || 'AeroDrive HP-350 Electric Motor',
          });
        }
      }
    }

    // If no products were explicitly supplied, auto-register a new serialized motor
    if (resolvedProducts.length === 0) {
      const genNum = Math.floor(1000 + Math.random() * 9000);
      const genSerial = `SN-MOT-${new Date().getFullYear()}-${genNum}`;
      resolvedProducts.push({
        passportId: `DPP-${genSerial}`,
        serialNumber: genSerial,
        modelName: 'AeroDrive HP-350 Electric Motor',
      });
    }

    // Build checklist (merge default items with any customized items provided)
    let finalChecklist = [];
    if (Array.isArray(checklist) && checklist.length > 0) {
      finalChecklist = checklist.map((item, idx) => ({
        id: item.id || `chk-${idx + 1}-${Date.now()}`,
        stage: item.stage || 'GENERAL',
        title: item.title || `Verification Check #${idx + 1}`,
        description: item.description || '',
        checked: Boolean(item.checked),
        checkedAt: item.checked ? (item.checkedAt || new Date().toISOString()) : null,
        checkedBy: item.checked ? (item.checkedBy || 'Logistics Lead') : null,
        notes: item.notes || '',
      }));
    } else {
      finalChecklist = DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item }));
    }

    // QR payload linking directly to the mobile-reachable verification page
    const baseUrl = getBaseUrl(req);
    const qrPayload = `${baseUrl}/shipment-verify/${shipmentId}`;

    const newShipment = await Shipment.create({
      shipmentId,
      trackingNumber: finalTracking,
      carrier,
      originCompany,
      originFacility,
      destinationCompany: finalDestCompany,
      destinationClient: finalDestCompany,
      destinationAddress: destinationAddress || 'Consignee Central Logistics Hub',
      dispatchDate: req.body.dispatchDate ? new Date(req.body.dispatchDate) : new Date(),
      estimatedDelivery: req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : new Date(Date.now() + 86400000 * 3),
      products: resolvedProducts,
      shippingStatus,
      checklist: finalChecklist,
      qrPayload,
      notes: notes || `Direct freight dispatch from ${originCompany} to ${finalDestCompany}.`,
    });

    // Mark products as SHIPPED or register newly recorded products into the Product collection
    for (const prod of resolvedProducts) {
      const existing = await Product.findOne({
        $or: [{ passportId: prod.passportId }, { serialNumber: prod.serialNumber }]
      });
      if (existing) {
        await Product.updateOne(
          { _id: existing._id },
          { status: 'SHIPPED', shipmentId }
        );
      } else {
        const pId = prod.passportId || (prod.serialNumber.startsWith('DPP-') ? prod.serialNumber : `DPP-${prod.serialNumber}`);
        const sNum = prod.serialNumber || pId.replace('DPP-', '');
        await Product.create({
          passportId: pId,
          serialNumber: sNum,
          modelName: prod.modelName || 'AeroDrive HP-350 Electric Motor',
          productCategory: 'EV Powertrain / High-Performance Traction Motor',
          assemblyId: 'ASM-MVTEC-POWERTRAIN-401',
          facilityLocation: originFacility || 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
          manufacturedDate: new Date(),
          specifications: {
            ratedPowerKw: 350,
            maxRpm: 20000,
            peakTorqueNm: 520,
            efficiencyRating: 'IE5 Ultra-Premium (97.4%)',
            nominalVoltageV: 800,
            coolingMethod: 'Direct Stator Slot Oil Spray & Glycol Jacket',
            totalWeightKg: 48.5
          },
          sustainability: {
            totalCarbonFootprintKgCO2e: 184.2,
            recycledMaterialPercentage: 35.5,
            recyclabilityRatePercentage: 97.2,
            euBatteryDppCompliant: true,
            circularityIndex: 0.91,
            repairabilityScore: 'Class A (High Modularity)'
          },
          componentsUsed: [
            {
              componentId: 'CMP-MVTEC-HARNESS-101',
              componentName: 'Precision High-Voltage Stator Phase Lead Harness',
              componentType: 'Wiring Harness',
              serialNumber: `SN-CMP-${sNum}`
            }
          ],
          materialBatchesUsed: [
            {
              batchId: 'MB-MVTEC-CABLE-01',
              materialName: 'Class-H High-Temperature Stator Lead Wire & HV Harness',
              category: 'Conductor',
              supplierName: 'MVTec Precision Conductors GmbH'
            }
          ],
          complianceCertificates: ['ISO 9001', 'EU ESPR 2024/1781', 'CE Mark'],
          status: 'SHIPPED',
          shipmentId: shipmentId,
          passportUrl: `http://${lanIp}:${port}/dpp?id=${pId}`,
          qrPayload: `http://${lanIp}:${port}/dpp?id=${pId}`
        });
      }
    }

    // Log Manufacturing Event
    await ManufacturingEvent.create({
      eventId: 'EVT-' + Date.now().toString().slice(-6),
      eventType: 'DISPATCH',
      targetType: 'SHIPMENT',
      targetId: shipmentId,
      station: 'BAY-LOGISTICS-OUTBOUND',
      operator: 'Logistics Lead: Tyler Brooks',
      status: 'SUCCESS',
      remarks: `Shipment ${shipmentId} registered from ${originCompany} to ${finalDestCompany} with ${resolvedProducts.length} serialized product(s).`,
      timestamp: new Date()
    });

    // Log Cryptographic Audit Record
    await auditService.recordAuditEvent({
      actionType: 'CREATE',
      entityType: 'Shipment',
      entityId: shipmentId,
      actor: 'Logistics Lead',
      newValues: newShipment,
      summary: `Registered shipment ${shipmentId} from ${originCompany} to ${finalDestCompany} (${resolvedProducts.length} motors).`
    });

    return res.status(201).json({ success: true, data: newShipment });
  } catch (err) {
    console.error('Error creating shipment:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns complete end-to-end traceability for a shipment:
 * Shipment -> Products (Serial Numbers) -> Assemblies -> Components -> Raw Material Batches
 */
async function getShipmentTraceability(req, res) {
  try {
    const { id } = req.params;
    let shipment = null;
    if (id && id !== 'latest') {
      shipment = await Shipment.findOne({ $or: [{ shipmentId: id }, { trackingNumber: id }, { _id: id }] });
    }
    // If specific id not found or requested 'latest', load most recent shipment
    if (!shipment) {
      const allShipments = await Shipment.find({});
      if (allShipments.length > 0) {
        shipment = allShipments[allShipments.length - 1];
      }
    }
    if (!shipment) {
      return res.status(404).json({ success: false, message: `No shipments found.` });
    }

    // Collect products
    const productPassports = (shipment.products || []).map(p => p.passportId);
    const productSerials = (shipment.products || []).map(p => p.serialNumber);

    const fullProducts = await Product.find({
      $or: [
        { passportId: { $in: productPassports } },
        { serialNumber: { $in: productSerials } },
        { shipmentId: shipment.shipmentId }
      ]
    });

    // Collect assemblies
    const assemblyIds = [...new Set(fullProducts.map(p => p.assemblyId).filter(Boolean))];
    const fullAssemblies = await Assembly.find({
      assemblyId: { $in: assemblyIds }
    });

    // Collect components
    const componentIds = new Set();
    fullProducts.forEach(p => {
      (p.componentsUsed || []).forEach(c => componentIds.add(c.componentId));
    });
    fullAssemblies.forEach(a => {
      (a.componentsUsed || []).forEach(c => componentIds.add(c.componentId));
    });

    const fullComponents = await Component.find({
      componentId: { $in: Array.from(componentIds) }
    });

    // Collect raw material batches
    const batchIds = new Set();
    fullProducts.forEach(p => {
      (p.materialBatchesUsed || []).forEach(b => batchIds.add(b.batchId));
    });
    fullComponents.forEach(c => {
      (c.materialBatches || []).forEach(b => batchIds.add(b.batchId));
    });

    const fullBatches = await MaterialBatch.find({
      batchId: { $in: Array.from(batchIds) }
    });

    // Collect recent manufacturing events
    const allTargetIds = [
      shipment.shipmentId,
      ...fullProducts.map(p => p.passportId),
      ...fullProducts.map(p => p.serialNumber),
      ...Array.from(componentIds),
      ...Array.from(batchIds)
    ];

    let events = await ManufacturingEvent.find({
      targetId: { $in: allTargetIds }
    });

    if (!events || events.length === 0) {
      events = await ManufacturingEvent.find({});
    }

    if (Array.isArray(events)) {
      events = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
    } else {
      events = [];
    }

    const baseUrl = getBaseUrl(req);

    return res.status(200).json({
      success: true,
      data: {
        shipment,
        originCompany: shipment.originCompany || 'AeroDrive Powertrains Inc.',
        destinationCompany: shipment.destinationCompany || shipment.destinationClient,
        products: fullProducts.length > 0 ? fullProducts : shipment.products,
        assemblies: fullAssemblies,
        components: fullComponents,
        materialBatches: fullBatches,
        events,
        checklist: shipment.checklist || DEFAULT_CHECKLIST_ITEMS,
        qrPayload: `${baseUrl}/shipment-verify/${shipment.shipmentId}`
      }
    });
  } catch (err) {
    console.error('Error fetching shipment traceability:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Updates a check on the shipment checklist (records the exact checkedAt time, actor, and state)
 * Also allows adding a new custom checkpoint.
 */
async function updateShipmentChecklist(req, res) {
  try {
    const { id } = req.params;
    const { checkId, checked, checkedBy, notes, newCheck } = req.body;

    const shipment = await Shipment.findOne({ $or: [{ shipmentId: id }, { trackingNumber: id }, { _id: id }] });
    if (!shipment) {
      return res.status(404).json({ success: false, message: `Shipment ${id} not found.` });
    }

    let checklist = shipment.checklist && shipment.checklist.length > 0 
      ? [...shipment.checklist] 
      : DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));

    let modifiedTitle = '';
    let actionDone = '';

    if (newCheck && newCheck.title) {
      // Adding a new checkpoint
      const added = {
        id: newCheck.id || `chk-custom-${Date.now()}`,
        stage: newCheck.stage || 'GENERAL',
        title: newCheck.title,
        description: newCheck.description || '',
        checked: Boolean(newCheck.checked),
        checkedAt: newCheck.checked ? new Date().toISOString() : null,
        checkedBy: newCheck.checked ? (checkedBy || 'Logistics Inspector') : null,
        notes: newCheck.notes || '',
      };
      checklist.push(added);
      modifiedTitle = added.title;
      actionDone = 'Added new custom check';
    } else if (checkId) {
      // Toggling an existing checkpoint
      const index = checklist.findIndex(c => c.id === checkId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: `Check ${checkId} not found in shipment checklist.` });
      }

      const isChecked = typeof checked === 'boolean' ? checked : !checklist[index].checked;
      const exactTime = isChecked ? new Date().toISOString() : null;
      const actor = isChecked ? (checkedBy || 'Logistics Inspector') : null;

      checklist[index] = {
        ...checklist[index],
        checked: isChecked,
        checkedAt: exactTime,
        checkedBy: actor,
        notes: notes !== undefined ? notes : checklist[index].notes
      };

      modifiedTitle = checklist[index].title;
      actionDone = isChecked ? `Checked at ${exactTime}` : 'Unchecked';
    }

    // Save updated checklist to database
    await Shipment.updateOne(
      { $or: [{ shipmentId: id }, { trackingNumber: id }, { _id: id }] },
      { checklist }
    );

    // Log Manufacturing Event for audit compliance
    await ManufacturingEvent.create({
      eventId: 'EVT-' + Date.now().toString().slice(-6),
      eventType: 'DISPATCH',
      targetType: 'SHIPMENT',
      targetId: shipment.shipmentId,
      station: 'TRACEABILITY-CHECK-STATION',
      operator: checkedBy || 'Logistics Inspector',
      status: 'SUCCESS',
      remarks: `Verification check "${modifiedTitle}" updated on shipment ${shipment.shipmentId}: ${actionDone}.`,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Check updated successfully: ${actionDone}`,
      checklist,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating shipment checklist:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllShipments,
  getShipmentById,
  createShipment,
  getShipmentTraceability,
  updateShipmentChecklist,
};

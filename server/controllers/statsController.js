const Product = require('../models/Product');
const MaterialBatch = require('../models/MaterialBatch');
const Component = require('../models/Component');
const Assembly = require('../models/Assembly');
const Shipment = require('../models/Shipment');
const Defect = require('../models/Defect');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const AuditRecord = require('../models/AuditRecord');
const { getDbState } = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const [
      allProducts,
      allBatches,
      allComponents,
      allAssemblies,
      allShipments,
      allDefects,
      allEvents,
      allAudits,
    ] = await Promise.all([
      Product.find({}),
      MaterialBatch.find({}),
      Component.find({}),
      Assembly.find({}),
      Shipment.find({}),
      Defect.find({}),
      ManufacturingEvent.find({}),
      AuditRecord.find({}),
    ]);

    // 1. Summary Card Counts (Calculated dynamically from database)
    const totalProducts = allProducts.length;
    const totalBatches = allBatches.length;
    const totalDefects = allDefects.length;
    const totalShipments = allShipments.length;

    // 2. Defective or Quarantined Batches
    const quarantinedBatches = allBatches.filter(b => 
      b.status === 'DEFECTIVE' || b.status === 'QUARANTINED' || b.qualityPassed === false
    );

    // 3. Product Inspection & Lifecycle Status Distribution
    const inspectionStatusCounts = {
      MANUFACTURED: 0,
      QC_APPROVED: 0,
      IN_STORAGE: 0,
      SHIPPED: 0,
      QUARANTINED: 0,
      RECALLED: 0,
    };
    allProducts.forEach(p => {
      const st = p.status || 'MANUFACTURED';
      if (inspectionStatusCounts[st] !== undefined) {
        inspectionStatusCounts[st]++;
      } else {
        inspectionStatusCounts[st] = 1;
      }
    });

    // 4. Visual Chart 1: Products Manufactured Over Time
    // Group products by manufacture date (YYYY-MM-DD)
    const productTimelineMap = {};
    allProducts.forEach(p => {
      const d = p.manufacturedDate ? new Date(p.manufacturedDate) : new Date(p.createdAt || Date.now());
      const dateKey = d.toISOString().split('T')[0];
      productTimelineMap[dateKey] = (productTimelineMap[dateKey] || 0) + 1;
    });
    // Ensure chronological sort
    const productsOverTime = Object.keys(productTimelineMap).sort().map(key => ({
      date: key,
      formattedDate: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: productTimelineMap[key],
    }));

    // If only few dates exist, provide contextual timeline points
    if (productsOverTime.length === 0) {
      productsOverTime.push({
        date: new Date().toISOString().split('T')[0],
        formattedDate: 'Today',
        count: totalProducts,
      });
    }

    // 5. Visual Chart 2: Defect Counts by Status
    const defectStatusMap = {
      OPEN: 0,
      INVESTIGATING: 0,
      CONTAINED: 0,
      RESOLVED: 0,
    };
    allDefects.forEach(d => {
      const st = (d.status || 'OPEN').toUpperCase();
      if (defectStatusMap[st] !== undefined) {
        defectStatusMap[st]++;
      } else {
        defectStatusMap[st] = 1;
      }
    });
    const defectsByStatus = Object.keys(defectStatusMap).map(status => ({
      status,
      count: defectStatusMap[status],
    }));

    // 6. Visual Chart 3: Shipment Status Distribution
    const shipmentStatusMap = {
      PREPARING: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      HELD_RECALL: 0,
    };
    allShipments.forEach(s => {
      const st = (s.shippingStatus || 'PREPARING').toUpperCase();
      if (shipmentStatusMap[st] !== undefined) {
        shipmentStatusMap[st]++;
      } else {
        shipmentStatusMap[st] = 1;
      }
    });
    const shipmentsByStatus = Object.keys(shipmentStatusMap).map(status => ({
      status,
      count: shipmentStatusMap[status],
    }));

    // 7. Recent Manufacturing Events (sorted descending)
    const recentEvents = [...allEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    // 8. Recent Shipments (sorted descending with complete details)
    const recentShipments = [...allShipments]
      .sort((a, b) => new Date(b.dispatchDate || b.createdAt) - new Date(a.dispatchDate || a.createdAt))
      .map(s => ({
        _id: s._id,
        shipmentId: s.shipmentId,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        originCompany: s.originCompany || 'AeroDrive Powertrains Inc.',
        originFacility: s.originFacility || 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
        destinationCompany: s.destinationCompany || s.destinationClient || 'OEM Partner Facility',
        destinationClient: s.destinationCompany || s.destinationClient || 'OEM Partner Facility',
        destinationAddress: s.destinationAddress || 'Petuelring 130, 80809 Munich, Germany',
        shippingStatus: s.shippingStatus,
        dispatchDate: s.dispatchDate,
        products: Array.isArray(s.products) ? s.products : [],
        productCount: Array.isArray(s.products) ? s.products.length : 0,
        checklist: Array.isArray(s.checklist) ? s.checklist : [],
        qrPayload: s.qrPayload,
      }));

    const destinationNames = [...new Set(allShipments.map(s => s.destinationCompany || s.destinationClient).filter(Boolean))];
    const shipmentDestinationSummary = destinationNames.length > 0 ? destinationNames.join(', ') : 'Direct Logistics';

    // 9. Recent Audit Records (sorted descending)
    const recentAudits = [...allAudits]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          totalProducts,
          totalBatches,
          totalDefects,
          totalShipments,
          totalComponents: allComponents.length,
          totalAssemblies: allAssemblies.length,
          totalEvents: allEvents.length,
          totalAudits: allAudits.length,
          activeQuarantines: inspectionStatusCounts.QUARANTINED || 0,
        },
        productInspectionStatus: inspectionStatusCounts,
        quarantinedBatches,
        recentShipments,
        shipmentDestinationSummary,
        recentEvents,
        recentAudits,
        charts: {
          productsOverTime,
          defectsByStatus,
          shipmentsByStatus,
        },
        dbState: getDbState(),
      }
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardStats,
};

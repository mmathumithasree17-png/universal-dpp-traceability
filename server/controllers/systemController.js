const os = require('os');
const { getDbState, fileStore } = require('../config/db');
const runSeed = require('../scripts/seed');
const MaterialBatch = require('../models/MaterialBatch');
const Component = require('../models/Component');
const Assembly = require('../models/Assembly');
const Product = require('../models/Product');
const Shipment = require('../models/Shipment');
const Defect = require('../models/Defect');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

async function getHealth(req, res) {
  try {
    const dbState = getDbState();
    return res.status(200).json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Universal Digital Product Passport Traceability API',
      version: '1.0.0',
      database: {
        mode: dbState.mode,
        isConnected: dbState.isConnected,
        uri: dbState.mode === 'mongodb' ? dbState.uri.replace(/:([^:@]+)@/, ':****@') : 'Local Persistent Storage Engine',
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function triggerSeed(req, res) {
  try {
    await runSeed();
    if (fileStore.data.systemState) {
      fileStore.data.systemState.userCleared = false;
      fileStore.save();
    }
    return res.status(200).json({
      success: true,
      message: 'Demonstration dataset successfully reloaded into persistent storage.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Completely clears all manufacturing records from the database
 * and marks userCleared = true so auto-seed does not restore it on reboot.
 */
async function clearDataset(req, res) {
  try {
    // 1. Delete records via Models
    await MaterialBatch.deleteMany({});
    await Component.deleteMany({});
    await Assembly.deleteMany({});
    await Product.deleteMany({});
    await Shipment.deleteMany({});
    await Defect.deleteMany({});
    await ManufacturingEvent.deleteMany({});
    await AuditRecord.deleteMany({});

    // 2. Clear all internal collections in fileStore
    const collections = [
      'materialbatch', 'materialbatches',
      'component', 'components',
      'assembly', 'assemblies',
      'product', 'products',
      'shipment', 'shipments',
      'defect', 'defects',
      'manufacturingevent', 'manufacturingevents',
      'auditrecord', 'auditrecords'
    ];
    for (const c of collections) {
      fileStore.data[c] = [];
    }

    // 3. Mark userCleared = true so server doesn't auto-seed
    fileStore.data.systemState = {
      userCleared: true,
      lastClearedAt: new Date().toISOString()
    };
    fileStore.save();

    // 4. Initialize a clean Genesis block for the tamper-evident audit ledger
    await auditService.recordAuditEvent({
      actionType: 'SYSTEM_RESET',
      entityType: 'System',
      entityId: 'SYSTEM_CLEARED',
      actor: req.body?.actor || 'Manufacturing Admin',
      summary: 'All datasets cleared. System initialized for new custom dataset entry.',
      ipAddress: req.ip || '127.0.0.1'
    });

    console.log('[System] All datasets cleared. Ready for new dataset.');

    return res.status(200).json({
      success: true,
      message: 'All dataset records have been completely removed. System is ready for your new dataset.',
      counts: {
        totalProducts: 0,
        totalBatches: 0,
        totalComponents: 0,
        totalAssemblies: 0,
        totalShipments: 0,
        totalDefects: 0,
        totalEvents: 0,
      }
    });
  } catch (err) {
    console.error('Error clearing dataset:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Imports a new user-supplied dataset (batches, components, assemblies, products, shipments, etc.)
 */
async function importDataset(req, res) {
  try {
    const {
      materialBatches = [],
      components = [],
      assemblies = [],
      products = [],
      shipments = [],
      defects = [],
      manufacturingEvents = [],
      replaceExisting = true,
      actor = 'Dataset Importer'
    } = req.body;

    if (replaceExisting) {
      await MaterialBatch.deleteMany({});
      await Component.deleteMany({});
      await Assembly.deleteMany({});
      await Product.deleteMany({});
      await Shipment.deleteMany({});
      await Defect.deleteMany({});
      await ManufacturingEvent.deleteMany({});
      await AuditRecord.deleteMany({});

      const collections = [
        'materialbatch', 'materialbatches',
        'component', 'components',
        'assembly', 'assemblies',
        'product', 'products',
        'shipment', 'shipments',
        'defect', 'defects',
        'manufacturingevent', 'manufacturingevents',
        'auditrecord', 'auditrecords'
      ];
      for (const c of collections) {
        fileStore.data[c] = [];
      }
      fileStore.save();
    }

    if (materialBatches.length > 0) await MaterialBatch.insertMany(materialBatches);
    if (components.length > 0) await Component.insertMany(components);
    if (assemblies.length > 0) await Assembly.insertMany(assemblies);
    if (products.length > 0) await Product.insertMany(products);
    if (shipments.length > 0) await Shipment.insertMany(shipments);
    if (defects.length > 0) await Defect.insertMany(defects);
    if (manufacturingEvents.length > 0) await ManufacturingEvent.insertMany(manufacturingEvents);

    fileStore.data.systemState = {
      userCleared: false,
      lastImportedAt: new Date().toISOString()
    };
    fileStore.save();

    await auditService.ensureInitialChainIntegrity();
    await auditService.recordAuditEvent({
      actionType: 'IMPORT',
      entityType: 'Dataset',
      entityId: `IMPORT-${Date.now()}`,
      actor: actor,
      summary: `Imported new dataset: ${products.length} products, ${materialBatches.length} batches, ${components.length} components, ${assemblies.length} assemblies, ${shipments.length} shipments.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    console.log(`[System] New dataset imported successfully: ${products.length} products.`);

    return res.status(200).json({
      success: true,
      message: 'New dataset successfully imported and verified.',
      importedCounts: {
        materialBatches: materialBatches.length,
        components: components.length,
        assemblies: assemblies.length,
        products: products.length,
        shipments: shipments.length,
        defects: defects.length,
        manufacturingEvents: manufacturingEvents.length
      }
    });
  } catch (err) {
    console.error('Error importing dataset:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Exports current dataset as JSON
 */
async function exportDataset(req, res) {
  try {
    const data = {
      materialBatches: await MaterialBatch.find({}),
      components: await Component.find({}),
      assemblies: await Assembly.find({}),
      products: await Product.find({}),
      shipments: await Shipment.find({}),
      defects: await Defect.find({}),
      manufacturingEvents: await ManufacturingEvent.find({}),
      exportedAt: new Date().toISOString()
    };
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns reachable local network (LAN) IP and URLs for mobile QR scanning
 */
async function getNetworkInfo(req, res) {
  try {
    const interfaces = os.networkInterfaces();
    const networkList = [];
    let detectedLanIp = null;

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          networkList.push({
            name,
            address: net.address,
            netmask: net.netmask,
          });
          if (!detectedLanIp || name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan') || name.toLowerCase().includes('eth')) {
            detectedLanIp = net.address;
          }
        }
      }
    }

    const port = process.env.PORT || 5001;
    const publicUrl = process.env.PUBLIC_URL || null;
    const lanUrl = detectedLanIp ? `http://${detectedLanIp}:${port}/dashboard` : null;
    const localUrl = `http://localhost:${port}/dashboard`;

    return res.status(200).json({
      success: true,
      lanIp: detectedLanIp,
      lanUrl,
      localUrl,
      publicUrl,
      port,
      networkList,
      activeUrl: publicUrl || lanUrl || localUrl,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getHealth,
  getNetworkInfo,
  triggerSeed,
  clearDataset,
  importDataset,
  exportDataset,
};

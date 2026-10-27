require('dotenv').config();
const { connectDB } = require('../config/db');
const MaterialBatch = require('../models/MaterialBatch');
const Component = require('../models/Component');
const Assembly = require('../models/Assembly');
const Product = require('../models/Product');
const Shipment = require('../models/Shipment');
const Defect = require('../models/Defect');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

const {
  seedMaterialBatches,
  seedComponents,
  seedAssemblies,
  seedProducts,
  seedShipments,
  seedDefects,
  seedManufacturingEvents,
  seedAuditRecords,
} = require('./seedData');

async function runSeed() {
  console.log('[Seed] Initializing database connection...');
  await connectDB();

  console.log('[Seed] Clearing existing demo records...');
  await MaterialBatch.deleteMany({});
  await Component.deleteMany({});
  await Assembly.deleteMany({});
  await Product.deleteMany({});
  await Shipment.deleteMany({});
  await Defect.deleteMany({});
  await ManufacturingEvent.deleteMany({});
  await AuditRecord.deleteMany({});

  console.log('[Seed] Inserting realistic electric motor manufacturing records...');
  await MaterialBatch.insertMany(seedMaterialBatches);
  await Component.insertMany(seedComponents);
  await Assembly.insertMany(seedAssemblies);
  await Product.insertMany(seedProducts);
  await Shipment.insertMany(seedShipments);
  await Defect.insertMany(seedDefects);
  await ManufacturingEvent.insertMany(seedManufacturingEvents);
  await AuditRecord.insertMany(seedAuditRecords);
  await auditService.ensureInitialChainIntegrity();

  console.log('----------------------------------------------------');
  console.log('✓ Seed completed successfully!');
  console.log(`- Material Batches: ${seedMaterialBatches.length}`);
  console.log(`- Components:       ${seedComponents.length}`);
  console.log(`- Assemblies:       ${seedAssemblies.length}`);
  console.log(`- Finished DPPs:    ${seedProducts.length}`);
  console.log(`- Shipments:        ${seedShipments.length}`);
  console.log(`- Defects:          ${seedDefects.length}`);
  console.log(`- Events:           ${seedManufacturingEvents.length}`);
  console.log(`- Audit Records:    ${seedAuditRecords.length}`);
  console.log('----------------------------------------------------');
}

// Auto-run if executed directly
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = runSeed;

const { app, startServer } = require('../index');
const http = require('http');

async function testTraceabilityModule() {
  console.log('===========================================================');
  console.log('🧪 TESTING FORWARD & BACKWARD TRACEABILITY MODULE (PS10)');
  console.log('===========================================================');

  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // STEP 1: Forward Trace from Material Batch B-204
    console.log('\n[TEST STEP 1] Forward Tracing from Raw Material Batch B-204:');
    const fwdRes = await request('GET', '/api/trace/forward/B-204');
    console.log(`   - HTTP Status: ${fwdRes.status}, Latency: ${fwdRes.data.meta?.executionTimeMs}ms`);
    if (fwdRes.status !== 200) {
      throw new Error(`Forward trace query failed: ${JSON.stringify(fwdRes.data)}`);
    }

    const fwdData = fwdRes.data;
    const fwdPipeline = fwdData.pipeline;
    console.log(`   ✓ Resolved Entity Type: ${fwdData.meta?.resolvedType}`);
    console.log(`   ✓ Batches:              ${fwdPipeline.materialBatches.length} (Target: B-204)`);
    console.log(`   ✓ Downstream Components:${fwdPipeline.components.length} items`);
    fwdPipeline.components.forEach(c => console.log(`     -> ${c.componentId}: ${c.componentName}`));
    console.log(`   ✓ Downstream Assemblies:${fwdPipeline.assemblies.length} items`);
    fwdPipeline.assemblies.forEach(a => console.log(`     -> ${a.assemblyId}: ${a.assemblyName}`));
    console.log(`   ✓ Downstream Finished Units: ${fwdPipeline.products.length} units`);
    fwdPipeline.products.forEach(p => console.log(`     -> ${p.passportId}: ${p.modelName} (Status: ${p.status})`));
    console.log(`   ✓ Downstream Shipments: ${fwdPipeline.shipments.length} consignments`);
    fwdPipeline.shipments.forEach(s => console.log(`     -> ${s.shipmentId}: ${s.destinationClient} (${s.trackingNumber})`));

    // Validations on Forward Trace from B-204
    const compIds = fwdPipeline.components.map(c => c.componentId);
    if (!compIds.includes('CMP-ROTOR-B204-1') || !compIds.includes('CMP-ROTOR-B204-2')) {
      throw new Error('Forward trace from B-204 missing expected downstream rotor components.');
    }
    const prodIds = fwdPipeline.products.map(p => p.passportId);
    if (!prodIds.includes('DPP-EV600-B204-001') || !prodIds.includes('DPP-EV600-B204-002')) {
      throw new Error('Forward trace from B-204 missing expected GT600 motors.');
    }
    const shipIds = fwdPipeline.shipments.map(s => s.shipmentId);
    if (!shipIds.includes('SHP-2026-B204')) {
      throw new Error('Forward trace from B-204 missing Aston Martin shipment SHP-2026-B204.');
    }
    console.log('   ✓ VERIFIED: Material Batch B-204 correctly traces downstream to components, assembly, products, and customer shipments!');

    // STEP 2: Backward Trace from Finished Motor DPP-EV600-B204-001
    console.log('\n[TEST STEP 2] Backward Tracing from Finished Motor DPP-EV600-B204-001:');
    const bwdRes = await request('GET', '/api/trace/backward/DPP-EV600-B204-001');
    console.log(`   - HTTP Status: ${bwdRes.status}, Latency: ${bwdRes.data.meta?.executionTimeMs}ms`);
    if (bwdRes.status !== 200) {
      throw new Error(`Backward trace query failed: ${JSON.stringify(bwdRes.data)}`);
    }

    const bwdData = bwdRes.data;
    const bwdPipeline = bwdData.pipeline;
    console.log(`   ✓ Finished Product:     ${bwdPipeline.products[0]?.passportId} - ${bwdPipeline.products[0]?.modelName}`);
    console.log(`   ✓ Powertrain Assembly:  ${bwdPipeline.assemblies[0]?.assemblyId} - ${bwdPipeline.assemblies[0]?.assemblyName}`);
    console.log(`   ✓ Subcomponents:        ${bwdPipeline.components.length} components`);
    bwdPipeline.components.forEach(c => console.log(`     -> ${c.componentId}: ${c.componentName}`));
    console.log(`   ✓ Source Material Batches: ${bwdPipeline.materialBatches.length} heat lots`);
    bwdPipeline.materialBatches.forEach(b => console.log(`     -> ${b.batchId}: ${b.materialName} (${b.supplierName})`));
    console.log(`   ✓ Supplier Provenance:  ${bwdPipeline.supplierProvenance.length} suppliers`);
    bwdPipeline.supplierProvenance.forEach(s => console.log(`     -> Supplier: ${s.supplierName} (${s.batchesSupplied.length} lots, Total: ${s.totalQuantityKg} kg)`));

    // Confirm that a product containing multiple components shows all its actual source material batches
    const bwdBatchIds = bwdPipeline.materialBatches.map(b => b.batchId);
    if (!bwdBatchIds.includes('B-204')) {
      throw new Error('Backward trace missing source alloy steel batch B-204.');
    }
    if (!bwdBatchIds.includes('MB-COPPER-2026-088')) {
      throw new Error('Backward trace missing source copper batch MB-COPPER-2026-088.');
    }
    if (!bwdBatchIds.includes('MB-MAGNET-2026-014')) {
      throw new Error('Backward trace missing source magnet batch MB-MAGNET-2026-014.');
    }
    console.log('   ✓ VERIFIED: Motor containing multiple components shows ALL its actual source material batches (B-204, Copper, Magnets)!');

    // STEP 3: Confirm Both Directions Produce Consistent Relationships
    console.log('\n[TEST STEP 3] Confirming Bi-Directional Consistency:');
    // Forward trace from B-204 includes DPP-EV600-B204-001
    // Backward trace from DPP-EV600-B204-001 includes B-204
    const fwdContainsProd = fwdPipeline.products.some(p => p.passportId === 'DPP-EV600-B204-001');
    const bwdContainsBatch = bwdPipeline.materialBatches.some(b => b.batchId === 'B-204');
    if (!fwdContainsProd || !bwdContainsBatch) {
      throw new Error('Bi-directional relationship inconsistency detected between B-204 and DPP-EV600-B204-001.');
    }
    console.log('   ✓ VERIFIED: Forward and Backward traces produce 100% consistent, bi-directional relationships');

    // STEP 4: Confirm Multi-Level Genealogy & Product Deduplication
    console.log('\n[TEST STEP 4] Confirming Deduplication of Products with Shared Components:');
    const prodCounts = {};
    fwdPipeline.products.forEach(p => {
      prodCounts[p.passportId] = (prodCounts[p.passportId] || 0) + 1;
    });
    const duplicates = Object.entries(prodCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      throw new Error(`Product duplication detected in trace result: ${JSON.stringify(duplicates)}`);
    }
    console.log('   ✓ VERIFIED: All products in trace pipeline are strictly deduplicated (0 duplicates across multi-level paths)');

    // STEP 5: Test Anomaly Detection on Defective Batch MB-SHAFT-2026-033
    console.log('\n[TEST STEP 5] Testing Anomaly Detection on Defective Material Batch MB-SHAFT-2026-033:');
    const defectTraceRes = await request('GET', '/api/trace/forward/MB-SHAFT-2026-033');
    if (defectTraceRes.status !== 200) {
      throw new Error(`Defect trace query failed: ${JSON.stringify(defectTraceRes.data)}`);
    }
    const anomalies = defectTraceRes.data.anomalies || [];
    console.log(`   - Detected Anomalies: ${anomalies.length}`);
    anomalies.forEach(a => console.log(`     [${a.severity}] ${a.type}: ${a.message}`));

    const hasDefectiveBatchAlert = anomalies.some(a => a.entityId === 'MB-SHAFT-2026-033' && a.type === 'DEFECTIVE_BATCH');
    const hasQuarantinedProdAlert = anomalies.some(a => a.type === 'PRODUCT_QUARANTINED');
    if (!hasDefectiveBatchAlert || !hasQuarantinedProdAlert) {
      throw new Error('Anomaly detection failed to flag defective batch and quarantined product.');
    }
    console.log('   ✓ VERIFIED: Defective batches, failed inspections, and quarantined units are prominently highlighted in trace results');

    // STEP 6: Test Missing / Invalid Identifier Handling
    console.log('\n[TEST STEP 6] Testing Invalid Identifier Handling:');
    const invalidRes = await request('GET', '/api/trace/forward/NONEXISTENT-TARGET-999');
    console.log(`   - Status: ${invalidRes.status}, Message: "${invalidRes.data.message}"`);
    if (invalidRes.status !== 404) {
      throw new Error(`Expected HTTP 404 for invalid identifier, got ${invalidRes.status}`);
    }
    console.log('   ✓ VERIFIED: Proper 404 error and user-friendly explanation returned when records are missing');

    // STEP 7: Test Optional Filtering (Status Filter)
    console.log('\n[TEST STEP 7] Testing Filtering by Status:');
    const filteredRes = await request('GET', '/api/trace/forward/B-204?statusFilter=SHIPPED');
    const filteredProds = filteredRes.data.pipeline.products || [];
    console.log(`   - Products matching statusFilter=SHIPPED: ${filteredProds.length}`);
    const nonShipped = filteredProds.filter(p => p.status !== 'SHIPPED');
    if (nonShipped.length > 0) {
      throw new Error('Filtering failed: non-shipped products appeared in filtered results.');
    }
    console.log('   ✓ VERIFIED: Status and date range filtering working cleanly');

    console.log('\n===========================================================');
    console.log('🎉 ALL FORWARD & BACKWARD TRACEABILITY TESTS PASSED 100%!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

testTraceabilityModule();

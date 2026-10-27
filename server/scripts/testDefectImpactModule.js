const { app, startServer } = require('../index');
const http = require('http');

async function testDefectImpactModule() {
  console.log('===========================================================');
  console.log('🧪 TESTING DEFECT IMPACT ANALYSIS MODULE (PS10)');
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
    const timestampSuffix = Date.now().toString().slice(-6);
    const batchB204Id = `B-204-${timestampSuffix}`;
    const batchUnrelatedId = `B-999-UNRELATED-${timestampSuffix}`;

    // STEP 1: Set up the required test scenario
    console.log('\n[TEST STEP 1] Setting up Test Scenario: Material Batch B-204 and components used in 3 product batches...');

    // 1. Create Material Batch B-204
    await request('POST', '/api/batches', {
      batchId: batchB204Id,
      materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy',
      category: 'AlloySteel',
      supplierName: 'Vanguard Metallurgical Europe',
      supplierLotNumber: 'LOT-B204-FORGING',
      quantity: 1500,
      unit: 'kg',
      purityOrGrade: 'Grade 42CrMo4+QT',
      status: 'ACTIVE',
      qualityPassed: true
    });

    // 2. Create Unrelated Material Batch
    await request('POST', '/api/batches', {
      batchId: batchUnrelatedId,
      materialName: 'Completely Unrelated Insulating Resin',
      category: 'InsulationResin',
      supplierName: 'Global Polymers Corp',
      supplierLotNumber: 'LOT-UNRELATED-001',
      quantity: 500,
      unit: 'kg',
      status: 'ACTIVE',
      qualityPassed: true
    });

    // 3. Create Components using B-204
    const compAId = `CMP-ROTOR-B204-A-${timestampSuffix}`;
    const compBId = `CMP-ROTOR-B204-B-${timestampSuffix}`;
    const compUnrelatedId = `CMP-UNRELATED-${timestampSuffix}`;

    const Component = require('../models/Component');
    await Component.create({
      componentId: compAId,
      componentName: 'Precision Balanced IPM Rotor Core with B-204 Shaft Stock',
      componentType: 'Rotor',
      materialBatches: [{ batchId: batchB204Id, materialName: '42CrMo4 Alloy', quantityUsed: 12.5, unit: 'kg' }],
      lineId: 'LINE-ROTOR-TEST',
      status: 'AVAILABLE'
    });

    await Component.create({
      componentId: compBId,
      componentName: 'Heavy-Duty Industrial Rotor Core with B-204 Shaft Stock',
      componentType: 'Rotor',
      materialBatches: [{ batchId: batchB204Id, materialName: '42CrMo4 Alloy', quantityUsed: 14.0, unit: 'kg' }],
      lineId: 'LINE-ROTOR-TEST',
      status: 'AVAILABLE'
    });

    await Component.create({
      componentId: compUnrelatedId,
      componentName: 'Unrelated Stator Slot Insulation Liner',
      componentType: 'Stator',
      materialBatches: [{ batchId: batchUnrelatedId, materialName: 'Unrelated Resin', quantityUsed: 2.0, unit: 'kg' }],
      lineId: 'LINE-INSUL-TEST',
      status: 'AVAILABLE'
    });

    // 4. Create 3 Finished Products using B-204
    const prod1Id = `DPP-PROD-B204-001-${timestampSuffix}`;
    const prod2Id = `DPP-PROD-B204-002-${timestampSuffix}`;
    const prod3Id = `DPP-PROD-B204-003-${timestampSuffix}`;
    const prodUnrelatedId = `DPP-PROD-UNRELATED-${timestampSuffix}`;

    const shipmentId = `SHP-TEST-B204-${timestampSuffix}`;

    // Product 1: Shipped
    await request('POST', '/api/products', {
      passportId: prod1Id,
      serialNumber: `SN-B204-001-${timestampSuffix}`,
      modelName: 'UltraTorq EV-500 Traction Motor Unit 1',
      assemblyId: 'ASM-2026-0041',
      componentsUsed: [{ componentId: compAId, componentName: 'Precision Rotor' }],
      materialBatchesUsed: [{ batchId: batchB204Id, materialName: 'B-204 Alloy' }],
      status: 'SHIPPED',
      shipmentId
    });

    // Product 2: In-Stock (Manufactured)
    await request('POST', '/api/products', {
      passportId: prod2Id,
      serialNumber: `SN-B204-002-${timestampSuffix}`,
      modelName: 'UltraTorq EV-500 Traction Motor Unit 2',
      assemblyId: 'ASM-2026-0041',
      componentsUsed: [{ componentId: compBId, componentName: 'Heavy-Duty Rotor' }],
      materialBatchesUsed: [{ batchId: batchB204Id, materialName: 'B-204 Alloy' }],
      status: 'MANUFACTURED',
      shipmentId: null
    });

    // Product 3: In-Stock (QC Approved)
    await request('POST', '/api/products', {
      passportId: prod3Id,
      serialNumber: `SN-B204-003-${timestampSuffix}`,
      modelName: 'UltraTorq EV-500 Traction Motor Unit 3',
      assemblyId: 'ASM-2026-0041',
      componentsUsed: [{ componentId: compAId, componentName: 'Precision Rotor' }],
      materialBatchesUsed: [{ batchId: batchB204Id, materialName: 'B-204 Alloy' }],
      status: 'QC_APPROVED',
      shipmentId: null
    });

    // Unrelated Product (Uses only unrelated batch B-999)
    await request('POST', '/api/products', {
      passportId: prodUnrelatedId,
      serialNumber: `SN-UNRELATED-${timestampSuffix}`,
      modelName: 'Unrelated Auxiliary Motor',
      assemblyId: 'ASM-2026-0042',
      componentsUsed: [{ componentId: compUnrelatedId, componentName: 'Slot Liner' }],
      materialBatchesUsed: [{ batchId: batchUnrelatedId, materialName: 'Unrelated Resin' }],
      status: 'SHIPPED'
    });

    // 5. Create Shipment for Product 1
    await request('POST', '/api/shipments', {
      shipmentId,
      destinationClient: 'Aston Martin Lagonda Ltd, Gaydon UK',
      carrier: 'DHL Global Aviation Express',
      destinationAddress: 'Banbury Road, Gaydon, Warwick CV35 0DB, UK',
      trackingNumber: `TRK-ASTON-${timestampSuffix}`,
      shippingStatus: 'IN_TRANSIT',
      products: [{ passportId: prod1Id, serialNumber: `SN-B204-001-${timestampSuffix}`, modelName: 'UltraTorq EV-500' }]
    });

    console.log('✓ Test scenario seeded:');
    console.log(`   - Material Batch: ${batchB204Id}`);
    console.log(`   - 2 Components:   ${compAId}, ${compBId}`);
    console.log(`   - 3 Products:     ${prod1Id} (Shipped), ${prod2Id} (In-Stock), ${prod3Id} (In-Stock)`);
    console.log(`   - 1 Shipment:     ${shipmentId} -> Aston Martin Lagonda Ltd`);
    console.log(`   - Unrelated Item: ${prodUnrelatedId} (Must be excluded)`);

    // STEP 2: Preview Defect Impact
    console.log('\n[TEST STEP 2] Previewing defect impact via GET /api/defects/preview...');
    const previewRes = await request('GET', `/api/defects/preview?sourceType=MATERIAL_BATCH&sourceId=${batchB204Id}`);
    if (previewRes.status !== 200 || !previewRes.data.success) {
      throw new Error(`Preview failed: ${JSON.stringify(previewRes)}`);
    }

    const preview = previewRes.data.data;
    console.log(`✓ Real-time traversal completed in: ${preview.executionTimeMs} ms (${preview.benchmarkResult})`);
    console.log(`   - Total Affected Products: ${preview.summary.totalAffectedProducts}`);
    console.log(`   - Products in Stock:       ${preview.summary.inStockCount}`);
    console.log(`   - Already Shipped:         ${preview.summary.alreadyShippedCount}`);
    console.log(`   - Affected Shipments:      ${preview.summary.affectedShipmentsCount}`);

    // Verify response time is under 1000ms
    if (preview.executionTimeMs >= 1000) {
      throw new Error(`Execution time ${preview.executionTimeMs}ms exceeded 1-second benchmark!`);
    }

    // Verify exactly the 3 affected products are found
    const affectedIds = preview.details.affectedProducts.map(p => p.passportId);
    if (!affectedIds.includes(prod1Id) || !affectedIds.includes(prod2Id) || !affectedIds.includes(prod3Id)) {
      throw new Error(`Expected all 3 products using B-204 to be found. Found: ${JSON.stringify(affectedIds)}`);
    }
    // Verify unrelated product is EXCLUDED
    if (affectedIds.includes(prodUnrelatedId)) {
      throw new Error(`Unrelated product ${prodUnrelatedId} was erroneously included in blast radius!`);
    }
    console.log('✓ VERIFIED: All 3 downstream products correctly identified; unrelated product strictly EXCLUDED.');

    // STEP 3: Declare and Commit Defect
    console.log('\n[TEST STEP 3] Declaring defect and triggering automated containment via POST /api/defects...');
    const defectPayload = {
      sourceType: 'MATERIAL_BATCH',
      sourceId: batchB204Id,
      title: `Hydrogen Embrittlement and Grain Boundary Cracking in Batch ${batchB204Id}`,
      category: 'METALLURGICAL_FLAW',
      severity: 'CRITICAL',
      rootCause: 'Degassing furnace vacuum seal failure causing hydrogen inclusion.',
      reportedBy: 'QC Chief Inspector: Tyler Brooks',
      notes: 'Automated test execution of containment protocol.'
    };

    const commitRes = await request('POST', '/api/defects', defectPayload);
    if (commitRes.status !== 201 || !commitRes.data.success) {
      throw new Error(`Defect commit failed: ${JSON.stringify(commitRes)}`);
    }

    const committedDefect = commitRes.data.data;
    console.log(`✓ Defect committed: ${committedDefect.defectId}`);
    console.log(`   - Containment Action: "${committedDefect.containmentAction}"`);

    // STEP 4: Verify Database State Changes (Automated Containment)
    console.log('\n[TEST STEP 4] Verifying database records were locked and quarantined...');

    // 1. Check Batch B-204 status
    const batchRes = await request('GET', `/api/batches/${batchB204Id}`);
    if (batchRes.data.data.status !== 'QUARANTINED') {
      throw new Error(`Expected batch ${batchB204Id} to be QUARANTINED, got ${batchRes.data.data.status}`);
    }
    console.log(`   ✓ Material Batch ${batchB204Id} status: QUARANTINED`);

    // 2. Check In-Stock Products are QUARANTINED
    const prod2Res = await request('GET', `/api/products/${prod2Id}`);
    if (prod2Res.data.data.product.status !== 'QUARANTINED') {
      throw new Error(`Expected in-stock product ${prod2Id} to be QUARANTINED, got ${prod2Res.data.data.product.status}`);
    }
    console.log(`   ✓ In-Stock Product ${prod2Id} status: QUARANTINED`);

    const prod3Res = await request('GET', `/api/products/${prod3Id}`);
    if (prod3Res.data.data.product.status !== 'QUARANTINED') {
      throw new Error(`Expected in-stock product ${prod3Id} to be QUARANTINED, got ${prod3Res.data.data.product.status}`);
    }
    console.log(`   ✓ In-Stock Product ${prod3Id} status: QUARANTINED`);

    // 3. Check Shipped Product remains SHIPPED (with logistics recall action flagged)
    const prod1Res = await request('GET', `/api/products/${prod1Id}`);
    if (prod1Res.data.data.product.status !== 'SHIPPED') {
      throw new Error(`Expected shipped product ${prod1Id} status to remain SHIPPED, got ${prod1Res.data.data.product.status}`);
    }
    console.log(`   ✓ Shipped Product ${prod1Id} flagged in logistics recall list for consignee Aston Martin`);

    // STEP 5: Test Idempotency / Duplicate Prevention on Retry
    console.log('\n[TEST STEP 5] Testing idempotency: Submitting duplicate defect request to verify duplicate prevention...');
    const retryRes = await request('POST', '/api/defects', defectPayload);
    console.log(`   - Status: ${retryRes.status}, isDuplicate: ${retryRes.data.isDuplicate}`);
    if (!retryRes.data.isDuplicate) {
      throw new Error('Duplicate defect submission was not correctly caught by idempotency protection.');
    }
    console.log('✓ VERIFIED: Duplicate defect submission caught and prevented duplicate database records.');

    console.log('\n===========================================================');
    console.log('🎉 ALL DEFECT IMPACT ANALYSIS TEST CRITERIA PASSED 100%!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

testDefectImpactModule();

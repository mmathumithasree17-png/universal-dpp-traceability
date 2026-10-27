const { app, startServer } = require('../index');
const http = require('http');

async function testEventManagementModule() {
  console.log('===========================================================');
  console.log('🧪 TESTING EVENT MANAGEMENT MODULE (PS10)');
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
    const batchId = `B-EVT-${timestampSuffix}`;
    const compId = `CMP-EVT-${timestampSuffix}`;
    const passportId = `DPP-EVT-${timestampSuffix}`;
    const serialNumber = `SN-EVT-${timestampSuffix}`;
    const shipmentId = `SHP-EVT-${timestampSuffix}`;
    const assemblyId = `ASM-EVT-${timestampSuffix}`;

    console.log(`\n[TEST STEP 1] Initializing Test Entity Hierarchy:`);
    console.log(`  - Material Batch: ${batchId}`);
    console.log(`  - Component:      ${compId}`);
    console.log(`  - Assembly:       ${assemblyId}`);
    console.log(`  - Finished Unit:  ${passportId}`);
    console.log(`  - Shipment:       ${shipmentId}`);

    // 1. Create Raw Material Batch
    const batchRes = await request('POST', '/api/batches', {
      batchId,
      materialName: 'Electro-Magnet Winding Copper 99.99%',
      category: 'Conductor',
      supplierName: 'Aurubis Nordic AG',
      supplierLotNumber: `LOT-CU-${timestampSuffix}`,
      quantity: 800,
      unit: 'kg',
      purityOrGrade: 'Grade C11000',
      status: 'ACTIVE',
      qualityPassed: true
    });
    if (batchRes.status !== 201) throw new Error(`Failed to create test batch: ${JSON.stringify(batchRes)}`);
    console.log('  ✓ Created Material Batch in persistent store');

    // 2. Create Component
    const compRes = await request('POST', '/api/components', {
      componentId: compId,
      componentName: 'Precision 800V Hairpin Stator Assembly',
      componentType: 'Stator',
      lineId: 'LINE-STATOR-AUTO-1',
      operatorId: 'OP-ELENA-ROSTOVA',
      status: 'AVAILABLE',
      qualityCheckPassed: true,
      materialBatches: [{ batchId, quantityUsed: 28.5, unit: 'kg' }]
    });
    if (compRes.status !== 201) throw new Error(`Failed to create test component: ${JSON.stringify(compRes)}`);
    console.log('  ✓ Created Component in persistent store');

    // 2b. Create Assembly Operation
    const asmRes = await request('POST', '/api/assemblies', {
      assemblyId,
      assemblyName: '350kW Permanent Magnet Synchronous Powertrain Unit',
      assemblyType: 'EV Traction Powertrain',
      assemblyLine: 'LINE-POWERTRAIN-ALPHA',
      workstation: 'WS-FINAL-01',
      operator: 'Lead Tech: Tyler Brooks',
      status: 'PASSED',
      components: [{ componentId: compId, componentName: 'Precision 800V Hairpin Stator Assembly', componentType: 'Stator' }]
    });
    if (asmRes.status !== 201) throw new Error(`Failed to create test assembly: ${JSON.stringify(asmRes)}`);
    console.log('  ✓ Created Assembly in persistent store');

    // 3. Create Product
    const prodRes = await request('POST', '/api/products', {
      passportId,
      serialNumber,
      modelName: 'HyperDrive Tri-Motor EVO 350kW Test Unit',
      assemblyId,
      status: 'MANUFACTURED',
      componentsUsed: [{ componentId: compId, componentName: 'Precision 800V Hairpin Stator Assembly' }],
      materialBatchesUsed: [{ batchId, materialName: 'Electro-Magnet Winding Copper 99.99%' }]
    });
    if (prodRes.status !== 201) throw new Error(`Failed to create test product: ${JSON.stringify(prodRes)}`);
    console.log('  ✓ Created Product in persistent store');

    // 4. Create Shipment
    const shipRes = await request('POST', '/api/shipments', {
      shipmentId,
      trackingNumber: `TRK-EVT-${timestampSuffix}`,
      carrier: 'Kuehne+Nagel ColdChain Express',
      destinationClient: 'Porsche AG Powertrain Integration Center',
      destinationAddress: 'Weissach R&D Facility, Germany',
      shippingStatus: 'PREPARING',
      products: [{ passportId, serialNumber, modelName: 'HyperDrive Tri-Motor EVO 350kW Test Unit' }]
    });
    if (shipRes.status !== 201) throw new Error(`Failed to create test shipment: ${JSON.stringify(shipRes)}`);
    console.log('  ✓ Created Shipment in persistent store');

    // STEP 2: Record Required Manufacturing Lifecycle Events
    console.log('\n[TEST STEP 2] Executing Required Lifecycle Workflow:');

    // Event A: Material Receipt
    console.log('  -> Recording Event A: Material Received on Batch...');
    const t1 = new Date(Date.now() - 4000);
    const evtARes = await request('POST', '/api/events', {
      eventId: `EVT-RCV-${timestampSuffix}`,
      eventType: 'MATERIAL_RECEIVED',
      targetType: 'MATERIAL_BATCH',
      targetId: batchId,
      timestamp: t1,
      station: 'INBOUND-RECEIVING-DOCK-1',
      machine: 'Unloading Scale #2',
      operator: 'Marcus Vance',
      inspectionResult: 'PASSED',
      remarks: 'Raw material copper coil arrived from Aurubis Nordic AG with verified certificate of analysis.',
    });
    if (evtARes.status !== 201) throw new Error(`Event A failed: ${JSON.stringify(evtARes)}`);
    console.log(`     ✓ Event A recorded [${evtARes.data.data.eventId}] - Target: ${evtARes.data.data.targetId}`);

    // Event B: Successful Inspection
    console.log('  -> Recording Event B: Successful Quality Inspection on Batch...');
    const t2 = new Date(Date.now() - 3000);
    const evtBRes = await request('POST', '/api/events', {
      eventId: `EVT-INSP-${timestampSuffix}`,
      eventType: 'MATERIAL_INSPECTED',
      targetType: 'MATERIAL_BATCH',
      targetId: batchId,
      timestamp: t2,
      station: 'METALLURGY-SPECTROMETRY-LAB',
      machine: 'XRF Optical Emission Spectrometer',
      operator: 'Dr. Maya Patel',
      inspectionResult: 'PASSED',
      resultingStatus: 'ACTIVE',
      remarks: 'Optical emission spectroscopy verified 99.992% electrolytic purity. ASTM B170 compliant.',
      supportingEvidence: `COA-${timestampSuffix}`,
    });
    if (evtBRes.status !== 201) throw new Error(`Event B failed: ${JSON.stringify(evtBRes)}`);
    console.log(`     ✓ Event B recorded [${evtBRes.data.data.eventId}] - QC Result: ${evtBRes.data.data.inspectionResult}`);

    // Event C: Assemble Component into Product & Final Inspection
    console.log('  -> Recording Event C: Assembly Completed & Approved on Product...');
    const t3 = new Date(Date.now() - 2000);
    const evtCRes = await request('POST', '/api/events', {
      eventId: `EVT-ASM-${timestampSuffix}`,
      eventType: 'ASSEMBLY_COMPLETED',
      targetType: 'PRODUCT',
      targetId: passportId,
      timestamp: t3,
      station: 'STATION-FINAL-ASSEMBLY-01',
      machine: 'Automated Robotic Cell 4',
      operator: 'Lead Tech: Tyler Brooks',
      inspectionResult: 'PASSED',
      resultingStatus: 'QC_APPROVED',
      remarks: 'Subassembly married to rotor housing. All 16 torque checkpoints cleared with laser micrometer inspection.',
    });
    if (evtCRes.status !== 201) throw new Error(`Event C failed: ${JSON.stringify(evtCRes)}`);
    console.log(`     ✓ Event C recorded [${evtCRes.data.data.eventId}] - Target State Updated: ${evtCRes.data.resultingStatus}`);

    // Event D: Record Shipment Dispatch
    console.log('  -> Recording Event D: Shipment Dispatched & In-Transit Handover...');
    const t4 = new Date(Date.now());
    const evtDRes = await request('POST', '/api/events', {
      eventId: `EVT-SHP-${timestampSuffix}`,
      eventType: 'SHIPMENT_DISPATCHED',
      targetType: 'SHIPMENT',
      targetId: shipmentId,
      timestamp: t4,
      station: 'OUTBOUND-LOGISTICS-BAY-4',
      machine: 'Cold-Chain Dispatch Dock #2',
      operator: 'Logistics Supervisor: Sarah Chen',
      inspectionResult: 'PASSED',
      resultingStatus: 'IN_TRANSIT',
      remarks: 'Consignment handed over to Kuehne+Nagel driver. Air-ride suspension and GPS temperature tracking active.',
    });
    if (evtDRes.status !== 201) throw new Error(`Event D failed: ${JSON.stringify(evtDRes)}`);
    console.log(`     ✓ Event D recorded [${evtDRes.data.data.eventId}] - Shipment State Updated: ${evtDRes.data.resultingStatus}`);

    // STEP 3: Verify Status Transitions in Database
    console.log('\n[TEST STEP 3] Verifying Legitimate State Transitions in DB:');
    
    // Check Product status transitioned to SHIPPED via shipment dispatch cascade
    const verifyProd = await request('GET', `/api/products/${passportId}`);
    console.log(`   - Product status in DB: ${verifyProd.data.data.product.status}`);
    if (verifyProd.data.data.product.status !== 'SHIPPED') {
      throw new Error(`Expected product ${passportId} status to be SHIPPED, got ${verifyProd.data.data.product.status}`);
    }
    console.log('   ✓ VERIFIED: Product status legitimately cascaded to SHIPPED');

    // Check Shipment status transitioned to IN_TRANSIT
    const verifyShip = await request('GET', `/api/shipments/${shipmentId}`);
    console.log(`   - Shipment status in DB: ${verifyShip.data.data.shippingStatus}`);
    if (verifyShip.data.data.shippingStatus !== 'IN_TRANSIT') {
      throw new Error(`Expected shipment status to be IN_TRANSIT, got ${verifyShip.data.data.shippingStatus}`);
    }
    console.log('   ✓ VERIFIED: Shipment status legitimately transitioned to IN_TRANSIT');

    // STEP 4: Verify Chronological Ordering & Filtering
    console.log('\n[TEST STEP 4] Verifying Chronological Ordering & Multi-Criteria Filtering:');
    const allEventsRes = await request('GET', `/api/events?search=${timestampSuffix}`);
    if (allEventsRes.data.count < 4) {
      throw new Error(`Expected at least 4 events with suffix ${timestampSuffix}, got ${allEventsRes.data.count}`);
    }

    const fetchedEvents = allEventsRes.data.data;
    console.log(`   - Fetched ${fetchedEvents.length} events for test cycle.`);

    // Verify descending chronological order for event feed
    for (let i = 0; i < fetchedEvents.length - 1; i++) {
      const curTime = new Date(fetchedEvents[i].timestamp).getTime();
      const nextTime = new Date(fetchedEvents[i + 1].timestamp).getTime();
      if (curTime < nextTime) {
        throw new Error(`Events not sorted chronologically descending: index ${i} (${curTime}) < index ${i+1} (${nextTime})`);
      }
    }
    console.log('   ✓ VERIFIED: Events returned in strict chronological order (newest first)');

    // STEP 5: Verify Reflection in DPP (Digital Product Passport)
    console.log('\n[TEST STEP 5] Verifying Reflection in Digital Product Passport (DPP):');
    const dppRes = await request('GET', `/api/products/${passportId}`);
    const dppTimeline = dppRes.data.data.manufacturingEvents || dppRes.data.data.relevantEvents || [];
    console.log(`   - Connected timeline events in DPP certificate: ${dppTimeline.length}`);
    
    // Check that events for the product, its component, material batch, and shipment are all present
    const dppEventIds = dppTimeline.map(e => e.eventId);
    if (!dppEventIds.includes(`EVT-RCV-${timestampSuffix}`)) {
      throw new Error('Event A (Material Received) not reflected in Product DPP timeline.');
    }
    if (!dppEventIds.includes(`EVT-INSP-${timestampSuffix}`)) {
      throw new Error('Event B (Material Inspected) not reflected in Product DPP timeline.');
    }
    if (!dppEventIds.includes(`EVT-ASM-${timestampSuffix}`)) {
      throw new Error('Event C (Assembly Completed) not reflected in Product DPP timeline.');
    }
    if (!dppEventIds.includes(`EVT-SHP-${timestampSuffix}`)) {
      throw new Error('Event D (Shipment Dispatched) not reflected in Product DPP timeline.');
    }
    console.log('   ✓ VERIFIED: All 4 lifecycle events correctly reflected in DPP timeline!');

    // STEP 6: Verify Reflection in Genealogy Explorer Graph
    console.log('\n[TEST STEP 6] Verifying Reflection in Genealogy Explorer:');
    const graphRes = await request('GET', `/api/genealogy/graph?rootId=${passportId}`);
    const graphNodes = graphRes.data.data.nodes || [];
    const graphNodeIds = graphNodes.map(n => n.id);
    
    if (!graphNodeIds.includes(batchId)) throw new Error(`Batch ${batchId} missing in genealogy graph.`);
    if (!graphNodeIds.includes(compId)) throw new Error(`Component ${compId} missing in genealogy graph.`);
    if (!graphNodeIds.includes(passportId)) throw new Error(`Product ${passportId} missing in genealogy graph.`);
    if (!graphNodeIds.includes(shipmentId)) throw new Error(`Shipment ${shipmentId} missing in genealogy graph.`);
    console.log(`   ✓ VERIFIED: Complete 4-tier lineage graph intact in Genealogy Explorer (${graphNodes.length} nodes connected)`);

    // STEP 7: Verify Reflection in Manufacturing Dashboard
    console.log('\n[TEST STEP 7] Verifying Reflection in Dashboard Recent Activity:');
    const dashEventsRes = await request('GET', '/api/events');
    const topEvents = dashEventsRes.data.data.slice(0, 5);
    const topIds = topEvents.map(e => e.eventId);
    if (!topIds.includes(`EVT-SHP-${timestampSuffix}`)) {
      throw new Error('Most recent shipment dispatch event not appearing in top dashboard activity feed.');
    }
    console.log('   ✓ VERIFIED: Dashboard recent activity feed displays newest shop floor events immediately');

    // STEP 8: Test Prevention of Invalid Target References (Nonexistent Entity)
    console.log('\n[TEST STEP 8] Testing Reference Integrity: Rejecting Nonexistent Target Entity...');
    const invalidRefRes = await request('POST', '/api/events', {
      eventType: 'FINAL_QUALITY_INSPECTION',
      targetType: 'PRODUCT',
      targetId: 'BOGUS-NONEXISTENT-PRODUCT-ID-999',
      station: 'TEST-BENCH',
      operator: 'Tester'
    });
    console.log(`   - Status: ${invalidRefRes.status}, Error Message: "${invalidRefRes.data.message}"`);
    if (invalidRefRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for nonexistent target entity, got ${invalidRefRes.status}`);
    }
    console.log('   ✓ VERIFIED: Server safely prevented invalid reference to nonexistent entity');

    // STEP 9: Test Idempotency / Duplicate Prevention on Retry
    console.log('\n[TEST STEP 9] Testing Idempotency: Duplicate Retry Prevention...');
    const duplicateRetryRes = await request('POST', '/api/events', {
      eventId: `EVT-RCV-${timestampSuffix}`,
      eventType: 'MATERIAL_RECEIVED',
      targetType: 'MATERIAL_BATCH',
      targetId: batchId,
      timestamp: t1,
      station: 'INBOUND-RECEIVING-DOCK-1',
      operator: 'Marcus Vance'
    });
    console.log(`   - Status: ${duplicateRetryRes.status}, isDuplicate: ${duplicateRetryRes.data.isDuplicate}`);
    if (!duplicateRetryRes.data.isDuplicate) {
      throw new Error('Duplicate event submission was not caught by idempotency protection.');
    }
    console.log('   ✓ VERIFIED: Duplicate event caught and prevented duplicate database records');

    // STEP 10: Verify Cryptographic Audit Records
    console.log('\n[TEST STEP 10] Verifying Cryptographic Audit Records:');
    const auditRes = await request('GET', `/api/audit?entityId=EVT-SHP-${timestampSuffix}`);
    if (auditRes.data.count < 1) {
      throw new Error(`Expected at least 1 audit record for event EVT-SHP-${timestampSuffix}`);
    }
    const auditRecord = auditRes.data.data[0];
    console.log(`   - Audit ID: ${auditRecord.auditId}`);
    console.log(`   - SHA-256 Hash: ${auditRecord.hashSignature}`);
    if (!auditRecord.hashSignature || auditRecord.hashSignature.length !== 64) {
      throw new Error(`Invalid SHA-256 hash signature length: ${auditRecord.hashSignature}`);
    }
    console.log('   ✓ VERIFIED: Event recorded with 256-bit cryptographic signature in immutable audit history');

    console.log('\n===========================================================');
    console.log('🎉 ALL EVENT MANAGEMENT MODULE TESTS PASSED 100%!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

testEventManagementModule();

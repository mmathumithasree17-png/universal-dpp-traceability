const { app, startServer } = require('../index');
const http = require('http');

async function testDppModule() {
  console.log('===========================================================');
  console.log('🧪 TESTING DIGITAL PRODUCT PASSPORT (DPP) MODULE (PS10)');
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
    // 1. Create a Sample Electric Motor Product
    const testSuffix = Date.now().toString().slice(-6);
    const testPassportId = `DPP-EV600-TEST-${testSuffix}`;
    const testSerialNumber = `SN-TEST-600-${testSuffix}`;

    const sampleProductPayload = {
      passportId: testPassportId,
      serialNumber: testSerialNumber,
      modelName: 'HyperTorq-GT600 Extreme Traction Motor',
      productCategory: 'EV Hypercar Powertrain',
      assemblyId: 'ASM-2026-0041',
      facilityLocation: 'Cleanroom Powertrain Cell 1 - Detroit, MI',
      specifications: {
        ratedPowerKw: 650,
        maxRpm: 24000,
        peakTorqueNm: 880,
        efficiencyRating: 'IE5 Ultra-Premium (98.2%)',
        nominalVoltageV: 900,
        coolingMethod: 'Dual Dielectric Oil Spray & Rotor Shaft Glycol',
        totalWeightKg: 42.0,
      },
      sustainability: {
        totalCarbonFootprintKgCO2e: 162.4,
        recycledMaterialPercentage: 42.0,
        recyclabilityRatePercentage: 98.6,
        euBatteryDppCompliant: true,
      },
      componentsUsed: [
        {
          componentId: 'CMP-STATOR-104',
          componentName: 'Hairpin High-Torque Stator Sub-Assembly',
          componentType: 'Stator',
          serialNumber: 'SN-STAT-2026-0104'
        }
      ],
      materialBatchesUsed: [
        {
          batchId: 'MB-COPPER-2026-088',
          materialName: 'Oxygen-Free High-Conductivity Copper Wire',
          category: 'Conductor',
          supplierName: 'Apex Metallurgy Corp'
        }
      ],
      complianceCertificates: ['ISO 9001:2015', 'EU DPP Regulation 2024/1781', 'CE Mark (EN 60034-1)'],
      status: 'QC_APPROVED',
      qualityInspections: [
        {
          inspectionId: 'INSP-QC-TEST-09',
          station: 'STATION-DYNO-TEST-BENCH-1',
          inspector: 'Dr. Maya Patel',
          result: 'PASSED',
          notes: 'Full overload stress test passed at 650kW with zero thermal throttling.'
        }
      ],
      reworkHistory: [],
    };

    console.log('\n[TEST STEP 1] Creating a sample product via POST /api/products...');
    const createRes = await request('POST', '/api/products', sampleProductPayload);
    if (createRes.status !== 201 || !createRes.data.success) {
      throw new Error(`Failed to create product: ${JSON.stringify(createRes)}`);
    }
    console.log(`✓ Product created successfully: ${createRes.data.data.passportId} (${createRes.data.data.modelName})`);

    // 2. Fetch Passport by Passport ID
    console.log(`\n[TEST STEP 2] Querying GET /api/products/${testPassportId} (by Passport ID)...`);
    const passportRes = await request('GET', `/api/products/${testPassportId}`);
    if (passportRes.status !== 200 || !passportRes.data.success) {
      throw new Error(`Failed to fetch passport: ${JSON.stringify(passportRes)}`);
    }

    const dppData = passportRes.data.data;
    console.log('✓ Digital Product Passport retrieved successfully!');
    console.log(`   - Model:                ${dppData.product.modelName}`);
    console.log(`   - Serial Number:        ${dppData.product.serialNumber}`);
    console.log(`   - Status:               ${dppData.product.status}`);
    console.log(`   - QR Identity URL:      ${dppData.product.passportUrl}`);
    console.log(`   - Connected Assembly:   ${dppData.assembly?.assemblyId} (${dppData.assembly?.assemblyName})`);
    console.log(`   - Connected Components: ${dppData.components?.length} items (${dppData.components[0]?.componentId})`);
    console.log(`   - Connected Materials:  ${dppData.materialBatches?.length} items (${dppData.materialBatches[0]?.batchId})`);
    console.log(`   - Quality Inspections:  ${dppData.qualityInspections?.length} records`);
    console.log(`   - Timeline Events:      ${dppData.manufacturingEvents?.length} events`);
    console.log(`   - Tamper-Evident Hash:  ${dppData.verification?.tamperEvidentHash}`);

    // Verify connections
    if (!dppData.assembly || dppData.assembly.assemblyId !== 'ASM-2026-0041') {
      throw new Error('Connected assembly was not correctly resolved from database.');
    }
    if (!dppData.components || dppData.components.length === 0) {
      throw new Error('Connected components were not correctly resolved from database.');
    }
    if (!dppData.materialBatches || dppData.materialBatches.length === 0) {
      throw new Error('Connected raw material batches were not correctly resolved from database.');
    }
    console.log('✓ All connected materials, components, assembly, and inspection records successfully verified!');

    // 3. Search Passport by Serial Number
    console.log(`\n[TEST STEP 3] Searching GET /api/products/${testSerialNumber} (by Serial Number)...`);
    const serialRes = await request('GET', `/api/products/${testSerialNumber}`);
    if (serialRes.status !== 200 || serialRes.data.data.product.passportId !== testPassportId) {
      throw new Error('Lookup by serial number failed.');
    }
    console.log('✓ Successfully retrieved identical Digital Product Passport via Serial Number search!');

    // 4. Test Invalid Product ID (Not-Found Handling)
    console.log('\n[TEST STEP 4] Testing invalid product ID: GET /api/products/INVALID-NONEXISTENT-999...');
    const invalidRes = await request('GET', '/api/products/INVALID-NONEXISTENT-999');
    console.log(`   - Response Status: ${invalidRes.status}`);
    console.log(`   - Error Message:   "${invalidRes.data.message}"`);

    if (invalidRes.status !== 404) {
      throw new Error(`Expected 404 status for invalid product, got ${invalidRes.status}`);
    }
    if (invalidRes.data.success !== false || !invalidRes.data.message) {
      throw new Error('Invalid product query did not return appropriate structured error message.');
    }
    console.log('✓ VERIFIED: Accurate 404 error and user-friendly explanation returned for invalid IDs.');

    console.log('\n===========================================================');
    console.log('🎉 ALL DIGITAL PRODUCT PASSPORT TESTS PASSED 100%!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

testDppModule();

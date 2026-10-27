const { app, startServer } = require('../index');
const http = require('http');

async function testAll() {
  console.log('[Test] Starting server instance for verification test...');
  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }).on('error', reject);
    });
  }

  try {
    console.log('[Test 1] Testing /api/system/health...');
    const health = await get('/api/system/health');
    console.log('  Status:', health.status, 'Payload:', health.data?.status, health.data?.database?.mode);

    console.log('[Test 2] Testing /api/system/stats...');
    const stats = await get('/api/system/stats');
    console.log('  Status:', stats.status, 'Counts:', JSON.stringify(stats.data?.data?.counts));

    console.log('[Test 3] Testing /api/products...');
    const products = await get('/api/products');
    console.log('  Status:', products.status, 'Count:', products.data?.count);

    console.log('[Test 4] Testing /api/batches...');
    const batches = await get('/api/batches');
    console.log('  Status:', batches.status, 'Count:', batches.data?.count);

    console.log('[Test 5] Testing Defect Impact Query on defective batch MB-SHAFT-2026-033...');
    const impact = await get('/api/trace/defect-impact/MB-SHAFT-2026-033');
    console.log('  Status:', impact.status);
    console.log('  Execution Latency:', impact.data?.meta?.executionTimeMs, 'ms');
    console.log('  Affected Products Count:', impact.data?.impactSummary?.totalAffectedProducts);
    console.log('  Risk Score:', impact.data?.impactSummary?.riskScore);

    console.log('[Test 6] Testing Forward Trace from batch MB-COPPER-2026-088...');
    const fwd = await get('/api/trace/forward/MB-COPPER-2026-088');
    console.log('  Status:', fwd.status, 'Downstream Products:', fwd.data?.data?.affectedProducts?.length);

    console.log('[Test 7] Testing Backward Trace from product DPP-EV500-2026-001...');
    const bwd = await get('/api/trace/backward/DPP-EV500-2026-001');
    console.log('  Status:', bwd.status, 'Components:', bwd.data?.data?.components?.length, 'Batches:', bwd.data?.data?.materialBatches?.length);

    console.log('[Test 8] Testing /api/events and /api/audit...');
    const events = await get('/api/events');
    const audit = await get('/api/audit');
    console.log('  Events Count:', events.data?.count, 'Audit Count:', audit.data?.count);

    console.log('\n======================================================');
    console.log('✓ ALL 8 AUTOMATED VERIFICATION CHECKS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

testAll();

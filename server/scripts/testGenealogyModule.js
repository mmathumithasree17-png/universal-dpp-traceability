const { app, startServer } = require('../index');
const http = require('http');

async function testGenealogyModule() {
  console.log('===========================================================');
  console.log('🧪 TESTING GENEALOGY EXPLORER MODULE (PS10)');
  console.log('===========================================================');

  const server = await startServer();
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  function request(method, path) {
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
      req.end();
    });
  }

  try {
    // 1. Fetch Complete Plant Genealogy Graph
    console.log('\n[TEST STEP 1] Fetching complete plant genealogy graph via GET /api/genealogy/graph...');
    const graphRes = await request('GET', '/api/genealogy/graph');
    if (graphRes.status !== 200 || !graphRes.data.success) {
      throw new Error(`Failed to fetch graph: ${JSON.stringify(graphRes)}`);
    }

    const graph = graphRes.data.data;
    const { nodes, edges, meta } = graph;

    console.log('✓ Complete graph hierarchy successfully retrieved:');
    console.log(`   - Total Nodes: ${nodes.length}`);
    console.log(`   - Total Edges: ${edges.length}`);
    console.log(`   - Breakdown:   ${JSON.stringify(meta.tierBreakdown)}`);

    // Verify all 5 tiers are present
    const tiersFound = new Set(nodes.map(n => n.type));
    ['BATCH', 'COMPONENT', 'ASSEMBLY', 'PRODUCT', 'SHIPMENT'].forEach(t => {
      if (!tiersFound.has(t)) throw new Error(`Missing tier: ${t}`);
    });
    console.log('✓ All 5 required tiers verified: Material Batch -> Component -> Assembly -> Product -> Shipment.');

    // 2. Verify Shared Material Batches
    console.log('\n[TEST STEP 2] Verifying shared material batch relationships...');
    const copperEdges = edges.filter(e => e.source === 'MB-COPPER-2026-088');
    console.log(`   - Copper Batch (MB-COPPER-2026-088) outgoing edges: ${copperEdges.length}`);
    copperEdges.forEach(e => console.log(`     -> Component: ${e.target}`));

    if (copperEdges.length < 2) {
      throw new Error('Expected material batch MB-COPPER-2026-088 to be shared across at least 2 components.');
    }
    console.log('✓ Shared material batch relationship verified (1 batch -> multiple components).');

    // 3. Verify Components Shared Across Products / Assemblies
    console.log('\n[TEST STEP 3] Verifying components shared across products/assemblies...');
    const housingEdges = edges.filter(e => e.source === 'CMP-HOUSING-301');
    console.log(`   - Housing Component (CMP-HOUSING-301) outgoing edges: ${housingEdges.length}`);
    housingEdges.forEach(e => console.log(`     -> Assembly: ${e.target}`));

    if (housingEdges.length < 2) {
      throw new Error('Expected CMP-HOUSING-301 to be integrated into multiple assemblies.');
    }
    console.log('✓ Shared component relationship verified (1 component -> multiple assemblies/products).');

    // 4. Verify Quarantined / Defective Chain Highlighting
    console.log('\n[TEST STEP 4] Verifying defective/quarantined chain highlighting...');
    const defectiveBatchNode = nodes.find(n => n.id === 'MB-SHAFT-2026-033');
    const defectiveCompNode = nodes.find(n => n.id === 'CMP-ROTOR-201');
    const defectiveProductNode = nodes.find(n => n.id === 'DPP-EV500-2026-003');

    if (!defectiveBatchNode?.isQuarantined || !defectiveCompNode?.isQuarantined || !defectiveProductNode?.isQuarantined) {
      throw new Error('Defective batch, component, and finished product must all be flagged as isQuarantined: true.');
    }

    const quarantinedEdges = edges.filter(e => e.isQuarantined);
    console.log(`   ✓ Defective Batch Node:      ${defectiveBatchNode.id} (isQuarantined: ${defectiveBatchNode.isQuarantined})`);
    console.log(`   ✓ Defective Component Node:  ${defectiveCompNode.id} (isQuarantined: ${defectiveCompNode.isQuarantined})`);
    console.log(`   ✓ Defective Product Node:    ${defectiveProductNode.id} (isQuarantined: ${defectiveProductNode.isQuarantined})`);
    console.log(`   ✓ Quarantined Edges Count:   ${quarantinedEdges.length} connections highlighted in red`);

    // 5. Query Specific Root ID: Product Lineage
    console.log('\n[TEST STEP 5] Querying genealogy focused on product: GET /api/genealogy/graph?rootId=DPP-EV500-2026-001...');
    const prodGraphRes = await request('GET', '/api/genealogy/graph?rootId=DPP-EV500-2026-001');
    if (prodGraphRes.status !== 200 || !prodGraphRes.data.success) {
      throw new Error('Failed to query product genealogy.');
    }
    const prodGraph = prodGraphRes.data.data;
    console.log(`✓ Product lineage extracted: ${prodGraph.nodes.length} connected nodes, ${prodGraph.edges.length} edges.`);
    const hasShipment = prodGraph.nodes.some(n => n.id === 'SHP-2026-0412');
    const hasAssembly = prodGraph.nodes.some(n => n.id === 'ASM-2026-0041');
    if (!hasShipment || !hasAssembly) {
      throw new Error('Product lineage did not include connected shipment or assembly.');
    }
    console.log('✓ Upstream assembly and downstream customer shipment correctly resolved.');

    // 6. Query Specific Root ID: Component Lineage (Bi-directional)
    console.log('\n[TEST STEP 6] Querying bi-directional lineage of component: GET /api/genealogy/graph?rootId=CMP-STATOR-104...');
    const compGraphRes = await request('GET', '/api/genealogy/graph?rootId=CMP-STATOR-104');
    const compGraph = compGraphRes.data.data;
    const hasUpstreamCopper = compGraph.nodes.some(n => n.id === 'MB-COPPER-2026-088');
    const hasDownstreamProduct = compGraph.nodes.some(n => n.id === 'DPP-EV500-2026-001');
    if (!hasUpstreamCopper || !hasDownstreamProduct) {
      throw new Error('Component query failed to resolve both upstream material batch and downstream finished product.');
    }
    console.log('✓ Bi-directional graph traversal verified (Copper Batch <-> Stator <-> Finished Motor).');

    // 7. Test Non-existent Root ID (Not-Found Handling)
    console.log('\n[TEST STEP 7] Testing invalid root ID: GET /api/genealogy/graph?rootId=INVALID_ROOT_9999...');
    const invalidRes = await request('GET', '/api/genealogy/graph?rootId=INVALID_ROOT_9999');
    console.log(`   - Status:  ${invalidRes.status}`);
    console.log(`   - Message: "${invalidRes.data.message}"`);

    if (invalidRes.status !== 404) {
      throw new Error(`Expected 404 for invalid root ID, got ${invalidRes.status}`);
    }
    console.log('✓ VERIFIED: Accurate 404 error returned for invalid genealogy identifier.');

    console.log('\n===========================================================');
    console.log('🎉 ALL GENEALOGY EXPLORER TESTS PASSED 100%!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

testGenealogyModule();

const Product = require('../models/Product');
const Component = require('../models/Component');
const MaterialBatch = require('../models/MaterialBatch');
const Assembly = require('../models/Assembly');
const Shipment = require('../models/Shipment');

async function getGenealogyGraph(req, res) {
  try {
    const { rootId, statusFilter, batchCategory, shipmentStatus } = req.query;

    // Fetch all database records
    const [allProducts, allComponents, allBatches, allAssemblies, allShipments] = await Promise.all([
      Product.find({}),
      Component.find({}),
      MaterialBatch.find({}),
      Assembly.find({}),
      Shipment.find({}),
    ]);

    // Build lookup maps
    const productMap = new Map(allProducts.map(p => [p.passportId, p]));
    const componentMap = new Map(allComponents.map(c => [c.componentId, c]));
    const batchMap = new Map(allBatches.map(b => [b.batchId, b]));
    const assemblyMap = new Map(allAssemblies.map(a => [a.assemblyId, a]));
    const shipmentMap = new Map(allShipments.map(s => [s.shipmentId, s]));

    // Determine target entity if rootId specified
    let targetType = null;
    let targetRecord = null;
    const cleanRootId = rootId ? String(rootId).trim() : null;

    if (cleanRootId) {
      if (productMap.has(cleanRootId)) {
        targetType = 'PRODUCT';
        targetRecord = productMap.get(cleanRootId);
      } else {
        // Try serial
        const prodBySerial = allProducts.find(p => p.serialNumber === cleanRootId);
        if (prodBySerial) {
          targetType = 'PRODUCT';
          targetRecord = prodBySerial;
        } else if (componentMap.has(cleanRootId)) {
          targetType = 'COMPONENT';
          targetRecord = componentMap.get(cleanRootId);
        } else if (batchMap.has(cleanRootId)) {
          targetType = 'BATCH';
          targetRecord = batchMap.get(cleanRootId);
        } else if (assemblyMap.has(cleanRootId)) {
          targetType = 'ASSEMBLY';
          targetRecord = assemblyMap.get(cleanRootId);
        } else if (shipmentMap.has(cleanRootId)) {
          targetType = 'SHIPMENT';
          targetRecord = shipmentMap.get(cleanRootId);
        }
      }

      if (!targetRecord) {
        return res.status(404).json({
          success: false,
          message: `No genealogy record found matching identifier "${cleanRootId}". Please verify the ID.`,
        });
      }
    }

    // Build complete explicit node and edge graph
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();
    const edgeSet = new Set();

    function addNode(id, label, type, tier, status, isQuarantined, data) {
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({
          id,
          label,
          type,
          tier,
          status,
          isQuarantined: Boolean(isQuarantined),
          data,
        });
      }
    }

    function addEdge(source, target, label, isQuarantined = false) {
      const edgeId = `e_${source}_${target}`;
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        edges.push({
          id: edgeId,
          source,
          target,
          label,
          isQuarantined: Boolean(isQuarantined),
        });
      }
    }

    // Tier 1: Material Batches
    allBatches.forEach(batch => {
      if (batchCategory && batchCategory !== 'ALL' && batch.category !== batchCategory) return;
      const isQ = batch.status === 'QUARANTINED' || batch.status === 'DEFECTIVE' || batch.qualityPassed === false;
      addNode(batch.batchId, batch.materialName, 'BATCH', 1, batch.status, isQ, {
        category: batch.category,
        supplierName: batch.supplierName,
        supplierLotNumber: batch.supplierLotNumber,
        quantity: `${batch.quantity} ${batch.unit || 'kg'}`,
        purityOrGrade: batch.purityOrGrade,
        certificateOfAnalysis: batch.certificateOfAnalysis,
        carbonFootprintKgCO2e: batch.carbonFootprintKgCO2e,
        receivedDate: batch.receivedDate,
        defectId: batch.defectId,
        notes: batch.notes,
      });
    });

    // Tier 2: Components (Connected to Batches)
    allComponents.forEach(comp => {
      const isQ = comp.status === 'DEFECTIVE' || comp.status === 'QUARANTINED' || comp.qualityCheckPassed === false;
      addNode(comp.componentId, comp.componentName, 'COMPONENT', 2, comp.status, isQ, {
        componentType: comp.componentType,
        serialNumber: comp.serialNumber,
        lineId: comp.lineId,
        operatorId: comp.operatorId,
        productionDate: comp.productionDate,
        qualityCheckPassed: comp.qualityCheckPassed,
        materialBatches: comp.materialBatches,
        notes: comp.notes,
      });

      // Edge: Batch -> Component
      (comp.materialBatches || []).forEach(mb => {
        if (nodeSet.has(mb.batchId)) {
          const batchDoc = batchMap.get(mb.batchId);
          const edgeQ = isQ || (batchDoc && (batchDoc.status === 'QUARANTINED' || batchDoc.status === 'DEFECTIVE'));
          addEdge(mb.batchId, comp.componentId, `${mb.quantityUsed || ''} ${mb.unit || 'kg'}`, edgeQ);
        }
      });
    });

    // Tier 3: Assembly Operations (Connected to Components)
    allAssemblies.forEach(asm => {
      const isQ = asm.status === 'QUARANTINED' || asm.status === 'FAILED' || asm.qualityChecks?.passedAll === false;
      addNode(asm.assemblyId, asm.assemblyName, 'ASSEMBLY', 3, asm.status, isQ, {
        assemblyType: asm.assemblyType,
        assemblyLine: asm.assemblyLine,
        workstation: asm.workstation,
        assembledAt: asm.assembledAt,
        operator: asm.operator,
        qualityChecks: asm.qualityChecks,
        notes: asm.notes,
      });

      // Edge: Component -> Assembly
      (asm.components || []).forEach(c => {
        if (nodeSet.has(c.componentId)) {
          const compDoc = componentMap.get(c.componentId);
          const edgeQ = isQ || (compDoc && (compDoc.status === 'QUARANTINED' || compDoc.status === 'DEFECTIVE'));
          addEdge(c.componentId, asm.assemblyId, 'integrated_in', edgeQ);
        }
      });
    });

    // Tier 4: Finished Products (Connected to Assembly and direct components/batches)
    allProducts.forEach(prod => {
      if (statusFilter && statusFilter !== 'ALL' && prod.status !== statusFilter) return;
      const isQ = prod.status === 'QUARANTINED' || prod.status === 'RECALLED';
      addNode(prod.passportId, prod.modelName, 'PRODUCT', 4, prod.status, isQ, {
        serialNumber: prod.serialNumber,
        productCategory: prod.productCategory,
        facilityLocation: prod.facilityLocation,
        manufacturedDate: prod.manufacturedDate,
        specifications: prod.specifications,
        sustainability: prod.sustainability,
        complianceCertificates: prod.complianceCertificates,
        quarantineReason: prod.quarantineReason,
        shipmentId: prod.shipmentId,
      });

      // Edge: Assembly -> Product
      if (prod.assemblyId && nodeSet.has(prod.assemblyId)) {
        const asmDoc = assemblyMap.get(prod.assemblyId);
        const edgeQ = isQ || (asmDoc && asmDoc.status === 'QUARANTINED');
        addEdge(prod.assemblyId, prod.passportId, 'powertrain_for', edgeQ);
      }

      // Also ensure components used by product are directly linked if no assembly node exists in graph
      (prod.componentsUsed || []).forEach(c => {
        if (nodeSet.has(c.componentId) && (!prod.assemblyId || !nodeSet.has(prod.assemblyId))) {
          addEdge(c.componentId, prod.passportId, 'part_of', isQ);
        }
      });
    });

    // Tier 5: Shipments (Connected to Finished Products)
    allShipments.forEach(shp => {
      if (shipmentStatus && shipmentStatus !== 'ALL' && shp.shippingStatus !== shipmentStatus) return;
      const isQ = shp.shippingStatus === 'HELD_RECALL';
      addNode(shp.shipmentId, `${shp.destinationClient} (${shp.carrier})`, 'SHIPMENT', 5, shp.shippingStatus, isQ, {
        trackingNumber: shp.trackingNumber,
        carrier: shp.carrier,
        destinationClient: shp.destinationClient,
        destinationAddress: shp.destinationAddress,
        dispatchDate: shp.dispatchDate,
        estimatedDelivery: shp.estimatedDelivery,
        actualDelivery: shp.actualDelivery,
        temperatureControlled: shp.temperatureControlled,
        notes: shp.notes,
        productsCount: (shp.products || []).length,
      });

      // Edge: Product -> Shipment
      (shp.products || []).forEach(p => {
        if (nodeSet.has(p.passportId)) {
          const prodDoc = productMap.get(p.passportId);
          const edgeQ = isQ || (prodDoc && prodDoc.status === 'QUARANTINED');
          addEdge(p.passportId, shp.shipmentId, 'dispatched_in', edgeQ);
        }
      });
    });

    // Filter subgraph if rootId was specified
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (cleanRootId && targetRecord) {
      const reachableNodeIds = new Set();
      const targetId = targetRecord.passportId || targetRecord.componentId || targetRecord.batchId || targetRecord.assemblyId || targetRecord.shipmentId;
      reachableNodeIds.add(targetId);

      // Multi-pass bi-directional graph traversal (both upstream & downstream)
      let addedAny = true;
      let iterations = 0;
      while (addedAny && iterations < 8) {
        addedAny = false;
        iterations++;
        edges.forEach(e => {
          if (reachableNodeIds.has(e.source) && !reachableNodeIds.has(e.target)) {
            reachableNodeIds.add(e.target);
            addedAny = true;
          }
          if (reachableNodeIds.has(e.target) && !reachableNodeIds.has(e.source)) {
            reachableNodeIds.add(e.source);
            addedAny = true;
          }
        });
      }

      filteredNodes = nodes.filter(n => reachableNodeIds.has(n.id));
      filteredEdges = edges.filter(e => reachableNodeIds.has(e.source) && reachableNodeIds.has(e.target));
    }

    if (filteredNodes.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          nodes: [],
          edges: [],
          meta: {
            rootId: cleanRootId,
            message: `No connected genealogy found for identifier "${cleanRootId}".`,
          }
        }
      });
    }

    // Graph statistics
    const quarantinedNodesCount = filteredNodes.filter(n => n.isQuarantined).length;

    return res.status(200).json({
      success: true,
      data: {
        nodes: filteredNodes,
        edges: filteredEdges,
        meta: {
          rootId: cleanRootId,
          targetType,
          totalNodes: filteredNodes.length,
          totalEdges: filteredEdges.length,
          quarantinedNodesCount,
          tierBreakdown: {
            materialBatches: filteredNodes.filter(n => n.type === 'BATCH').length,
            components: filteredNodes.filter(n => n.type === 'COMPONENT').length,
            assemblies: filteredNodes.filter(n => n.type === 'ASSEMBLY').length,
            products: filteredNodes.filter(n => n.type === 'PRODUCT').length,
            shipments: filteredNodes.filter(n => n.type === 'SHIPMENT').length,
          }
        }
      }
    });
  } catch (err) {
    console.error('[Genealogy Graph Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getGenealogyGraph,
};

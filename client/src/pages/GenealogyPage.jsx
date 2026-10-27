import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  GitFork,
  Search,
  Filter,
  Layers,
  Box,
  Cpu,
  QrCode,
  Truck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';
import GenealogyGraphCanvas from '../components/genealogy/GenealogyGraphCanvas';
import GenealogyLegend from '../components/genealogy/GenealogyLegend';
import NodeDetailDrawer from '../components/genealogy/NodeDetailDrawer';

export default function GenealogyPage() {
  const { refreshTrigger } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter states
  const [searchInput, setSearchInput] = useState(searchParams.get('root') || '');
  const [activeRootId, setActiveRootId] = useState(searchParams.get('root') || '');
  const [productStatus, setProductStatus] = useState('ALL');
  const [batchCategory, setBatchCategory] = useState('ALL');
  const [shipmentStatus, setShipmentStatus] = useState('ALL');
  const [quarantineOnly, setQuarantineOnly] = useState(false);

  // Graph data & UI states
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  // Fetch Genealogy Graph from Backend
  const loadGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (activeRootId) params.rootId = activeRootId;
      if (productStatus !== 'ALL') params.statusFilter = productStatus;
      if (batchCategory !== 'ALL') params.batchCategory = batchCategory;
      if (shipmentStatus !== 'ALL') params.shipmentStatus = shipmentStatus;

      const res = await api.getGenealogyGraph(params);
      if (res.success && res.data) {
        setGraphData(res.data);
        // Highlight active search node
        if (activeRootId) {
          const match = res.data.nodes.find(
            (n) => n.id.toLowerCase() === activeRootId.toLowerCase()
          );
          if (match) {
            setHighlightedNodeId(match.id);
            if (!selectedNode) setSelectedNode(match);
          }
        }
      } else {
        throw new Error(res.message || 'Failed to retrieve graph hierarchy');
      }
    } catch (err) {
      setError(err.message || 'Genealogy query failed');
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [activeRootId, productStatus, batchCategory, shipmentStatus, refreshTrigger]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    setActiveRootId(query);
    if (query) {
      setSearchParams({ root: query });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveRootId('');
    setHighlightedNodeId(null);
    setSearchParams({});
  };

  // Filter nodes if "quarantineOnly" toggle is active
  const filteredNodes = React.useMemo(() => {
    if (!graphData?.nodes) return [];
    if (!quarantineOnly) return graphData.nodes;
    return graphData.nodes.filter((n) => n.isQuarantined);
  }, [graphData, quarantineOnly]);

  const filteredEdges = React.useMemo(() => {
    if (!graphData?.edges) return [];
    if (!quarantineOnly) return graphData.edges;
    const qIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.edges.filter((e) => qIds.has(e.source) && qIds.has(e.target));
  }, [graphData, filteredNodes, quarantineOnly]);

  const meta = graphData?.meta || {};

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="industrial-card p-6 rounded-2xl border border-navy-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <GitFork className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                Multi-Tier Bill-of-Materials & Provenance Lineage
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Genealogy Explorer
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Explore the explicit 5-tier lifecycle: <strong>Material Batch &rarr; Component &rarr; Assembly &rarr; Finished Product &rarr; Shipment</strong>.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full lg:w-96">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Product, Component, or Batch ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700/80 rounded-xl pl-9 pr-8 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all shrink-0"
            >
              Trace
            </button>
          </form>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-3 border-t border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Product Selector Dropdown (Products: Options) */}
            <select
              value={activeRootId || 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  handleClearSearch();
                } else {
                  setSearchInput(val);
                  setActiveRootId(val);
                  setSearchParams({ root: val });
                }
              }}
              className="bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
            >
              <option value="ALL">Product Option: (Show All)</option>
              {(graphData?.nodes?.filter(n => n.type === 'Product' || n.category === 'Product') || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.label}
                </option>
              ))}
            </select>

            {/* Product Status Filter */}
            <select
              value={productStatus}
              onChange={(e) => setProductStatus(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Product Status: All</option>
              <option value="SHIPPED">Product: Shipped</option>
              <option value="QUARANTINED">Product: Quarantined</option>
              <option value="MANUFACTURED">Product: Manufactured</option>
            </select>

            {/* Material Batch Category Filter */}
            <select
              value={batchCategory}
              onChange={(e) => setBatchCategory(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Batches: All Categories</option>
              <option value="Conductor">Conductor (Copper)</option>
              <option value="RareEarthMagnet">Rare Earth (NdFeB)</option>
              <option value="SiliconSteel">Silicon Steel Sheet</option>
              <option value="AlloySteel">Alloy Shaft (42CrMo4)</option>
            </select>

            {/* Shipment Status Filter */}
            <select
              value={shipmentStatus}
              onChange={(e) => setShipmentStatus(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Shipment: All</option>
              <option value="DELIVERED">Shipment: Delivered</option>
              <option value="IN_TRANSIT">Shipment: In Transit</option>
              <option value="PREPARING">Shipment: Preparing</option>
            </select>

            {/* Quarantined Chain Filter Toggle */}
            <label className="flex items-center space-x-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg bg-navy-950 border border-rose-500/30 text-rose-300 hover:border-rose-500/60 transition-colors">
              <input
                type="checkbox"
                checked={quarantineOnly}
                onChange={(e) => setQuarantineOnly(e.target.checked)}
                className="rounded border-rose-500 text-rose-500 focus:ring-0"
              />
              <span className="text-[11px] font-semibold">Quarantined Only</span>
            </label>
          </div>

          {/* Quick Identifier Pills */}
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="text-slate-500 hidden sm:inline">Try ID:</span>
            <button
              onClick={() => { setSearchInput('DPP-EV500-2026-001'); setActiveRootId('DPP-EV500-2026-001'); }}
              className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-cyan-300 hover:border-cyan-400"
            >
              DPP-EV500-001
            </button>
            <button
              onClick={() => { setSearchInput('MB-SHAFT-2026-033'); setActiveRootId('MB-SHAFT-2026-033'); }}
              className="px-2 py-0.5 rounded bg-navy-900 border border-rose-500/40 text-rose-300 hover:border-rose-400"
            >
              MB-SHAFT-033 (Defective)
            </button>
            <button
              onClick={() => { setSearchInput('CMP-HOUSING-301'); setActiveRootId('CMP-HOUSING-301'); }}
              className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-cyan-300 hover:border-cyan-400"
            >
              CMP-HOUSING-301 (Shared)
            </button>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Graph Visual Canvas or Empty State */}
      {loading ? (
        <LoadingSpinner text="Computing Multi-Hop Graph Traversal Across 5 Tiers..." size="lg" />
      ) : filteredNodes.length === 0 ? (
        /* FEATURE 10: Clear message when a record has no connected genealogy */
        <div className="industrial-card p-12 text-center rounded-2xl border border-navy-700 space-y-4">
          <div className="w-16 h-16 rounded-full bg-navy-900 border border-navy-700 flex items-center justify-center mx-auto text-slate-500">
            <GitFork className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-bold font-mono text-white">
              No Connected Genealogy Found
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {activeRootId
                ? `No upstream or downstream genealogy connections exist for identifier "${activeRootId}". Please verify the Product ID, Component ID, or Batch ID.`
                : 'No graph nodes match your current filter selections.'}
            </p>
          </div>

          <button
            onClick={() => {
              handleClearSearch();
              setProductStatus('ALL');
              setBatchCategory('ALL');
              setShipmentStatus('ALL');
              setQuarantineOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all"
          >
            Reset All Filters & View Full Plant Graph
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Search & Graph Meta Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold">
                {activeRootId ? `Lineage Graph for: ${activeRootId}` : 'Complete Plant Manufacturing Hierarchy'}
              </span>
              <span>&bull;</span>
              <span>{filteredNodes.length} Nodes</span>
              <span>&bull;</span>
              <span>{filteredEdges.length} Explicit Edges</span>
            </div>

            {meta.quarantinedNodesCount > 0 && (
              <span className="text-rose-400 font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{meta.quarantinedNodesCount} Quarantined / Contained Node(s) Detected</span>
              </span>
            )}
          </div>

          {/* Interactive Graph Canvas */}
          <GenealogyGraphCanvas
            nodes={filteredNodes}
            edges={filteredEdges}
            selectedNodeId={selectedNode?.id}
            highlightedNodeId={highlightedNodeId}
            onSelectNode={(node) => setSelectedNode(node)}
          />

          {/* Legend and Instructions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <GenealogyLegend />
            <p className="text-[11px] font-mono text-slate-500 text-right">
              Drag to pan &bull; Scroll to zoom &bull; Click node to inspect details &bull; Click [-] / [+] to toggle branch
            </p>
          </div>
        </div>
      )}

      {/* Slide-over Node Detail Drawer */}
      <NodeDetailDrawer
        selectedNode={selectedNode}
        allNodes={graphData?.nodes || []}
        allEdges={graphData?.edges || []}
        onClose={() => setSelectedNode(null)}
        onSelectNode={(node) => {
          setSelectedNode(node);
          setHighlightedNodeId(node.id);
        }}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Network,
  ArrowRight,
  ArrowLeft,
  Search,
  Layers,
  Box,
  Cpu,
  QrCode,
  Truck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Printer,
  Calendar,
  ExternalLink,
  RotateCcw,
  Info,
  Maximize2,
  Minimize2,
  ChevronRight,
  List,
  GitBranch,
  Building,
  Hash,
} from 'lucide-react';
import { api } from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';

const QUICK_PRESETS = [
  {
    label: 'MB-MVTEC-CABLE-01 (Forward Trace)',
    id: 'MB-MVTEC-CABLE-01',
    direction: 'forward',
    desc: 'Class-H High-Temp Cable -> Stator Harness -> Traction Motors -> Munich Shipment',
  },
  {
    label: 'DPP-EV500-2026-003 (Backward Trace)',
    id: 'DPP-EV500-2026-003',
    direction: 'backward',
    desc: 'AeroDrive Motor #003 -> Assembly 401 -> Stator Harness -> MVTec Cable Batch',
  },
  {
    label: 'DPP-EV500-2026-004 (Backward Trace)',
    id: 'DPP-EV500-2026-004',
    direction: 'backward',
    desc: 'AeroDrive Motor #004 -> Assembly 401 -> Stator Harness -> MVTec Cable Batch',
  },
  {
    label: 'SHP-514975 (Consignment Trace)',
    id: 'SHP-514975',
    direction: 'backward',
    desc: 'BMW Munich Consignment -> Dual Powertrains -> Upstream Component Genealogy',
  },
];

export default function TraceabilityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshTrigger } = useOutletContext() || {};

  const detectNaturalDirection = (id, explicitDir) => {
    if (explicitDir === 'forward' || explicitDir === 'backward') return explicitDir;
    if (!id) return 'backward';
    const clean = id.trim().toUpperCase();
    if (clean.startsWith('DPP-') || clean.startsWith('SN-') || clean.startsWith('ASM-') || clean.startsWith('SHP-')) {
      return 'backward';
    }
    return 'forward';
  };

  const initialId = searchParams.get('id') || 'DPP-EV500-2026-003';
  const initialDir = detectNaturalDirection(initialId, searchParams.get('dir'));

  const [direction, setDirection] = useState(initialDir);
  const [identifier, setIdentifier] = useState(initialId);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View modes: 'pipeline' (stepped cards) | 'graph' (interactive visual tree)
  const [viewMode, setViewMode] = useState('pipeline');
  const [selectedNode, setSelectedNode] = useState(null);

  const handleTrace = async (targetId = identifier, targetDir = direction) => {
    const cleanId = String(targetId).trim();
    if (!cleanId) return;

    try {
      setLoading(true);
      setError(null);
      setSelectedNode(null);

      const params = {};
      if (statusFilter !== 'ALL') params.statusFilter = statusFilter;
      if (shipmentStatusFilter !== 'ALL') params.shipmentStatusFilter = shipmentStatusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let res;
      if (targetDir === 'forward') {
        res = await api.forwardTrace(cleanId, params);
      } else {
        res = await api.backwardTrace(cleanId, params);
      }

      if (res.success) {
        setResults(res);
      } else {
        setError(res.message || 'Traceability query failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to execute traceability query. Please verify the identifier.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlId = searchParams.get('id');
    const urlDir = searchParams.get('dir');
    if (urlId) {
      const cleanId = urlId.trim();
      const resolvedDir = detectNaturalDirection(cleanId, urlDir);
      setIdentifier(cleanId);
      setDirection(resolvedDir);
      handleTrace(cleanId, resolvedDir);
    } else {
      handleTrace(identifier, direction);
    }
  }, [searchParams, refreshTrigger]);

  const handlePresetSelect = (preset) => {
    setDirection(preset.direction);
    setIdentifier(preset.id);
    handleTrace(preset.id, preset.direction);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability_${direction}_${identifier}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pipeline = results?.pipeline || {};
  const summary = results?.summary || {};
  const anomalies = results?.anomalies || [];
  const graph = results?.graph || { nodes: [], edges: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-600 mb-1">
            <Network className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Bi-Directional Manufacturing Provenance Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Forward & Backward Traceability
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Traverse upstream or downstream across Material Batches &rarr; Engineered Components &rarr; Subassemblies &rarr; Finished Products &rarr; Customer Consignments.
          </p>
        </div>

        {results && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrintDossier}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-mono transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-600" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-mono transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Direction Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            setDirection('forward');
          }}
          className={`p-4 rounded-xl border text-left transition-all relative ${
            direction === 'forward'
              ? 'bg-cyan-50/70 border-cyan-500 text-slate-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2 font-mono font-bold text-xs uppercase mb-1">
            <ArrowRight className="w-4 h-4 text-cyan-600" />
            <span className={direction === 'forward' ? 'text-cyan-800' : 'text-slate-700'}>
              Forward Traceability (Downstream)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">
            Start at raw material batch to track which components, assemblies, products, and customer shipments were made from it.
          </p>
          <span className="text-[10px] font-mono text-cyan-700 block mt-2 font-semibold">
            Material Batch &rarr; Components &rarr; Assemblies &rarr; Products &rarr; Shipments
          </span>
        </button>

        <button
          onClick={() => {
            setDirection('backward');
          }}
          className={`p-4 rounded-xl border text-left transition-all relative ${
            direction === 'backward'
              ? 'bg-cyan-50/70 border-cyan-500 text-slate-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2 font-mono font-bold text-xs uppercase mb-1">
            <ArrowLeft className="w-4 h-4 text-cyan-600" />
            <span className={direction === 'backward' ? 'text-cyan-800' : 'text-slate-700'}>
              Backward Traceability (Upstream)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">
            Start at a finished motor or shipment to inspect component genealogy, subassembly operations, and source material supplier heat lots.
          </p>
          <span className="text-[10px] font-mono text-cyan-700 block mt-2 font-semibold">
            Finished Product &rarr; Assemblies &rarr; Components &rarr; Source Batches &rarr; Suppliers
          </span>
        </button>
      </div>

      {/* Query Search Bar & Presets */}
      <div className="industrial-card p-5 rounded-xl border border-slate-200 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrace(identifier, direction);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                direction === 'forward'
                  ? 'Enter Material Batch ID (e.g. MB-MVTEC-CABLE-01), Component ID, or Assembly ID...'
                  : 'Enter Product Passport ID (e.g. DPP-EV500-2026-003) or Shipment ID...'
              }
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Traversing Graph...' : 'Execute Bi-Directional Trace'}</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Verified Records:</span>
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 text-[11px] font-mono text-slate-700 hover:text-cyan-800 transition-all flex items-center space-x-1 shadow-sm"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 text-xs font-mono">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Product Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 text-xs focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="QC_APPROVED">QC_APPROVED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="QUARANTINED">QUARANTINED</option>
              <option value="MANUFACTURED">MANUFACTURED</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Shipment Status:</label>
            <select
              value={shipmentStatusFilter}
              onChange={(e) => {
                setShipmentStatusFilter(e.target.value);
              }}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 text-xs focus:border-cyan-500"
            >
              <option value="ALL">All Shipment Statuses</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="PREPARING">PREPARING</option>
              <option value="HELD_RECALL">HELD_RECALL</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:border-cyan-500 text-[11px]"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-1">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:border-cyan-500 text-[11px]"
            />
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner text="Traversing Manufacturing Genealogy Database..." />
      ) : results ? (
        <div className="space-y-6">
          {/* Query Summary & Latency Metric */}
          <div className="industrial-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-3 flex-wrap">
              <span className="text-slate-500 font-semibold">Target:</span>
              <strong className="text-cyan-700 text-sm font-bold">{results.meta?.queryIdentifier}</strong>
              <Badge text={results.meta?.resolvedType} size="xs" />
              <span className="text-slate-400">&bull; Direction:</span>
              <span className="font-bold text-slate-900 uppercase">{results.meta?.direction}</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-500">
              <span>
                Traversed in: <strong className="text-cyan-700 font-semibold">{results.meta?.executionTimeMs} ms</strong>
              </span>
              <span>
                Found: <strong className="text-slate-900 font-bold">{summary.totalProducts || 0}</strong> Motors, <strong className="text-slate-900 font-bold">{summary.totalBatches || 0}</strong> Batches
              </span>
            </div>
          </div>

          {/* Anomaly & Non-Conformance Alert Callout */}
          {anomalies.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 space-y-2 text-xs font-mono">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Lineage Anomalies & Quality Flags Detected ({anomalies.length})</span>
              </div>
              <div className="space-y-1.5">
                {anomalies.map((a, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-navy-950/80 border border-rose-500/30 flex items-start justify-between text-[11px]">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-rose-300">{a.entityType}: {a.entityId}</span>
                        <Badge text={a.severity} size="xs" />
                      </div>
                      <p className="text-slate-300 font-sans mt-0.5">{a.message}</p>
                    </div>
                    {a.entityType === 'Product' && (
                      <Link
                        to={`/dpp?id=${a.entityId}`}
                        className="text-cyan-400 hover:text-cyan-300 underline shrink-0 ml-2 text-[10px]"
                      >
                        Inspect DPP
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="industrial-card p-3 rounded-lg border border-navy-800">
              <span className="text-slate-400 text-[10px] uppercase block">Material Batches</span>
              <strong className="text-emerald-400 text-lg">{summary.totalBatches || pipeline.materialBatches?.length || 0}</strong>
              <span className="text-slate-500 text-[10px] block">Heat lots linked</span>
            </div>

            <div className="industrial-card p-3 rounded-lg border border-navy-800">
              <span className="text-slate-400 text-[10px] uppercase block">Components</span>
              <strong className="text-cyan-400 text-lg">{summary.totalComponents || pipeline.components?.length || 0}</strong>
              <span className="text-slate-500 text-[10px] block">Sub-assemblies</span>
            </div>

            <div className="industrial-card p-3 rounded-lg border border-navy-800">
              <span className="text-slate-400 text-[10px] uppercase block">Powertrain Assemblies</span>
              <strong className="text-gold-400 text-lg">{summary.totalAssemblies || pipeline.assemblies?.length || 0}</strong>
              <span className="text-slate-500 text-[10px] block">Operations verified</span>
            </div>

            <div className="industrial-card p-3 rounded-lg border border-navy-800">
              <span className="text-slate-400 text-[10px] uppercase block">Finished DPP Units</span>
              <strong className="text-sky-400 text-lg">{summary.totalProducts || pipeline.products?.length || 0}</strong>
              <span className="text-slate-500 text-[10px] block">Deduplicated motors</span>
            </div>

            <div className="industrial-card p-3 rounded-lg border border-navy-800">
              <span className="text-slate-400 text-[10px] uppercase block">Customer Consignments</span>
              <strong className="text-indigo-400 text-lg">{summary.totalShipments || pipeline.shipments?.length || 0}</strong>
              <span className="text-slate-500 text-[10px] block">Shipments dispatched</span>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'pipeline'
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Stepped Pipeline View</span>
              </button>

              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'graph'
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Interactive Visual Tree</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              Click any entity to inspect full Digital Product Passport or Lineage
            </span>
          </div>

          {/* View Mode 1: Stepped Pipeline View */}
          {viewMode === 'pipeline' ? (
            <div className="space-y-6">
              {/* Stepped Tier Progress Flow */}
              {direction === 'forward' ? (
                /* FORWARD FLOW: Batch -> Components -> Assembly -> Products -> Shipments */
                <div className="space-y-6">
                  {/* Tier 1: Material Batches */}
                  <div className="industrial-card p-4 rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                        <Layers className="w-4 h-4" />
                        <span>Tier 1: Source Material Batches ({pipeline.materialBatches?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Provenance Inbound</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(pipeline.materialBatches || []).map((b) => (
                        <div
                          key={b.batchId}
                          onClick={() => setSelectedNode({ type: 'BATCH', data: b })}
                          className={`p-3 rounded-lg bg-navy-950 border transition-all cursor-pointer ${
                            b.status === 'QUARANTINED' || b.status === 'DEFECTIVE'
                              ? 'border-rose-500/50 hover:border-rose-500 bg-rose-950/20'
                              : 'border-navy-800 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-emerald-400 text-xs">{b.batchId}</span>
                            <Badge text={b.status} size="xs" />
                          </div>
                          <p className="text-slate-200 text-xs mt-1 font-semibold">{b.materialName}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>Supplier: <strong className="text-white">{b.supplierName}</strong></div>
                            <div>Lot: {b.supplierLotNumber} &bull; Qty: {b.quantity} {b.unit || 'kg'}</div>
                            <div>Received: {new Date(b.receivedDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 2: Components */}
                  <div className="industrial-card p-4 rounded-xl border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs uppercase">
                        <Box className="w-4 h-4" />
                        <span>Tier 2: Manufactured Components ({pipeline.components?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Precision Subassemblies</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(pipeline.components || []).map((c) => (
                        <div
                          key={c.componentId}
                          onClick={() => setSelectedNode({ type: 'COMPONENT', data: c })}
                          className="p-3 rounded-lg bg-navy-950 border border-navy-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-cyan-300 text-xs">{c.componentId}</span>
                            <Badge text={c.status} size="xs" />
                          </div>
                          <p className="text-slate-200 text-xs mt-1 font-semibold">{c.componentName}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>Type: <strong className="text-white">{c.componentType}</strong> &bull; Line: {c.lineId}</div>
                            <div>Batches Used: {(c.materialBatches || []).map(mb => mb.batchId).join(', ') || 'N/A'}</div>
                            <div>Produced: {new Date(c.productionDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 3: Assemblies */}
                  <div className="industrial-card p-4 rounded-xl border border-gold-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-gold-400 font-mono font-bold text-xs uppercase">
                        <Cpu className="w-4 h-4" />
                        <span>Tier 3: Powertrain Assemblies ({pipeline.assemblies?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Integrated Operations</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(pipeline.assemblies || []).map((a) => (
                        <div
                          key={a.assemblyId}
                          onClick={() => setSelectedNode({ type: 'ASSEMBLY', data: a })}
                          className="p-3 rounded-lg bg-navy-950 border border-navy-800 hover:border-gold-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-gold-400 text-xs">{a.assemblyId}</span>
                            <Badge text={a.status} size="xs" />
                          </div>
                          <p className="text-slate-200 text-xs mt-1 font-semibold">{a.assemblyName}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>Line: <strong className="text-white">{a.assemblyLine}</strong> &bull; Workstation: {a.workstation}</div>
                            <div>Quality Verification: {a.qualityChecks?.passedAll ? '100% Passed' : 'Fail / Incomplete'}</div>
                            <div>Components: {(a.components || []).map(c => c.componentId).join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 4: Finished Products */}
                  <div className="industrial-card p-4 rounded-xl border border-sky-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-sky-400 font-mono font-bold text-xs uppercase">
                        <QrCode className="w-4 h-4" />
                        <span>Tier 4: Finished Digital Product Passports ({pipeline.products?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Deduplicated Motors</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(pipeline.products || []).map((p) => (
                        <div
                          key={p.passportId}
                          onClick={() => setSelectedNode({ type: 'PRODUCT', data: p })}
                          className={`p-3 rounded-lg bg-navy-950 border transition-all cursor-pointer ${
                            p.status === 'QUARANTINED'
                              ? 'border-rose-500/50 hover:border-rose-500 bg-rose-950/20'
                              : 'border-navy-800 hover:border-sky-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sky-300 text-xs">{p.passportId}</span>
                            <Badge text={p.status} size="xs" />
                          </div>
                          <p className="text-slate-200 text-xs mt-1 font-semibold">{p.modelName}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>SN: <strong className="text-white">{p.serialNumber}</strong></div>
                            <div>Assembly: {p.assemblyId || 'Modular'}</div>
                            <div>Manufactured: {new Date(p.manufacturedDate).toLocaleDateString()}</div>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-navy-850 flex justify-end">
                            <Link
                              to={`/dpp?id=${p.passportId}`}
                              className="text-cyan-400 hover:text-cyan-300 text-[11px] font-mono flex items-center space-x-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>Open DPP</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 5: Shipments */}
                  <div className="industrial-card p-4 rounded-xl border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-indigo-400 font-mono font-bold text-xs uppercase">
                        <Truck className="w-4 h-4" />
                        <span>Tier 5: Customer Consignments ({pipeline.shipments?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Logistics & Destinations</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(pipeline.shipments || []).map((s) => (
                        <div
                          key={s.shipmentId}
                          onClick={() => setSelectedNode({ type: 'SHIPMENT', data: s })}
                          className="p-3 rounded-lg bg-navy-950 border border-navy-800 hover:border-indigo-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-300 text-xs">{s.shipmentId}</span>
                            <Badge text={s.shippingStatus} size="xs" />
                          </div>
                          <p className="text-white text-xs mt-1 font-bold">{s.destinationClient}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>Carrier: <strong className="text-slate-200">{s.carrier}</strong> &bull; Tracking: {s.trackingNumber}</div>
                            <div>Address: {s.destinationAddress}</div>
                            <div>Dispatched: {new Date(s.dispatchDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* BACKWARD FLOW: Product -> Assembly -> Components -> Material Batches -> Suppliers */
                <div className="space-y-6">
                  {/* Finished Product Card */}
                  <div className="industrial-card p-5 rounded-xl border border-sky-500/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-sky-400 font-mono font-bold text-xs uppercase">
                        <QrCode className="w-4 h-4" />
                        <span>Finished Product Passport ({pipeline.products?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">Root Query Origin</span>
                    </div>

                    {(pipeline.products || []).map((p) => (
                      <div key={p.passportId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-lg bg-navy-950 border border-navy-800">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sky-300 text-sm">{p.passportId}</span>
                            <Badge text={p.status} size="xs" />
                          </div>
                          <h3 className="text-base font-bold text-white mt-1">{p.modelName}</h3>
                          <div className="mt-1 text-xs font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Serial: <strong className="text-white">{p.serialNumber}</strong></span>
                            <span>Facility: {p.facilityLocation}</span>
                            <span>Date: {new Date(p.manufacturedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Link
                          to={`/dpp?id=${p.passportId}`}
                          className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View DPP Certificate</span>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Supplier & Receipt Records */}
                  <div className="industrial-card p-5 rounded-xl border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                        <Building className="w-4 h-4" />
                        <span>Source Material Suppliers & Inbound Heat Lots ({pipeline.supplierProvenance?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Authentic Mill Test Certificates</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(pipeline.supplierProvenance || []).map((sup, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono">
                          <strong className="text-white block text-sm">{sup.supplierName}</strong>
                          <span className="text-[10px] text-cyan-300 block mt-0.5">
                            Categories: {sup.categories.join(', ')}
                          </span>
                          <div className="mt-2 pt-2 border-t border-navy-850 space-y-1 text-[11px] text-slate-300">
                            <div>Total Delivered: <strong>{sup.totalQuantityKg} kg</strong></div>
                            <div>Batches Supplied:</div>
                            <ul className="pl-3 list-disc text-slate-400 text-[10px]">
                              {sup.batchesSupplied.map(b => (
                                <li key={b.batchId}>
                                  <span className="text-emerald-400">{b.batchId}</span> - {b.materialName} (Lot: {b.supplierLotNumber})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source Material Batches */}
                  <div className="industrial-card p-4 rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                      <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                        <Layers className="w-4 h-4" />
                        <span>Source Material Batches ({pipeline.materialBatches?.length || 0})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Heat Lots Verified</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(pipeline.materialBatches || []).map((b) => (
                        <div
                          key={b.batchId}
                          onClick={() => setSelectedNode({ type: 'BATCH', data: b })}
                          className="p-3 rounded-lg bg-navy-950 border border-navy-800 hover:border-emerald-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-emerald-400 text-xs">{b.batchId}</span>
                            <Badge text={b.status} size="xs" />
                          </div>
                          <p className="text-slate-200 text-xs mt-1 font-semibold">{b.materialName}</p>
                          <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>Supplier: <strong className="text-white">{b.supplierName}</strong></div>
                            <div>Grade: {b.purityOrGrade || 'N/A'}</div>
                            <div>COA: {b.certificateOfAnalysis || 'Certified'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connected Components & Assemblies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="industrial-card p-4 rounded-xl border border-cyan-500/30 space-y-3">
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs uppercase pb-2 border-b border-navy-800">
                        <Box className="w-4 h-4" />
                        <span>Subcomponents ({pipeline.components?.length || 0})</span>
                      </div>
                      <div className="space-y-2">
                        {(pipeline.components || []).map((c) => (
                          <div key={c.componentId} className="p-2.5 rounded bg-navy-950 border border-navy-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-cyan-300">{c.componentId}</span>
                              <Badge text={c.status} size="xs" />
                            </div>
                            <p className="text-slate-200 mt-0.5">{c.componentName}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Batches: {(c.materialBatches || []).map(mb => mb.batchId).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="industrial-card p-4 rounded-xl border border-gold-500/30 space-y-3">
                      <div className="flex items-center space-x-2 text-gold-400 font-mono font-bold text-xs uppercase pb-2 border-b border-navy-800">
                        <Cpu className="w-4 h-4" />
                        <span>Assembly Operation ({pipeline.assemblies?.length || 0})</span>
                      </div>
                      <div className="space-y-2">
                        {(pipeline.assemblies || []).map((a) => (
                          <div key={a.assemblyId} className="p-2.5 rounded bg-navy-950 border border-navy-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-gold-400">{a.assemblyId}</span>
                              <Badge text={a.status} size="xs" />
                            </div>
                            <p className="text-slate-200 mt-0.5">{a.assemblyName}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Line: {a.assemblyLine} &bull; Workstation: {a.workstation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* View Mode 2: Interactive Visual Tree */
            <div className="industrial-card p-5 rounded-xl border border-navy-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-navy-800 text-xs font-mono text-slate-400">
                <span>Visual Provenance Graph ({graph.nodes.length} nodes, {graph.edges.length} connections)</span>
                <span className="text-cyan-400">Click node to inspect properties</span>
              </div>

              {/* Visual Graph Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {['BATCH', 'COMPONENT', 'ASSEMBLY', 'PRODUCT', 'SHIPMENT'].map((tierType, tIdx) => {
                  const tierNodes = graph.nodes.filter(n => n.type === tierType);
                  return (
                    <div key={tierType} className="space-y-2 p-2 rounded-lg bg-navy-950/80 border border-navy-850">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-navy-800 pb-1 flex items-center justify-between">
                        <span>Tier {tIdx + 1}: {tierType}</span>
                        <span>({tierNodes.length})</span>
                      </div>

                      {tierNodes.length === 0 ? (
                        <div className="text-[10px] text-slate-600 p-2 text-center">None</div>
                      ) : (
                        <div className="space-y-1.5">
                          {tierNodes.map((node) => (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNode(node)}
                              className={`p-2 rounded border transition-all cursor-pointer text-xs font-mono ${
                                node.isQuarantined
                                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                                  : 'bg-navy-900 border-navy-800 hover:border-cyan-500 text-slate-300'
                              }`}
                            >
                              <span className="font-bold block truncate text-[11px] text-cyan-300">
                                {node.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate font-sans">
                                {node.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Selected Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="industrial-card p-6 rounded-xl max-w-lg w-full space-y-4 border border-cyan-500/40 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-navy-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  {selectedNode.type} Inspection
                </span>
                <h3 className="text-base font-bold text-white font-mono">{selectedNode.id || selectedNode.data?.batchId || selectedNode.data?.componentId || selectedNode.data?.passportId}</h3>
              </div>
              <Badge text={selectedNode.data?.status || selectedNode.status} size="xs" />
            </div>

            <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-1.5 text-xs font-mono">
              {Object.entries(selectedNode.data || {}).map(([k, v]) => {
                if (v === null || v === undefined || typeof v === 'object') return null;
                return (
                  <div key={k} className="flex justify-between items-start gap-2 py-0.5 border-b border-navy-900">
                    <span className="text-slate-500 uppercase text-[10px]">{k}:</span>
                    <span className="text-slate-200 text-right truncate max-w-xs">{String(v)}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-navy-800 flex items-center justify-between gap-2">
              {selectedNode.type === 'PRODUCT' && (
                <button
                  onClick={() => navigate(`/dpp?id=${selectedNode.id || selectedNode.data?.passportId}`)}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Inspect Passport</span>
                </button>
              )}

              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-1.5 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 font-mono text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

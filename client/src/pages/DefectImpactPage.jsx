import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  Clock,
  Box,
  Truck,
  Layers,
  Cpu,
  History,
  CheckCircle2,
  Lock,
  Printer,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  FileText,
  AlertOctagon,
  RefreshCw,
  QrCode,
  Building2,
  PackageCheck
} from 'lucide-react';
import { api } from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';

const DEFECT_CATEGORIES = [
  { value: 'METALLURGICAL_FLAW', label: 'Metallurgical Inclusion / Sub-surface Flaw' },
  { value: 'INSULATION_BREAKDOWN', label: 'Winding Dielectric / Enamel Breakdown' },
  { value: 'DIMENSIONAL_VARIANCE', label: 'CNC Machining Tolerance Out of Spec' },
  { value: 'THERMAL_OVERHEATING', label: 'Uncontrolled Temperature Rise on Dyno' },
  { value: 'ASSEMBLY_TORQUE_ERROR', label: 'Robotic Stator-to-Housing Torque Fault' },
  { value: 'SUPPLIER_CONTAMINATION', label: 'Raw Material Lot Impurity / High Carbon' },
  { value: 'OTHER', label: 'Other Shop Floor Anomaly' },
];

export default function DefectImpactPage() {
  const navigate = useNavigate();
  const { refreshTrigger, onDataRefreshed } = useOutletContext() || {};
  const [searchParams] = useSearchParams();

  // Dynamic Batches from Database
  const [availableBatches, setAvailableBatches] = useState([]);

  // Workflow Form State
  const [sourceType, setSourceType] = useState('MATERIAL_BATCH');
  const [sourceId, setSourceId] = useState(searchParams.get('sourceId') || '');
  const [title, setTitle] = useState('Stator Lead Wire Dielectric Insulation Defect');
  const [category, setCategory] = useState('INSULATION_BREAKDOWN');
  const [severity, setSeverity] = useState('CRITICAL');
  const [rootCause, setRootCause] = useState('Sub-surface inner insulation barrier compromise. Catastrophic phase-to-ground risk under 800V transient load.');
  const [reportedBy, setReportedBy] = useState('Quality Lead: Dr. Aris Thorne');
  const [discoveryTime, setDiscoveryTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('Immediate automated containment hold triggered across all downstream finished motor assemblies and customer shipments.');

  // Traversal & Output State
  const [analysisReport, setAnalysisReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Available Defect Records history
  const [defectsList, setDefectsList] = useState([]);

  // Fetch defects list
  const loadDefectsList = async () => {
    try {
      const res = await api.getDefects();
      if (res.success && res.data) {
        setDefectsList(res.data);
      }
    } catch (err) {
      console.warn('Notice loading defects list:', err);
    }
  };

  // Run Real-time Traversal to Identify All Affected Products
  const handlePreviewImpact = async (targetId, type = sourceType) => {
    const idToQuery = (targetId || sourceId).trim();
    if (!idToQuery) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await api.previewDefectImpact({ sourceType: type, sourceId: idToQuery });
      if (res.success && res.data) {
        setAnalysisReport(res.data);
      } else {
        throw new Error(res.message || 'Defect impact calculation failed');
      }
    } catch (err) {
      setError(err.message || 'Defect impact calculation failed');
      setAnalysisReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches on mount and auto-select defective batch
  useEffect(() => {
    async function initBatches() {
      try {
        const res = await api.getBatches();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableBatches(res.data);
          const paramId = searchParams.get('sourceId');
          // Prefer param, or defective batch, or first batch
          const defectiveBatch = res.data.find(b => b.status === 'DEFECTIVE' || b.qualityPassed === false);
          const initialId = paramId || (defectiveBatch ? defectiveBatch.batchId : res.data[0].batchId);
          setSourceId(initialId);
          handlePreviewImpact(initialId, 'MATERIAL_BATCH');
        }
      } catch (err) {
        console.warn('Failed to load batches:', err);
      }
    }
    initBatches();
    loadDefectsList();
  }, [refreshTrigger]);

  // Execute and Commit Defect with Automated Containment
  const handleCommitDefect = async (e) => {
    e.preventDefault();
    if (!sourceId.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        sourceType,
        sourceId: sourceId.trim(),
        title: title.trim(),
        category,
        severity,
        rootCause: rootCause.trim(),
        reportedBy: reportedBy.trim(),
        discoveryTime,
        notes: notes.trim(),
      };

      const res = await api.createDefect(payload);
      if (res.success) {
        setSuccessMessage(res.message || 'Defect recorded and automated containment executed successfully!');
        if (onDataRefreshed) onDataRefreshed();
        loadDefectsList();
        handlePreviewImpact(sourceId, sourceType);
      }
    } catch (err) {
      setError(err.message || 'Failed to commit defect');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const summary = analysisReport?.summary || {};
  const details = analysisReport?.details || {};

  return (
    <div className="space-y-6">
      {/* Top Banner: Clean Industrial Header */}
      <div className="industrial-card p-6 md:p-8 rounded-3xl relative overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>SUB-SECOND MULTI-HOP BLAST RADIUS ENGINE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Defect Impact Analysis & Product Identification
            </h1>
            <p className="text-slate-600 text-xs md:text-sm mt-1 max-w-3xl">
              Select any defective raw material batch to instantly trace downstream genealogy and identify every affected component, finished electric motor, and customer consignment in milliseconds.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {analysisReport && (
              <button
                onClick={handlePrintDossier}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-xs"
                title="Print official factory containment dossier"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Export Dossier (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && <AlertBanner type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}

      {/* CORE CONTROL: Select Defective Batch to Identify Affected Products */}
      <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Select Defective Raw Material Batch to Identify Affected Products
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Real-time multi-hop graph traversal (&lt; 10ms latency)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Batch Selector Dropdown */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-700 block">
              Choose Raw Material Batch from Database:
            </label>
            <div className="relative">
              <select
                value={sourceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceId(val);
                  handlePreviewImpact(val, 'MATERIAL_BATCH');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all shadow-xs"
              >
                {availableBatches.length === 0 ? (
                  <option value="">No batches loaded</option>
                ) : (
                  availableBatches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} &mdash; {b.materialName} ({b.supplierName}) [{b.status || 'ACTIVE'}]
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Trigger Button */}
          <div>
            <button
              type="button"
              onClick={() => handlePreviewImpact(sourceId, 'MATERIAL_BATCH')}
              disabled={loading || !sourceId}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-rose-200" />
              <span>{loading ? 'Traversing Graph...' : 'Identify Affected Products'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Traversal Results & Blast Radius Report */}
      {loading ? (
        <LoadingSpinner text="Executing Multi-Hop Genealogy Traversal Across Stored Records..." size="lg" />
      ) : analysisReport ? (
        <div className="space-y-6">
          {/* Performance & Execution Latency Banner */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-3 text-slate-700">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Measured Traversal Latency: <strong className="text-slate-900 text-sm">{analysisReport.executionTimeMs} ms</strong>
              </span>
              <span>&bull;</span>
              <span className="text-slate-500">{analysisReport.benchmarkResult}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Risk Assessment:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                summary.riskLevel === 'CRITICAL_CUSTOMER_EXPOSURE'
                  ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {summary.riskLevel?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="industrial-card p-5 rounded-2xl border border-rose-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Affected Motors</span>
              <p className="text-3xl font-extrabold font-mono text-rose-600">
                {summary.totalAffectedProducts || 0}
              </p>
              <p className="text-[11px] font-mono text-slate-500">Downstream Serialized Motors</p>
            </div>

            <div className="industrial-card p-5 rounded-2xl border border-amber-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">In Factory Storage</span>
              <p className="text-3xl font-extrabold font-mono text-amber-600">
                {summary.inStockCount || 0}
              </p>
              <p className="text-[11px] font-mono text-amber-700 font-semibold">Action: Immediate Warehouse Lock</p>
            </div>

            <div className="industrial-card p-5 rounded-2xl border border-indigo-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Already Shipped</span>
              <p className="text-3xl font-extrabold font-mono text-indigo-600">
                {summary.alreadyShippedCount || 0}
              </p>
              <p className="text-[11px] font-mono text-indigo-700 font-semibold">Action: Carrier Halt & Consignee Advisory</p>
            </div>

            <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Customer Shipments</span>
              <p className="text-3xl font-extrabold font-mono text-slate-900">
                {summary.affectedShipmentsCount || 0}
              </p>
              <p className="text-[11px] font-mono text-slate-500">Exposed Active Consignments</p>
            </div>
          </div>

          {/* PRIMARY REQUIREMENT: Comprehensive Table of ALL PRODUCTS AFFECTED */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    All Products Affected by Defective Batch ({details.affectedProducts?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exact serialized finished electric motors assembled with components containing raw material batch {sourceId}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                100% Traceable Downstream Impact
              </span>
            </div>

            {!details.affectedProducts || details.affectedProducts.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ✓ ZERO finished products affected by this batch. No downstream assemblies recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-3">Serial Number</th>
                      <th className="py-3 px-3">Passport ID</th>
                      <th className="py-3 px-3">Electric Motor Model</th>
                      <th className="py-3 px-3">Current Status</th>
                      <th className="py-3 px-3">Location / Consignment</th>
                      <th className="py-3 px-3">Containment Action</th>
                      <th className="py-3 px-3 text-right">Passport Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {details.affectedProducts.map((p) => {
                      const isShipped = p.status === 'SHIPPED';
                      return (
                        <tr key={p.passportId} className="hover:bg-rose-50/40 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-900">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                              {p.serialNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-cyan-800 font-semibold">{p.passportId}</td>
                          <td className="py-3.5 px-3 font-sans text-slate-700 max-w-xs">{p.modelName}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isShipped
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            {isShipped ? (
                              <span className="text-indigo-800 font-semibold block">
                                In Consignment {p.shipmentId || 'Active Freight'}
                              </span>
                            ) : (
                              <span className="text-amber-800 font-semibold block">
                                Cleanroom Plant 4 Storage (Locked)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              {isShipped ? 'Carrier Intercept & Recall' : 'MES Quarantined'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => navigate(`/dpp?id=${p.passportId}`)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all"
                            >
                              <span>Inspect DPP</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Downstream Propagation Chain (5-Tier Flow) */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                5-Tier Downstream Propagation Chain
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              {/* Tier 1: Defective Batch */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Tier 1: Defective Batch</span>
                <span className="font-bold text-rose-950 text-sm block">{sourceId}</span>
                <p className="text-[11px] text-rose-700">
                  {analysisReport.confirmedDefective?.label || 'Class-H High-Temperature Stator Lead Wire'}
                </p>
              </div>

              {/* Tier 2: Affected Components */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Tier 2: Affected Components ({details.affectedComponents?.length || 0})
                </span>
                {(details.affectedComponents || []).map(c => (
                  <div key={c.componentId} className="pt-1">
                    <span className="font-bold text-slate-900 block">{c.componentId}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{c.componentName}</span>
                  </div>
                ))}
              </div>

              {/* Tier 3: Finished Motors */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Tier 3: Finished Motors ({details.affectedProducts?.length || 0})
                </span>
                {(details.affectedProducts || []).map(p => (
                  <div key={p.serialNumber} className="pt-1">
                    <span className="font-bold text-slate-900 block">{p.serialNumber}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{p.modelName}</span>
                  </div>
                ))}
              </div>

              {/* Tier 4: Shipments */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Tier 4: Exposed Shipments ({details.affectedShipments?.length || 0})
                </span>
                {(details.affectedShipments || []).map(s => (
                  <div key={s.shipmentId} className="pt-1">
                    <span className="font-bold text-slate-900 block">{s.shipmentId}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{s.destinationCompany || s.destinationClient}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Affected Shipments and Consignees */}
          {details.affectedShipments && details.affectedShipments.length > 0 && (
            <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Exposed Customer Consignments ({details.affectedShipments.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">Logistics Recall Tracking</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.affectedShipments.map((shp) => (
                  <div key={shp.shipmentId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{shp.shipmentId}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {shp.shippingStatus}
                      </span>
                    </div>
                    <p className="font-sans font-bold text-slate-800 text-xs">{shp.destinationCompany || shp.destinationClient}</p>
                    <p className="text-slate-500 text-[11px]">{shp.destinationAddress}</p>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span>Carrier: {shp.carrier}</span>
                      <span className="font-bold text-slate-700">Trk: {shp.trackingNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automated Containment Next Steps */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Recommended 8D Containment & Quality Actions
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {(analysisReport.suggestedNextSteps || []).map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-slate-800 font-sans text-xs leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Historical Defect & Containment Ledger */}
      <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Historical Defect & Containment Ledger ({defectsList.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Persistent Records</span>
        </div>

        {defectsList.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded-2xl">
            No historical defect logs recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {defectsList.map((def) => (
              <div
                key={def.defectId || def._id}
                onClick={() => {
                  setSourceType(def.sourceType || 'MATERIAL_BATCH');
                  setSourceId(def.sourceId || def.affectedBatchId);
                  setTitle(def.title);
                  setRootCause(def.rootCause);
                  handlePreviewImpact(def.sourceId || def.affectedBatchId, def.sourceType || 'MATERIAL_BATCH');
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-white cursor-pointer transition-all space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800">{def.defectId}</span>
                  <Badge text={def.status} size="xs" />
                </div>
                <p className="font-sans font-bold text-slate-900 line-clamp-1">{def.title}</p>
                <p className="text-slate-500 text-[11px] line-clamp-1">Target: {def.sourceId || def.affectedBatchId}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{def.affectedProductsCount || 0} product(s) affected</span>
                  <span>{new Date(def.identifiedDate || def.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

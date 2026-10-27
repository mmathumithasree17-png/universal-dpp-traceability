import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  Building2,
  Barcode,
  CheckSquare,
  Clock,
  Layers,
  Box,
  Cpu,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Camera,
  MapPin,
  Calendar,
  FileText,
  Activity,
  Download,
  Copy,
  Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';
import QrScannerModal from '../components/dpp/QrScannerModal';

export default function ShipmentVerificationPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingCheckId, setUpdatingCheckId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (data) {
      const targetUrl = data.qrPayload || window.location.href;
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#060a12', light: '#ffffff' }
      }).then(uri => setQrDataUrl(uri)).catch(err => console.error('QR dataURL error:', err));

      if (qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, targetUrl, {
          width: 210,
          margin: 1.5,
          color: { dark: '#060a12', light: '#ffffff' }
        }, (err) => {
          if (err) console.error('Error drawing canvas QR:', err);
        });
      }
    }
  }, [data]);

  // New check state
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [newCheckTitle, setNewCheckTitle] = useState('');
  const [newCheckStage, setNewCheckStage] = useState('DELIVERY');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getShipmentTraceability(id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Traceability data not found for this shipment.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load shipment traceability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Live checklist ticking
  const handleToggleCheck = async (checkId, currentChecked) => {
    try {
      setUpdatingCheckId(checkId);
      const nextChecked = !currentChecked;
      const res = await api.updateShipmentChecklist(id, {
        checkId,
        checked: nextChecked,
        checkedBy: 'Consignment Recipient Inspector'
      });

      if (res.success) {
        setToastMessage(`Check updated: ${nextChecked ? 'Verified & Timestamp Recorded' : 'Unchecked'}`);
        // Update local state
        setData(prev => ({
          ...prev,
          checklist: res.checklist
        }));
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      alert('Error updating check: ' + err.message);
    } finally {
      setUpdatingCheckId(null);
    }
  };

  // Add new check directly
  const handleAddCustomCheck = async (e) => {
    e.preventDefault();
    if (!newCheckTitle.trim()) return;
    try {
      const res = await api.updateShipmentChecklist(id, {
        newCheck: {
          title: newCheckTitle.trim(),
          stage: newCheckStage,
          checked: true,
        },
        checkedBy: 'Consignment Recipient Inspector'
      });
      if (res.success) {
        setData(prev => ({ ...prev, checklist: res.checklist }));
        setNewCheckTitle('');
        setShowAddCheck(false);
        setToastMessage('New checkpoint added and verified!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      alert('Error adding checkpoint: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving End-to-End Product Traceability & Consignment Ledger..." size="lg" />;
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <AlertBanner type="error" title="Shipment Not Found" message={error || 'Unable to load consignment record.'} />
        <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-cyan-600 font-bold text-sm">
          <span>&larr; Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const {
    shipment,
    originCompany,
    destinationCompany,
    products = [],
    components = [],
    materialBatches = [],
    events = [],
    checklist = []
  } = data;

  const completedCount = checklist.filter(c => c.checked).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="industrial-card p-6 md:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                {shipment.shipmentId}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {shipment.shippingStatus}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                TRACKING: <strong className="text-slate-800">{shipment.trackingNumber}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Consignment Traceability & Custody Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              End-to-end provenance mapping from source raw materials to finished electric motors and logistics delivery.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan Another QR</span>
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-1 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Origin to Destination Route Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
              Originating Company (What Company Are We?)
            </span>
            <div className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{originCompany}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{shipment.originFacility || 'Cleanroom Gigafactory Plant 4'}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-1 py-2 md:py-0">
            <div className="w-full flex items-center justify-center space-x-2 text-cyan-600">
              <div className="h-0.5 flex-1 bg-cyan-200" />
              <Truck className="w-5 h-5" />
              <div className="h-0.5 flex-1 bg-cyan-200" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">{shipment.carrier}</span>
            <span className="text-[10px] text-slate-400">Dispatch: {new Date(shipment.dispatchDate).toLocaleDateString()}</span>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
              Destination / Recipient Company
            </span>
            <div className="font-extrabold text-sm text-slate-900 flex items-center md:justify-end space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{destinationCompany}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center md:justify-end space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{shipment.destinationAddress || 'Consignee Central Hub'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: INTERACTIVE CHECKLIST (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Checklist Card */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    Live Custody Verification Checklist (Raw Material &rarr; Delivery)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any checkbox below to verify items. The exact timestamp is immediately recorded into the database.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCheck(!showAddCheck)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Check</span>
              </button>
            </div>

            {/* Live Verification Progress Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-700">Verification Progress</span>
                <span className={`${progressPercent === 100 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {completedCount} of {totalCount} Checkpoints Verified ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-cyan-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Custom Checkpoint Adder Form */}
            {showAddCheck && (
              <form onSubmit={handleAddCustomCheck} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <span className="text-xs font-bold text-emerald-900 block">Add New Verification Checkpoint</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCheckTitle}
                    onChange={(e) => setNewCheckTitle(e.target.value)}
                    placeholder="e.g. Inbound customs release stamp verified"
                    className="flex-1 bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <select
                    value={newCheckStage}
                    onChange={(e) => setNewCheckStage(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="COMPONENT">Component</option>
                    <option value="ASSEMBLY">Assembly</option>
                    <option value="FINISHED_PRODUCT">Finished Product</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="DELIVERY">Delivery Receipt</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Save & Check
                  </button>
                </div>
              </form>
            )}

            {/* Checklist List */}
            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id, item.checked)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 group ${
                    item.checked
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={updatingCheckId === item.id}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className={`font-bold text-xs sm:text-sm ${item.checked ? 'text-emerald-950 font-bold' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.stage}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                    )}

                    {/* LIVE RECORDED TIMESTAMP DISPLAY */}
                    {item.checked && item.checkedAt ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-300">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Checked at: {new Date(item.checkedAt).toLocaleTimeString()} on {new Date(item.checkedAt).toLocaleDateString()}</span>
                        </div>
                        {item.checkedBy && (
                          <span className="text-[10px] font-mono text-slate-500">By: {item.checkedBy}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic mt-1 block group-hover:text-cyan-600 transition-colors">
                        Click to verify this checkpoint & record timestamp
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Tier Traceability Visual Breakdown */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                End-to-End Product Traceability Genealogy
              </h2>
            </div>

            <div className="space-y-4">
              {/* Tier 1: Raw Materials */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-blue-900 uppercase">
                    1. Source Raw Material Batches ({materialBatches.length} lots)
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-semibold">Tier 1 Smelter Provenance</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {materialBatches.map(b => (
                    <div key={b.batchId} className="p-2.5 bg-white rounded-xl border border-blue-200/80">
                      <span className="font-mono font-bold text-blue-900 block">{b.batchId}</span>
                      <span className="text-slate-600 text-[11px] block">{b.materialName}</span>
                      <span className="text-slate-400 text-[10px]">Supplier: {b.supplierName} &bull; CoA: {b.certificateOfAnalysis || 'Certified'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier 2: Machined Components */}
              <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-cyan-900 uppercase">
                    2. Manufactured Components ({components.length} units)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-700 font-semibold">Tier 2 Sub-components</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {components.map(c => (
                    <div key={c.componentId} className="p-2.5 bg-white rounded-xl border border-cyan-200/80">
                      <span className="font-mono font-bold text-cyan-900 block">{c.componentId}</span>
                      <span className="text-slate-600 text-[11px] block">{c.componentName}</span>
                      <span className="text-slate-400 text-[10px]">Line: {c.lineId || 'Precision CNC / Winding'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier 3: Finished Motors */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-900 uppercase">
                    3. Finished Serialized Powertrains ({products.length} motors)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">Tier 3 Digital Product Passports</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {products.map(p => (
                    <div key={p.passportId || p.serialNumber} className="p-2.5 bg-white rounded-xl border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-emerald-900 block">{p.serialNumber || p.passportId}</span>
                        <span className="text-slate-600 text-[11px] block">{p.modelName}</span>
                      </div>
                      <Link
                        to={`/dpp?id=${p.passportId}`}
                        className="text-emerald-700 hover:text-emerald-800 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200"
                        title="View Digital Passport"
                      >
                        <QrCode className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Station Telemetry & Manufacturing Event Audit Stream */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Traceability History & Station Telemetry Audit Log
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chronological lifecycle records from raw material receipt through CNC winding, dyno testing, and final QA
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0 self-start sm:self-auto">
                {events.length} Telemetry Events
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No telemetry events logged for this asset yet.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((evt, idx) => {
                  const isPass = evt.inspectionResult === 'PASSED' || evt.status === 'SUCCESS';
                  const isFail = evt.inspectionResult === 'FAILED' || evt.status === 'FAILED';
                  const isWarning = evt.inspectionResult === 'WARNING' || evt.status === 'WARNING';

                  return (
                    <div
                      key={evt.eventId || idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {evt.eventId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                            {evt.eventType ? evt.eventType.replace(/_/g, ' ') : 'EVENT'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isPass
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isFail
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isWarning
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {evt.inspectionResult || evt.status || 'LOGGED'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(evt.timestamp).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Target Asset:</span>
                          <span className="font-mono text-slate-800 font-semibold text-[11px]">
                            {evt.targetType}: {evt.targetId}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Workstation / Cell:</span>
                          <span className="text-slate-700 text-[11px]">
                            {evt.station || 'Assembly Station 4'} {evt.machine ? `(${evt.machine})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Responsible Operator:</span>
                          <span className="text-slate-700 text-[11px]">{evt.operator || 'Quality Lead'}</span>
                        </div>
                      </div>

                      {(evt.notes || evt.remarks || evt.parametersRecorded) && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                          {evt.notes || evt.remarks}
                          {evt.parametersRecorded && Object.keys(evt.parametersRecorded).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2 pt-1 border-t border-slate-200/60 font-mono text-[10px] text-slate-500">
                              {Object.entries(evt.parametersRecorded).map(([k, v]) => (
                                <span key={k} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {k}: <strong className="text-slate-800">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QR CODE & PRODUCT SERIALS (1 COL) */}
        <div className="space-y-6">
          {/* High-Resolution QR Card */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-mono font-bold uppercase text-slate-500">Consignment QR Pass</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-emerald-300 shadow-md min-h-[220px] items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Consignment QR ${shipment.shipmentId}`}
                  className="w-52 h-52 object-contain rounded-xl shadow-xs"
                />
              ) : (
                <canvas ref={qrCanvasRef} className="rounded-xl shadow-xs w-52 h-52" />
              )}
            </div>

            <div className="space-y-1">
              <span className="font-mono font-bold text-slate-900 text-sm block">{shipment.shipmentId}</span>
              <p className="text-[11px] text-slate-500">
                Scan with any smartphone or terminal to open this live verification ledger.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">QR Destination URL:</span>
                <span className="text-[11px] font-mono text-slate-800 break-all font-semibold select-all">
                  {data.qrPayload || currentUrl}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.qrPayload || currentUrl);
                    setToastMessage('Live QR Link Copied to Clipboard!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 flex items-center justify-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
                <a
                  href={qrDataUrl}
                  download={`consignment-qr-${shipment.shipmentId}.png`}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              </div>
            </div>
          </div>

          {/* Attached Serial Numbers Card */}
          <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Barcode className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-mono font-bold uppercase text-slate-900">
                  Products in Consignment
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                {products.length} Units
              </span>
            </div>

            <div className="space-y-2">
              {products.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">{p.serialNumber || p.passportId}</span>
                    <Link
                      to={`/dpp?id=${p.passportId}`}
                      className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800 flex items-center space-x-1"
                    >
                      <span>Passport</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-slate-500">{p.modelName || 'AeroDrive Powertrain'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal for Quick Scanning */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedId, rawPayload) => {
          setIsScannerOpen(false);
          const raw = String(rawPayload || decodedId || '');
          const matchShp = decodedId?.startsWith('SHP-') ? decodedId : (raw.match(/SHP-[\w-]+/) || [])[0];
          if (matchShp) {
            window.location.href = `/shipment-verify/${matchShp}`;
            return;
          }
          const matchDpp = (raw.match(/(DPP-[\w-]+|SN-[\w-]+)/) || [])[0];
          if (matchDpp) {
            window.location.href = `/dpp?id=${matchDpp}`;
            return;
          }
          if (decodedId) {
            window.location.href = `/dpp?id=${decodedId}`;
          }
        }}
      />
    </div>
  );
}

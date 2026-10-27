import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  QrCode,
  Layers,
  ShieldAlert,
  Truck,
  Activity,
  History,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Database,
  Smartphone,
  Box,
} from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';
import ProductsTimelineChart from '../components/dashboard/ProductsTimelineChart';
import DefectsStatusChart from '../components/dashboard/DefectsStatusChart';
import ShipmentStatusChart from '../components/dashboard/ShipmentStatusChart';
import QuickActionModals from '../components/dashboard/QuickActionModals';
import DatasetManagerModal from '../components/dashboard/DatasetManagerModal';
import RecordShipmentModal from '../components/dashboard/RecordShipmentModal';
import ScanWebsiteModal from '../components/common/ScanWebsiteModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { refreshTrigger, onDataRefreshed } = useOutletContext() || {};
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'product' | 'defect' | 'event' | null
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isScanWebModalOpen, setIsScanWebModalOpen] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const loadStats = async (isManual = false) => {
    try {
      if (!stats) {
        setLoading(true);
      } else if (isManual) {
        setRefreshing(true);
      }
      setError(null);
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        setSecondsAgo(0);
      } else {
        throw new Error(res.message || 'Malformed dashboard payload');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics from backend database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Live second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // If stats already exist, load silently in background without unmounting any open modals
    loadStats(Boolean(stats));
    // Auto-refresh dashboard metrics every 5 seconds to reflect shop-floor updates within seconds
    const interval = setInterval(() => {
      loadStats(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleActionSuccess = (msg) => {
    setToastMessage(msg);
    loadStats(true);
    if (onDataRefreshed) onDataRefreshed();
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading && !stats) {
    return <LoadingSpinner text="Connecting to Universal DPP Industrial Ledger & Database..." size="lg" />;
  }

  const counts = stats?.counts || {
    totalProducts: 0,
    totalBatches: 0,
    totalDefects: 0,
    totalShipments: 0,
    activeQuarantines: 0,
  };

  const inspection = stats?.productInspectionStatus || {
    MANUFACTURED: 0,
    QC_APPROVED: 0,
    IN_STORAGE: 0,
    SHIPPED: 0,
    QUARANTINED: 0,
    RECALLED: 0,
  };

  const quarantinedBatches = stats?.quarantinedBatches || [];
  const recentShipments = stats?.recentShipments || [];
  const recentEvents = stats?.recentEvents || [];
  const recentAudits = stats?.recentAudits || [];
  const charts = stats?.charts || {
    productsOverTime: [],
    defectsByStatus: [],
    shipmentsByStatus: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Manufacturing Executive Header & Quick Actions */}
      <div className="industrial-card p-6 rounded-2xl relative overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Subtle Industrial Warehouse Background Accent */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: "url('/images/factory-warehouse.jpg')" }}
        />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                <span>SHOP FLOOR & PROVENANCE CONTROL CENTER</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPDATED {secondsAgo}S AGO (SYNC: 5S)</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Manufacturing Traceability Dashboard
            </h1>
            <p className="text-slate-600 text-xs md:text-sm mt-1">
              Live operational metrics computed directly from persistent database records for electric motor powertrain lifecycle.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action */}
            <button
              onClick={() => setIsShipmentModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-xs"
              title="Record and dispatch a new shipment with traceability checklist and QR code"
            >
              <Truck className="w-4 h-4" />
              <span>Record Shipment</span>
            </button>

            {/* Mobile Scan Button */}
            <button
              onClick={() => setIsScanWebModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold transition-all shadow-xs"
              title="Scan QR Code to open this website on your mobile phone or tablet"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Scan to Open Website</span>
            </button>

            {/* Secondary Actions Group */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setActiveModal('defect')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-mono font-medium transition-all"
                title="Report anomaly and execute containment"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Defect</span>
              </button>

              <button
                onClick={() => setActiveModal('product')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-mono font-medium transition-all"
                title="Register new finished motor passport"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Product</span>
              </button>

              <button
                onClick={() => setActiveModal('component')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-mono font-medium transition-all"
                title="Add new precision sub-component to Digital Product Passports"
              >
                <Box className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Component</span>
              </button>

              <button
                onClick={() => setActiveModal('event')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-mono font-medium transition-all"
                title="Log shop floor event"
              >
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Event</span>
              </button>

              <button
                onClick={() => setIsDatasetModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-mono font-medium transition-all"
                title="Manage dataset: Remove all records, upload or import new dataset"
              >
                <Database className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Dataset</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadStats(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Quarantine Alert Notice */}
        {counts.activeQuarantines > 0 && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold font-mono text-rose-950">AUTOMATED DEFECT CONTAINMENT ACTIVE: </span>
                <span className="text-rose-800">
                  {counts.activeQuarantines} motor(s) isolated from shipment. Quarantined batch: 
                  <strong className="text-rose-950 ml-1 font-mono">MB-SHAFT-2026-033</strong>.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/defects')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              <span>Inspect Blast Radius</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {toastMessage && (
        <AlertBanner type="success" message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* REQUIREMENT 1 & 2: Four Summary Cards Calculated from Database with Navigation on Click */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            System Key Performance Indicators (Real-Time Database Records)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Click any card to inspect records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Products */}
          <div
            onClick={() => navigate('/dpp')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            title="Click to view all Digital Product Passports"
          >
            <StatCard
              title="Total Products"
              value={counts.totalProducts}
              subtitle={counts.totalProducts === 2 ? "2 Active Serialized Motors" : "Finished electric motors tracked"}
              icon={QrCode}
              color="cyan"
              badgeText="View DPP Registry &rarr;"
            />
          </div>

          {/* 2. Total Material Batches */}
          <div
            onClick={() => navigate('/traceability')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            title="Click to inspect raw material traceability"
          >
            <StatCard
              title="Raw Materials & Batches"
              value={counts.totalBatches}
              subtitle="Copper, Magnets, Silicon Steel, Alloys"
              icon={Layers}
              color="gold"
              badgeText="Trace Batches &rarr;"
            />
          </div>

          {/* 3. Total Defects */}
          <div
            onClick={() => navigate('/defects')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            title="Click to analyze defect impact"
          >
            <StatCard
              title="Total Defects"
              value={counts.totalDefects}
              subtitle={`${counts.activeQuarantines} quarantine lock(s) active`}
              icon={ShieldAlert}
              color="rose"
              badgeText="Blast Radius &rarr;"
            />
          </div>

          {/* 4. Total Shipments */}
          <div
            onClick={() => navigate('/shipment-verify/latest')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            title="Click to view latest shipment with working QR code and complete product traceability"
          >
            <StatCard
              title="Total Shipments"
              value={counts.totalShipments}
              subtitle={stats?.shipmentDestinationSummary || "BMW Group Powertrain Plant, Munich"}
              icon={Truck}
              color="emerald"
              badgeText="View Latest Shipment & QR &rarr;"
            />
          </div>
        </div>
      </div>

      {/* Visual Telemetry & Analytics Charts (3 Responsive Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Products Manufactured Over Time */}
        <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <ProductsTimelineChart data={charts.productsOverTime} />
        </div>

        {/* Chart 2: Defect Counts by Status */}
        <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <DefectsStatusChart data={charts.defectsByStatus} />
        </div>

        {/* Chart 3: Shipment Status Distribution */}
        <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <ShipmentStatusChart data={charts.shipmentsByStatus} />
        </div>
      </div>

      {/* Production Health & Defect Containment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Product Inspection & Lifecycle Status Breakdown */}
        <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Product Inspection Status
              </h3>
            </div>
            <button
              onClick={() => navigate('/dpp')}
              className="text-[11px] font-mono text-cyan-700 hover:underline flex items-center space-x-1"
            >
              <span>View DPP Registry</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">MANUFACTURED / IN CELL</span>
              <span className="font-bold text-blue-700">{inspection.MANUFACTURED} units</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">QC APPROVED / CLEARED</span>
              <span className="font-bold text-emerald-700">{inspection.QC_APPROVED} units</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <span className="text-emerald-900 font-semibold">SHIPPED TO CUSTOMERS (IN TRANSIT)</span>
              <span className="font-bold text-emerald-800">{inspection.SHIPPED} units</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <span className="text-rose-800 font-semibold">QUARANTINED / HOLD</span>
              <span className="font-bold text-rose-700">{inspection.QUARANTINED} units</span>
            </div>
          </div>
        </div>

        {/* Section 2: Defective or Quarantined Batches */}
        <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Defective / Quarantined Batches
              </h3>
            </div>
            <button
              onClick={() => navigate('/defects')}
              className="text-[11px] font-mono text-rose-700 hover:underline flex items-center space-x-1"
            >
              <span>Blast Radius</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {quarantinedBatches.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono text-center">
              ✓ All raw material batches currently active & verified.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {quarantinedBatches.map((batch) => (
                <div
                  key={batch.batchId}
                  onClick={() => navigate('/defects')}
                  className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-700">{batch.batchId}</span>
                    <Badge text={batch.status} size="xs" />
                  </div>
                  <p className="text-slate-800 font-semibold text-xs mt-1 truncate">{batch.materialName}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Supplier: {batch.supplierName} &bull; Lot: {batch.supplierLotNumber}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REAL SHIPMENT & CONSIGNMENT DETAILS LEDGER */}
      <div id="real-shipments" className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Real Shipment & Consignment Details
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {recentShipments.length} Active Consignment
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical logistics dispatch, serialized finished motor payloads, and live custody verification checklists
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShipmentModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Shipment</span>
            </button>
          </div>
        </div>

        {recentShipments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No real shipment recorded yet. Click "Record Shipment" to dispatch serialized motors.
          </div>
        ) : (
          <div className="space-y-4">
            {recentShipments.map((shp) => {
              const verifiedChecks = (shp.checklist || []).filter(c => c.checked).length;
              const totalChecks = (shp.checklist || []).length || 6;
              const checkPercent = Math.round((verifiedChecks / totalChecks) * 100);

              return (
                <div
                  key={shp.shipmentId || shp._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Row: IDs, Status & Action */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-xl font-mono text-xs font-bold bg-slate-900 text-white shadow-xs">
                        {shp.shipmentId}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {shp.shippingStatus}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        TRACKING: <strong className="text-slate-800">{shp.trackingNumber}</strong>
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        &bull; CARRIER: <strong className="text-slate-700">{shp.carrier}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/shipment-verify/${shp.shipmentId}`)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Live QR & Checklist</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Route & Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Originating Company (What Company Are We?):</span>
                      <span className="font-bold text-slate-900 block text-xs">{shp.originCompany || 'AeroDrive Powertrains Inc.'}</span>
                      <span className="text-slate-500 text-[11px] block">{shp.originFacility || 'Gigafactory Cleanroom Plant 4 - Detroit, MI'}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination Client / Consignee:</span>
                      <span className="font-bold text-emerald-900 block text-xs">{shp.destinationCompany || shp.destinationClient}</span>
                      <span className="text-slate-500 text-[11px] block">{shp.destinationAddress || 'Petuelring 130, 80809 Munich, Germany'}</span>
                    </div>
                  </div>

                  {/* Products Contained in this Shipment */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-700 uppercase">
                        Serialized Finished Motors in Consignment ({shp.products?.length || 0} units):
                      </span>
                      <span className="text-[11px] text-slate-500">Each motor has its own Digital Product Passport</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(shp.products || []).map((p, idx) => (
                        <div
                          key={p.serialNumber || p.passportId || idx}
                          onClick={() => navigate(`/dpp?id=${p.passportId}`)}
                          className="p-3 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-900 block group-hover:text-cyan-700 transition-colors">
                              {p.serialNumber || p.passportId}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {p.modelName || 'AeroDrive HP-350 Electric Motor'}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-cyan-600 font-bold group-hover:underline flex items-center space-x-1">
                            <span>Inspect DPP</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custody Checklist Progress */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Custody Verification Checkpoints (Raw Material &rarr; Delivery):</span>
                      </span>
                      <span className="font-bold text-emerald-800">
                        {verifiedChecks} of {totalChecks} Milestones Verified ({checkPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${checkPercent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1 text-[10px] font-mono">
                      {(shp.checklist || []).slice(0, 6).map((c) => (
                        <div
                          key={c.id}
                          className={`p-2 rounded-lg border text-center ${
                            c.checked
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                          title={`${c.title} - ${c.checked ? `Verified at ${new Date(c.checkedAt).toLocaleTimeString()}` : 'Pending'}`}
                        >
                          <div className="truncate">{c.checked ? '✓ Verified' : '○ Pending'}</div>
                          <div className="text-[9px] text-slate-500 truncate mt-0.5">{c.stage?.replace(/_/g, ' ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Table with Click-Through Navigation */}
      <div className="industrial-card p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900">
                Recent Shop Floor Activity & Event Stream
              </h3>
              <p className="text-xs text-slate-500">
                Click any activity record to navigate to Event Management and inspect telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="text-xs font-mono text-cyan-700 hover:underline flex items-center space-x-1"
          >
            <span>Open Event Management</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No events logged in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Product / Batch ID</th>
                  <th className="py-2.5 px-3">Station & Remarks</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recentEvents.map((evt) => (
                  <tr
                    key={evt.eventId || evt._id}
                    onClick={() => navigate('/events')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-bold text-cyan-700 group-hover:underline">
                      {evt.eventId}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">
                      {evt.eventType}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold">
                        {evt.targetId}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate font-sans">
                      <strong className="text-slate-900 font-mono block text-[11px]">{evt.station}</strong>
                      <span className="text-slate-500 truncate block">{evt.remarks}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge text={evt.status} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Quick Action Modals */}
      <QuickActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Dataset Management Modal */}
      <DatasetManagerModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onSuccess={handleActionSuccess}
        currentCounts={counts}
      />

      {/* Enhanced Record Shipment Modal (Company, Products/Serials, Raw-to-Finish Checklist & QR Generator) */}
      <RecordShipmentModal
        isOpen={isShipmentModalOpen}
        onClose={() => setIsShipmentModalOpen(false)}
        onSuccess={handleActionSuccess}
      />

      {/* Dedicated Website Mobile Access QR Modal */}
      <ScanWebsiteModal
        isOpen={isScanWebModalOpen}
        onClose={() => setIsScanWebModalOpen(false)}
      />
    </div>
  );
}

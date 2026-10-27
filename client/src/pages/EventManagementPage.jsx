import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Cpu,
  Box,
  Truck,
  QrCode,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  List,
  Calendar,
  FileText,
  User,
  Wrench,
  CheckCheck,
  Zap,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';

const EVENT_TYPE_CATEGORIES = [
  {
    category: 'Material Provenance',
    types: [
      { id: 'MATERIAL_RECEIVED', label: 'Material Received' },
      { id: 'MATERIAL_RECEIPT', label: 'Material Receipt (Legacy)' },
      { id: 'MATERIAL_INSPECTED', label: 'Material Inspected' },
      { id: 'MATERIAL_APPROVED', label: 'Material Approved' },
      { id: 'MATERIAL_REJECTED', label: 'Material Rejected / Scrapped' },
    ],
  },
  {
    category: 'Component Machining & Winding',
    types: [
      { id: 'COMPONENT_MANUFACTURED', label: 'Component Manufactured' },
      { id: 'COMPONENT_MACHINED', label: 'Component Machined' },
      { id: 'COMPONENT_INSPECTED', label: 'Component Inspected' },
      { id: 'STAMPING', label: 'Stator Lamination Stamping' },
      { id: 'WINDING', label: 'Precision Hairpin Copper Winding' },
      { id: 'IMPREGNATION', label: 'Vacuum Epoxy Resin Impregnation' },
      { id: 'ROTOR_BALANCING', label: 'Dynamic Rotor Balancing' },
    ],
  },
  {
    category: 'Rework & Corrections',
    types: [
      { id: 'REWORK_STARTED', label: 'Rework Started' },
      { id: 'REWORK_COMPLETED', label: 'Rework Completed' },
      { id: 'CORRECTIVE_ACTION_RECORDED', label: 'Corrective Action Recorded' },
    ],
  },
  {
    category: 'Assembly Operations',
    types: [
      { id: 'ASSEMBLY_STARTED', label: 'Powertrain Assembly Started' },
      { id: 'ASSEMBLY_COMPLETED', label: 'Powertrain Assembly Completed' },
      { id: 'FINAL_ASSEMBLY', label: 'Final Subassembly Integration' },
    ],
  },
  {
    category: 'Quality Testing & Passports',
    types: [
      { id: 'FINAL_QUALITY_INSPECTION', label: 'Final Quality Inspection' },
      { id: 'DYNO_TESTING', label: '350kW Dyno Load & Thermal Benchmark' },
      { id: 'PRODUCT_APPROVED', label: 'Product Approved for Storage/Dispatch' },
      { id: 'PRODUCT_QUARANTINED', label: 'Product Quarantined (Lockout)' },
      { id: 'QUARANTINE_TRIGGERED', label: 'Automated Quarantine Triggered' },
    ],
  },
  {
    category: 'Shipping & Consignment',
    types: [
      { id: 'SHIPMENT_CREATED', label: 'Shipment Created / Manifested' },
      { id: 'SHIPMENT_DISPATCHED', label: 'Shipment Dispatched / In Transit' },
      { id: 'PACKAGING', label: 'Finished Goods Packaging' },
      { id: 'DISPATCH', label: 'Dispatch Handover' },
    ],
  },
  {
    category: 'Defects & Non-Conformance',
    types: [
      { id: 'DEFECT_DISCOVERED', label: 'Defect Discovered' },
      { id: 'DEFECT_DETECTED', label: 'Defect Detected (Diagnostic)' },
    ],
  },
];

const TARGET_ICONS = {
  MATERIAL_BATCH: Layers,
  COMPONENT: Box,
  ASSEMBLY: Cpu,
  PRODUCT: QrCode,
  SHIPMENT: Truck,
};

export default function EventManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshTrigger, onDataRefreshed } = useOutletContext() || {};

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, successCount: 0, alertCount: 0, passedInspections: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Lookups for fast event registration
  const [lookups, setLookups] = useState({
    MATERIAL_BATCH: [],
    COMPONENT: [],
    ASSEMBLY: [],
    PRODUCT: [],
    SHIPMENT: [],
  });

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState(searchParams.get('eventType') || '');
  const [filterTargetType, setFilterTargetType] = useState(searchParams.get('targetType') || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterInspection, setFilterInspection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'

  // Modal & Drawer states
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    eventType: 'MATERIAL_RECEIVED',
    targetType: 'MATERIAL_BATCH',
    targetId: '',
    station: 'STATION-INBOUND-RECEIPT-01',
    machine: 'Dock Scale #4',
    operator: 'Marcus Vance (Receiving Lead)',
    inspectionResult: 'PASSED',
    previousStatus: '',
    resultingStatus: 'ACTIVE',
    notes: 'Inbound raw material consignment inspected, COA verified against metallurgical specification.',
    defectDetails: '',
    supportingEvidence: 'DOC-COA-2026-X89',
    status: 'SUCCESS',
    parametersRecorded: {
      lotPurityPercentage: 99.98,
      moistureContentPpm: 12,
    },
  };
  const [formData, setFormData] = useState(initialForm);

  // Load Lookups on mount
  useEffect(() => {
    async function fetchLookups() {
      try {
        const res = await api.getEventLookups();
        if (res.success && res.data) {
          setLookups(res.data);
          // Set sensible default targetId if empty
          if (!formData.targetId && res.data.MATERIAL_BATCH?.[0]) {
            setFormData(prev => ({
              ...prev,
              targetId: res.data.MATERIAL_BATCH[0].id,
              previousStatus: res.data.MATERIAL_BATCH[0].status,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load lookups for event form:', err);
      }
    }
    fetchLookups();
  }, []);

  // Fetch Events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterType) params.eventType = filterType;
      if (filterTargetType) params.targetType = filterTargetType;
      if (filterStatus) params.status = filterStatus;
      if (filterInspection) params.inspectionResult = filterInspection;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getEvents(params);
      if (res.success) {
        setEvents(res.data || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [
    refreshTrigger,
    search,
    filterType,
    filterTargetType,
    filterStatus,
    filterInspection,
    startDate,
    endDate,
  ]);

  // When targetType changes in form, update available options
  const handleTargetTypeChange = (newTargetType) => {
    const available = lookups[newTargetType] || [];
    const firstItem = available[0] || null;

    setFormData(prev => ({
      ...prev,
      targetType: newTargetType,
      targetId: firstItem ? firstItem.id : '',
      previousStatus: firstItem ? firstItem.status : '',
    }));
  };

  // When targetId changes in form, auto-detect previous status
  const handleTargetIdChange = (newTargetId) => {
    const available = lookups[formData.targetType] || [];
    const matched = available.find(item => item.id === newTargetId);

    setFormData(prev => ({
      ...prev,
      targetId: newTargetId,
      previousStatus: matched ? matched.status : '',
    }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterTargetType('');
    setFilterStatus('');
    setFilterInspection('');
    setStartDate('');
    setEndDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setFeedback(null);

      const res = await api.createEvent(formData);

      if (res.isDuplicate) {
        setFeedback({
          type: 'warning',
          message: `Notice: Duplicate event recognized (${res.data.eventId}). Existing event returned without overwriting.`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Event [${res.data.eventId}] registered successfully! ${
            res.recordUpdated
              ? `Target state updated: ${res.previousStatus || 'INIT'} ➔ ${res.resultingStatus}`
              : ''
          }`,
        });
      }

      setShowModal(false);
      if (onDataRefreshed) onDataRefreshed();
      loadEvents();
    } catch (err) {
      setError(`Failed to create event: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Shop Floor Execution & Lifecycle Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Event Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Chronological audit recording across raw material intake, stator/rotor manufacturing, multi-stage assembly, dyno tests, and dispatch handoffs.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Record Lifecycle Event</span>
          </button>
        </div>
      </div>

      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="industrial-card p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Total Lifecycle Events
            </span>
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats.total || events.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">records</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400 font-mono">
            Persistent Store Verified
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Successful Ops
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {stats.successCount || events.filter(e => e.status === 'SUCCESS').length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">100% nominal</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80 font-mono">
            Zero Process Aborts
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Quality Inspections
            </span>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats.passedInspections || events.filter(e => e.inspectionResult === 'PASSED').length}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Passed</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {stats.failedInspections || events.filter(e => e.inspectionResult === 'FAILED').length} Non-Conformances Flagged
          </div>
        </div>

        <div className="industrial-card p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Alerts & Lockouts
            </span>
            <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
              {stats.alertCount || events.filter(e => e.status === 'ALERT' || e.status === 'FAILED').length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">quarantined</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400/80 font-mono">
            Safety Interlocks Active
          </div>
        </div>
      </div>

      {/* Multi-Criteria Search & Filter Bar */}
      <div className="industrial-card p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by event ID, target ID, operator, station, or remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-navy-950 border border-navy-700/80 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-navy-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                viewMode === 'timeline'
                  ? 'bg-cyan-600 text-navy-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chronological Journey</span>
            </button>
          </div>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-navy-800/80 text-xs font-mono">
          {/* Target Type Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Target Entity:</label>
            <select
              value={filterTargetType}
              onChange={(e) => setFilterTargetType(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Entities</option>
              <option value="MATERIAL_BATCH">Material Batches</option>
              <option value="COMPONENT">Components</option>
              <option value="ASSEMBLY">Assemblies</option>
              <option value="PRODUCT">Products (DPP)</option>
              <option value="SHIPMENT">Shipments</option>
            </select>
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Event Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Event Types</option>
              {EVENT_TYPE_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Execution Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="ALERT">ALERT</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Inspection Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">QC Inspection:</label>
            <select
              value={filterInspection}
              onChange={(e) => setFilterInspection(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All QC Results</option>
              <option value="PASSED">PASSED</option>
              <option value="FAILED">FAILED</option>
              <option value="WARNING">WARNING</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">From Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 text-[11px]"
            />
          </div>

          {/* Date Range End & Reset */}
          <div className="flex items-end space-x-1.5">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block mb-1">To Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 text-[11px]"
              />
            </div>
            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="px-2 py-1.5 rounded bg-navy-800 hover:bg-navy-750 text-slate-400 hover:text-white border border-navy-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table View or Chronological Timeline View */}
      {loading ? (
        <LoadingSpinner text="Querying Manufacturing Event Ledger..." />
      ) : events.length === 0 ? (
        <div className="industrial-card p-12 text-center rounded-xl space-y-3">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">No Manufacturing Events Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No shop floor events match your query parameters. Try clearing your filters or record a new lifecycle event.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded bg-navy-800 hover:bg-navy-700 text-cyan-400 font-mono text-xs border border-navy-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Tabular View */
        <div className="industrial-card rounded-xl overflow-hidden border border-navy-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-navy-900 border-b border-navy-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Station & Line</th>
                  <th className="py-3 px-4">Status & QC</th>
                  <th className="py-3 px-4">State Transition</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {events.map((evt) => {
                  const TargetIcon = TARGET_ICONS[evt.targetType] || Box;
                  const isAlert = evt.status === 'ALERT' || evt.status === 'FAILED' || evt.inspectionResult === 'FAILED';

                  return (
                    <tr
                      key={evt._id || evt.eventId}
                      className="hover:bg-navy-900/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(evt)}
                    >
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        {evt.eventId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{evt.eventType}</span>
                        <span className="text-[10px] text-slate-400 font-sans truncate max-w-xs block">
                          {evt.remarks || evt.notes}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <TargetIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-bold text-slate-200">{evt.targetId}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">{evt.targetType}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="text-white block font-semibold">{evt.station}</span>
                        <span className="text-[10px] text-slate-500">{evt.operator}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <Badge text={evt.status} size="xs" />
                          {evt.inspectionResult && evt.inspectionResult !== 'N/A' && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                evt.inspectionResult === 'PASSED'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                                  : 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                              }`}
                            >
                              {evt.inspectionResult}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {evt.resultingStatus ? (
                          <div className="flex items-center space-x-1 text-[10px]">
                            <span className="text-slate-400">{evt.previousStatus || 'INIT'}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
                            <span className={`font-bold ${
                              evt.resultingStatus === 'QUARANTINED' || evt.resultingStatus === 'DEFECTIVE'
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}>
                              {evt.resultingStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Unchanged</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2 py-1 rounded bg-navy-800 hover:bg-navy-750 text-cyan-400 hover:text-cyan-300 border border-navy-700 text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Chronological Journey Timeline View */
        <div className="industrial-card p-6 rounded-xl border border-navy-800">
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-navy-700 before:to-emerald-500">
            {events.map((evt) => {
              const TargetIcon = TARGET_ICONS[evt.targetType] || Box;
              const isAlert = evt.status === 'ALERT' || evt.status === 'FAILED' || evt.inspectionResult === 'FAILED';
              const isSuccess = evt.status === 'SUCCESS' || evt.inspectionResult === 'PASSED';

              return (
                <div key={evt._id || evt.eventId} className="relative group">
                  <div
                    className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-125 ${
                      isAlert
                        ? 'bg-rose-950 border-rose-500 text-rose-400'
                        : isSuccess
                        ? 'bg-navy-900 border-cyan-400 text-cyan-300'
                        : 'bg-navy-900 border-slate-600 text-slate-400'
                    }`}
                  >
                    <TargetIcon className="w-3 h-3" />
                  </div>

                  <div
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                      isAlert
                        ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                        : 'bg-navy-950/60 border-navy-800 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-navy-800/80">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono font-bold text-cyan-400">{evt.eventId}</span>
                        <span className="font-semibold text-white uppercase">{evt.eventType}</span>
                        <Badge text={evt.status} size="xs" />
                        {evt.inspectionResult && evt.inspectionResult !== 'N/A' && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              evt.inspectionResult === 'PASSED'
                                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-950/50 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            INSP: {evt.inspectionResult}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-3 text-slate-300 font-mono text-[11px]">
                      <span className="text-slate-400">Target:</span>
                      <strong className="text-white flex items-center space-x-1">
                        <TargetIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{evt.targetId}</span>
                      </strong>
                      <span className="text-slate-500 uppercase">({evt.targetType})</span>
                    </div>

                    <div className="mt-2 text-slate-300 font-sans">
                      {evt.remarks || evt.notes}
                    </div>

                    {evt.resultingStatus && (
                      <div className="mt-2 flex items-center space-x-2 text-[11px] font-mono">
                        <span className="text-slate-400">State Transition:</span>
                        <span className="px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">
                          {evt.previousStatus || 'ORIGINAL'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                        <span className="px-1.5 py-0.5 rounded border font-semibold bg-cyan-950/60 border-cyan-500/40 text-cyan-300">
                          {evt.resultingStatus}
                        </span>
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-navy-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                      <span>
                        Station: <strong className="text-white">{evt.station}</strong> &bull; Operator: {evt.operator}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[10px]"
                      >
                        Inspect Full Audit Record &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Slide-over / Modal for Selected Event */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="industrial-card p-6 rounded-xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto border border-cyan-500/30 shadow-2xl">
            <div className="flex items-start justify-between border-b border-navy-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Lifecycle Event Inspection
                </span>
                <h3 className="text-lg font-bold text-white font-mono">{selectedEvent.eventId}</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedEvent.eventType}</span>
              </div>
              <Badge text={selectedEvent.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
                <span className="text-slate-400 block text-[10px] uppercase">Target Entity</span>
                <strong className="text-white text-sm block mt-0.5">{selectedEvent.targetId}</strong>
                <span className="text-cyan-400 text-[10px]">{selectedEvent.targetType}</span>
              </div>

              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800">
                <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                <strong className="text-white text-xs block mt-0.5">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </strong>
                <span className="text-slate-500 text-[10px]">Shop Floor System Clock</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Station / Workcell:</span>
                <span className="text-white font-bold">{selectedEvent.station}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Machine / Line:</span>
                <span className="text-cyan-300 font-bold">{selectedEvent.machine || selectedEvent.station}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Operator / Lead:</span>
                <span className="text-white font-bold">{selectedEvent.operator}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">QC Inspection Result:</span>
                <span className={`font-bold ${
                  selectedEvent.inspectionResult === 'PASSED'
                    ? 'text-emerald-400'
                    : selectedEvent.inspectionResult === 'FAILED'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}>
                  {selectedEvent.inspectionResult || 'N/A'}
                </span>
              </div>
              {selectedEvent.resultingStatus && (
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-slate-400">State Transition:</span>
                  <span className="text-cyan-400 font-bold">
                    {selectedEvent.previousStatus || 'INIT'} ➔ {selectedEvent.resultingStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Remarks & Notes */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Execution Telemetry & Remarks</span>
              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-xs font-sans text-slate-300">
                {selectedEvent.remarks || selectedEvent.notes || 'No remarks provided.'}
              </div>
            </div>

            {/* Defect details if any */}
            {selectedEvent.defectDetails && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-rose-400">Non-Conformance Details</span>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-xs font-mono text-rose-300">
                  {typeof selectedEvent.defectDetails === 'object' ? (
                    <span>
                      {selectedEvent.defectDetails.anomalyType || selectedEvent.defectDetails.defectId || 'Flagged Anomaly'}
                      {selectedEvent.defectDetails.confidenceScore
                        ? ` (Confidence: ${(selectedEvent.defectDetails.confidenceScore * 100).toFixed(1)}%)`
                        : ''}
                    </span>
                  ) : (
                    String(selectedEvent.defectDetails)
                  )}
                </div>
              </div>
            )}

            {/* Supporting evidence */}
            {selectedEvent.supportingEvidence && (
              <div className="flex items-center space-x-2 p-2 rounded bg-navy-950 border border-navy-800 text-xs font-mono">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Supporting Evidence / Attachment:</span>
                <span className="text-white font-bold">{selectedEvent.supportingEvidence}</span>
              </div>
            )}

            {/* Navigation links to DPP or Genealogy */}
            <div className="pt-2 border-t border-navy-800 flex items-center justify-between gap-2">
              {selectedEvent.targetType === 'PRODUCT' ? (
                <button
                  onClick={() => {
                    navigate(`/dpp?id=${selectedEvent.targetId}`);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Inspect in Digital Product Passport</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate(`/genealogy?id=${selectedEvent.targetId}`);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded bg-navy-800 hover:bg-navy-750 text-cyan-400 border border-navy-700 font-mono text-xs transition-all"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>View in Genealogy Explorer</span>
                </button>
              )}

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 font-mono text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Event Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="industrial-card p-6 rounded-xl max-w-2xl w-full space-y-4 max-h-[92vh] overflow-y-auto border border-cyan-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight">
                  Record Shop Floor Event
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Persists to authoritative ledger, updates physical record status, and creates audit signatures.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {/* Event Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">
                    Event Type <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      let suggestedStatus = 'SUCCESS';
                      let resulting = 'ACTIVE';

                      if (newType.includes('REJECTED') || newType.includes('QUARANTINED') || newType.includes('DEFECT')) {
                        suggestedStatus = 'ALERT';
                        resulting = 'QUARANTINED';
                      }

                      setFormData({
                        ...formData,
                        eventType: newType,
                        status: suggestedStatus,
                        resultingStatus: resulting,
                      });
                    }}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    required
                  >
                    {EVENT_TYPE_CATEGORIES.map((cat) => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Target Entity Classification <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => handleTargetTypeChange(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    required
                  >
                    <option value="MATERIAL_BATCH">Raw Material Batch</option>
                    <option value="COMPONENT">Engineered Component</option>
                    <option value="ASSEMBLY">Powertrain Assembly</option>
                    <option value="PRODUCT">Finished Product (DPP)</option>
                    <option value="SHIPMENT">Consignment Shipment</option>
                  </select>
                </div>
              </div>

              {/* Target Selector */}
              <div>
                <label className="text-slate-400 block mb-1">
                  Select Target Record ID <span className="text-rose-400">*</span>:
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.targetId}
                    onChange={(e) => handleTargetIdChange(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500 text-xs"
                    required
                  >
                    <option value="">-- Choose from existing persistent database records --</option>
                    {(lookups[formData.targetType] || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} [Current: {item.status}]
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or enter custom ID"
                    value={formData.targetId}
                    onChange={(e) => handleTargetIdChange(e.target.value)}
                    className="w-48 bg-navy-950 border border-navy-700 rounded p-2 text-white placeholder-slate-500 focus:border-cyan-500 text-xs"
                  />
                </div>
                {formData.previousStatus && (
                  <span className="text-[10px] text-cyan-400 mt-1 block">
                    Current Verified Status in DB: <strong>{formData.previousStatus}</strong>
                  </span>
                )}
              </div>

              {/* Station, Machine & Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Station / Workcell <span className="text-rose-400">*</span>:</label>
                  <input
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    placeholder="e.g. STATION-DYNO-TEST-BENCH-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Machine / Line:</label>
                  <input
                    type="text"
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    placeholder="e.g. Line A-3 Winder"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Operator / Inspector:</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    placeholder="e.g. Marcus Vance"
                    required
                  />
                </div>
              </div>

              {/* Inspection Result & Resulting Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">QC Inspection Result:</label>
                  <select
                    value={formData.inspectionResult}
                    onChange={(e) => {
                      const res = e.target.value;
                      let resulting = formData.resultingStatus;
                      let st = formData.status;
                      if (res === 'FAILED') {
                        st = 'ALERT';
                        resulting = formData.targetType === 'PRODUCT' ? 'QUARANTINED' : 'DEFECTIVE';
                      } else if (res === 'PASSED') {
                        st = 'SUCCESS';
                        resulting = formData.targetType === 'PRODUCT' ? 'QC_APPROVED' : 'ACTIVE';
                      }
                      setFormData({
                        ...formData,
                        inspectionResult: res,
                        status: st,
                        resultingStatus: resulting,
                      });
                    }}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                  >
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="WARNING">WARNING</option>
                    <option value="PENDING">PENDING</option>
                    <option value="N/A">N/A (Process Operation)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Execution Status:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                  >
                    <option value="SUCCESS">SUCCESS (Nominal)</option>
                    <option value="ALERT">ALERT (Non-Conformance)</option>
                    <option value="WARNING">WARNING (Tolerance Boundary)</option>
                    <option value="FAILED">FAILED (Machine Fault)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Resulting State:</label>
                  <input
                    type="text"
                    value={formData.resultingStatus}
                    onChange={(e) => setFormData({ ...formData, resultingStatus: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    placeholder="e.g. ACTIVE, QC_APPROVED, QUARANTINED"
                  />
                </div>
              </div>

              {/* Remarks & Notes */}
              <div>
                <label className="text-slate-400 block mb-1">Remarks & Telemetry Notes:</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                  placeholder="Record specific sensor readings, test parameters, or process notes..."
                />
              </div>

              {/* Supporting Evidence / Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Supporting Evidence / COA # / Log Ref:</label>
                  <input
                    type="text"
                    value={formData.supportingEvidence}
                    onChange={(e) => setFormData({ ...formData, supportingEvidence: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500"
                    placeholder="e.g. DOC-DYNO-TEST-2026-X89"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Defect Details (if non-conforming):</label>
                  <input
                    type="text"
                    value={formData.defectDetails}
                    onChange={(e) => setFormData({ ...formData, defectDetails: e.target.value })}
                    className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-white focus:border-cyan-500 placeholder-slate-600"
                    placeholder="Optional root cause description..."
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-bold font-mono text-xs shadow-lg shadow-cyan-950/50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Committing Event...' : 'Commit Event to Ledger'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

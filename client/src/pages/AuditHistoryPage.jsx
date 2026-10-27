import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Hash,
  Lock,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Layers,
  Box,
  Cpu,
  QrCode,
  Truck,
  AlertOctagon,
  Activity,
  CheckCircle2,
  XCircle,
  FileText,
  Info,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';

const ENTITY_ICONS = {
  Product: QrCode,
  MaterialBatch: Layers,
  Component: Box,
  Assembly: Cpu,
  Shipment: Truck,
  Defect: AlertOctagon,
  Event: Activity,
};

export default function AuditHistoryPage() {
  const navigate = useNavigate();
  const { refreshTrigger, onDataRefreshed } = useOutletContext() || {};

  const [audits, setAudits] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tamperedOnly, setTamperedOnly] = useState(false);

  // Expanded card state for diff viewer
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (auditId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [auditId]: !prev[auditId],
    }));
  };

  const loadAudits = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (actionFilter !== 'ALL') params.actionType = actionFilter;
      if (entityFilter !== 'ALL') params.entityType = entityFilter;
      if (userFilter.trim()) params.user = userFilter.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search.trim()) params.search = search.trim();
      if (tamperedOnly) params.tamperedOnly = true;

      const res = await api.getAuditRecords(params);
      if (res.success) {
        setAudits(res.data || []);
        if (res.verification) {
          setVerification(res.verification);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, [
    refreshTrigger,
    search,
    actionFilter,
    entityFilter,
    userFilter,
    startDate,
    endDate,
    tamperedOnly,
  ]);

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      setError(null);
      const res = await api.verifyAuditChain();
      if (res.success && res.data) {
        setVerification(res.data);
        if (res.data.isValid) {
          setFeedback({
            type: 'success',
            message: `Cryptographic audit chain fully verified! All ${res.data.totalRecords} blocks validated against SHA-256 hashes.`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: `INTEGRITY FAILURE: Tampering detected at block #${res.data.firstMismatch?.sequenceNumber || 'N/A'} (${res.data.firstMismatch?.auditId}).`,
          });
        }
      }
    } catch (err) {
      setError(`Verification query failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      setLoading(true);
      setError(null);
      const targetRecord = audits.length > 0 ? audits[Math.min(2, audits.length - 1)] : null;
      const res = await api.simulateAuditTamper({
        auditId: targetRecord?.auditId,
        fieldToTamper: 'summary',
        tamperedValue: 'UNAUTHORIZED_ALTERATION: Data modified by database intruder without updating SHA-256 signature.',
      });

      if (res.success) {
        setFeedback({
          type: 'warning',
          message: `Controlled Test Active: Modified record ${res.tamperedRecord?.auditId}. Hash chain recomputation now immediately flags INTEGRITY FAILURE.`,
        });
        if (res.verificationResult) setVerification(res.verificationResult);
        await loadAudits();
      }
    } catch (err) {
      setError(`Tamper simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreTamper = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.restoreAuditTamper();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Controlled Test Ended: Restored record ${res.restoredRecord?.auditId} back to pristine state. Hash chain returns to VERIFIED.`,
        });
        if (res.verificationResult) setVerification(res.verificationResult);
        await loadAudits();
      }
    } catch (err) {
      setError(`Restore failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setUserFilter('');
    setStartDate('');
    setEndDate('');
    setTamperedOnly(false);
  };

  const isChainValid = verification?.isValid !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-gold-400 mb-1">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Cryptographic Hash-Linked Audit Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Audit History & Integrity Verification
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Chronological record of who created or modified manufacturing records, previous vs. new state snapshots, and server-side SHA-256 chain verification.
          </p>
        </div>

        {/* Live Integrity Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Recomputing Hashes...' : 'Verify Hash Chain'}</span>
          </button>

          {verification?.isValid === false ? (
            <button
              onClick={handleRestoreTamper}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Ledger State</span>
            </button>
          ) : (
            <button
              onClick={handleSimulateTamper}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-750 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 font-mono text-xs transition-all"
              title="Controlled test for hackathon evaluation: alters an old record to demonstrate detection"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Tamper Test</span>
            </button>
          )}
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

      {/* Prominent Verification Status Banner */}
      {verification && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            isChainValid
              ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/60 text-rose-200 shadow-lg shadow-rose-950/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-3">
              <div
                className={`p-2 rounded-lg border ${
                  isChainValid
                    ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                    : 'bg-rose-950 border-rose-500/70 text-rose-400 animate-pulse'
                }`}
              >
                {isChainValid ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded border uppercase ${
                      isChainValid
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
                    }`}
                  >
                    STATUS: {verification.status || (isChainValid ? 'VERIFIED' : 'INTEGRITY FAILURE')}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {verification.verifiedCount} / {verification.totalRecords} Blocks Validated
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-300 font-sans">
                  {isChainValid
                    ? 'All sequential SHA-256 block digests match. No unauthorized modifications detected.'
                    : `INTEGRITY FAILURE DETECTED: Tampered or corrupted data detected at Block #${verification.firstMismatch?.sequenceNumber || 'N/A'}.`}
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
              <div>Checked: {new Date(verification.verifiedAt || Date.now()).toLocaleTimeString()}</div>
              {verification.latestHash && (
                <div className="text-[10px] text-slate-500 truncate max-w-xs">
                  Root: {verification.latestHash.slice(0, 16)}...
                </div>
              )}
            </div>
          </div>

          {/* First detected mismatch detail drawer */}
          {!isChainValid && verification.firstMismatch && (
            <div className="mt-3 pt-3 border-t border-rose-500/30 font-mono text-xs space-y-1.5 bg-rose-950/40 p-3 rounded-lg">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span>First Detected Mismatch:</span>
                <span>Audit ID: {verification.firstMismatch.auditId}</span>
              </div>
              <p className="text-[11px] text-rose-200 font-sans">
                {verification.firstMismatch.reason}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] pt-1 text-slate-300">
                <div className="p-2 rounded bg-navy-950/80 border border-rose-500/30 truncate">
                  <span className="text-slate-400 block">Expected Hash Signature:</span>
                  <span className="text-cyan-300">{verification.firstMismatch.expectedHash || verification.firstMismatch.expectedPreviousHash}</span>
                </div>
                <div className="p-2 rounded bg-navy-950/80 border border-rose-500/30 truncate">
                  <span className="text-slate-400 block">Recomputed / Actual Hash:</span>
                  <span className="text-rose-400 font-bold">{verification.firstMismatch.actualRecomputedHash || verification.firstMismatch.actualPreviousHash}</span>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleRestoreTamper}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow"
                >
                  Restore Pristine Value & Re-verify
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Architecture & Disclaimer Note */}
      <div className="p-3 bg-navy-950/60 border border-navy-800 rounded-xl text-xs text-slate-400 font-mono flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-slate-200">Tamper-Evident Hash Chain Architecture:</strong> Every audit entry binds to its predecessor via SHA-256 cryptographic linkage:
          <span className="text-cyan-300 block text-[11px]">
            H(Block N) = SHA-256( H(Block N-1) || auditId || sequence || timestamp || action || entity || actor || canonical(prevValues) || canonical(newValues) )
          </span>
          <span className="text-[11px] text-slate-500 block">
            Note: Cryptographic hash chaining provides detection of unauthorized alterations; it does not replace database access controls or prevent a privileged administrator from rewriting the entire database.
          </span>
        </div>
      </div>

      {/* Multi-Criteria Filters Toolbar */}
      <div className="industrial-card p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Audit ID, Entity ID, Actor, Hash, or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Tamper Filter Toggle */}
          <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer select-none shrink-0 bg-navy-950 px-3 py-2 rounded-lg border border-navy-800">
            <input
              type="checkbox"
              checked={tamperedOnly}
              onChange={(e) => setTamperedOnly(e.target.checked)}
              className="rounded bg-navy-900 border-navy-700 text-rose-500 focus:ring-0"
            />
            <span>Show Tampered Only</span>
          </label>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-navy-800/80 text-xs font-mono">
          {/* Entity Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Entity Type:</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">All Entities</option>
              <option value="Product">Product</option>
              <option value="MaterialBatch">MaterialBatch</option>
              <option value="Component">Component</option>
              <option value="Assembly">Assembly</option>
              <option value="Shipment">Shipment</option>
              <option value="Defect">Defect</option>
              <option value="Event">Event</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Action Type:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="DEFECT_FLAGGED">DEFECT_FLAGGED</option>
              <option value="QUARANTINE_EXECUTED">QUARANTINE_EXECUTED</option>
              <option value="PASSPORT_VERIFIED">PASSPORT_VERIFIED</option>
            </select>
          </div>

          {/* User / Actor */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Actor / User:</label>
            <input
              type="text"
              placeholder="e.g. Vance, Tyler"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">From Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-gold-500 text-[11px]"
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
                className="w-full bg-navy-950 border border-navy-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:border-gold-500 text-[11px]"
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

      {/* Main Audit Records List */}
      {loading ? (
        <LoadingSpinner text="Validating Cryptographic Ledger Signatures..." />
      ) : audits.length === 0 ? (
        <div className="industrial-card p-12 text-center rounded-xl space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">No Audit Records Match Query</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or resetting filters to view all historical entries.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded bg-navy-800 hover:bg-navy-700 text-cyan-400 font-mono text-xs border border-navy-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Displaying {audits.length} Sequential Audit Blocks</span>
            <span>Immutable & Append-Only</span>
          </div>

          {audits.map((aud, idx) => {
            const EntityIcon = ENTITY_ICONS[aud.entityType] || Box;
            const isTampered = aud.tamperedForDemo;
            const isExpanded = expandedCards[aud.auditId];
            const prevVals = aud.previousValues || aud.previousState;
            const newVals = aud.newValues || aud.newState;
            const hasDiff = prevVals || newVals;

            return (
              <div
                key={aud._id || aud.auditId}
                className={`industrial-card p-4 rounded-xl border transition-all text-xs font-mono ${
                  isTampered
                    ? 'border-rose-500/70 bg-rose-950/20 shadow-lg shadow-rose-950/20'
                    : 'border-navy-800 hover:border-gold-500/40 bg-navy-900/60'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-navy-800/80">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700 text-slate-400 font-bold">
                      #{aud.sequenceNumber || (audits.length - idx)}
                    </span>
                    <span className="font-bold text-gold-400">{aud.auditId}</span>
                    <Badge text={aud.actionType} size="xs" />

                    <div className="flex items-center space-x-1.5 text-white font-semibold">
                      <EntityIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{aud.entityType}:</span>
                      {aud.entityType === 'Product' ? (
                        <Link
                          to={`/dpp?id=${aud.entityId}`}
                          className="text-cyan-400 hover:text-cyan-300 underline flex items-center space-x-0.5"
                        >
                          <span>{aud.entityId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ) : (
                        <span className="text-slate-200">{aud.entityId}</span>
                      )}
                    </div>

                    {isTampered && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 border border-rose-500 text-rose-300">
                        TAMPERED DEMO BLOCK
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(aud.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Summary / Event Description */}
                <p className="text-slate-300 font-sans mt-2 text-xs">
                  {aud.summary || aud.description}
                </p>

                {/* Cryptographic Linkage Block */}
                <div className="mt-2.5 p-2 rounded-lg bg-navy-950/80 border border-navy-850 space-y-1 text-[11px] text-slate-400">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 truncate">
                    <div className="flex items-center space-x-1 truncate max-w-md">
                      <span className="text-slate-500 uppercase text-[10px]">Prev Hash:</span>
                      <span className="text-slate-400 truncate">{aud.previousRecordHash || '00000000...'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gold-300 truncate max-w-md">
                      <Hash className="w-3 h-3 text-gold-400 shrink-0" />
                      <span className="text-slate-500 uppercase text-[10px]">Block Hash:</span>
                      <span className="truncate font-bold">{aud.currentRecordHash || aud.hashSignature}</span>
                    </div>
                  </div>
                </div>

                {/* Diff Viewer Toggle */}
                {hasDiff && (
                  <div className="mt-2 pt-2 border-t border-navy-800/60 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(aud.auditId)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono transition-colors"
                    >
                      <span>{isExpanded ? 'Hide State Snapshot Diff' : 'Inspect Previous vs New Values'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <span className="text-[10px] text-slate-500">
                      Actor: <strong className="text-slate-300">{aud.actor}</strong> ({aud.ipAddress || '127.0.0.1'})
                    </span>
                  </div>
                )}

                {/* Collapsible Diff / State Inspector */}
                {isExpanded && hasDiff && (
                  <div className="mt-2 p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-2 text-[11px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 uppercase text-[10px] block mb-1">
                          Previous State Snapshot:
                        </span>
                        <pre className="p-2 rounded bg-navy-900 border border-navy-800 text-slate-400 overflow-x-auto text-[10px] max-h-40">
                          {prevVals ? JSON.stringify(prevVals, null, 2) : 'null (Genesis state / Initial creation)'}
                        </pre>
                      </div>

                      <div>
                        <span className="text-emerald-400 uppercase text-[10px] block mb-1">
                          New Value / Updated State:
                        </span>
                        <pre className="p-2 rounded bg-navy-900 border border-navy-800 text-emerald-300 overflow-x-auto text-[10px] max-h-40">
                          {newVals ? JSON.stringify(newVals, null, 2) : 'null'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

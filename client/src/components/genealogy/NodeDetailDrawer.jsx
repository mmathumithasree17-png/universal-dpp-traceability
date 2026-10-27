import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Layers,
  Box,
  Cpu,
  QrCode,
  Truck,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../common/Badge';

const TYPE_CONFIG = {
  BATCH: {
    label: 'Raw Material Batch',
    icon: Layers,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/20',
  },
  COMPONENT: {
    label: 'Engineered Component',
    icon: Box,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/20',
  },
  ASSEMBLY: {
    label: 'Powertrain Assembly Operation',
    icon: Cpu,
    color: 'text-gold-400',
    border: 'border-gold-500/40',
    bg: 'bg-gold-950/20',
  },
  PRODUCT: {
    label: 'Finished Product Passport',
    icon: QrCode,
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-950/20',
  },
  SHIPMENT: {
    label: 'Customer Consignment',
    icon: Truck,
    color: 'text-indigo-400',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-950/20',
  },
};

export default function NodeDetailDrawer({
  selectedNode,
  allNodes = [],
  allEdges = [],
  onClose,
  onSelectNode,
}) {
  const navigate = useNavigate();

  if (!selectedNode) return null;

  const cfg = TYPE_CONFIG[selectedNode.type] || TYPE_CONFIG.PRODUCT;
  const Icon = cfg.icon;
  const isQ = selectedNode.isQuarantined;

  // Find immediate parent nodes (nodes pointing to this node)
  const incomingEdges = allEdges.filter(e => e.target === selectedNode.id);
  const parentNodes = incomingEdges
    .map(e => allNodes.find(n => n.id === e.source))
    .filter(Boolean);

  // Find immediate child nodes (nodes this node points to)
  const outgoingEdges = allEdges.filter(e => e.source === selectedNode.id);
  const childNodes = outgoingEdges
    .map(e => allNodes.find(n => n.id === e.target))
    .filter(Boolean);

  // Format date if present
  const recordDate = selectedNode.data?.receivedDate ||
    selectedNode.data?.productionDate ||
    selectedNode.data?.assembledAt ||
    selectedNode.data?.manufacturedDate ||
    selectedNode.data?.dispatchDate;

  return (
    <div className="fixed top-16 right-0 bottom-0 w-full sm:w-96 z-40 bg-navy-900/95 backdrop-blur-xl border-l border-navy-700/80 shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-navy-800 flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              {cfg.label}
            </span>
            <h2 className="text-sm font-bold font-mono text-white truncate max-w-[200px]">
              {selectedNode.id}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Status & Quarantine Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950 border border-navy-800">
          <span className="text-slate-400">Lifecycle Status:</span>
          <Badge text={selectedNode.status} />
        </div>

        {isQ && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>DEFECT / QUARANTINE CONTAINMENT</span>
            </div>
            <p className="text-[11px] font-sans text-rose-200/90 leading-tight">
              {selectedNode.data?.quarantineReason || selectedNode.data?.notes || 'Connected to defective material batch chain.'}
            </p>
          </div>
        )}

        {/* Node Name / Description */}
        <div className="p-3 rounded-lg bg-navy-950/60 border border-navy-800 space-y-1">
          <span className="text-[10px] uppercase text-slate-500 block">Designation:</span>
          <p className="text-white font-sans text-xs font-semibold leading-snug">
            {selectedNode.label}
          </p>
          {recordDate && (
            <p className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Logged: {new Date(recordDate).toLocaleString()}</span>
            </p>
          )}
        </div>

        {/* Connected Upstream Parents */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase text-slate-400 flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3 text-cyan-400" />
            <span>Upstream Parent Entities ({parentNodes.length})</span>
          </span>

          {parentNodes.length === 0 ? (
            <div className="p-2.5 rounded bg-navy-950 border border-navy-850 text-slate-500 text-[11px]">
              Root provenance tier (No upstream parents).
            </div>
          ) : (
            <div className="space-y-1.5">
              {parentNodes.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectNode(p)}
                  className="p-2 rounded bg-navy-950 border border-navy-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between text-[11px]"
                >
                  <div className="truncate mr-2">
                    <span className="font-bold text-cyan-300 block truncate">{p.id}</span>
                    <span className="text-slate-400 text-[10px] truncate block font-sans">{p.label}</span>
                  </div>
                  <Badge text={p.type} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected Downstream Children */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase text-slate-400 flex items-center space-x-1">
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            <span>Downstream Child Entities ({childNodes.length})</span>
          </span>

          {childNodes.length === 0 ? (
            <div className="p-2.5 rounded bg-navy-950 border border-navy-850 text-slate-500 text-[11px]">
              Final tier (No downstream children).
            </div>
          ) : (
            <div className="space-y-1.5">
              {childNodes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectNode(c)}
                  className="p-2 rounded bg-navy-950 border border-navy-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between text-[11px]"
                >
                  <div className="truncate mr-2">
                    <span className="font-bold text-cyan-300 block truncate">{c.id}</span>
                    <span className="text-slate-400 text-[10px] truncate block font-sans">{c.label}</span>
                  </div>
                  <Badge text={c.type} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Properties Table */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase text-slate-400 block">Record Telemetry & Specs:</span>
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 space-y-1.5 text-[11px]">
            {Object.entries(selectedNode.data || {}).map(([k, v]) => {
              if (v === null || v === undefined || typeof v === 'object') return null;
              return (
                <div key={k} className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 uppercase text-[10px] truncate">{k}:</span>
                  <span className="text-slate-200 text-right truncate max-w-[180px] font-bold">{String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Link Buttons */}
        <div className="pt-2 border-t border-navy-800 space-y-2">
          {selectedNode.type === 'PRODUCT' && (
            <button
              onClick={() => navigate(`/dpp?id=${selectedNode.id}`)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-bold transition-all text-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Inspect Full DPP Certificate</span>
            </button>
          )}

          {selectedNode.type === 'BATCH' && (
            <button
              onClick={() => navigate(`/defects`)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Evaluate Blast Radius</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/traceability`)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open in Bi-Directional Trace</span>
          </button>
        </div>
      </div>
    </div>
  );
}

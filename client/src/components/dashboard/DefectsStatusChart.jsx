import React from 'react';
import { ShieldAlert, AlertOctagon } from 'lucide-react';

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    color: 'bg-rose-500',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
  },
  INVESTIGATING: {
    label: 'Investigating',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
  },
  CONTAINED: {
    label: 'Contained',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
  },
};

export default function DefectsStatusChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Defect Counts by Status
          </h3>
        </div>
        <span className="text-[11px] font-mono text-rose-700 font-semibold">
          Total Flagged: {total}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
        {/* Multi-segment distribution bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
          {total === 0 ? (
            <div className="w-full h-full bg-emerald-500/30" title="Zero defects active" />
          ) : (
            data.map((item) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
              const pct = (item.count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={item.status}
                  style={{ width: `${pct}%` }}
                  className={`${cfg.color} h-full transition-all duration-300 relative group`}
                  title={`${cfg.label}: ${item.count} (${pct.toFixed(0)}%)`}
                />
              );
            })
          )}
        </div>

        {/* Status Breakdown Legend & Counts */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {data.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={item.status}
                className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  <span className="text-slate-700">{cfg.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold ${cfg.textColor}`}>{item.count}</span>
                  <span className="text-[10px] text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

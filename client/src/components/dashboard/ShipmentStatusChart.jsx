import React from 'react';
import { Truck, CheckCircle2, Navigation, AlertTriangle, PackageCheck } from 'lucide-react';

const SHIPMENT_CONFIG = {
  PREPARING: {
    label: 'Preparing',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-400',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'bg-sky-500',
    textColor: 'text-sky-400',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'bg-cyan-500',
    textColor: 'text-cyan-300',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
  },
  HELD_RECALL: {
    label: 'Held Recall',
    color: 'bg-rose-500',
    textColor: 'text-rose-400',
  },
};

export default function ShipmentStatusChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Shipment Status Distribution
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
          Total Consignments: {total}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
        {/* Horizontal Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
          {total === 0 ? (
            <div className="w-full h-full bg-slate-300/40" />
          ) : (
            data.map((item) => {
              const cfg = SHIPMENT_CONFIG[item.status] || SHIPMENT_CONFIG.PREPARING;
              const pct = (item.count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={item.status}
                  style={{ width: `${pct}%` }}
                  className={`${cfg.color} h-full transition-all duration-300`}
                  title={`${cfg.label}: ${item.count} (${pct.toFixed(0)}%)`}
                />
              );
            })
          )}
        </div>

        {/* Breakdown Items */}
        <div className="space-y-2 text-xs font-mono">
          {data.map((item) => {
            const cfg = SHIPMENT_CONFIG[item.status] || SHIPMENT_CONFIG.PREPARING;
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
            return (
              <div key={item.status} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  <span className="text-slate-700">{cfg.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-full ${cfg.color}`} />
                  </div>
                  <span className={`font-bold ${cfg.textColor} w-6 text-right`}>{item.count}</span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

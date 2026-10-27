import React from 'react';
import { Layers, Box, Cpu, QrCode, Truck, AlertTriangle } from 'lucide-react';

export default function GenealogyLegend({ className = '' }) {
  return (
    <div className={`p-3 bg-navy-950/80 rounded-xl border border-navy-800 backdrop-blur-md text-[11px] font-mono flex flex-wrap items-center gap-4 ${className}`}>
      <span className="text-slate-400 uppercase tracking-wider font-semibold">Tiers:</span>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-slate-300">T1: Material Batch</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
        <Box className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-300">T2: Component</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />
        <Cpu className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-slate-300">T3: Assembly</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
        <QrCode className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-slate-300">T4: Finished Product</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
        <Truck className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-slate-300">T5: Shipment</span>
      </div>

      <div className="flex items-center space-x-1.5 border-l border-navy-700 pl-3">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-rose-300 font-semibold">Quarantined / Defective Chain</span>
      </div>
    </div>
  );
}

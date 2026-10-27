import React from 'react';

const variantClasses = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QC_APPROVED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  SHIPPED: 'bg-sky-50 text-sky-700 border-sky-200',
  DELIVERED: 'bg-teal-50 text-teal-700 border-teal-200',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MANUFACTURED: 'bg-blue-50 text-blue-700 border-blue-200',
  AVAILABLE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ASSEMBLED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  ALERT: 'bg-rose-50 text-rose-700 border-rose-200',
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
  DEFECTIVE: 'bg-rose-50 text-rose-700 border-rose-200',
  QUARANTINED: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
  CONTAINED: 'bg-purple-50 text-purple-700 border-purple-200',
  DEFAULT: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Badge({ text, variant, size = 'sm', className = '' }) {
  const norm = variant ? variant.toUpperCase() : (text ? String(text).toUpperCase() : 'DEFAULT');
  const cls = variantClasses[norm] || variantClasses.DEFAULT;
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded-full border tracking-wide uppercase ${cls} ${sizeCls} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {text || norm}
    </span>
  );
}

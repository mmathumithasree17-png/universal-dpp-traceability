import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan', badgeText }) {
  const colorMap = {
    cyan: {
      border: 'hover:border-cyan-400 shadow-xs hover:shadow-md',
      iconBg: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      text: 'text-cyan-700',
    },
    gold: {
      border: 'hover:border-amber-400 shadow-xs hover:shadow-md',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      text: 'text-amber-700',
    },
    rose: {
      border: 'hover:border-rose-400 shadow-xs hover:shadow-md',
      iconBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      text: 'text-rose-700',
    },
    emerald: {
      border: 'hover:border-emerald-400 shadow-xs hover:shadow-md',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      text: 'text-emerald-700',
    },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className={`industrial-card p-5 rounded-2xl border border-slate-200 bg-white transition-all duration-200 ${c.border} relative overflow-hidden group shadow-xs`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">{title}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">{value}</h3>
            {badgeText && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${c.iconBg}`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-sans">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.iconBg} group-hover:scale-105 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

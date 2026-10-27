import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function AlertBanner({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const styles = {
    info: {
      bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
      icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-lg border backdrop-blur-md text-sm ${current.bg} ${className}`}>
      <div className="flex items-center space-x-2.5">
        {current.icon}
        <span className="font-sans font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

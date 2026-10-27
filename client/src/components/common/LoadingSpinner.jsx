import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Querying Distributed Ledger...', size = 'md' }) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="relative">
        <Loader2 className={`${iconSizes[size]} text-cyan animate-spin`} />
        <div className="absolute inset-0 blur-md bg-cyan-500/30 rounded-full animate-pulse" />
      </div>
      {text && (
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

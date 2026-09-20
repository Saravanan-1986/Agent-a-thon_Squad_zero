import React from 'react';
import { STATE_LABELS, STATE_COLORS } from './stateMapper';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase().replace(/\s+/g, '_');

  // Severity fallbacks
  if (normalized === 'HIGH' || normalized === 'CRITICAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-[#FEE4E2] text-[#B42318] border-[#FECDCA] dark:bg-[#F04438]/20 dark:text-[#F87171] dark:border-[#F04438]/30 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-[#F04438] animate-pulse" />
        High Priority
      </span>
    );
  }
  if (normalized === 'MEDIUM') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-[#FEF6E7] text-[#B54708] border-[#FDECAB] dark:bg-[#F79009]/20 dark:text-[#FBBF24] dark:border-[#F79009]/30 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-[#F79009]" />
        Medium Priority
      </span>
    );
  }
  if (normalized === 'LOW') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        Low Priority
      </span>
    );
  }

  const colors = STATE_COLORS[normalized] || {
    bg: 'bg-slate-100 dark:bg-white/10',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-white/10',
    dot: 'bg-slate-400',
  };

  const label = STATE_LABELS[normalized] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

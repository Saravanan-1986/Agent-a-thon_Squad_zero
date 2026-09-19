import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase().replace(/\s+/g, '_');

  const statusConfig = {
    // 12 Debt Lifecycle States
    CLEAR: {
      label: 'Clear',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    SUSPECTED: {
      label: 'Suspected',
      bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    CONFIRMED_DEBT: {
      label: 'Confirmed Debt',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    CONFIRMED: {
      label: 'Confirmed Debt',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    INTERVENTION_PROPOSED: {
      label: 'Intervention Proposed',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
      dot: 'bg-indigo-500',
    },
    MENTOR_REVIEW: {
      label: 'Mentor Review',
      bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
      dot: 'bg-purple-500',
    },
    IN_INTERVENTION: {
      label: 'In Intervention',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
      dot: 'bg-blue-500 animate-pulse',
    },
    FOLLOW_UP: {
      label: 'Follow-Up',
      bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
      dot: 'bg-sky-500',
    },
    VERIFYING: {
      label: 'Verifying Evidence',
      bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
      dot: 'bg-cyan-500 animate-pulse',
    },
    REPAID: {
      label: 'Repaid',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    FAILED: {
      label: 'Adaptation Required',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    },
    ESCALATED: {
      label: 'Escalated to Mentor',
      bg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
      dot: 'bg-orange-500',
    },
    REGRESSED: {
      label: 'Regressed',
      bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
      dot: 'bg-rose-600',
    },

    // Severity levels
    HIGH: {
      label: 'High Severity',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    },
    MEDIUM: {
      label: 'Medium Severity',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    LOW: {
      label: 'Low Severity',
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const config = statusConfig[normalized] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

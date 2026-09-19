import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase().replace(/\s+/g, '_');

  const statusConfig = {
    // 12 Debt Lifecycle States
    CLEAR: {
      label: 'Clear',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      ping: false,
    },
    SUSPECTED: {
      label: 'Suspected',
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      ping: true,
    },
    CONFIRMED_DEBT: {
      label: 'Confirmed Debt',
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-glow-rose',
      dot: 'bg-rose-500',
      ping: true,
    },
    CONFIRMED: {
      label: 'Confirmed Debt',
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40',
      dot: 'bg-rose-500',
      ping: true,
    },
    INTERVENTION_PROPOSED: {
      label: 'Intervention Proposed',
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      dot: 'bg-indigo-500',
      ping: false,
    },
    MENTOR_REVIEW: {
      label: 'Mentor Review',
      bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
      dot: 'bg-purple-500',
      ping: true,
    },
    IN_INTERVENTION: {
      label: 'In Intervention',
      bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40 shadow-glow-sm',
      dot: 'bg-blue-500',
      ping: true,
    },
    FOLLOW_UP: {
      label: 'Follow-Up',
      bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
      dot: 'bg-sky-500',
      ping: false,
    },
    VERIFYING: {
      label: 'Verifying Evidence',
      bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/40 shadow-glow-sm',
      dot: 'bg-cyan-500',
      ping: true,
    },
    REPAID: {
      label: 'Repaid',
      bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-glow-emerald',
      dot: 'bg-emerald-500',
      ping: false,
    },
    FAILED: {
      label: 'Adaptation Required',
      bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      ping: true,
    },
    ESCALATED: {
      label: 'Escalated to Mentor',
      bg: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/40',
      dot: 'bg-orange-500',
      ping: true,
    },
    REGRESSED: {
      label: 'Regressed',
      bg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-600/40',
      dot: 'bg-rose-600',
      ping: true,
    },

    // Severity levels
    HIGH: {
      label: 'High Severity',
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-glow-rose',
      dot: 'bg-rose-500',
      ping: true,
    },
    CRITICAL: {
      label: 'Critical Severity',
      bg: 'bg-rose-600/20 text-rose-800 dark:text-rose-300 border-rose-500 shadow-glow-rose',
      dot: 'bg-rose-500',
      ping: true,
    },
    MEDIUM: {
      label: 'Medium Severity',
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      ping: false,
    },
    LOW: {
      label: 'Low Severity',
      bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400',
      ping: false,
    },
  };

  const config = statusConfig[normalized] || {
    label: status,
    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    dot: 'bg-slate-400',
    ping: false,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md transition-all ${config.bg} ${className}`}>
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}

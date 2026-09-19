import React from 'react';
import { motion } from 'framer-motion';

export default function Metric({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendDirection = 'up',
  statusColor = 'blue',
  className = '',
}) {
  const colorMap = {
    blue: {
      text: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
      glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]',
      bar: 'bg-gradient-to-r from-blue-600 to-indigo-500',
    },
    amber: {
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30',
      glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    emerald: {
      text: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
      glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    rose: {
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30',
      glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]',
      bar: 'bg-gradient-to-r from-rose-500 to-red-500',
    },
    purple: {
      text: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30',
      glow: 'shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]',
      bar: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    },
  };

  const currentTheme = colorMap[statusColor] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`glass-card p-5 relative overflow-hidden group ${className}`}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${currentTheme.bar} opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${currentTheme.bg} ${currentTheme.glow} transition-transform group-hover:scale-110`}>
            <Icon className={`w-4 h-4 ${currentTheme.text}`} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-sans">{value}</span>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trendDirection === 'down' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{subtext}</p>
      )}
    </motion.div>
  );
}

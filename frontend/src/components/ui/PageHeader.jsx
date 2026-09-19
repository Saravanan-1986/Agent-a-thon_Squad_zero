import React from 'react';
import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  subtitle,
  category = 'Overview',
  actions,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative mb-7 pb-5 border-b border-obsidian-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="relative z-10">
        {category && (
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-widest text-cyber-400 mb-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-500 animate-pulse" />
            <span className="text-slate-400">Knowledge Debt Engine</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyber-400 bg-cyber-500/10 px-2 py-0.5 rounded border border-cyber-500/20">{category}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white flex items-center gap-3">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-400 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          {actions}
        </div>
      )}

      {/* Ambient bottom glow subtle accent */}
      <div className="absolute -bottom-px left-0 w-32 h-[2px] bg-gradient-to-r from-cyber-500 via-indigo-500 to-transparent" />
    </motion.div>
  );
}


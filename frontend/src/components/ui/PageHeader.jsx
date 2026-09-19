import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  category = 'Overview',
  actions,
  className = '',
}) {
  return (
    <div className={`mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
      <div>
        {category && (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <span>Knowledge Debt Engine</span>
            <span>/</span>
            <span>{category}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function SummaryChips({
  items = [],
  className = '',
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {items.map((item, index) => {
        const text = typeof item === 'string' ? item : item.text;
        const variant = typeof item === 'object' ? item.variant : 'default';

        const variantStyles = {
          default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          danger: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          info: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          success: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        };

        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${variantStyles[variant] || variantStyles.default}`}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}

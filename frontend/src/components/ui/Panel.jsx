import React from 'react';

export default function Panel({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  noPadding = false,
  ...props
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xs transition-colors ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between px-5 py-4 ${headerBorder ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

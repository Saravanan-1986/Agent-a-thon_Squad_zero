import React from 'react';
import { motion } from 'framer-motion';

/**
 * Panel — white/navy card with optional header.
 * Uses only standard Tailwind + hex literals for dark mode.
 */
export default function Panel({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  noPadding = false,
  animate = true,
  padding = 'p-6',
  ...props
}) {
  const content = (
    <div
      className={[
        'rounded-xl',
        'bg-white dark:bg-[#161b27]',
        'border border-gray-200 dark:border-[#21262d]',
        'shadow-sm',
        'overflow-hidden',
        className,
      ].join(' ')}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={[
            'flex items-center justify-between px-5 py-4',
            headerBorder
              ? 'border-b border-gray-100 dark:border-[#21262d] bg-gray-50/70 dark:bg-[#1c2333]/50'
              : '',
          ].join(' ')}
        >
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : padding}>{children}</div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {content}
    </motion.div>
  );
}

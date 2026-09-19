/**
 * Design System tokens — use these in all components.
 * All values map to standard Tailwind classes (no custom tokens).
 *
 * LIGHT:  white / gray-50 surfaces, gray-900 text, blue-600 accent
 * DARK:   #0d1117 / #161b27 / #1c2333 surfaces, slate-200 text, blue-500 accent
 */

export const surface = {
  base:      'bg-white dark:bg-[#161b27]',
  raised:    'bg-gray-50 dark:bg-[#1c2333]',
  sunken:    'bg-gray-100 dark:bg-[#0d1117]',
  overlay:   'bg-white dark:bg-[#161b27]',
  border:    'border-gray-200 dark:border-[#21262d]',
  borderSub: 'border-gray-100 dark:border-[#21262d]/60',
  hover:     'hover:bg-gray-50 dark:hover:bg-[#1c2333]/80',
};

export const text = {
  primary:   'text-gray-900 dark:text-[#e6edf3]',
  secondary: 'text-gray-500 dark:text-[#8b949e]',
  muted:     'text-gray-400 dark:text-[#6e7681]',
  accent:    'text-blue-600 dark:text-blue-400',
  success:   'text-emerald-600 dark:text-emerald-400',
  warning:   'text-amber-600 dark:text-amber-400',
  danger:    'text-red-600 dark:text-red-400',
};

export const accent = {
  // Blue accent
  bg:        'bg-blue-600',
  bgHover:   'hover:bg-blue-700',
  bgLight:   'bg-blue-50 dark:bg-blue-500/10',
  text:      'text-blue-600 dark:text-blue-400',
  border:    'border-blue-200 dark:border-blue-500/30',
  ring:      'ring-blue-500/30',
};

export const status = {
  repaid:  { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/25', label: 'REPAID' },
  active:  { dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/25',     label: 'ACTIVE DEBT' },
  suspect: { dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/25', label: 'SUSPECTED' },
  clear:   { dot: 'bg-gray-400',    text: 'text-gray-500 dark:text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-500/10',   border: 'border-gray-200 dark:border-gray-500/25',   label: 'CLEAR' },
};

/**
 * Knowledge Debt Engine Design Tokens
 * 
 * Palette:
 * - Canvas Light: Soft lavender-sky gradient (#E6EAFF -> #F0EDFB -> #FDEEE4)
 * - Canvas Dark: Deep Indigo/Navy (#14183A)
 * - Card Light: #F8F9FE
 * - Card Dark: #1A204C
 * - Ink Light: #1B2150
 * - Ink Dark: #F1F5F9
 * - Brand Primary: Orange #FF6A2B
 * - Brand Secondary: Violet-Blue #5B4BFF
 */

export const surface = {
  base:      'bg-card-light dark:bg-card-dark border border-slate-200/80 dark:border-white/10 shadow-soft rounded-[20px]',
  raised:    'bg-white dark:bg-[#22295E] border border-slate-200/60 dark:border-white/10 shadow-soft rounded-[20px]',
  sunken:    'bg-slate-100/70 dark:bg-[#121633] border border-slate-200/50 dark:border-white/5 rounded-xl',
  overlay:   'bg-white/95 dark:bg-[#1A204C]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-soft-lg',
  border:    'border-slate-200 dark:border-white/10',
  borderSub: 'border-slate-100 dark:border-white/5',
  hover:     'hover:bg-slate-50 dark:hover:bg-[#22295E]/80 transition-colors',
};

export const text = {
  primary:   'text-[#1B2150] dark:text-[#F1F5F9] font-medium',
  secondary: 'text-[#5F6788] dark:text-[#94A3B8]',
  muted:     'text-[#8C94B2] dark:text-[#64748B]',
  accent:    'text-[#5B4BFF] dark:text-[#818CF8]',
  orange:    'text-[#FF6A2B]',
  success:   'text-[#12B76A] dark:text-[#34D399]',
  warning:   'text-[#F79009] dark:text-[#FBBF24]',
  danger:    'text-[#F04438] dark:text-[#F87171]',
};

export const buttons = {
  primary:   'bg-[#FF6A2B] hover:bg-[#E8591C] active:scale-[0.98] text-white font-semibold rounded-full px-5 py-2.5 shadow-glow-orange transition-all duration-200 focus-ring',
  secondary: 'bg-[#5B4BFF] hover:bg-[#4A3AE0] active:scale-[0.98] text-white font-semibold rounded-full px-5 py-2.5 shadow-glow-violet transition-all duration-200 focus-ring',
  outline:   'border-2 border-[#5B4BFF] text-[#5B4BFF] dark:border-[#818CF8] dark:text-[#818CF8] hover:bg-[#5B4BFF]/10 active:scale-[0.98] font-semibold rounded-full px-5 py-2.5 transition-all duration-200 focus-ring',
  ghost:     'text-[#5F6788] dark:text-[#94A3B8] hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full px-4 py-2 font-medium transition-all focus-ring',
};

export const status = {
  repaid:  { dot: 'bg-[#12B76A]', text: 'text-[#027A48] dark:text-[#34D399]', bg: 'bg-[#E8FDF2] dark:bg-[#12B76A]/15', border: 'border-[#A6F4C5] dark:border-[#12B76A]/30', label: 'Cleared' },
  active:  { dot: 'bg-[#F04438]', text: 'text-[#B42318] dark:text-[#F87171]', bg: 'bg-[#FEE4E2] dark:bg-[#F04438]/15', border: 'border-[#FECDCA] dark:border-[#F04438]/30', label: 'Fix needed' },
  suspect: { dot: 'bg-[#F79009]', text: 'text-[#B54708] dark:text-[#FBBF24]', bg: 'bg-[#FEF6E7] dark:bg-[#F79009]/15', border: 'border-[#FDECAB] dark:border-[#F79009]/30', label: 'Spotted' },
  clear:   { dot: 'bg-[#12B76A]', text: 'text-[#027A48] dark:text-[#34D399]', bg: 'bg-[#E8FDF2] dark:bg-[#12B76A]/15', border: 'border-[#A6F4C5] dark:border-[#12B76A]/30', label: 'Healthy' },
};

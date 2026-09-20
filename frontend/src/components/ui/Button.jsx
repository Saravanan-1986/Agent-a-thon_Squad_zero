import React from 'react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  title,
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center font-bold rounded-full',
    'transition-all duration-200',
    'focus:outline-none focus-ring',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-soft',
    'select-none cursor-pointer whitespace-nowrap',
  ].join(' ');

  const variants = {
    primary: [
      'bg-[#FF6A2B] hover:bg-[#E8591C] active:bg-[#D44B10]',
      'text-white',
      'shadow-glow-orange',
    ].join(' '),

    secondary: [
      'bg-[#5B4BFF] hover:bg-[#4A3AE0] active:bg-[#3B2BC7]',
      'text-white',
      'shadow-glow-violet',
    ].join(' '),

    ghost: [
      'bg-transparent hover:bg-slate-200/60 dark:hover:bg-white/10',
      'text-[#5F6788] dark:text-[#94A3B8] hover:text-[#1B2150] dark:hover:text-white',
    ].join(' '),

    danger: [
      'bg-[#F04438] hover:bg-[#D92D20] active:bg-[#B42318]',
      'text-white',
    ].join(' '),

    success: [
      'bg-[#12B76A] hover:bg-[#079455] active:bg-[#027A48]',
      'text-white',
    ].join(' '),

    outline: [
      'bg-transparent hover:bg-[#5B4BFF]/10',
      'text-[#5B4BFF] dark:text-[#818CF8]',
      'border-2 border-[#5B4BFF] dark:border-[#818CF8]',
    ].join(' '),

    icon: [
      'bg-card-light dark:bg-card-dark hover:bg-slate-200/60 dark:hover:bg-white/10',
      'text-[#5F6788] dark:text-[#94A3B8] hover:text-[#1B2150] dark:hover:text-white',
      'border border-slate-200 dark:border-white/10 p-2.5 rounded-full',
    ].join(' '),
  };

  const sizes = {
    sm: 'h-8 px-3.5 text-xs gap-1.5',
    md: 'h-10 px-5 text-xs gap-2',
    lg: 'h-12 px-6 text-sm gap-2.5',
    xl: 'h-14 px-8 text-base gap-3',
  };

  const selectedSize = variant === 'icon' ? '' : (sizes[size] || sizes.md);

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${base} ${variants[variant] || variants.primary} ${selectedSize} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </motion.button>
  );
}

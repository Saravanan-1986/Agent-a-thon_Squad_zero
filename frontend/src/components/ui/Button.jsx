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
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'select-none cursor-pointer whitespace-nowrap',
  ].join(' ');

  const variants = {
    primary: [
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
      'text-white',
      'border border-blue-600 hover:border-blue-700',
      'shadow-sm hover:shadow-md',
      'focus:ring-blue-500/40 focus:ring-offset-white dark:focus:ring-offset-[#0d1117]',
    ].join(' '),

    secondary: [
      'bg-white hover:bg-gray-50 active:bg-gray-100',
      'dark:bg-[#21262d] dark:hover:bg-[#282e38] dark:active:bg-[#30363d]',
      'text-gray-700 dark:text-[#c9d1d9]',
      'border border-gray-300 dark:border-[#30363d]',
      'shadow-sm',
      'focus:ring-blue-500/30 focus:ring-offset-white dark:focus:ring-offset-[#0d1117]',
    ].join(' '),

    ghost: [
      'bg-transparent hover:bg-gray-100 active:bg-gray-200',
      'dark:hover:bg-[#21262d] dark:active:bg-[#282e38]',
      'text-gray-600 hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-[#c9d1d9]',
      'border border-transparent',
      'focus:ring-gray-400/30',
    ].join(' '),

    danger: [
      'bg-red-600 hover:bg-red-700 active:bg-red-800',
      'text-white',
      'border border-red-600',
      'shadow-sm',
      'focus:ring-red-500/40 focus:ring-offset-white dark:focus:ring-offset-[#0d1117]',
    ].join(' '),

    success: [
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      'text-white',
      'border border-emerald-600',
      'shadow-sm',
      'focus:ring-emerald-500/40 focus:ring-offset-white dark:focus:ring-offset-[#0d1117]',
    ].join(' '),

    outline: [
      'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10',
      'text-blue-600 dark:text-blue-400',
      'border border-blue-600 dark:border-blue-500',
      'focus:ring-blue-500/30',
    ].join(' '),

    icon: [
      'bg-white hover:bg-gray-50 dark:bg-[#21262d] dark:hover:bg-[#282e38]',
      'text-gray-500 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#c9d1d9]',
      'border border-gray-200 dark:border-[#30363d]',
      'shadow-sm p-2 rounded-lg',
    ].join(' '),
  };

  const sizes = {
    sm: 'h-7 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-sm gap-2',
    xl: 'h-12 px-8 text-base gap-2.5',
  };

  const selectedSize = variant === 'icon' ? '' : (sizes[size] || sizes.md);

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      whileHover={disabled ? {} : { scale: 1.01 }}
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

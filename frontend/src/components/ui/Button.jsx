import React from 'react';

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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xs dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600 dark:text-white border border-blue-500 dark:border-blue-400 font-semibold',
    secondary: 'bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-750 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs font-medium',
    outline: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 font-medium',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 font-medium',
    danger: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-500 dark:text-white shadow-xs border border-rose-500 font-medium',
    success: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white shadow-xs border border-emerald-500 font-medium',
    icon: 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 p-2 rounded-lg shadow-2xs',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-base gap-2.5',
    icon: 'h-9 w-9 p-0 flex items-center justify-center',
  };

  const selectedSize = variant === 'icon' ? 'icon' : size;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[selectedSize]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

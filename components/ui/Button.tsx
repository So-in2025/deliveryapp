import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all focus:outline-none active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none italic';
  
  const variants = {
    primary: 'bg-brand-500 text-brand-950 hover:bg-brand-400 shadow-xl shadow-brand-500/30 border border-brand-400',
    secondary: 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white border border-stone-200 dark:border-white/10 hover:bg-stone-200 dark:hover:bg-stone-800 shadow-lg shadow-black/[0.05]',
    outline: 'border-2 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-900 shadow-sm',
    ghost: 'text-stone-700 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5', 
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/30 border border-red-400'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-12 px-5 text-sm',
    lg: 'h-14 px-8 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className={`mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${variant === 'primary' ? 'border-brand-950' : 'border-white'}`}></span>
      ) : null}
      {children}
    </button>
  );
};
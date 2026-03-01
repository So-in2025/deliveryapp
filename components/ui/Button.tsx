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
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20',
    // Added border-slate-200 and slightly darker text for better contrast against white backgrounds
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700',
    outline: 'border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800', // Darkened text
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800', 
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
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
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      ) : null}
      {children}
    </button>
  );
};
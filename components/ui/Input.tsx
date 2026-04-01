import React from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400">
        <Search size={18} />
      </div>
      <input
        className={`bg-stone-100 border-none text-stone-900 text-sm rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white block pl-10 p-3 outline-none transition-all placeholder:text-stone-400 ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      />
    </div>
  );
};
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styles = {
    success: 'bg-slate-900 text-white border-slate-800',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-600 text-white border-blue-700'
  };

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <AlertCircle size={18} />
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${styles[toast.type]} min-w-[300px] animate-slide-up-fade mb-2`}>
      {icons[toast.type]}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

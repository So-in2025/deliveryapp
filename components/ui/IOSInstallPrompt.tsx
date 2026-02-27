import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    // Show only on iOS browser (not app)
    if (isIOS && !isStandalone) {
        // Delay slightly for better UX
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity" onClick={() => setShowPrompt(false)}></div>
      
      {/* Drawer */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 p-6 pb-safe rounded-t-3xl shadow-2xl pointer-events-auto animate-slide-up relative">
        <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"
        >
            <X size={16} />
        </button>

        <div className="flex gap-4 items-start pr-8">
             <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0">
                 <img src="https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/shopping-bag.svg" className="w-8 h-8 opacity-80" />
             </div>
             <div>
                 <h3 className="font-bold text-slate-900 text-lg">Instalar App</h3>
                 <p className="text-slate-500 text-sm leading-relaxed mt-1">
                     Agrega <b>Delivery Local</b> a tu inicio para una experiencia a pantalla completa.
                 </p>
             </div>
        </div>

        <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg text-blue-600">
                    <Share size={18} />
                </span>
                <span>1. Toca el botón <b>Compartir</b> abajo.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg text-slate-600">
                    <PlusSquare size={18} />
                </span>
                <span>2. Selecciona <b>Agregar a Inicio</b>.</span>
            </div>
        </div>

        {/* Pointer Triangle to bottom center (Safari standard share button location) */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-200"></div>
      </div>
    </div>
  );
};
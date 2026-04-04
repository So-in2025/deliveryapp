import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { APP_CONFIG } from '../../constants';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isStandalone) return;

    if (isIOS) {
      setPlatform('ios');
      // Delay slightly for better UX
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    } else {
      // Handle Android/Chrome beforeinstallprompt
      const handleBeforeInstallPrompt = (e: any) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        setDeferredPrompt(e);
        setPlatform(isAndroid ? 'android' : 'other');
        // Show the prompt after a delay
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-safe pointer-events-none"
        >
          {/* Backdrop Blur for the whole bottom area */}
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          <div className="relative bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 pointer-events-auto max-w-md mx-auto overflow-hidden">
            {/* Close Button */}
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-14 h-14 object-contain" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="font-black text-stone-900 dark:text-white text-lg leading-tight">Instalar App</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mt-1">
                  Agrega <b>Te lo Llevo</b> a tu inicio para una experiencia premium.
                </p>
              </div>
            </div>

            {platform === 'ios' ? (
              <div className="mt-6 space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl">
                <div className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-brand-600">
                    <Share size={18} />
                  </div>
                  <span>1. Toca el botón <b>Compartir</b> en Safari.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-stone-600 dark:text-stone-400">
                    <PlusSquare size={18} />
                  </div>
                  <span>2. Selecciona <b>Agregar a Inicio</b>.</span>
                </div>
                {/* Pointer for Safari Share Button */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-stone-50 dark:bg-stone-800/50 rotate-45 border-b border-r border-stone-200 dark:border-stone-800 hidden sm:block" />
              </div>
            ) : (
              <div className="mt-6">
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-brand-500 text-brand-950 font-black py-4 rounded-2xl shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Download size={20} />
                  INSTALAR AHORA
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <Smartphone size={12} />
                  <span>Optimizado para tu dispositivo</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

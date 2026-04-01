
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShoppingBag, LayoutDashboard, Truck, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export const DemoGuideModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only once per session or force it for the demo link
    const hasSeen = sessionStorage.getItem('codex_demo_seen');
    if (!hasSeen) {
        // Small delay for animation smoothness
        setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('codex_demo_seen', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative animate-slide-up z-10">
        
        <div className="bg-stone-900 p-6 text-white text-center relative">
            <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-brand-500 rounded-full blur-2xl opacity-40"></div>
            <h2 className="text-xl font-bold relative z-10">¡Bienvenido a la Demo!</h2>
            <p className="text-stone-300 text-xs mt-1 relative z-10">Versión Beta 1.0</p>
            <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
            <p className="text-sm text-stone-600 text-center leading-relaxed">
                Esta es una simulación completa. Puedes cambiar de rol usando la barra inferior para ver el ciclo de vida de un pedido.
            </p>

            <div className="space-y-4">
                <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-950 flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <div>
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2"><ShoppingBag size={14}/> Cliente</h4>
                        <p className="text-xs text-stone-500">Haz un pedido en "Burger & Co".</p>
                    </div>
                </div>
                
                <div className="w-0.5 h-4 bg-stone-200 ml-4"></div>

                <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <div>
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2"><LayoutDashboard size={14}/> Comercio</h4>
                        <p className="text-xs text-stone-500">Acepta el pedido y márcalo como "Listo".</p>
                    </div>
                </div>

                <div className="w-0.5 h-4 bg-stone-200 ml-4"></div>

                <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <div>
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2"><Truck size={14}/> Driver</h4>
                        <p className="text-xs text-stone-500">Acepta el envío y entrégalo.</p>
                    </div>
                </div>
            </div>

            <Button fullWidth onClick={handleClose}>
                Entendido, ¡Probar Ahora!
            </Button>
        </div>
      </div>
    </div>
  );
};

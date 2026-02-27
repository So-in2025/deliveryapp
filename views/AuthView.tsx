
import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShoppingBag, Store, Bike, Terminal, ArrowRight, MapPin, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { DemoGuideModal } from '../components/ui/DemoGuideModal';

export const AuthView: React.FC = () => {
  const { setRole } = useApp();
  const { showToast } = useToast();

  const handleDevAccess = () => {
      const pin = window.prompt("Ingrese PIN de acceso:", "");
      if (pin === "125478") {
          setRole(UserRole.DEV);
      } else if (pin !== null) {
          showToast("PIN Incorrecto", "error");
      }
  };

  return (
    <div className="h-full bg-slate-50 relative flex flex-col overflow-hidden animate-fade-in">
      <DemoGuideModal />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
        <div className="mb-10 animate-slide-up">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-brand-500/30 mb-6">
            Ω
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Delivery<br />
            <span className="text-brand-600">Local.</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg leading-relaxed">
            La plataforma definitiva para conectar sabores, negocios y personas.
          </p>
        </div>

        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={() => setRole(UserRole.CLIENT)}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-brand-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-lg">Pedir Comida</h3>
                <p className="text-xs text-slate-400">Cliente</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
          </button>

          <button
            onClick={() => setRole(UserRole.MERCHANT)}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-purple-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Store size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-lg">Vender</h3>
                <p className="text-xs text-slate-400">Restaurante / Local</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
          </button>

          <button
            onClick={() => setRole(UserRole.DRIVER)}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-amber-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bike size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-lg">Repartir</h3>
                <p className="text-xs text-slate-400">Driver / Rider</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
          </button>

          {/* Admin Entry Point */}
          <button
            onClick={() => setRole(UserRole.ADMIN)}
            className="w-full bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/20 border border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700">
                <Shield size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-lg">Administrador</h3>
                <p className="text-xs text-slate-400">Dueño de Plataforma</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      <div className="p-4 text-center animate-fade-in relative z-10" style={{ animationDelay: '500ms' }}>
        <button
            onClick={handleDevAccess}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors bg-white/50 px-3 py-1.5 rounded-full"
        >
            <Terminal size={12} />
            Modo Desarrollador
        </button>
      </div>
    </div>
  );
};

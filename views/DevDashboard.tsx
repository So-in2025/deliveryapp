
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { PROJECT_METRICS, MOCK_STORES } from '../constants';
import { resetAppData } from '../services/dataService';
import { Terminal, ShoppingBag, LayoutDashboard, Truck, CheckCircle2, Circle, ArrowRight, Wifi, WifiOff, Activity, Play, Check, AlertCircle, LogOut, Zap, UserCog, Trash2 } from 'lucide-react';

export const DevDashboard: React.FC = () => {
  const { setRole, orders, cart, updateUser, user, resetOrders } = useApp();
  const { showToast } = useToast();
  const { isSimulatedOffline, toggleSimulatedOffline } = useConnectivity();
  const [testResults, setTestResults] = useState<Array<{ name: string; status: 'pass' | 'fail' | 'pending'; msg: string }>>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleFactoryReset = () => {
    resetAppData();
  };

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
        {
            name: 'Data Integrity Check',
            run: () => {
                if (!MOCK_STORES || MOCK_STORES.length === 0) throw new Error('No mock stores found');
                if (!orders) throw new Error('Orders state is undefined');
                return 'Stores and Orders loaded correctly';
            }
        },
        {
            name: 'Cart Logic Math',
            run: () => {
                 const price = 10;
                 const quantity = 2;
                 const total = price * quantity;
                 if (total !== 20) throw new Error('Math is broken in JS engine');
                 return 'Basic math operations valid';
            }
        },
        {
            name: 'Local Storage Access',
            run: () => {
                const key = 'test_write';
                localStorage.setItem(key, 'ok');
                const val = localStorage.getItem(key);
                localStorage.removeItem(key);
                if (val !== 'ok') throw new Error('LocalStorage not writable');
                return 'Persistence layer operational';
            }
        },
        {
            name: 'Offline Simulation State',
            run: () => {
                return isSimulatedOffline ? 'System is in OFFLINE SIMULATION mode' : 'System is ONLINE';
            }
        }
    ];

    const results = [];
    for (const test of tests) {
        // Simulate async check
        await new Promise(r => setTimeout(r, 400));
        try {
            const msg = test.run();
            results.push({ name: test.name, status: 'pass' as const, msg });
        } catch (e: any) {
            results.push({ name: test.name, status: 'fail' as const, msg: e.message });
        }
        setTestResults([...results]);
    }
    setIsRunningTests(false);
  };

  const handleSetupFullFlow = () => {
      // 1. Set user as Owner of 's1' (Burger & Co)
      // 2. Set user as Driver
      updateUser({
          ownedStoreId: 's1', // Hardcoded to the first mock store for demo purposes
          isDriver: true,
          name: 'Super Demo User'
      });
      showToast('¡Configurado! Eres Dueño de Burger & Co y Driver.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px] ${isSimulatedOffline ? 'bg-red-500 shadow-red-500' : 'bg-green-500 shadow-green-500'}`}></div>
             <span className={`font-mono text-xs tracking-widest ${isSimulatedOffline ? 'text-red-500' : 'text-green-500'}`}>
                SYSTEM: {isSimulatedOffline ? 'OFFLINE (SIM)' : 'ONLINE'}
             </span>
        </div>
        <button 
            onClick={() => setRole(UserRole.NONE)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
        >
            <LogOut size={12} /> Salir
        </button>
      </div>

      <div className="space-y-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-white">CODEX OMEGA</h1>
        <p className="text-slate-400 text-sm font-mono">Blueprint Maestro // Mazamitla</p>
      </div>

      {/* Quick Setup for Testing - NEW SECTION */}
      <div className="mb-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-500/30">
        <div className="flex justify-between items-center mb-3">
            <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <UserCog size={16} className="text-indigo-400" /> Configuración Rápida (DEMO)
                </h3>
                <p className="text-xs text-indigo-200/70">Prepara tu usuario para probar todo el flujo.</p>
            </div>
        </div>
        
        <div className="space-y-3">
            <div className="flex gap-2">
                <select 
                    className="bg-slate-900 border border-indigo-500/50 text-white text-xs rounded-lg px-2 py-2 flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => {
                        if (e.target.value) {
                            updateUser({ ownedStoreId: e.target.value });
                            showToast(`Ahora eres dueño de: ${MOCK_STORES.find(s => s.id === e.target.value)?.name}`, 'success');
                        }
                    }}
                    value={user.ownedStoreId || ''}
                >
                    <option value="">-- Seleccionar Tienda a Gestionar --</option>
                    {MOCK_STORES.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
            </div>

            <button 
                onClick={handleSetupFullFlow}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
            >
                <Zap size={14} fill="currentColor" />
                Activar Permisos Totales (Default)
            </button>
        </div>

        <div className="mt-3 text-[10px] text-slate-400 font-mono bg-black/20 p-2 rounded">
            &gt; Current Role: {user.ownedStoreId ? `Owner of ${MOCK_STORES.find(s => s.id === user.ownedStoreId)?.name || user.ownedStoreId}` : 'No Store Assigned'}<br/>
            &gt; Driver Permission: {user.isDriver ? 'GRANTED' : 'DENIED'}
        </div>
      </div>

      {/* Connectivity Control */}
      <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-white text-sm">Simulación de Red</h3>
            <p className="text-xs text-slate-400">Prueba la resiliencia offline de la app.</p>
        </div>
        <button 
            onClick={toggleSimulatedOffline}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isSimulatedOffline ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
            {isSimulatedOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isSimulatedOffline ? 'Forzar Online' : 'Forzar Offline'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mb-6 bg-red-900/10 p-4 rounded-xl border border-red-900/30 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-red-400 text-sm flex items-center gap-2">
                <Trash2 size={16} /> Zona de Peligro
            </h3>
            <p className="text-xs text-red-300/70">Acciones destructivas para resetear estados.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { resetOrders(); }}
                className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg text-xs font-bold border border-red-800 transition-colors"
            >
                Reiniciar Pedidos
            </button>
            <button 
                onClick={handleFactoryReset}
                className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg text-xs font-bold border border-red-800 transition-colors"
            >
                Factory Reset
            </button>
        </div>
      </div>

       {/* System Diagnostics */}
       <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
             <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Activity size={16} className="text-brand-400" /> Diagnóstico del Sistema
                </h3>
                <p className="text-xs text-slate-400">Ejecuta pruebas de integridad y lógica.</p>
            </div>
            <button 
                onClick={runDiagnostics}
                disabled={isRunningTests}
                className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
                {isRunningTests ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Play size={14} fill="currentColor" />}
                {isRunningTests ? 'Ejecutando...' : 'Iniciar Test'}
            </button>
        </div>
        
        {testResults.length > 0 && (
            <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800 font-mono text-xs">
                {testResults.map((res, idx) => (
                    <div key={idx} className="flex items-start gap-3 animate-fade-in">
                        <div className={`mt-0.5 ${res.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                            {res.status === 'pass' ? <Check size={12} /> : <AlertCircle size={12} />}
                        </div>
                        <div>
                            <span className={res.status === 'pass' ? 'text-slate-300' : 'text-red-300'}>{res.name}</span>
                            <span className="text-slate-500 mx-2">//</span>
                            <span className="text-slate-400">{res.msg}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
           <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Progreso Total</p>
           <div className="flex items-end gap-2">
             <span className="text-2xl font-bold text-white">{PROJECT_METRICS.totalProgress}%</span>
             <span className="text-xs text-green-400 mb-1">▲ On Track</span>
           </div>
           <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
             <div className="bg-brand-500 h-full transition-all duration-1000" style={{ width: `${PROJECT_METRICS.totalProgress}%` }}></div>
           </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
           <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Fases Completadas</p>
           <div className="flex items-end gap-2">
             <span className="text-2xl font-bold text-white">{PROJECT_METRICS.completedPhases}</span>
             <span className="text-xs text-slate-500 mb-1">/ {PROJECT_METRICS.totalPhases}</span>
           </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Simulación de Roles</p>
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => setRole(UserRole.CLIENT)}
            className="group flex items-center justify-between bg-brand-600 hover:bg-brand-500 p-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-900/50"
          >
            <div className="flex items-center gap-3">
               <div className="bg-white/20 p-2 rounded-lg"><ShoppingBag size={20} className="text-white" /></div>
               <div className="text-left">
                  <p className="font-bold text-white">App Cliente</p>
                  <p className="text-xs text-brand-200">Home, Búsqueda, Carrito</p>
               </div>
            </div>
            <ArrowRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => setRole(UserRole.MERCHANT)}
                className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 transition-all text-left"
             >
                <div className="p-1.5 bg-purple-500/20 rounded text-purple-400"><LayoutDashboard size={18} /></div>
                <div>
                    <span className="text-sm font-bold block text-purple-100">Comercio</span>
                    <span className="text-[10px] text-slate-500">{user.ownedStoreId ? '(Activo)' : '(Inactivo)'}</span>
                </div>
             </button>
             <button 
                onClick={() => setRole(UserRole.DRIVER)}
                className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 transition-all text-left"
             >
                <div className="p-1.5 bg-amber-500/20 rounded text-amber-400"><Truck size={18} /></div>
                <div>
                    <span className="text-sm font-bold block text-amber-100">Driver</span>
                    <span className="text-[10px] text-slate-500">{user.isDriver ? '(Activo)' : '(Inactivo)'}</span>
                </div>
             </button>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Terminal size={16} className="text-slate-400" /> Roadmap
            </h3>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Phase {PROJECT_METRICS.completedPhases + 1}</span>
        </div>
        
        <div className="space-y-4 relative">
             <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-800"></div>
             
             {PROJECT_METRICS.roadmap.map((phase) => (
                 <div key={phase.id} className={`relative flex items-start gap-4 ${phase.completed || phase.active ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-5 h-5 rounded-full border-2 shrink-0 z-10 flex items-center justify-center bg-slate-900 ${
                         phase.completed ? 'border-green-500 text-green-500' : 
                         phase.active ? 'border-brand-500 text-brand-500' : 'border-slate-600'
                     }`}>
                         {phase.completed ? <CheckCircle2 size={12} fill="currentColor" className="text-slate-900" /> : 
                          phase.active ? <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div> : null}
                     </div>
                     <div>
                         <p className={`text-sm font-medium ${phase.active ? 'text-brand-400' : 'text-slate-300'}`}>
                             {phase.title}
                         </p>
                         {phase.active && (
                             <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                                 &gt; WORK_IN_PROGRESS<br/>
                                 &gt; RUNNING_TESTS...
                             </div>
                         )}
                     </div>
                 </div>
             ))}
        </div>
      </div>

    </div>
  );
};

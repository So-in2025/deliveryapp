import React from 'react';
import { useApp } from '../context/AppContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { UserRole } from '../types';
import { ShoppingBag, LayoutDashboard, Truck, Settings, LogOut, WifiOff, Shield, Palmtree } from 'lucide-react';
import { IOSInstallPrompt } from './ui/IOSInstallPrompt';
import { SettingsOverlay } from './ui/SettingsOverlay';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, setRole, toggleSettings, setClientViewState, setSelectedStore } = useApp();
  const { isOnline } = useConnectivity();
  const isDev = role === UserRole.DEV;
  const isAdmin = role === UserRole.ADMIN;
  const isAuth = role === UserRole.NONE;

  // Background color logic: Dev/Admin get dark backgrounds, others get light/dark responsive.
  const bgClass = (isDev || isAdmin) ? 'bg-slate-900' : 'bg-slate-100 dark:bg-slate-950 transition-colors duration-300';
  const containerBgClass = (isDev) ? 'bg-slate-900' : 'bg-white dark:bg-slate-900 transition-colors duration-300';

  const handleHomeClick = () => {
    // Escape hatch: If already on Client view, clicking Home resets the flow
    if (role === UserRole.CLIENT) {
        setClientViewState('BROWSE');
        setSelectedStore(null);
    } else {
        setRole(UserRole.CLIENT);
    }
  };

  return (
    <div className={`h-[100dvh] w-full flex flex-col items-center overflow-hidden ${bgClass}`}>
      
      {/* iOS PWA Prompt */}
      <IOSInstallPrompt />
      
      {/* Settings Overlay */}
      <SettingsOverlay />

      {/* Main Container: Mobile Constraint (max-w-md) OR Desktop Full Width (lg:max-w-none lg:flex-row) */}
      <div className={`w-full max-w-md lg:max-w-none h-full shadow-2xl relative flex flex-col lg:flex-row overflow-hidden ${containerBgClass}`}>
        
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-slate-800 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={12} className="text-red-400" />
            <span className="text-slate-200">Modo Offline • Datos locales</span>
          </div>
        )}

        {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
        {!isDev && !isAuth && !isAdmin && (
          <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-40 transition-colors duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-md">
                <Palmtree size={24} />
              </div>
              <h1 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Maza<span className="text-emerald-600 dark:text-emerald-400">mitla</span></h1>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <DesktopNavItem icon={<ShoppingBag />} label="Inicio" active={role === UserRole.CLIENT} onClick={handleHomeClick} />
              <DesktopNavItem icon={<LayoutDashboard />} label="Restaurante" active={role === UserRole.MERCHANT} onClick={() => setRole(UserRole.MERCHANT)} />
              <DesktopNavItem icon={<Truck />} label="Repartidor" active={role === UserRole.DRIVER} onClick={() => setRole(UserRole.DRIVER)} />
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <DesktopNavItem icon={<Settings />} label="Ajustes" active={false} onClick={toggleSettings} />
              <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={() => setRole(UserRole.NONE)} isDanger />
            </div>
          </aside>
        )}

        {/* --- MOBILE/DESKTOP CONTENT WRAPPER --- */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full">
          
          {/* Header - ONLY show if NOT in Dev Mode, NOT Admin, AND NOT in Auth Mode. Hidden on Desktop (lg:hidden) */}
          {!isDev && !isAuth && !isAdmin && (
            <header className={`lg:hidden shrink-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex justify-between items-center pt-safe transition-colors duration-300 ${!isOnline ? 'mt-6' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Palmtree size={18} />
                </div>
                <h1 className="font-bold text-slate-800 dark:text-white tracking-tight transition-colors">Maza<span className="text-emerald-600 dark:text-emerald-400">mitla</span></h1>
              </div>
              
              {/* Standard Exit/Back Button */}
              <button 
                  onClick={() => setRole(UserRole.NONE)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Cerrar Sesión"
              >
                  <LogOut size={18} />
              </button>
            </header>
          )}

          {/* Main Content Area - Scrollable */}
          <main className={`flex-1 overflow-y-auto scrollbar-hide relative ${(!isDev && !isAdmin) ? 'pb-safe lg:pb-0' : ''}`}>
            {children}
          </main>

          {/* Bottom Navigation - Standard Roles. Hidden on Desktop (lg:hidden) */}
          {!isDev && !isAuth && !isAdmin && (
            <nav className="lg:hidden shrink-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 relative transition-colors duration-300">
               <NavItem icon={<ShoppingBag />} label="Inicio" active={role === UserRole.CLIENT} onClick={handleHomeClick} />
               <NavItem icon={<LayoutDashboard />} label="Pedidos" active={role === UserRole.MERCHANT} onClick={() => setRole(UserRole.MERCHANT)} />
               <NavItem icon={<Truck />} label="Ruta" active={role === UserRole.DRIVER} onClick={() => setRole(UserRole.DRIVER)} />
               <NavItem icon={<Settings />} label="Ajustes" active={false} onClick={toggleSettings} />
            </nav>
          )}

          {/* Bottom Navigation - Admin Only (Simplified). Hidden on Desktop (lg:hidden) */}
          {isAdmin && (
              <nav className="lg:hidden shrink-0 w-full bg-slate-900 border-t border-slate-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 relative text-slate-400">
               <button 
                  onClick={() => setRole(UserRole.NONE)}
                  className="flex flex-col items-center gap-1 p-2 hover:text-white transition-colors"
               >
                  <LogOut size={22} />
                  <span className="text-[10px] font-medium">Salir</span>
               </button>
               <div className="text-xs font-mono text-slate-600">SUPER ADMIN MODE</div>
               <button 
                  onClick={toggleSettings}
                  className="flex flex-col items-center gap-1 p-2 hover:text-white transition-colors"
               >
                  <Settings size={22} />
                  <span className="text-[10px] font-medium">Config</span>
               </button>
              </nav>
          )}
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const DesktopNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => {
  const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all";
  let stateClass = "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white";
  
  if (active) {
    stateClass = "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400";
  } else if (isDanger) {
    stateClass = "text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-sm">{label}</span>
    </button>
  );
};
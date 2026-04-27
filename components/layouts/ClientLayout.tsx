import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { ShoppingBag, LogOut, WifiOff, Heart, History as HistoryIcon, User, Bell, Shield, Settings } from 'lucide-react';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { APP_CONFIG } from '../../constants';
import { UserRole } from '../../types';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-brand-950 dark:text-brand-400' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}
  >
    {React.cloneElement(icon as React.ReactElement<unknown>, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const DesktopNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => {
  const baseClass = "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-black transition-all duration-300 group";
  let stateClass = "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-stone-950 dark:hover:text-white";
  
  if (active) {
    stateClass = "bg-brand-500 text-brand-950 shadow-xl shadow-brand-500/20 scale-[1.02]";
  } else if (isDanger) {
    stateClass = "text-stone-500 dark:text-stone-400 hover:bg-red-500/10 hover:text-red-500";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as React.ReactElement<unknown>, { size: 22, strokeWidth: active ? 3 : 2 })}
      </div>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
};

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toggleSettings, setClientViewState, setSelectedStore, clientViewState, notifications, setIsNotificationsOpen, user, setRole } = useApp();
  const { signOut } = useAuth();
  const { isOnline } = useConnectivity();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleHomeClick = () => {
    setClientViewState('BROWSE');
    setSelectedStore(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-stone-50 dark:bg-[#050505] transition-colors duration-300 dark:bg-stone-900">
      <SettingsOverlay />

      <div className="w-full h-full relative flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-900 transition-colors duration-300">
        
        {!isOnline && (
          <div className="bg-stone-800 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={12} className="text-red-400" />
            <span className="text-stone-200">Modo Offline • Datos locales</span>
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white dark:bg-stone-900 border-r border-amber-200 dark:border-white/[0.03] z-40 transition-colors duration-300 dark:border-stone-800">
          <div className="p-10 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={handleHomeClick}>
                <div className="absolute -inset-6 bg-brand-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="w-32 h-32 bg-brand-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(250,204,21,0.2)] overflow-hidden border-4 border-white dark:border-stone-800 relative z-10 transition-transform duration-500 group-hover:scale-105 p-2">
                  <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" />
                </div>
                <div className="mt-4 text-center relative z-10">
                  <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter leading-none uppercase">{APP_CONFIG.appName}</h1>
                  <p className="text-[8px] font-bold text-brand-600 dark:text-brand-400 tracking-[0.3em] uppercase mt-1">Premium Delivery</p>
                </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <div className="px-4 mb-4">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Menú Principal</span>
            </div>
            <div id="browse-tab">
                <DesktopNavItem icon={<ShoppingBag />} label="Explorar Tiendas" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
            </div>
            <div id="favorites-tab">
                <DesktopNavItem icon={<Heart />} label="Mis Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
            </div>
            <div id="history-tab">
                <DesktopNavItem icon={<HistoryIcon />} label="Historial de Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
            </div>
            <div id="profile-tab">
                <DesktopNavItem icon={<User />} label="Mi Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
            </div>
            {user?.role === UserRole.ADMIN && (
                <div className="pt-6 mt-6 border-t border-amber-200 dark:border-white/[0.03] dark:border-stone-800">
                    <div className="px-4 mb-4">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Administración</span>
                    </div>
                    <DesktopNavItem icon={<Shield />} label="Panel de Control" active={false} onClick={() => setRole(UserRole.ADMIN)} />
                </div>
            )}
          </nav>

          <div className="p-6 border-t border-amber-200 dark:border-white/[0.03] space-y-2 dark:border-stone-800">
            <div id="settings-tab">
                <DesktopNavItem icon={<Settings />} label="Configuración" active={false} onClick={toggleSettings} />
            </div>
            <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full bg-stone-50 dark:bg-stone-950">
          
          {/* Mobile Header - More minimal and transparent */}
          <header className="lg:hidden shrink-0 z-[60] fixed top-0 left-0 right-0 pointer-events-none px-4 py-3 flex justify-between items-center pt-safe">
            <div className="flex items-center gap-2 pointer-events-auto bg-white/40 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
              <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-stone-950 dark:text-white tracking-tighter leading-none uppercase">{APP_CONFIG.appName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pointer-events-auto">
              <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md text-stone-950 dark:text-white border border-white/20 transition-all relative"
              >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border border-white" />
                  )}
              </button>
              <button 
                  onClick={toggleSettings}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md text-stone-950 dark:text-white border border-white/20 transition-all"
              >
                  <Settings size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative lg:pb-0 mt-16 lg:mt-0">
            <div className="w-full h-full">
                {children}
            </div>
          </main>


          {/* Mobile Bottom Navigation - Floating Pill Bottom Nav - Refined Élite */}
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[60] pointer-events-none">
            <nav className="mx-auto max-w-sm w-full bg-stone-950/80 dark:bg-stone-900/80 backdrop-blur-3xl border border-white/10 rounded-full py-2 px-4 flex justify-between items-center shadow-2xl shadow-brand-500/10 pointer-events-auto">
              <div id="browse-tab-mobile" className="flex-1 flex justify-center">
                  <NavItem icon={<ShoppingBag />} label="Inicio" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
              </div>
              <div id="favorites-tab-mobile" className="flex-1 flex justify-center">
                  <NavItem icon={<Heart />} label="Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
              </div>
              <div id="history-tab-mobile" className="flex-1 flex justify-center">
                  <NavItem icon={<HistoryIcon />} label="Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
              </div>
              <div id="profile-tab-mobile" className="flex-1 flex justify-center">
                  <NavItem icon={<User />} label="Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

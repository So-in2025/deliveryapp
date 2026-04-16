import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { ShoppingBag, LogOut, WifiOff, Heart, History, User, Bell, Shield } from 'lucide-react';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { APP_CONFIG } from '../../constants';
import { UserRole } from '../../types';

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
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-stone-50 dark:bg-[#050505] transition-colors duration-300">
      <SettingsOverlay />

      <div className="w-full h-full relative flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-900 transition-colors duration-300">
        
        {!isOnline && (
          <div className="bg-stone-800 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={12} className="text-red-400" />
            <span className="text-stone-200">Modo Offline • Datos locales</span>
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-100 dark:border-white/[0.03] z-40 transition-colors duration-300">
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
                <DesktopNavItem icon={<History />} label="Historial de Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
            </div>
            <div id="profile-tab">
                <DesktopNavItem icon={<User />} label="Mi Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
            </div>
            {user?.role === UserRole.ADMIN && (
                <div className="pt-6 mt-6 border-t border-stone-100 dark:border-white/[0.03]">
                    <div className="px-4 mb-4">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Administración</span>
                    </div>
                    <DesktopNavItem icon={<Shield />} label="Panel de Control" active={false} onClick={() => setRole(UserRole.ADMIN)} />
                </div>
            )}
          </nav>

          <div className="p-6 border-t border-stone-100 dark:border-white/[0.03] space-y-2">
            <div id="settings-tab">
                <DesktopNavItem icon={<User />} label="Perfil" active={false} onClick={toggleSettings} />
            </div>
            <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full bg-stone-50 dark:bg-stone-950">
          
          {/* Mobile Header */}
          <header className="lg:hidden shrink-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border-b border-black/[0.03] dark:border-white/[0.03] px-4 py-3 flex justify-between items-center pt-safe transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 overflow-hidden border-2 border-white dark:border-stone-800 p-1">
                <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-stone-950 dark:text-white tracking-tighter leading-none uppercase">{APP_CONFIG.appName}</span>
                <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase">Premium Delivery</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="p-2 rounded-lg bg-brand-950/10 dark:bg-white/10 text-brand-950 dark:text-white hover:bg-brand-950/20 transition-colors relative"
              >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-brand-500" />
                  )}
              </button>
              <button 
                  id="settings-tab-mobile"
                  onClick={toggleSettings}
                  className="p-2 rounded-lg bg-brand-950/10 dark:bg-white/10 text-brand-950 dark:text-white hover:bg-brand-950/20 transition-colors"
                  title="Perfil"
              >
                  <User size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative pb-safe lg:pb-0">
            <div className="w-full h-full lg:max-w-6xl lg:mx-auto">
                {children}
            </div>
          </main>


          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden shrink-0 w-full bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 relative transition-colors duration-300">
             <div id="browse-tab-mobile" className="flex-1 flex justify-center">
                 <NavItem icon={<ShoppingBag />} label="Inicio" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
             </div>
             <div id="favorites-tab-mobile" className="flex-1 flex justify-center">
                 <NavItem icon={<Heart />} label="Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
             </div>
             <div id="history-tab-mobile" className="flex-1 flex justify-center">
                 <NavItem icon={<History />} label="Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
             </div>
             <div id="profile-tab-mobile" className="flex-1 flex justify-center">
                 <NavItem icon={<User />} label="Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
             </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

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

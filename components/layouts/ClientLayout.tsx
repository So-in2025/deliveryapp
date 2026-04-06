import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { ShoppingBag, Settings, LogOut, WifiOff, Heart, History, User, Bell, Shield } from 'lucide-react';
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
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-brand-50 dark:bg-stone-950 transition-colors duration-300">
      <SettingsOverlay />

      <div className="w-full max-w-md lg:max-w-none h-full shadow-2xl relative flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-900 transition-colors duration-300">
        
        {!isOnline && (
          <div className="bg-stone-800 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={12} className="text-red-400" />
            <span className="text-stone-200">Modo Offline • Datos locales</span>
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-brand-50 dark:bg-stone-950 border-r border-brand-200 dark:border-stone-800 z-40 transition-colors duration-300">
          <div className="p-6 border-b border-brand-200 dark:border-stone-800 flex items-center justify-center">
            <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="h-24 lg:h-32 object-contain" />
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div id="browse-tab">
                <DesktopNavItem icon={<ShoppingBag />} label="Explorar" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
            </div>
            <div id="favorites-tab">
                <DesktopNavItem icon={<Heart />} label="Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
            </div>
            <div id="history-tab">
                <DesktopNavItem icon={<History />} label="Mis Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
            </div>
            <div id="profile-tab">
                <DesktopNavItem icon={<User />} label="Mi Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
            </div>
            {user?.role === UserRole.ADMIN && (
                <div className="pt-4">
                    <DesktopNavItem icon={<Shield />} label="Volver a Admin" active={false} onClick={() => setRole(UserRole.ADMIN)} />
                </div>
            )}
          </nav>

          <div className="p-4 border-t border-brand-100 dark:border-stone-800 space-y-2">
            <div id="settings-tab">
                <DesktopNavItem icon={<Settings />} label="Ajustes" active={false} onClick={toggleSettings} />
            </div>
            <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full">
          
          {/* Mobile Header */}
          <header className="lg:hidden shrink-0 z-30 bg-brand-500 dark:bg-stone-900 backdrop-blur-md border-b border-brand-600 dark:border-stone-800 px-4 py-3 flex justify-between items-center pt-safe transition-colors duration-300">
            <div className="flex items-center">
              <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="h-12 object-contain" />
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
              >
                  <Settings size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative pb-safe lg:pb-0">
            {children}
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
  const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all";
  let stateClass = "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-white";
  
  if (active) {
    stateClass = "bg-brand-50 dark:bg-brand-900/20 text-brand-950 dark:text-brand-400";
  } else if (isDanger) {
    stateClass = "text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      {React.cloneElement(icon as React.ReactElement<unknown>, { size: 20, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-sm">{label}</span>
    </button>
  );
};

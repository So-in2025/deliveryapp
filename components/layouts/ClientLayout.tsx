import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { ShoppingBag, Settings, LogOut, WifiOff, Heart, History, User, Bell } from 'lucide-react';
import { IOSInstallPrompt } from '../ui/IOSInstallPrompt';
import { SettingsOverlay } from '../ui/SettingsOverlay';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toggleSettings, setClientViewState, setSelectedStore, clientViewState, notifications, setIsNotificationsOpen } = useApp();
  const { signOut } = useAuth();
  const { isOnline } = useConnectivity();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleHomeClick = () => {
    setClientViewState('BROWSE');
    setSelectedStore(null);
  };

  const handleSignOut = async () => {
    console.log("Cerrando sesión desde ClientLayout...");
    await signOut();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-[#050505] text-white font-sans transition-colors duration-300">
      <IOSInstallPrompt />
      <SettingsOverlay />

      <div className="w-full h-full relative flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-[#050505] transition-colors duration-300">
        
        {!isOnline && (
          <div className="bg-red-500/90 backdrop-blur-md text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={14} />
            <span>Modo Offline • Datos locales</span>
          </div>
        )}

        {/* DESKTOP SIDEBAR - ELITE DESIGN */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-[#0A0A0A] border-r border-white/5 z-40 transition-colors duration-300">
          <div className="p-8 flex items-center justify-start">
            <img src="/logo.jpg" alt="Te lo Llevo" className="h-12 object-contain rounded-xl shadow-2xl" />
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <DesktopNavItem icon={<ShoppingBag />} label="Explorar" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
            <DesktopNavItem icon={<Heart />} label="Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
            <DesktopNavItem icon={<History />} label="Mis Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
            <DesktopNavItem icon={<User />} label="Mi Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
          </nav>

          <div className="p-4 border-t border-white/5 space-y-1">
            <DesktopNavItem icon={<Settings />} label="Ajustes" active={false} onClick={toggleSettings} />
            <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full">
          
          {/* Mobile Header - ELITE DESIGN */}
          <header className="lg:hidden shrink-0 z-30 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-6 py-4 flex justify-between items-center pt-safe transition-colors duration-300">
            <div className="flex items-center">
              <img src="/logo.jpg" alt="Te lo Llevo" className="h-8 object-contain rounded-lg shadow-sm" />
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 text-stone-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative"
              >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                  )}
              </button>
              <button 
                  onClick={toggleSettings}
                  className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 text-stone-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                  <Settings size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative pb-[100px] lg:pb-0">
            {children}
          </main>

          {/* Mobile Bottom Navigation - ELITE FLOATING DESIGN */}
          <div className="lg:hidden fixed bottom-0 left-0 w-full px-6 pb-safe pt-4 pointer-events-none z-40">
            <nav className="pointer-events-auto w-full bg-white/90 dark:bg-[#141414]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl flex justify-between items-center px-2 py-2 mb-4 transition-colors duration-300">
               <NavItem icon={<ShoppingBag />} label="Inicio" active={clientViewState === 'BROWSE'} onClick={handleHomeClick} />
               <NavItem icon={<Heart />} label="Favoritos" active={clientViewState === 'FAVORITES'} onClick={() => setClientViewState('FAVORITES')} />
               <NavItem icon={<History />} label="Pedidos" active={clientViewState === 'HISTORY'} onClick={() => setClientViewState('HISTORY')} />
               <NavItem icon={<User />} label="Perfil" active={clientViewState === 'PROFILE'} onClick={() => setClientViewState('PROFILE')} />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${active ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105' : 'text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: active ? 2.5 : 2 })}
    <span className={`text-[10px] font-bold mt-1 ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
  </button>
);

const DesktopNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => {
  const baseClass = "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 group";
  let stateClass = "text-stone-500 hover:bg-white/5 hover:text-white";
  
  if (active) {
    stateClass = "bg-white text-black shadow-xl scale-[1.02]";
  } else if (isDanger) {
    stateClass = "text-stone-500 hover:bg-red-500/10 hover:text-red-500";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      <div className={`${active ? 'text-black' : isDanger ? 'group-hover:text-red-500' : 'text-stone-400 group-hover:text-white'} transition-colors`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 22, strokeWidth: active ? 2.5 : 2 })}
      </div>
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );
};

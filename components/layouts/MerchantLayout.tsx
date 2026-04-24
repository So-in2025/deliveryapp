import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { LayoutDashboard, Store, History, LogOut, WifiOff, Bell, Utensils, Tag, HelpCircle, Shield, Sliders, User } from 'lucide-react';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { UserRole } from '../../types';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-brand-500' : 'text-stone-500 hover:text-stone-300'}`}
  >
    {React.cloneElement(icon as React.ReactElement<unknown>, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const DesktopNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => {
  const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all";
  let stateClass = "text-stone-400 hover:bg-white/5 hover:text-white";
  
  if (active) {
    stateClass = "bg-brand-500/10 text-brand-500";
  } else if (isDanger) {
    stateClass = "text-stone-400 hover:bg-red-500/10 hover:text-red-500";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      {React.cloneElement(icon as React.ReactElement<unknown>, { size: 20, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-sm">{label}</span>
    </button>
  );
};

export const MerchantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toggleSettings, merchantViewState, setMerchantViewState, notifications, setIsNotificationsOpen, user, setRole } = useApp();
  const { signOut } = useAuth();
  const { isOnline } = useConnectivity();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-stone-900 transition-colors duration-300">
      <SettingsOverlay />

      <div className="w-full max-w-md lg:max-w-none h-full shadow-2xl relative flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-900 transition-colors duration-300">
        
        {!isOnline && (
          <div className="bg-stone-800 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-slide-up-fade z-[60] absolute w-full top-0 pt-safe">
            <WifiOff size={12} className="text-red-400" />
            <span className="text-stone-200">Modo Offline • Datos locales</span>
          </div>
        )}

        {/* DESKTOP SIDEBAR - Merchant Focus */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-stone-950 border-r border-stone-800 z-40">
          <div className="p-6 border-b border-stone-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                <Store className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm">Panel Aliado</span>
                <span className="text-stone-500 text-[10px] uppercase tracking-widest dark:text-stone-400">Merchant App</span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div id="orders-tab">
                <DesktopNavItem icon={<LayoutDashboard />} label="Pedidos Activos" active={merchantViewState === 'ORDERS'} onClick={() => setMerchantViewState('ORDERS')} />
            </div>
            <div id="menu-tab">
                <DesktopNavItem icon={<Utensils />} label="Mi Menú" active={merchantViewState === 'MENU'} onClick={() => setMerchantViewState('MENU')} />
            </div>
            <div id="coupons-tab">
                <DesktopNavItem icon={<Tag />} label="Cupones" active={merchantViewState === 'COUPONS'} onClick={() => setMerchantViewState('COUPONS')} />
            </div>
            <div id="history-tab">
                <DesktopNavItem icon={<History />} label="Historial" active={merchantViewState === 'HISTORY'} onClick={() => setMerchantViewState('HISTORY')} />
            </div>
            <div id="store-settings-tab">
                <DesktopNavItem icon={<Sliders />} label="Mi Tienda" active={merchantViewState === 'SETTINGS'} onClick={() => setMerchantViewState('SETTINGS')} />
            </div>
            <div id="help-tab">
                <DesktopNavItem icon={<HelpCircle />} label="Ayuda y Soporte" active={false} onClick={() => { window.dispatchEvent(new CustomEvent('open-help')); toggleSettings(); }} />
            </div>
            {user?.role === UserRole.ADMIN && (
                <div className="pt-4">
                    <DesktopNavItem icon={<Shield />} label="Volver a Admin" active={false} onClick={() => setRole(UserRole.ADMIN)} />
                </div>
            )}
          </nav>

          <div className="p-4 border-t border-stone-800 space-y-2">
            <div id="settings-tab">
                <DesktopNavItem icon={<User />} label="Perfil" active={false} onClick={toggleSettings} />
            </div>
            <DesktopNavItem icon={<LogOut />} label="Cerrar Sesión" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full">
          
          {/* Mobile Header */}
          <header className="lg:hidden shrink-0 z-30 bg-stone-950 border-b border-stone-800 px-4 py-3 flex justify-between items-center pt-safe">
            <div className="flex items-center gap-2">
              <Store className="text-brand-500" size={20} />
              <span className="text-white font-bold text-sm">Mis Pedidos</span>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-help'));
                        toggleSettings();
                    }}
                    className="p-2 rounded-lg bg-white/5 text-stone-400 hover:text-white transition-colors"
                    title="Ayuda"
                >
                    <HelpCircle size={18} />
                </button>
                <button 
                    onClick={() => setIsNotificationsOpen(true)}
                    className="p-2 rounded-lg bg-white/5 text-stone-400 hover:text-white transition-colors relative"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-stone-900" />
                    )}
                </button>
                <button 
                    id="settings-tab-mobile"
                    onClick={toggleSettings}
                    className="p-2 rounded-lg bg-white/5 text-stone-400 hover:text-white transition-colors"
                    title="Perfil"
                >
                    <User size={18} />
                </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative bg-stone-50 dark:bg-stone-950">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden shrink-0 w-full bg-stone-950 border-t border-stone-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 relative">
             <div id="orders-tab-mobile"><NavItem icon={<LayoutDashboard />} label="Pedidos" active={merchantViewState === 'ORDERS'} onClick={() => setMerchantViewState('ORDERS')} /></div>
             <div id="menu-tab-mobile"><NavItem icon={<Utensils />} label="Menú" active={merchantViewState === 'MENU'} onClick={() => setMerchantViewState('MENU')} /></div>
             <div id="coupons-tab-mobile"><NavItem icon={<Tag />} label="Cupones" active={merchantViewState === 'COUPONS'} onClick={() => setMerchantViewState('COUPONS')} /></div>
             <div id="history-tab-mobile"><NavItem icon={<History />} label="Historial" active={merchantViewState === 'HISTORY'} onClick={() => setMerchantViewState('HISTORY')} /></div>
             <div id="store-settings-tab-mobile"><NavItem icon={<Sliders />} label="Tienda" active={merchantViewState === 'SETTINGS'} onClick={() => setMerchantViewState('SETTINGS')} /></div>
          </nav>
        </div>
      </div>
    </div>
  );
};

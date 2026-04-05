import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Users, Store, Truck, Database, AlertTriangle, Bell, HelpCircle, Settings } from 'lucide-react';
import { SettingsOverlay } from '../ui/SettingsOverlay';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminViewState, setAdminViewState, notifications, setIsNotificationsOpen, toggleSettings } = useApp();
  const { signOut } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden bg-stone-950">
      <SettingsOverlay />

      <div className="w-full h-full shadow-2xl relative flex flex-col lg:flex-row overflow-hidden bg-stone-900">
        
        {/* DESKTOP SIDEBAR - Admin Focus */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-stone-950 border-r border-stone-800 z-40">
          <div className="p-6 border-b border-stone-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                <Shield className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight">ADMIN CORE</span>
                <span className="text-stone-600 text-[10px] font-mono uppercase tracking-widest">v1.0.4-stable</span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <DesktopNavItem icon={<Database />} label="Dashboard" active={adminViewState === 'DASHBOARD'} onClick={() => setAdminViewState('DASHBOARD')} />
            <DesktopNavItem icon={<Users />} label="Usuarios" active={adminViewState === 'USERS'} onClick={() => setAdminViewState('USERS')} />
            <DesktopNavItem icon={<Store />} label="Comercios" active={adminViewState === 'STORES'} onClick={() => setAdminViewState('STORES')} />
            <DesktopNavItem icon={<Truck />} label="Flota" active={adminViewState === 'FLEET'} onClick={() => setAdminViewState('FLEET')} />
            <DesktopNavItem icon={<AlertTriangle />} label="Reclamos" active={adminViewState === 'DISPUTES'} onClick={() => setAdminViewState('DISPUTES')} />
            <DesktopNavItem icon={<HelpCircle />} label="Ayuda y Soporte" active={false} onClick={() => { window.dispatchEvent(new CustomEvent('open-help')); toggleSettings(); }} />
          </nav>

          <div className="p-4 border-t border-stone-800 space-y-1">
            <DesktopNavItem icon={<Settings />} label="Configuración" active={adminViewState === 'SETTINGS'} onClick={() => setAdminViewState('SETTINGS')} />
            <DesktopNavItem icon={<LogOut />} label="Logout" active={false} onClick={handleSignOut} isDanger />
          </div>
        </aside>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col relative overflow-hidden w-full">
          
          {/* Mobile Header */}
          <header className="lg:hidden shrink-0 z-30 bg-stone-950 border-b border-stone-800 px-4 py-3 flex justify-between items-center pt-safe">
            <div className="flex items-center gap-2">
              <Shield className="text-red-600" size={18} />
              <span className="text-white font-mono text-xs font-bold tracking-tighter">ADMIN_SHELL</span>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-help'));
                        toggleSettings();
                    }}
                    className="p-2 rounded bg-white/5 text-stone-400 hover:text-white transition-colors"
                    title="Ayuda"
                >
                    <HelpCircle size={16} />
                </button>
                <button 
                    onClick={() => setIsNotificationsOpen(true)}
                    className="p-2 rounded bg-white/5 text-stone-400 hover:text-white transition-colors relative"
                >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
                    )}
                </button>
                <button 
                    onClick={handleSignOut}
                    className="p-2 rounded bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-colors"
                >
                    <LogOut size={16} />
                </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hide relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const DesktopNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => {
  const baseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded font-mono transition-all";
  let stateClass = "text-stone-500 hover:bg-white/5 hover:text-stone-200";
  
  if (active) {
    stateClass = "bg-white/5 text-white border-l-2 border-red-600 pl-[14px]";
  } else if (isDanger) {
    stateClass = "text-stone-500 hover:bg-red-600/10 hover:text-red-500";
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${stateClass}`}>
      {React.cloneElement(icon as React.ReactElement<unknown>, { size: 16, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </button>
  );
};

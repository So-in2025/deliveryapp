
import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShoppingBag, Store, Bike, Terminal, ArrowRight, Shield, LogIn, User as UserIcon, Globe, Sparkles, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../constants';

export const AuthView: React.FC = () => {
  const { setRole } = useApp();
  const { showToast } = useToast();
  const { user, login, signOut, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
      setIsLoggingIn(true);
      try {
          await login();
      } finally {
          setIsLoggingIn(false);
      }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if iOS
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isIOS && !isStandalone) {
      setShowInstallButton(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIOS) {
        showToast('Para instalar: Toca compartir y luego "Agregar a Inicio"', 'info');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleRoleSelection = (role: UserRole, isGuest: boolean = false) => {
    if (!user && !isGuest) {
      showToast("Por favor, inicia sesión primero", "info");
      login();
      return;
    }
    setRole(role);
  };

  const handleDevAccess = () => {
      const pin = window.prompt("Ingrese PIN de acceso:", "");
      if (pin === "125478") {
          setRole(UserRole.DEV);
      } else if (pin !== null) {
          showToast("PIN Incorrecto", "error");
      }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-stone-950 relative flex flex-col lg:flex-row overflow-hidden">
      
      {/* FLOATING INSTALL BUTTON */}
      <AnimatePresence>
        {showInstallButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstallClick}
            className="absolute top-6 right-6 z-50 bg-brand-500 text-brand-950 px-4 py-2 rounded-full font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 border border-brand-400/50 group"
          >
            <Download size={14} className="group-hover:bounce" />
            INSTALAR APP
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-stone-950"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* FLOATING DECORATIVE ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <motion.div 
            animate={{ 
                y: [0, -40, 0],
                x: [0, 20, 0],
                rotate: [0, 10, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] left-[10%] w-64 h-64 bg-brand-500/5 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
                y: [0, 40, 0],
                x: [0, -20, 0],
                rotate: [0, -10, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-brand-500/5 rounded-full blur-[120px]"
          />
      </div>

      {/* LEFT SIDE: BRANDING (Desktop Only - Becomes Background) */}
      <div className="hidden lg:block absolute inset-0 z-0 p-6">
        {/* Encapsulated Premium Frame */}
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-between group">
            
            {/* Background Image & Overlays */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920" 
                    alt="Premium Food" 
                    className="w-full h-full object-cover opacity-40 mix-blend-luminosity transition-transform duration-[20s] ease-out group-hover:scale-110"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-stone-950/95 via-stone-950/70 to-brand-950/30" />
                {/* Architectural Grid Overlay */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Corner Accents */}
            <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-white/10 rounded-tl-xl z-10 transition-all duration-700 group-hover:border-brand-500/50 group-hover:w-16 group-hover:h-16" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-white/10 rounded-tr-xl z-10 transition-all duration-700 group-hover:border-brand-500/50 group-hover:w-16 group-hover:h-16" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-white/10 rounded-bl-xl z-10 transition-all duration-700 group-hover:border-brand-500/50 group-hover:w-16 group-hover:h-16" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-white/10 rounded-br-xl z-10 transition-all duration-700 group-hover:border-brand-500/50 group-hover:w-16 group-hover:h-16" />

            <div className="relative z-10 w-full h-full p-16 flex flex-col justify-between">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-5"
            >
                <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,237,0,0.3)] overflow-hidden">
                    <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png'} />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-white tracking-tighter leading-none">TE LO LLEVO</h1>
                    <span className="text-[10px] font-bold text-brand-500 tracking-[0.3em] uppercase mt-1">Premium Delivery</span>
                </div>
            </motion.div>

            <div className="space-y-10">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Sparkles size={12} />
                        <span>Nueva Experiencia 2026</span>
                    </div>
                    <h2 className="text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase">
                        REDEFINE<br/>TU<br/><span className="text-brand-500">CIUDAD.</span>
                    </h2>
                    <p className="text-stone-400 font-medium mt-8 text-xl max-w-md leading-relaxed">
                        Accede a los mejores comercios, farmacias y restaurantes con un servicio diseñado para la excelencia.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-8"
                >
                    <div className="space-y-2">
                        <div className="text-3xl font-black text-white tracking-tighter">500+</div>
                        <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Aliados Estratégicos</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-3xl font-black text-white tracking-tighter">24/7</div>
                        <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Soporte Elite</div>
                    </div>
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4"
            >
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-stone-950 bg-stone-800 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <p className="text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                    Únete a más de <span className="text-white">10k usuarios</span> satisfechos
                </p>
            </motion.div>
        </div>
      </div>
      </div>

      {/* RIGHT SIDE: ACTIONS (Mobile & Desktop Overlay) */}
      <div className="relative z-10 w-full lg:w-[40%] lg:ml-auto h-full bg-white dark:bg-stone-950 overflow-y-auto scrollbar-hide border-l border-stone-800">
        {/* Subtle Background Grid for Right Side */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Mobile Header Background (Encapsulated) */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-72 bg-stone-950 z-0 overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000" 
                alt="Premium Food" 
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
                referrerPolicy="no-referrer"
            />
            {/* Architectural Grid Overlay */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/95 to-white dark:via-stone-950/95 dark:to-stone-950" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-12 relative z-10 max-w-md lg:max-w-lg mx-auto w-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="lg:hidden w-24 h-24 bg-brand-500 rounded-2xl flex items-center justify-center shadow-xl mb-8 mx-auto overflow-hidden">
                    <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png'} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight text-center lg:text-left leading-tight">
                    Tu puerta a la <br/><span className="text-brand-500 italic">Excelencia.</span>
                </h3>
                <p className="text-stone-600 dark:text-stone-400 font-medium mt-3 text-center lg:text-left text-base">
                    Inicia sesión para descubrir un mundo de posibilidades.
                </p>
            </motion.div>

            {/* Login Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10 space-y-4"
            >
                {!user ? (
                    <>
                        <button
                            onClick={handleLogin}
                            disabled={loading || isLoggingIn}
                            className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold py-4 px-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base border border-stone-800 dark:border-white"
                        >
                            {isLoggingIn ? (
                                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <LogIn size={20} className="text-brand-500" />
                            )}
                            {loading || isLoggingIn ? 'Procesando...' : 'Acceder con Google'}
                        </button>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-stone-950 px-2 text-stone-500">o</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleRoleSelection(UserRole.CLIENT, true)}
                            className="w-full bg-transparent text-stone-600 dark:text-stone-400 font-bold py-4 px-6 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-all flex items-center justify-center gap-3 text-base"
                        >
                            <UserIcon size={20} />
                            Entrar como Invitado (Demo)
                        </button>
                    </>
                ) : (
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-500 p-0.5 shadow-md">
                                <div className="w-full h-full rounded-[10px] overflow-hidden bg-stone-800">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">Perfil Activo</p>
                                <p className="text-sm font-black text-stone-900 dark:text-white truncate max-w-[160px]">{user.displayName}</p>
                            </div>
                        </div>
                        <button 
                            onClick={signOut}
                            className="text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Role Grid */}
            <div className="grid grid-cols-1 gap-4">
                <RoleButton 
                    icon={<ShoppingBag />} 
                    title="Realizar Pedido" 
                    subtitle="Cliente Final" 
                    variant="primary"
                    onClick={() => handleRoleSelection(UserRole.CLIENT, true)}
                    delay={0.2}
                />
                <div className="grid grid-cols-2 gap-4">
                    <RoleButton 
                        icon={<Store />} 
                        title="Vender" 
                        subtitle="Comercio" 
                        variant="secondary"
                        onClick={() => handleRoleSelection(UserRole.MERCHANT, true)}
                        delay={0.3}
                    />
                    <RoleButton 
                        icon={<Bike />} 
                        title="Repartir" 
                        subtitle="Driver" 
                        variant="secondary"
                        onClick={() => handleRoleSelection(UserRole.DRIVER, true)}
                        delay={0.4}
                    />
                </div>
                <RoleButton 
                    icon={<Shield />} 
                    title="Panel Administrativo" 
                    subtitle="Gestión de Plataforma" 
                    variant="dark"
                    onClick={() => handleRoleSelection(UserRole.ADMIN, true)}
                    delay={0.5}
                />
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-12 flex flex-col items-center gap-5"
            >
                <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600">
                    <Globe size={12} />
                    <span className="text-xs font-bold uppercase tracking-widest">Global Network • Secure Access</span>
                </div>
                <button
                    onClick={handleDevAccess}
                    className="group flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all uppercase tracking-wider"
                >
                    <Terminal size={14} className="group-hover:rotate-12 transition-transform" />
                    Terminal de Desarrollador
                </button>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

interface RoleButtonProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    variant: 'primary' | 'secondary' | 'dark';
    onClick: () => void;
    delay: number;
}

const RoleButton: React.FC<RoleButtonProps> = ({ icon, title, subtitle, variant, onClick, delay }) => {
    const variants = {
        primary: "bg-stone-900 border border-brand-500/30 text-white hover:border-brand-500/60 shadow-[0_0_20px_rgba(255,237,0,0.05)]",
        secondary: "bg-stone-900/50 border border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800/50",
        dark: "bg-stone-950 border border-stone-800 text-white hover:border-stone-700"
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", damping: 22 }}
            onClick={onClick}
            className={`w-full p-5 rounded-3xl flex flex-col items-start gap-4 group transition-all active:scale-[0.98] ${variants[variant]}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${variant === 'primary' ? 'bg-brand-500/10 text-brand-500' : 'bg-stone-800 text-stone-400 group-hover:text-white'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2 })}
            </div>
            <div className="w-full flex justify-between items-end">
                <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                        {subtitle}
                    </p>
                    <h4 className="font-black text-lg tracking-tight leading-none text-white">{title}</h4>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:translate-x-1 bg-stone-800/50 text-stone-400">
                    <ArrowRight size={16} />
                </div>
            </div>
        </motion.button>
    );
};

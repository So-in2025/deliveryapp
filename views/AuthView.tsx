
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, Store } from '../types';
import { ShoppingBag, Store as StoreIcon, Bike, ArrowRight, Shield, User as UserIcon, Globe, Download, ArrowLeft, Mail, Lock, User, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONFIG } from '../constants';

export const AuthView: React.FC = () => {
  const { user: appUser, createStore, updateUser, setRole, config, requestAdminAccess, myStore } = useApp();
  const { showToast } = useToast();
  const { user: authUser, login, loginEmail, registerEmail, resetPass, signOut, loading, resendVerification, reloadUser } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'NONE' | 'MERCHANT' | 'DRIVER'>('NONE');
  const [authMode, setAuthMode] = useState<'GOOGLE' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER' | 'FORGOT'>('GOOGLE');

  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  // Email Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('Comida');
  const [storeTime, setStoreTime] = useState('30');
  const [storeTaxId, setStoreTaxId] = useState('');
  const [storeBankName, setStoreBankName] = useState('');
  const [storeBankAccount, setStoreBankAccount] = useState('');
  const [storeClabe, setStoreClabe] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const [vehicleType, setVehicleType] = useState('Moto');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [vehicleInsurance, setVehicleInsurance] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

    const checkMerchantAccount = async (uid: string) => {
        if (appUser.ownedStoreId || myStore) return true;
        try {
            const { collection, query, where, getDocs, db, doc, getDoc } = await import('../firebase');
            const q = query(collection(db, 'stores'), where('ownerId', '==', uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const storeId = snap.docs[0].id;
                updateUser({ ownedStoreId: storeId }); // Auto fix
                return true;
            }
            
            // Fallback: check if store by ID exists in case ownerId was missing
            const fallbackStoreId = `store-${uid}`;
            const storeRef = doc(db, 'stores', fallbackStoreId);
            const storeSnap = await getDoc(storeRef);
            if (storeSnap.exists()) {
                updateUser({ ownedStoreId: fallbackStoreId }); // Auto fix
                return true;
            }
        } catch (e) {
            console.error('Error fetching store', e);
        }
        return false;
    };

  const handleRoleSelection = useCallback(async (role: UserRole, isGuest: boolean = false) => {
    if (!authUser && !isGuest) {
      setPendingRole(role);
      showToast("Por favor, inicia sesión para continuar", "info");
      setAuthMode('GOOGLE'); // Default to Google for quick login
      login();
      return;
    }
    
    if (isGuest) {
      updateUser({ role });
      setRole(role);
      return;
    }

    const hasDriverAccount = appUser.isDriver;
    const isActuallyAdmin = appUser.role === UserRole.ADMIN;

    if (role === UserRole.MERCHANT) {
      const hasMerchantAccount = await checkMerchantAccount(authUser.uid);
      if (!hasMerchantAccount) {
        setOnboardingStep('MERCHANT');
        return;
      }
    }
    
    // If selecting Driver but hasn't registered as driver, show onboarding form
    if (role === UserRole.DRIVER && !hasDriverAccount) {
      setOnboardingStep('DRIVER');
      return;
    }

    // Auto-fix profile if store ID was missing but store exists
    if (role === UserRole.MERCHANT && !appUser.ownedStoreId && myStore) {
        updateUser({ ownedStoreId: myStore.id });
    }

    // Only update DB role if they are NOT admin and it's a "promotion" 
    // or they don't have a primary role yet.
    if (!isActuallyAdmin && (appUser.role === UserRole.NONE || !appUser.role)) {
        updateUser({ role });
    }
    
    setRole(role);
  }, [authUser, appUser.ownedStoreId, appUser.role, appUser.isDriver, myStore, login, showToast, updateUser, setRole]);

  // Handle Redirection/Role selection after login
  useEffect(() => {
    // Only proceed if auth is ready AND appUser profile matches authUser (synced)
    if (authUser && pendingRole && appUser.uid === authUser.uid) {
      handleRoleSelection(pendingRole);
      setPendingRole(null);
    }
  }, [authUser, pendingRole, appUser.uid, handleRoleSelection]);

  const handleLogin = async () => {
      setIsLoggingIn(true);
      try {
          await login();
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const cleanEmail = email.trim();
      if (authMode === 'EMAIL_LOGIN') {
        await loginEmail(cleanEmail, password);
      } else if (authMode === 'EMAIL_REGISTER') {
        if (password !== confirmPassword) {
          showToast('Las contraseñas no coinciden', 'error');
          setIsLoggingIn(false);
          return;
        }
        if (password.length < 6) {
          showToast('La contraseña debe tener al menos 6 caracteres', 'error');
          setIsLoggingIn(false);
          return;
        }
        await registerEmail(cleanEmail, password, name.trim());
      } else if (authMode === 'FORGOT') {
        await resetPass(cleanEmail);
        setAuthMode('EMAIL_LOGIN');
      }
    } catch (err) {
      // Errors are handled in context
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if iOS
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && window.navigator.standalone);
    
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

  if (loading && !authUser) {
    return (
      <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 bg-brand-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-pulse">
            <ShoppingBag size={40} className="text-brand-950" />
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest dark:text-stone-400">Iniciando plataforma...</p>
        </div>
      </div>
    );
  }

  const handleRequestAdminAccess = async () => {
    if (!authUser) {
        showToast('Inicia sesión para solicitar acceso', 'info');
        return;
    }
    setIsRequestingAccess(true);
    await requestAdminAccess();
    setIsRequestingAccess(false);
    setShowAdminAccess(false);
  };

  const MEXICAN_BANKS = [
    'BBVA México', 'Santander México', 'Banorte', 'Citibanamex', 'HSBC México', 
    'Scotiabank', 'Banco Azteca', 'Bancoppel', 'Inbursa', 'Afirme', 'BanBajío', 
    'Banco del Bienestar', 'Nu México', 'Stori', 'Hey Banco'
  ];

  const handleRegisterMerchant = async () => {
      // Trim inputs for mobile autocorrect/space issues
      const tName = storeName.trim();
      const tTaxId = storeTaxId.trim().toUpperCase();
      const tClabe = storeClabe.trim();
      const tAddress = storeAddress.trim();
      const tPhone = storePhone.trim();

      if (!tName || !tAddress || !tPhone) {
          showToast('Por favor completa los campos obligatorios (Nombre, Dirección, Teléfono)', 'error');
          return;
      }
      
      // RFC Validation (13 chars: 4 letters, 6 numbers, 3 homoclave)
      const rfcRegex = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/i;
      if (tTaxId && !rfcRegex.test(tTaxId)) {
          showToast('RFC inválido. Debe tener 13 caracteres (4 letras, 6 números, 3 homoclave)', 'error');
          return;
      }

      // CLABE Validation (18 digits)
      const clabeRegex = /^[0-9]{18}$/;
      if (tClabe && !clabeRegex.test(tClabe)) {
          showToast('CLABE inválida. Debe tener 18 dígitos numéricos', 'error');
          return;
      }

      setIsLoggingIn(true);
      const storeId = `store-${authUser?.uid || Date.now()}`;
      const newStore: Store = {
          id: storeId,
          name: tName,
          category: storeCategory,
          rating: 5.0,
          reviewsCount: 0,
          deliveryTimeMin: Number(storeTime),
          deliveryTimeMax: Number(storeTime) + 15,
          deliveryFee: 45,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
          products: [],
          createdAt: new Date().toISOString(),
          ownerId: authUser?.uid || 'guest',
          taxId: tTaxId || undefined,
          bankName: storeBankName || undefined,
          bankAccount: storeBankAccount.trim() || undefined,
          clabe: tClabe || undefined,
          address: tAddress,
          phone: tPhone,
          isActive: false,
          isOpen: false
      };
      
      try {
          // 1. Create store first
          await createStore(newStore);
          
          // 2. Update user profile to link store AND set role atomically
          // We wait for this to be fully committed
          await updateUser({ 
            ownedStoreId: storeId, 
            role: UserRole.MERCHANT 
          });
          
          // 3. Ensure UI loader is off before transition
          setIsLoggingIn(false);
          
          // 4. Finally switch UI role
          setRole(UserRole.MERCHANT);
          setOnboardingStep('NONE');
          showToast('¡Tienda registrada con éxito!', 'success');
      } catch (error) {
          console.error('Error in handleRegisterMerchant:', error);
          showToast('Error al procesar el registro. Intenta de nuevo.', 'error');
          setIsLoggingIn(false);
      }
  };
  const handleRegisterDriver = () => {
      const phoneRegex = /^[0-9]{7,15}$/;
      if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
          showToast('Por favor completa todos los campos obligatorios correctamente', 'error');
          return;
      }
      updateUser({ 
          isDriver: true, 
          isApprovedDriver: false,
          role: UserRole.DRIVER, 
          phone: phoneNumber,
          driverLicense: driverLicense,
          vehicleInsurance: vehicleInsurance,
          vehiclePlate: vehiclePlate
      });
      showToast('Registro enviado. Tu cuenta está bajo revisión por el administrador.', 'success');
      setRole(UserRole.DRIVER);
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
                <div className="w-24 h-24 bg-brand-500 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(250,204,21,0.3)] overflow-hidden border-4 border-white/20 backdrop-blur-sm p-1">
                    <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" onError={(e) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png'} />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-white tracking-tighter leading-none">TE LO LLEVO</h1>
                    <span className="text-[10px] font-bold text-brand-500 tracking-[0.3em] uppercase mt-1">Delivery Cercano</span>
                </div>
            </motion.div>

            <div className="space-y-10">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                >
                    {/* Removed Trato Cercano badge */}
                    <h2 className="text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                        LO MEJOR DE<br/>NUESTRO<br/><span className="text-brand-500">PUEBLO.</span>
                    </h2>
                    <p className="text-stone-400 font-medium mt-8 text-xl max-w-md leading-relaxed">
                        Apoya el comercio local y recibe tus productos favoritos con la confianza y calidez de nuestra gente.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-8"
                >
                    <div className="space-y-2">
                        <div className="text-3xl font-black text-white tracking-tighter uppercase italic">Negocios</div>
                        <div className="text-xs text-stone-500 font-bold uppercase tracking-widest dark:text-stone-400">Locales</div>
                    </div>
                    <div className="space-y-2">
                        {/* Removed Trato Cercano */}
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
                            <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <p className="text-stone-500 text-[11px] font-bold uppercase tracking-wider dark:text-stone-400 italic">
                    CONECTANDO <span className="text-white">NEGOCIOS</span> LOCALES
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
                <div className="lg:hidden w-28 h-28 bg-brand-500 rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 mx-auto overflow-hidden p-1">
                    <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" onError={(e) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png'} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight text-center lg:text-left leading-tight">
                    Hasta la comodidad <br/><span className="text-brand-500 italic">de tu puerta.</span>
                </h3>
                <p className="text-stone-600 dark:text-stone-400 font-medium mt-3 text-center lg:text-left text-base">
                    Descubre un mundo de productos y servicios.
                </p>
            </motion.div>

            {/* Login Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10 space-y-4"
            >
                {authUser && !authUser.emailVerified && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-500/20 rounded-3xl p-5 mb-4 flex flex-col gap-3 shadow-xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
                                <Mail size={20} className="text-amber-950" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-black text-amber-950 dark:text-amber-500 uppercase tracking-widest leading-tight mb-1">Verificación Necesaria</h4>
                                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400 leading-snug italic">
                                    Hemos enviado un enlace a <span className="font-bold underline">{authUser.email}</span>. Es vital para la seguridad de tus transacciones.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={async () => {
                                    const { resendVerification } = await import('../context/AuthContext').then(m => m.useAuth()); // This won't work easily here, use hook from above
                                }}
                                // Wait, I already have resendVerification from useAuth hook
                                className="hidden"
                             ></button>
                             <Button 
                                size="sm" 
                                fullWidth 
                                onClick={resendVerification}
                                className="!bg-amber-500 !text-amber-950 !h-10 !text-[10px] !font-black shadow-lg shadow-amber-500/20"
                             >
                                REENVIAR CORREO
                             </Button>
                             <Button 
                                variant="outline"
                                size="sm" 
                                fullWidth 
                                onClick={reloadUser}
                                className="!h-10 !text-[10px] !font-black !border-amber-500/30"
                             >
                                YA VERIFICADO
                             </Button>
                        </div>
                    </motion.div>
                )}

                {!authUser ? (
                    <div className="space-y-4">
                        {authMode === 'GOOGLE' ? (
                            <div className="space-y-3">
                                <button
                                    onClick={handleLogin}
                                    disabled={loading || isLoggingIn}
                                    className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold py-4 px-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base border border-stone-800 dark:border-white"
                                >
                                    {isLoggingIn ? (
                                        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                    )}
                                    {loading || isLoggingIn ? 'Procesando...' : 'Acceder con Google'}
                                </button>
                                
                                <button
                                    onClick={() => setAuthMode('EMAIL_LOGIN')}
                                    className="w-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-bold py-4 px-6 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-3 text-base border border-amber-300 dark:border-stone-700"
                                >
                                    <Mail size={20} className="text-brand-500" />
                                    Ingresar con Correo
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailAuth} className="space-y-3">
                                {authMode === 'EMAIL_REGISTER' && (
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input type="text" 
                                            placeholder="Nombre completo" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                )}
                                
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input type="email" 
                                        placeholder="Correo electrónico" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    />
                                </div>

                                {authMode !== 'FORGOT' && (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input type="password" 
                                                placeholder="Contraseña" 
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            />
                                        </div>
                                        {authMode === 'EMAIL_REGISTER' && (
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                                <input type="password" 
                                                    placeholder="Confirmar contraseña" 
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl py-3.5 pl-11 pr-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoggingIn}
                                    className="w-full bg-brand-500 text-brand-950 font-bold py-4 px-6 rounded-2xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoggingIn ? (
                                        <div className="w-5 h-5 border-2 border-brand-950 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        authMode === 'EMAIL_LOGIN' ? 'Iniciar Sesión' : 
                                        authMode === 'EMAIL_REGISTER' ? 'Crear Cuenta' : 'Enviar Recuperación'
                                    )}
                                </button>

                                <div className="flex flex-col gap-2 text-center pt-2">
                                    {authMode === 'EMAIL_LOGIN' && (
                                        <>
                                            <button type="button" onClick={() => setAuthMode('EMAIL_REGISTER')} className="text-stone-500 dark:text-stone-400 hover:text-brand-500 text-xs font-bold transition-colors">
                                                ¿No tienes cuenta? REGÍSTRATE
                                            </button>
                                            <button type="button" onClick={() => setAuthMode('FORGOT')} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 text-[10px] uppercase tracking-widest transition-colors">
                                                Olvidé mi contraseña
                                            </button>
                                        </>
                                    )}
                                    {authMode === 'EMAIL_REGISTER' && (
                                        <button type="button" onClick={() => setAuthMode('EMAIL_LOGIN')} className="text-stone-500 dark:text-stone-400 hover:text-brand-500 text-xs font-bold transition-colors">
                                            ¿Ya tienes cuenta? INICIA SESIÓN
                                        </button>
                                    )}
                                    {authMode === 'FORGOT' && (
                                        <button type="button" onClick={() => setAuthMode('EMAIL_LOGIN')} className="text-stone-500 dark:text-stone-400 hover:text-brand-500 text-xs font-bold transition-colors">
                                            VOLVER AL INGRESO
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setAuthMode('GOOGLE')} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 text-[10px] uppercase tracking-widest transition-colors mt-2">
                                        OTRAS OPCIONES DE INGRESO
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-amber-300 dark:border-stone-800 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-500 p-0.5 shadow-md">
                                <div className="w-full h-full rounded-[10px] overflow-hidden bg-stone-800">
                                    {authUser.photoURL ? (
                                        <img src={authUser.photoURL} alt={authUser.displayName || ''} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">Perfil Activo</p>
                                <p className="text-sm font-black text-stone-900 dark:text-white truncate max-w-[160px]">{authUser.displayName}</p>
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

            {/* Role Grid or Onboarding Forms */}
            <AnimatePresence mode="wait">
                {onboardingStep === 'NONE' ? (
                    <motion.div 
                        key="roles"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        <RoleButton 
                            icon={<ShoppingBag />} 
                            title="Realizar Pedido" 
                            subtitle="Cliente Final" 
                            variant="primary"
                            onClick={() => handleRoleSelection(UserRole.CLIENT, false)}
                            delay={0.2}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <RoleButton 
                                icon={<StoreIcon />} 
                                title="Vender" 
                                subtitle="Comercio" 
                                variant="secondary"
                                onClick={() => handleRoleSelection(UserRole.MERCHANT, false)}
                                delay={0.3}
                            />
                            <RoleButton 
                                icon={<Bike />} 
                                title="Repartir" 
                                subtitle="Driver" 
                                variant="secondary"
                                onClick={() => handleRoleSelection(UserRole.DRIVER, false)}
                                delay={0.4}
                            />
                        </div>
                    </motion.div>
                ) : onboardingStep === 'MERCHANT' ? (
                    <motion.div 
                        key="merchant-onboarding"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => setOnboardingStep('NONE')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-stone-500 dark:text-stone-400" />
                            </button>
                            <div>
                                <h4 className="text-xl font-black text-stone-900 dark:text-white">Crea tu Tienda</h4>
                                <p className="text-sm text-stone-500 dark:text-stone-400">Completa tu perfil comercial</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[65vh] lg:max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Nombre del Local *</label>
                                <input type="text" 
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Ej. Tacos El Gordo"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">RFC (13 caracteres) (opcional)</label>
                                 <input type="text" 
                                     value={storeTaxId}
                                     onChange={(e) => setStoreTaxId(e.target.value)}
                                     placeholder="Ej. ABCD900101XYZ"
                                     maxLength={13}
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Banco (opcional)</label>
                                 <select 
                                     value={storeBankName}
                                     onChange={(e) => setStoreBankName(e.target.value)}
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
                                 >
                                     <option value="">Selecciona un banco</option>
                                     {MEXICAN_BANKS.map(bank => (
                                         <option key={bank} value={bank}>{bank}</option>
                                     ))}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">CLABE Interbancaria (18 dígitos) (opcional)</label>
                                 <input type="text" 
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                     value={storeClabe}
                                     onChange={(e) => setStoreClabe(e.target.value.replace(/\D/g, ''))}
                                     placeholder="18 dígitos (si aplica)"
                                     maxLength={18}
                                     autoComplete="off"
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Número de Cuenta (opcional)</label>
                                 <input type="text" 
                                     value={storeBankAccount}
                                     onChange={(e) => setStoreBankAccount(e.target.value)}
                                     placeholder="Número de cuenta"
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Dirección del Local *</label>
                                 <input type="text" 
                                     value={storeAddress}
                                     onChange={(e) => setStoreAddress(e.target.value)}
                                     placeholder="Ej. Av. Principal 123"
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Teléfono del Local *</label>
                                 <input type="tel" 
                                     value={storePhone}
                                     onChange={(e) => setStorePhone(e.target.value)}
                                     placeholder="Ej. 33 1234 5678"
                                     className="w-full bg-stone-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                 />
                             </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Categoría</label>
                                    <select 
                                        value={storeCategory}
                                        onChange={(e) => setStoreCategory(e.target.value)}
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        {config.categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Tiempo (Min)</label>
                                    <select 
                                        value={storeTime}
                                        onChange={(e) => setStoreTime(e.target.value)}
                                        className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="15">15 min</option>
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">60 min</option>
                                    </select>
                                </div>
                            </div>
                            <button 
                                onClick={handleRegisterMerchant}
                                disabled={isLoggingIn}
                                className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 text-brand-950 font-black py-4 px-6 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoggingIn ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-950 border-t-transparent" />
                                ) : (
                                    <>
                                        <StoreIcon size={20} />
                                        Abrir Tienda
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="driver-onboarding"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => setOnboardingStep('NONE')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-stone-500 dark:text-stone-400" />
                            </button>
                            <div>
                                <h4 className="text-xl font-black text-stone-900 dark:text-white">Sé Repartidor</h4>
                                <p className="text-sm text-stone-500 dark:text-stone-400">Configura tu vehículo</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[65vh] lg:max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Vehículo *</label>
                                <select 
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
                                >
                                    <option value="Moto">Motocicleta</option>
                                    <option value="Auto">Automóvil</option>
                                    <option value="Bici">Bicicleta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Teléfono de Contacto *</label>
                                <input type="tel" 
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Ej. 33 1234 5678"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Licencia de Conducir (Opcional)</label>
                                <input type="text" 
                                    value={driverLicense}
                                    onChange={(e) => setDriverLicense(e.target.value)}
                                    placeholder="Dejar en blanco si no aplica"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Placa del Vehículo (Opcional)</label>
                                <input type="text" 
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value)}
                                    placeholder="Dejar en blanco si no aplica"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Póliza de Seguro</label>
                                <input type="text" 
                                    value={vehicleInsurance}
                                    onChange={(e) => setVehicleInsurance(e.target.value)}
                                    placeholder="Número de póliza (Opcional)"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={handleRegisterDriver}
                                disabled={!phoneNumber}
                                className="w-full mt-4 bg-stone-900 dark:bg-white disabled:opacity-50 text-white dark:text-stone-900 font-black py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Bike size={20} />
                                Comenzar a Repartir
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-12 flex flex-col items-center gap-5"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600">
                        <Globe size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Infraestructura Segura • Acceso Encriptado</span>
                    </div>
                    
                    {/* Admin Access Portal - Professional & Discreet */}
                    {appUser?.role === UserRole.ADMIN ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleSelection(UserRole.ADMIN, false)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-900 border border-amber-300 dark:border-stone-800 text-stone-500 hover:text-brand-600 transition-all group dark:text-stone-400"
                        >
                            <Shield size={14} className="group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Portal Administrativo</span>
                        </motion.button>
                    ) : (
                        <button 
                            onClick={() => setShowAdminAccess(true)}
                            className="text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:text-stone-400 transition-colors dark:text-stone-400"
                        >
                            Acceso Staff
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Admin Access Modal */}
            <AnimatePresence>
                {showAdminAccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
                                    <Shield size={20} className="text-brand-950" />
                                </div>
                                <h4 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Acceso Staff</h4>
                            </div>
                                <button onClick={() => setShowAdminAccess(false)} className="text-stone-400 hover:text-stone-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                    El acceso al panel administrativo es restringido. Solo el personal autorizado puede gestionar la plataforma.
                                </p>
                                
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                        Si eres parte del equipo, solicita tu acceso. El desarrollador deberá aprobar tu cuenta desde la base de datos.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleRequestAdminAccess}
                                    disabled={isRequestingAccess || appUser?.adminAccessRequested}
                                    className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isRequestingAccess ? 'Enviando...' : appUser?.adminAccessRequested ? 'Solicitud Pendiente' : 'Solicitar Acceso'}
                                </button>
                                
                                <p className="text-[10px] text-center text-stone-400 uppercase tracking-widest font-bold">
                                    Seguridad Nivel Bancario
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
                {React.cloneElement(icon as React.ReactElement<unknown>, { size: 24, strokeWidth: 2 })}
            </div>
            <div className="w-full flex justify-between items-end">
                <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 dark:text-stone-400">
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

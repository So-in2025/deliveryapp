import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { resetAppData } from '../../services/dataService';
import { UserRole, Store } from '../../types';
import { Button } from './Button';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { X, User, Bell, Moon, LogOut, ChevronRight, Shield, HelpCircle, RefreshCcw, Store as StoreIcon, Bike, ArrowLeft, Camera, Check, MapPin, Clock, Download, ChefHat, ShoppingBag, FileText } from 'lucide-react';

// Internal navigation state for the overlay
type SettingsView = 'MAIN' | 'EDIT_PROFILE' | 'PRIVACY' | 'TERMS' | 'HELP' | 'REGISTER_MERCHANT' | 'REGISTER_DRIVER';

export const SettingsOverlay: React.FC = () => {
  const { isSettingsOpen, toggleSettings, user, updateUser, createStore, requestDriverAccess, stores, darkMode, toggleDarkMode, role, verifyAdminPin, setRole, config } = useApp();
  const { signOut, requestNotificationPermission } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<SettingsView>('MAIN');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Listen for custom event to open help directly
  useEffect(() => {
    const handleOpenHelp = () => {
      setCurrentView('HELP');
    };
    window.addEventListener('open-help', handleOpenHelp);
    return () => window.removeEventListener('open-help', handleOpenHelp);
  }, []);

  // Temporary State for forms
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted' && !!user.pushSubscription
  );

  const [merchantReg, setMerchantReg] = useState({ 
    name: '', category: 'Restaurante', address: '', time: '30', taxId: '', bankName: '', bankAccount: '', clabe: '', phone: '' 
  });
  const [driverReg, setDriverReg] = useState({ vehicleType: 'MOTO', phone: '' });

  const MEXICAN_BANKS = [
    'BBVA México', 'Santander México', 'Banorte', 'Citibanamex', 'HSBC México', 
    'Scotiabank', 'Banco Azteca', 'Bancoppel', 'Inbursa', 'Afirme', 'BanBajío', 
    'Banco del Bienestar', 'Nu México', 'Stori', 'Hey Banco'
  ];

  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Check if iOS
      const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIOS) {
        showToast('Para instalar en iOS: Toca compartir y luego "Agregar a Inicio"', 'info');
      } else {
        showToast('La app ya está instalada o tu navegador no soporta la instalación directa.', 'info');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!isSettingsOpen) return null;

  const handleLogout = async () => {
      await signOut();
      toggleSettings();
      setCurrentView('MAIN');
  };

  const handleReset = () => {
      // Removed window.confirm to ensure it works in iframes without being blocked
      showToast('Restaurando sistema...', 'info');
      setTimeout(() => {
        resetAppData();
        window.location.reload(); 
      }, 1000);
  };

  const toggleNotifications = async () => {
      if (!notificationsEnabled) {
          try {
              await requestNotificationPermission();
              setNotificationsEnabled(true);
          } catch (error) {
              console.error('Error enabling notifications:', error);
          }
      } else {
          setNotificationsEnabled(false);
          showToast('Notificaciones desactivadas localmente', 'info');
      }
  };

  const handlePrivacy = () => {
      setCurrentView('PRIVACY');
  };

  const handleSaveProfile = () => {
      updateUser({ name: editName, email: editEmail });
      showToast('Perfil actualizado', 'success');
      setCurrentView('MAIN');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              setIsUploadingAvatar(true);
              showToast('Subiendo foto...', 'info');
              const url = await uploadImageToCloudinary(e.target.files[0]);
              updateUser({ avatar: url });
              showToast('Foto de perfil actualizada', 'success');
          } catch (error) {
              console.error('Error uploading avatar:', error);
              showToast('Error al subir la foto', 'error');
          } finally {
              setIsUploadingAvatar(false);
          }
      }
  };

  const switchRole = async (newRole: UserRole) => {
      if (newRole === UserRole.ADMIN) {
          // If already admin in Firestore or config, just switch UI view
          if (user.role === UserRole.ADMIN || config.adminEmails?.includes(user.email)) {
              setRole(UserRole.ADMIN);
              showToast('Panel de Staff activado', 'success');
              toggleSettings();
              return;
          }

          const pin = prompt('Ingrese el PIN de administrador:');
          if (pin) {
              const isValid = await verifyAdminPin(pin);
              if (isValid) {
                  await updateUser({ role: UserRole.ADMIN });
                  setRole(UserRole.ADMIN);
                  showToast('Modo Administrador activado permanentemente', 'success');
                  toggleSettings();
              } else {
                  showToast('PIN incorrecto', 'error');
              }
          }
          return;
      }
      
      // Just switch the UI View (Session Role)
      // We DO NOT update Firestore role here to avoid downgrading Admins/Merchants
      setRole(newRole);
      toggleSettings();
  };

  // --- SUB-VIEWS ---
    
  // --- PARTNER REGISTRATION STATES ---

    const handleCreateStoreRequest = async () => {
        // Trim inputs
        const tName = merchantReg.name.trim();
        const tTaxId = merchantReg.taxId.trim().toUpperCase();
        const tClabe = merchantReg.clabe.trim();
        const tAddress = merchantReg.address.trim();
        const tPhone = merchantReg.phone.trim();

        if (!tName || !tTaxId || !tClabe || !merchantReg.bankName || !tAddress || !tPhone) {
            showToast('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        // RFC Validation (13 chars: 4 letters, 6 numbers, 3 homoclave)
        const rfcRegex = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/i;
        if (!rfcRegex.test(tTaxId)) {
            showToast('RFC inválido. Debe tener 13 caracteres (4 letras, 6 números, 3 homoclave)', 'error');
            return;
        }

        // CLABE Validation (18 digits)
        const clabeRegex = /^[0-9]{18}$/;
        if (!clabeRegex.test(tClabe)) {
            showToast('CLABE inválida. Debe tener 18 dígitos numéricos', 'error');
            return;
        }

        const storeId = `store-${user.uid || Date.now()}`;
        
        await createStore({
            id: storeId,
            name: tName,
            category: merchantReg.category,
            address: tAddress,
            rating: 5,
            reviewsCount: 0,
            deliveryTimeMin: Number(merchantReg.time),
            deliveryTimeMax: Number(merchantReg.time) + 15,
            deliveryFee: 45,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
            products: [],
            createdAt: new Date().toISOString(),
            ownerId: user.uid,
            taxId: tTaxId,
            bankName: merchantReg.bankName,
            bankAccount: merchantReg.bankAccount.trim(),
            clabe: tClabe,
            phone: tPhone,
            isActive: false,
            isOpen: false
        } as any);

        await updateUser({ 
            ownedStoreId: storeId, 
            role: UserRole.MERCHANT 
        });

        // Switch to MERCHANT view immediately
        setRole(UserRole.MERCHANT);
        setCurrentView('MAIN');
        toggleSettings();
        showToast('¡Tienda registrada con éxito!', 'success');
    };

    const handleDriverRequest = () => {
        if (!driverReg.phone) {
            showToast('Ingresa tu teléfono', 'error');
            return;
        }
        requestDriverAccess({
            phone: driverReg.phone,
            vehicleType: driverReg.vehicleType,
        } as any);
        setCurrentView('MAIN');
    };

    const renderMerchantRegistration = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                <div className="w-16 h-16 bg-brand-500/10 text-brand-600 rounded-2xl flex items-center justify-center mb-4">
                    <StoreIcon size={32} />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Registra tu Comercio</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Empieza a vender tus productos en la plataforma.</p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Nombre del Local *</label>
                    <input 
                        placeholder="Ej. Tacos El Gordo" 
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.name}
                        onChange={e => setMerchantReg({...merchantReg, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">RFC (13 Caracteres) *</label>
                    <input 
                        placeholder="Ej. ABCD900101XYZ" 
                        maxLength={13}
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.taxId}
                        onChange={e => setMerchantReg({...merchantReg, taxId: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Banco *</label>
                    <select 
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.bankName}
                        onChange={e => setMerchantReg({...merchantReg, bankName: e.target.value})}
                    >
                        <option value="">Selecciona un banco</option>
                        {MEXICAN_BANKS.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">CLABE Interbancaria *</label>
                    <input 
                        placeholder="18 dígitos numéricos" 
                        maxLength={18}
                        inputMode="numeric"
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.clabe}
                        onChange={e => setMerchantReg({...merchantReg, clabe: e.target.value.replace(/\D/g, '')})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Número de Cuenta (Opcional)</label>
                    <input 
                        placeholder="Cuenta bancaria" 
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.bankAccount}
                        onChange={e => setMerchantReg({...merchantReg, bankAccount: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Teléfono del Local *</label>
                    <input 
                        type="tel"
                        placeholder="Ej. 33 1234 5678" 
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.phone}
                        onChange={e => setMerchantReg({...merchantReg, phone: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Dirección del Local *</label>
                    <input 
                        placeholder="Ej. Av. Principal 123" 
                        className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                        value={merchantReg.address}
                        onChange={e => setMerchantReg({...merchantReg, address: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Categoría</label>
                        <select 
                            className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                            value={merchantReg.category}
                            onChange={e => setMerchantReg({...merchantReg, category: e.target.value})}
                        >
                            {config?.categories?.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            )) || <option value="Comida">Comida</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Tiempo (Min)</label>
                        <select 
                            className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white outline-none focus:border-brand-500"
                            value={merchantReg.time}
                            onChange={e => setMerchantReg({...merchantReg, time: e.target.value})}
                        >
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                        </select>
                    </div>
                </div>
                <Button fullWidth onClick={handleCreateStoreRequest} className="mt-4">Enviar Solicitud</Button>
            </div>

            <p className="text-[10px] text-center text-stone-400 font-bold uppercase tracking-wider">Tu solicitud será revisada por el equipo administrativo.</p>
        </div>
    );

    const renderDriverRegistration = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                    <Bike size={32} />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Únete como Repartidor</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Gana dinero realizando entregas en tu zona.</p>
            </div>

            <div className="space-y-4">
                <input 
                    placeholder="Teléfono (WhatsApp)" 
                    type="tel"
                    className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-900 dark:text-white font-mono"
                    value={driverReg.phone}
                    onChange={e => setDriverReg({...driverReg, phone: e.target.value})}
                />
                <div className="grid grid-cols-3 gap-2">
                    {['MOTO', 'BICI', 'AUTO'].map(v => (
                        <button 
                            key={v}
                            onClick={() => setDriverReg({...driverReg, vehicleType: v})}
                            className={`p-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${driverReg.vehicleType === v ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-stone-900 text-stone-500 border-stone-100 dark:border-stone-800'}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
                <Button fullWidth onClick={handleDriverRequest}>Enviar Solicitud</Button>
            </div>
            <p className="text-[10px] text-center text-stone-400 font-bold uppercase tracking-wider">Te notificaremos por WhatsApp tras validar tus datos.</p>
        </div>
    );

    const renderMainView = () => {
      const myStore = stores.find(s => s.id === user.ownedStoreId || s.ownerId === user.uid);
      const isMerchantPending = myStore && !myStore.isActive;
      const isDriverPending = user.isDriver && !user.isApprovedDriver;

      return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right transition-colors duration-300">
            {/* Partners Hub */}
            <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">Cambiar de Rol</h3>
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
                    
                    {/* Client Option */}
                    <div 
                        onClick={() => switchRole(UserRole.CLIENT)}
                        className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white">
                                    Modo Cliente
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                                    Pedir comida a domicilio
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                    </div>

                    {/* Merchant Option */}
                    <div 
                        onClick={() => {
                            if (isMerchantPending) {
                                switchRole(UserRole.MERCHANT);
                            } else if (myStore?.isActive) {
                                switchRole(UserRole.MERCHANT);
                            } else {
                                setCurrentView('REGISTER_MERCHANT');
                            }
                        }}
                        className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-950 dark:text-brand-400 rounded-lg group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                                <StoreIcon size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white">
                                    {isMerchantPending ? 'Comercio en Revisión' : myStore?.isActive ? 'Ir a mi Comercio' : 'Unirse como Comercio'}
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                                    {isMerchantPending 
                                        ? 'Tu solicitud está siendo validada' 
                                        : myStore?.isActive 
                                            ? 'Gestionar productos y pedidos' 
                                            : 'Vende tus productos en la plataforma'}
                                </p>
                            </div>
                        </div>
                        {isMerchantPending ? (
                            <Clock size={16} className="text-amber-500 animate-pulse" />
                        ) : (
                            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                        )}
                    </div>

                    {/* Driver Option */}
                    <div 
                        onClick={() => {
                            if (isDriverPending) {
                                switchRole(UserRole.DRIVER);
                            } else if (user.isApprovedDriver) {
                                switchRole(UserRole.DRIVER);
                            } else {
                                setCurrentView('REGISTER_DRIVER');
                            }
                        }}
                        className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                                <Bike size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white">
                                    {isDriverPending ? 'Driver en Revisión' : user.isApprovedDriver ? 'Ir a modo Driver' : 'Unirse como Driver'}
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                                    {isDriverPending 
                                        ? 'Validando tu información de seguridad' 
                                        : user.isApprovedDriver 
                                            ? 'Ver rutas y entregas' 
                                            : 'Gana dinero realizando entregas'}
                                </p>
                            </div>
                        </div>
                        {isDriverPending ? (
                            <Clock size={16} className="text-amber-500 animate-pulse" />
                        ) : (
                            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                        )}
                    </div>

                    {/* Admin Option - Professional & Discreet */}
                    {(user.role === UserRole.ADMIN || config.adminEmails?.includes(user.email)) && (
                        <div 
                            onClick={() => switchRole(UserRole.ADMIN)}
                            className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                        >
                            <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                                <div className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-stone-900 dark:text-white uppercase tracking-tight">
                                        Panel de Staff Admin
                                    </p>
                                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-widest">
                                        Gestionar Plataforma
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                        </div>
                    )}

                    {/* Back to Hub Option - Always visible for quick switching */}
                    <div 
                        onClick={() => { setRole(UserRole.NONE); toggleSettings(); }}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white uppercase tracking-tight">
                                    Menu Principal (Hub)
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">
                                    Regresar a Selección de Rol
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                    </div>
                </div>
            </div>
            
            {/* General Settings */}
            <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">General</h3>
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
                    <div onClick={() => { setEditName(user.name); setEditEmail(user.email); setCurrentView('EDIT_PROFILE'); }}>
                        <SettingItem icon={<User size={18} />} label="Editar Perfil" />
                    </div>
                    <SettingItem icon={<Bell size={18} />} label="Notificaciones" hasSwitch active={notificationsEnabled} onClick={toggleNotifications} />
                    <SettingItem icon={<Moon size={18} />} label="Modo Oscuro" hasSwitch active={darkMode} onClick={toggleDarkMode} />
                    <div onClick={handlePrivacy}>
                        <SettingItem icon={<Shield size={18} />} label="Privacidad y Datos" />
                    </div>
                    <div onClick={() => setCurrentView('HELP')}>
                        <SettingItem icon={<HelpCircle size={18} />} label="Ayuda y Soporte" />
                    </div>
                    <div onClick={() => setCurrentView('TERMS')}>
                        <SettingItem icon={<FileText size={18} />} label="Términos y Condiciones" />
                    </div>
                    <div onClick={handleInstallApp}>
                        <SettingItem icon={<Download size={18} />} label="Instalar Aplicación" />
                    </div>
                </div>
            </div>

             {/* Debug Actions */}
             <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
                <div 
                    onClick={handleReset}
                    className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer text-red-600 dark:text-red-400 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <RefreshCcw size={18} />
                        <span className="font-medium text-sm">Restaurar Datos de Fábrica</span>
                    </div>
                </div>
            </div>

            <div className="px-2">
                <p className="text-xs text-center text-stone-400 mb-4">Versión 1.0.8 (Onboarding)</p>
                <button 
                    onClick={handleLogout}
                    className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50"
                >
                    <LogOut size={18} />
                    Cambiar Usuario / Salir
                </button>
            </div>
      </div>
  );
};

  const renderEditProfileView = () => (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right transition-colors duration-300">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 text-center transition-colors duration-300">
              <div className="w-24 h-24 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full mb-4 relative overflow-hidden group">
                  {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100 dark:bg-stone-800">
                          <User size={32} />
                      </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {isUploadingAvatar ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                          <Camera size={20} className="text-white" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload} 
                        disabled={isUploadingAvatar}
                      />
                  </label>
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white">Foto de Perfil</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Toca para cambiar</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 space-y-4 transition-colors duration-300">
              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Nombre Completo</label>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Correo Electrónico</label>
                  <input 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>
          </div>

          <Button fullWidth onClick={handleSaveProfile}>Guardar Cambios</Button>
      </div>
  );

  const renderPrivacyView = () => (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-stone-950 animate-slide-in-right">
          <div className="prose prose-stone dark:prose-invert max-w-none text-sm space-y-4 text-stone-600 dark:text-stone-400">
              <p className="font-bold text-stone-900 dark:text-white">Última actualización: 6 de Abril, 2026</p>
              <p>En <span className="font-bold text-brand-600">Te lo Llevo</span>, la privacidad de nuestros vecinos es prioridad. Esta política detalla cómo manejamos tu información en nuestra comunidad.</p>
              
              <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">1. Datos que Recopilamos</h4>
              <p>Para que tus pedidos lleguen correctamente, necesitamos: Nombre, Teléfono, Dirección exacta (con referencias locales) y Correo electrónico. También guardamos tu historial de pedidos para ofrecerte mejores promociones.</p>
              
              <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">2. Geolocalización</h4>
              <p>Si eres cliente, usamos tu ubicación solo para mostrarte comercios cercanos y calcular el costo de envío. Si eres repartidor, rastreamos tu ubicación en tiempo real solo mientras estás en un pedido activo para seguridad de todos.</p>
              
              <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">3. Uso de Cookies y Almacenamiento</h4>
              <p>Usamos almacenamiento local para mantener tu sesión iniciada y recordar tus productos en el carrito, evitando que pierdas tu progreso si se cierra la app.</p>
              
              <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">4. Tus Derechos</h4>
              <p>Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento desde esta configuración o contactando a soporte técnico local.</p>
          </div>
      </div>
  );

  const renderTermsView = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-stone-950 animate-slide-in-right">
        <div className="prose prose-stone dark:prose-invert max-w-none text-sm space-y-4 text-stone-600 dark:text-stone-400">
            <p className="font-bold text-stone-900 dark:text-white">Última actualización: 6 de Abril, 2026</p>
            <p>Bienvenido a <span className="font-bold text-brand-600">Te lo Llevo</span>. Al usar nuestra app, aceptas estas reglas diseñadas para una convivencia sana en nuestra comunidad.</p>
            
            <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">1. Naturaleza del Servicio</h4>
            <p><span className="font-bold">Te lo Llevo</span> es una plataforma tecnológica de intermediación. No preparamos comida ni somos dueños de los vehículos de reparto. Conectamos vecinos con comercios locales.</p>
            
            <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">2. Deslinde de Responsabilidad (Productos)</h4>
            <p>La calidad, temperatura, sabor y estado de los productos son responsabilidad exclusiva del comercio que los prepara. Cualquier reclamo sobre el producto debe dirigirse al comercio a través de nuestro sistema de tickets.</p>
            
            <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">3. Deslinde de Responsabilidad (Accidentes)</h4>
            <p>Los repartidores (Drivers) actúan como prestadores independientes. <span className="font-bold">Te lo Llevo</span> no se hace responsable por accidentes de tránsito, daños a terceros o lesiones sufridas por los repartidores durante el ejercicio de su actividad. Cada repartidor debe contar con su propio seguro de vida y vehículo vigente.</p>
            
            <h4 className="font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest mt-6">4. Comportamiento del Usuario</h4>
            <p>Nos reservamos el derecho de bloquear cuentas que falten al respeto a repartidores o personal de comercios. Queremos una comunidad basada en el respeto mutuo.</p>
        </div>
    </div>
);

  const renderHelpView = () => {
    const helpContent = {
      [UserRole.CLIENT]: (
        <div className="space-y-6">
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-3">
              <HelpCircle size={16} className="text-brand-500" /> Preguntas Frecuentes (FAQ)
            </h4>
            <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="font-bold text-xs text-brand-600 dark:text-brand-400 uppercase mb-1">¿Cuál es la zona de cobertura?</p>
                    <p className="text-xs">Cubrimos todo el casco urbano y barrios periféricos hasta 8km del centro. Si tu dirección no aparece, contáctanos.</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="font-bold text-xs text-brand-600 dark:text-brand-400 uppercase mb-1">¿Qué hago si mi pedido llegó mal?</p>
                    <p className="text-xs">Ve a "Mis Pedidos", selecciona el pedido y toca "Iniciar Reclamo". Adjunta una foto y el comercio te dará una solución inmediata.</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <p className="font-bold text-xs text-brand-600 dark:text-brand-400 uppercase mb-1">¿Cuáles son los horarios?</p>
                    <p className="text-xs">La app funciona 24/7, pero la disponibilidad depende de los horarios de cada comercio (generalmente de 11:00 a 23:00).</p>
                </div>
            </div>
          </section>
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <ShoppingBag size={16} className="text-brand-500" /> Cómo Pedir
            </h4>
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li>Elige tu comercio favorito.</li>
              <li>Personaliza tu pedido con extras.</li>
              <li>Paga con Mercado Pago o Efectivo.</li>
            </ul>
          </section>
        </div>
      ),
      [UserRole.MERCHANT]: (
        <div className="space-y-6">
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <Bell size={16} className="text-brand-500" /> Gestión de Pedidos
            </h4>
            <p className="text-xs">Recibirás una alerta sonora con cada pedido nuevo. Debes aceptarlo para iniciar la preparación.</p>
          </section>
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <ChefHat size={16} className="text-brand-500" /> Tu Menú
            </h4>
            <p className="text-xs">Puedes añadir fotos reales usando Cloudinary y configurar modificadores para tus platos.</p>
          </section>
        </div>
      ),
      [UserRole.DRIVER]: (
        <div className="space-y-6">
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <Bike size={16} className="text-brand-500" /> Aceptar Entregas
            </h4>
            <p className="text-xs">Verás la distancia al comercio y al cliente antes de aceptar cualquier pedido disponible.</p>
          </section>
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <Check size={16} className="text-brand-500" /> Proceso de Entrega
            </h4>
            <p className="text-xs">Marca como "Retirado" al salir del local y "Entregado" al llegar con el cliente.</p>
          </section>
        </div>
      ),
      [UserRole.ADMIN]: (
        <div className="space-y-6">
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <Shield size={16} className="text-brand-500" /> Seguridad Global
            </h4>
            <p className="text-xs">El acceso a configuraciones críticas requiere validación de PIN en el servidor.</p>
          </section>
          <section>
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
              <RefreshCcw size={16} className="text-brand-500" /> Mantenimiento
            </h4>
            <p className="text-xs">Asegúrate de que las API Keys de Mercado Pago y Cloudinary estén configuradas en las variables de entorno.</p>
          </section>
        </div>
      )
    };

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-stone-950 animate-slide-in-right">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-white">Centro de Ayuda</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Guía rápida para tu rol actual</p>
          </div>
        </div>
        
        <div className="text-stone-600 dark:text-stone-400 text-sm">
          {helpContent[role as UserRole] || helpContent[UserRole.CLIENT]}
        </div>

        <div className="mt-8 p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase mb-2">¿Necesitas más ayuda?</p>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Consulta el manual completo en formato PDF o contacta a soporte técnico.</p>
          <button className="w-full py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <Download size={14} /> Descargar Manual Completo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in pointer-events-auto"
        onClick={toggleSettings}
      ></div>
      
      <div className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-white dark:bg-stone-900 shadow-2xl pointer-events-auto animate-slide-in-right flex flex-col transition-colors duration-300">
        {/* Dynamic Header */}
        <div className="p-6 bg-stone-900 dark:bg-black text-white relative overflow-hidden shrink-0 transition-all duration-300">
             <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-brand-500 rounded-full opacity-20 blur-2xl"></div>
             
             <div className="flex justify-between items-start relative z-10">
                 {currentView !== 'MAIN' ? (
                     <button onClick={() => setCurrentView('MAIN')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                         <ArrowLeft size={20} />
                     </button>
                 ) : (
                    <div className="w-8"></div> // Spacer
                 )}

                 <button 
                    onClick={toggleSettings}
                    className="p-2 -mr-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                 >
                     <X size={20} className="text-white" />
                 </button>
             </div>

             {currentView === 'MAIN' ? (
                 <div className="flex items-center gap-4 mt-2 relative z-10 animate-fade-in">
                     <div className="w-16 h-16 bg-brand-600 rounded-full border-4 border-stone-800 dark:border-stone-900 flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
                         {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}
                     </div>
                     <div>
                         <h2 className="font-bold text-lg leading-tight">{user.name}</h2>
                         <p className="text-stone-400 text-xs">{user.email}</p>
                         <span className="inline-block mt-1 px-2 py-0.5 bg-brand-500/20 text-brand-300 text-[10px] font-bold rounded uppercase tracking-wider border border-brand-500/30">
                             Miembro Gold
                         </span>
                     </div>
                 </div>
             ) : (
                 <div className="mt-2 text-center animate-fade-in">
                     <h2 className="font-bold text-xl">
                        {currentView === 'EDIT_PROFILE' && 'Editar Perfil'}
                        {currentView === 'PRIVACY' && 'Privacidad'}
                        {currentView === 'TERMS' && 'Términos'}
                        {currentView === 'HELP' && 'Ayuda'}
                        {currentView === 'REGISTER_MERCHANT' && 'Registro Comercio'}
                        {currentView === 'REGISTER_DRIVER' && 'Registro Repartidor'}
                     </h2>
                 </div>
             )}
        </div>

        {/* Dynamic Content */}
        {currentView === 'MAIN' && renderMainView()}
        {currentView === 'EDIT_PROFILE' && renderEditProfileView()}
        {currentView === 'PRIVACY' && renderPrivacyView()}
        {currentView === 'TERMS' && renderTermsView()}
        {currentView === 'HELP' && renderHelpView()}
        {currentView === 'REGISTER_MERCHANT' && renderMerchantRegistration()}
        {currentView === 'REGISTER_DRIVER' && renderDriverRegistration()}
      </div>
      
      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-in-right {
            animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const SettingItem: React.FC<{ icon: React.ReactNode; label: string; hasSwitch?: boolean; active?: boolean; onClick?: () => void }> = ({ icon, label, hasSwitch, active, onClick }) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-700 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-700 active:bg-stone-100 dark:active:bg-stone-600 transition-colors cursor-pointer">
        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </div>
        {hasSwitch ? (
            <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-brand-500' : 'bg-stone-200 dark:bg-stone-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'left-5' : 'left-1'}`}></div>
            </div>
        ) : (
            <ChevronRight size={16} className="text-stone-300 dark:text-stone-500" />
        )}
    </div>
);
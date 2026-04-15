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
type SettingsView = 'MAIN' | 'EDIT_PROFILE' | 'REGISTER_MERCHANT' | 'REGISTER_DRIVER' | 'PRIVACY' | 'TERMS' | 'HELP';

export const SettingsOverlay: React.FC = () => {
  const { isSettingsOpen, toggleSettings, user, updateUser, createStore, darkMode, toggleDarkMode, role, verifyAdminPin, setRole } = useApp();
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
  
  // Store Reg State
  const [storeName, setStoreName] = useState('');
  const [storeLegalName, setStoreLegalName] = useState('');
  const [storeTaxId, setStoreTaxId] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeBankAccount, setStoreBankAccount] = useState('');
  const [storeCategory, setStoreCategory] = useState('Hamburguesas');
  const [storeTime, setStoreTime] = useState('20');
  
  // Driver Reg State
  const [driverVehicle, setDriverVehicle] = useState('Moto');
  const [driverPlate, setDriverPlate] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverInsurance, setDriverInsurance] = useState('');

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

  const handleRegisterMerchant = () => {
      if (user.uid === 'guest') {
          showToast('Debes iniciar sesión con Google para crear una tienda real.', 'error');
          return;
      }
      
      if (!storeName || !storeLegalName || !storeTaxId || !storePhone) {
          showToast('Por favor completa todos los campos obligatorios', 'error');
          return;
      }

      const newStore: Store = {
          id: `store-${Date.now()}`,
          name: storeName,
          category: storeCategory,
          rating: 5.0, // Heuristic: New stores start high
          reviewsCount: 0,
          deliveryTimeMin: Number(storeTime),
          deliveryTimeMax: Number(storeTime) + 15,
          deliveryFee: 45,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // Default fancy image
          products: [],
          createdAt: new Date().toISOString(), // Triggers "NEW" badge
          ownerId: user.uid,
          legalName: storeLegalName,
          taxId: storeTaxId,
          phone: storePhone,
          bankAccount: storeBankAccount
      };
      createStore(newStore);
      updateUser({ ownedStoreId: newStore.id, role: UserRole.MERCHANT });
      setRole(UserRole.MERCHANT);
      showToast('¡Local creado exitosamente!', 'success');
      toggleSettings();
      setCurrentView('MAIN');
  };

  const handleRegisterDriver = () => {
      const phoneRegex = /^[0-9]{7,15}$/;
      if (!driverPhone || !phoneRegex.test(driverPhone) || !driverLicense || !driverPlate) {
          showToast('Por favor completa todos los campos obligatorios correctamente', 'error');
          return;
      }

      updateUser({ 
          isDriver: true, 
          role: UserRole.DRIVER, 
          phone: driverPhone,
          driverLicense: driverLicense,
          vehicleInsurance: driverInsurance,
          vehiclePlate: driverPlate
      });
      setRole(UserRole.DRIVER);
      showToast('¡Registro de Driver completo!', 'success');
      toggleSettings();
      setCurrentView('MAIN');
  };

  const switchRole = async (newRole: UserRole) => {
      if (newRole === UserRole.ADMIN) {
          const pin = prompt('Ingrese el PIN de administrador:');
          if (pin) {
              const isValid = await verifyAdminPin(pin);
              if (isValid) {
                  updateUser({ role: UserRole.ADMIN });
                  setRole(UserRole.ADMIN);
                  showToast('Modo Administrador activado', 'success');
                  toggleSettings();
              } else {
                  showToast('PIN incorrecto', 'error');
              }
          }
          return;
      }
      updateUser({ role: newRole });
      setRole(newRole);
      toggleSettings();
  };

  // --- SUB-VIEWS ---

  const renderMainView = () => (
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
                        onClick={() => user.ownedStoreId ? switchRole(UserRole.MERCHANT) : setCurrentView('REGISTER_MERCHANT')}
                        className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-950 dark:text-brand-400 rounded-lg group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                                <StoreIcon size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white">
                                    {user.ownedStoreId ? 'Ir a mi Comercio' : 'Registrar mi Negocio'}
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                                    {user.ownedStoreId ? 'Gestionar productos y pedidos' : 'Vende tus productos aquí'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                    </div>

                    {/* Driver Option */}
                    <div 
                        onClick={() => user.isDriver ? switchRole(UserRole.DRIVER) : setCurrentView('REGISTER_DRIVER')}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-300">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                                <Bike size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-stone-900 dark:text-white">
                                    {user.isDriver ? 'Ir a modo Driver' : 'Registrarme como Driver'}
                                </p>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                                    {user.isDriver ? 'Ver rutas y entregas' : 'Gana dinero repartiendo'}
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
                    <div onClick={toggleNotifications}>
                        <SettingItem icon={<Bell size={18} />} label="Notificaciones" hasSwitch active={notificationsEnabled} />
                    </div>
                    <div onClick={toggleDarkMode}>
                        <SettingItem icon={<Moon size={18} />} label="Modo Oscuro" hasSwitch active={darkMode} />
                    </div>
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

  const renderRegisterMerchantView = () => (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right transition-colors duration-300">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-brand-950 shadow-lg shadow-brand-900/20">
              <StoreIcon size={32} className="mb-3 opacity-80" />
              <h2 className="text-xl font-bold">Crea tu Tienda</h2>
              <p className="text-brand-900/80 text-sm mt-1">Empieza a vender en minutos. Completamente gratis para empezar.</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 space-y-5 transition-colors duration-300">
              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Nombre del Local</label>
                  <input 
                    placeholder="Ej: Burger King"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Razón Social / Nombre Legal</label>
                  <input 
                    placeholder="Ej: Burger King S.A."
                    value={storeLegalName}
                    onChange={(e) => setStoreLegalName(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">RFC / Identificación Fiscal</label>
                      <input 
                        placeholder="30-XXXXXXXX-X"
                        value={storeTaxId}
                        onChange={(e) => setStoreTaxId(e.target.value)}
                        className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Teléfono Comercial</label>
                      <input 
                        placeholder="11 1234 5678"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                      />
                  </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">CBU / Cuenta Bancaria (Pagos)</label>
                  <input 
                    placeholder="0000000000000000000000"
                    value={storeBankAccount}
                    onChange={(e) => setStoreBankAccount(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>
              
              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Categoría</label>
                  <select 
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium appearance-none text-stone-900 dark:text-white transition-colors"
                  >
                      <option>Hamburguesas</option>
                      <option>Pizza & Pasta</option>
                      <option>Japonesa</option>
                      <option>Mexicana</option>
                      <option>Cafetería</option>
                      <option>Postres</option>
                  </select>
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Tiempo de Entrega (min)</label>
                  <div className="flex items-center gap-2 mt-1">
                      <Clock size={18} className="text-stone-400" />
                      <input 
                        type="number"
                        placeholder="20"
                        value={storeTime}
                        onChange={(e) => setStoreTime(e.target.value)}
                        className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-brand-500 font-medium text-stone-900 dark:text-white transition-colors"
                      />
                  </div>
              </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex gap-3 items-start text-sm text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 transition-colors duration-300">
               <Check size={18} className="shrink-0 mt-0.5" />
               <p>Al crear tu tienda, aparecerás inmediatamente en la sección <b>"Nuevos en la App"</b> con visibilidad destacada.</p>
          </div>

          <Button fullWidth onClick={handleRegisterMerchant} disabled={!storeName} className="bg-brand-500 hover:bg-brand-600 text-brand-950 shadow-brand-500/30">
              Lanzar Negocio
          </Button>
      </div>
  );

  const renderRegisterDriverView = () => (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right transition-colors duration-300">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-900/20">
              <Bike size={32} className="mb-3 opacity-80" />
              <h2 className="text-xl font-bold">Únete como Driver</h2>
              <p className="text-amber-100 text-sm mt-1">Gana dinero extra con tu vehículo en tus propios horarios.</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 space-y-5 transition-colors duration-300">
              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Tipo de Vehículo</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                      {['Moto', 'Bici', 'Auto', 'Pie'].map(v => (
                          <div 
                            key={v}
                            onClick={() => setDriverVehicle(v)}
                            className={`p-3 rounded-xl border text-center font-bold text-sm cursor-pointer transition-all ${driverVehicle === v ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400' : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'}`}
                          >
                              {v}
                          </div>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Teléfono de Contacto</label>
                  <input 
                    placeholder="11 1234 5678"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-amber-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Número de Licencia</label>
                  <input 
                    placeholder="ABC-123456"
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-amber-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Póliza de Seguro (Opcional)</label>
                  <input 
                    placeholder="Nro de Póliza"
                    value={driverInsurance}
                    onChange={(e) => setDriverInsurance(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-amber-500 font-medium text-stone-900 dark:text-white transition-colors"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Patente / ID Vehículo</label>
                  <input 
                    placeholder="ABC-123"
                    value={driverPlate}
                    onChange={(e) => setDriverPlate(e.target.value)}
                    className="w-full mt-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 outline-none focus:border-amber-500 font-medium uppercase text-stone-900 dark:text-white transition-colors"
                  />
              </div>
          </div>

           <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-xl flex gap-3 items-center text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 transition-colors duration-300">
               <MapPin size={18} />
               <p>Tu ubicación se compartirá solo cuando estés activo.</p>
          </div>

          <Button fullWidth onClick={handleRegisterDriver} className="bg-amber-500 hover:bg-amber-600 shadow-amber-500/30">
              Completar Registro
          </Button>
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
                        {currentView === 'REGISTER_MERCHANT' && 'Registro'}
                        {currentView === 'REGISTER_DRIVER' && 'Registro'}
                        {currentView === 'PRIVACY' && 'Privacidad'}
                        {currentView === 'TERMS' && 'Términos'}
                        {currentView === 'HELP' && 'Ayuda'}
                     </h2>
                 </div>
             )}
        </div>

        {/* Dynamic Content */}
        {currentView === 'MAIN' && renderMainView()}
        {currentView === 'EDIT_PROFILE' && renderEditProfileView()}
        {currentView === 'REGISTER_MERCHANT' && renderRegisterMerchantView()}
        {currentView === 'REGISTER_DRIVER' && renderRegisterDriverView()}
        {currentView === 'PRIVACY' && renderPrivacyView()}
        {currentView === 'TERMS' && renderTermsView()}
        {currentView === 'HELP' && renderHelpView()}
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
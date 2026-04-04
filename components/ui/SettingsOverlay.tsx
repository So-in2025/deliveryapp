import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { resetAppData } from '../../services/dataService';
import { UserRole, Store } from '../../types';
import { Button } from './Button';
import { X, User, Bell, Moon, LogOut, ChevronRight, Shield, HelpCircle, RefreshCcw, Store as StoreIcon, Bike, ArrowLeft, Camera, Check, MapPin, Clock, Sparkles, Download } from 'lucide-react';
import { APP_CONFIG } from '../../constants';

// Internal navigation state for the overlay
type SettingsView = 'MAIN' | 'EDIT_PROFILE' | 'REGISTER_MERCHANT' | 'REGISTER_DRIVER' | 'PRIVACY';

export const SettingsOverlay: React.FC = () => {
  const { isSettingsOpen, toggleSettings, role, setRole, user, updateUser, createStore, darkMode, toggleDarkMode, stores, isDriverOnline, toggleDriverStatus } = useApp();
  const { signOut, requestNotificationPermission } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<SettingsView>('MAIN');

  // Temporary State for forms
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted' && !!user.fcmToken
  );
  
  // Store Reg State
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('Hamburguesas');
  const [storeTime, setStoreTime] = useState('20');
  
  // Driver Reg State
  const [driverVehicle, setDriverVehicle] = useState('Moto');
  const [driverPlate, setDriverPlate] = useState('');

  // Demo State
  const [demoStoreId, setDemoStoreId] = useState(user.ownedStoreId || (stores.length > 0 ? stores[0].id : 's1'));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
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
      setRole(UserRole.NONE);
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
          await requestNotificationPermission();
          setNotificationsEnabled(true);
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

  const handleRegisterMerchant = () => {
      const newStore: Store = {
          id: `store-${Date.now()}`,
          name: storeName || 'Mi Nuevo Local',
          category: storeCategory,
          rating: 5.0, // Heuristic: New stores start high
          reviewsCount: 0,
          deliveryTimeMin: Number(storeTime),
          deliveryTimeMax: Number(storeTime) + 15,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // Default fancy image
          products: [],
          createdAt: new Date().toISOString() // Triggers "NEW" badge
      };
      createStore(newStore);
      updateUser({ ownedStoreId: newStore.id });
      showToast('¡Local creado exitosamente!', 'success');
      setRole(UserRole.MERCHANT);
      toggleSettings();
      setCurrentView('MAIN');
  };

  const handleRegisterDriver = () => {
      updateUser({ isDriver: true });
      showToast('¡Registro de Driver completo!', 'success');
      setRole(UserRole.DRIVER);
      toggleSettings();
      setCurrentView('MAIN');
  };

  const switchToRole = (newRole: UserRole, storeId?: string) => {
      // DEMO AUTOMATION: Ensure user has necessary permissions/data for the role
      if (newRole === UserRole.MERCHANT) {
          const targetStoreId = storeId || user.ownedStoreId || 's1';
          const targetStore = stores.find(s => s.id === targetStoreId);
          updateUser({ ownedStoreId: targetStoreId });
          showToast(`Modo Demo: Tienda "${targetStore?.name || targetStoreId}" asignada.`, 'info');
      } else if (newRole === UserRole.DRIVER) {
          const updates: Partial<typeof user> = {};
          if (!user.isDriver) updates.isDriver = true;
          updateUser(updates);
          
          // Auto-connect driver
          if (!isDriverOnline) {
             toggleDriverStatus();
          }
          showToast('Modo Demo: Driver activado y conectado.', 'info');
      }

      setRole(newRole);
      toggleSettings();
  };

  // --- SUB-VIEWS ---

  const renderMainView = () => (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-950 animate-slide-in-right transition-colors duration-300">
            {/* Partners Hub */}
            <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">Zona Partners</h3>
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-colors duration-300">
                    
                    {/* Merchant Option */}
                    <div 
                        onClick={() => user.ownedStoreId ? switchToRole(UserRole.MERCHANT) : setCurrentView('REGISTER_MERCHANT')}
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
                        onClick={() => user.isDriver ? switchToRole(UserRole.DRIVER) : setCurrentView('REGISTER_DRIVER')}
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
                        <SettingItem icon={<Shield size={18} />} label="Privacidad y Seguridad" />
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

            {/* Demo Role Switcher (For Client Demo) */}
            <div className="bg-stone-900 rounded-2xl shadow-sm border border-stone-800 overflow-hidden p-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles size={12} className="text-yellow-400" /> Demo: Cambiar Rol
                </h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <button onClick={() => switchToRole(UserRole.CLIENT)} className="p-2 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors">Cliente</button>
                    <button onClick={() => switchToRole(UserRole.MERCHANT, demoStoreId)} className="p-2 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors">Comercio</button>
                    <button onClick={() => switchToRole(UserRole.DRIVER)} className="p-2 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors">Driver</button>
                    <button onClick={() => switchToRole(UserRole.ADMIN)} className="p-2 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors">Admin</button>
                </div>
                {role === UserRole.MERCHANT && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">Tienda Demo:</span>
                        <select 
                            value={demoStoreId}
                            onChange={(e) => {
                                const newStoreId = e.target.value;
                                setDemoStoreId(newStoreId);
                                if (role === UserRole.MERCHANT) {
                                    updateUser({ ownedStoreId: newStoreId });
                                    showToast(`Tienda cambiada a ${stores.find(s => s.id === newStoreId)?.name}`, 'info');
                                }
                            }}
                            className="flex-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs rounded p-1 outline-none focus:border-brand-500"
                        >
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
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
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={20} className="text-white" />
                  </div>
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
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase ml-1">Patente / ID (Opcional)</label>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 dark:bg-stone-900 animate-slide-in-right">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 text-center">
              <div className="w-16 h-16 mx-auto bg-brand-500 rounded-full flex items-center justify-center mb-4">
                  <Shield size={32} className="text-brand-950" />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white">Protección de Datos</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Tus datos están encriptados y almacenados localmente en tu dispositivo.</p>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
              <div className="p-4 border-b border-stone-50 dark:border-stone-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-stone-400" />
                      <div>
                          <p className="font-medium text-sm text-stone-900 dark:text-white">Ubicación Precisa</p>
                          <p className="text-[10px] text-stone-400">Usada para calcular entregas</p>
                      </div>
                  </div>
                  <div className="w-10 h-6 bg-brand-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
              </div>
              <div className="p-4 border-b border-stone-50 dark:border-stone-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <User size={18} className="text-stone-400" />
                      <div>
                          <p className="font-medium text-sm text-stone-900 dark:text-white">Perfil Público</p>
                          <p className="text-[10px] text-stone-400">Visible para comercios</p>
                      </div>
                  </div>
                  <div className="w-10 h-6 bg-brand-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <Bell size={18} className="text-stone-400" />
                      <div>
                          <p className="font-medium text-sm text-stone-900 dark:text-white">Alertas de Seguridad</p>
                          <p className="text-[10px] text-stone-400">Notificar accesos sospechosos</p>
                      </div>
                  </div>
                  <div className="w-10 h-6 bg-brand-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
              </div>
          </div>
          
          <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-xl flex gap-3 items-start text-xs text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
               <HelpCircle size={16} className="shrink-0 mt-0.5" />
               <p>Esta aplicación cumple con los estándares de privacidad GDPR y CCPA. Puedes solicitar la eliminación de tus datos en cualquier momento.</p>
          </div>
      </div>
  );

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
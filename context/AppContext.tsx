
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { soundService } from '../services/soundService';
import { UserRole, Order, Store, Product, OrderStatus, CartItem, Modifier, PaymentMethod, OrderType, Coupon, UserProfile, ViewState, Review, MerchantViewState, DriverViewState, AdminViewState, AppNotification, GlobalConfig } from '../types';
import { loadCart, saveCart } from '../services/dataService';
import { APP_CONFIG } from '../constants';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { db, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp, Timestamp, query, where, or, OperationType, handleFirestoreError, messaging, onMessage } from '../firebase';
import { io, Socket } from 'socket.io-client';

// App Context Type and Provider
interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: UserProfile; 
  users: UserProfile[];
  updateUser: (data: Partial<UserProfile>) => void;
  updateAnyUser: (userId: string, data: Partial<UserProfile>) => void;
  createStore: (store: Store) => void;
  orders: Order[];
  stores: Store[]; 
  cart: CartItem[];
  favorites: string[];
  coupons: Coupon[];
  drivers: {id: string, name: string}[]; 
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  toggleFavorite: (storeId: string) => void;
  addToCart: (product: Product, quantity: number, modifiers: Modifier[], storeId: string) => void;
  updateCartItemQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  placeOrder: (storeId: string, storeName: string, address: string, paymentMethod: PaymentMethod, notes: string, type: OrderType, discount?: number, coordinates?: { lat: number, lng: number }) => void;
  getRouteDistance: (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => Promise<number>;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  updateOrder: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  submitClaim: (orderId: string, reason: string) => void;
  resolveClaim: (orderId: string, resolution: 'RESOLVED' | 'REJECTED') => void;
  assignDriver: (orderId: string, driverId: string) => void;
  addProduct: (storeId: string, product: Product) => void;
  updateProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  bulkAddProducts: (storeId: string, products: Product[]) => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
  addReview: (review: Review) => void;
  reviews: Review[];
  createPaymentPreference: (orderId: string, items: { name: string, price: number, quantity: number }[]) => Promise<{ id: string, init_point: string } | null>;
  updateStore: (storeId: string, data: Partial<Store>) => void;
  updateLocation: (lat: number, lng: number) => void;
  socket: Socket | null;
  
  // Chat Real-time
  sendMessage: (orderId: string, text: string) => Promise<void>;
  subscribeToChat: (orderId: string, callback: (messages: ChatMessage[]) => void) => () => void;
  
  isDriverOnline: boolean;
  toggleDriverStatus: () => void;
  // Lifted Client State for Global Navigation
  clientViewState: ViewState;
  setClientViewState: (view: ViewState) => void;
  // Lifted Merchant State
  merchantViewState: MerchantViewState;
  setMerchantViewState: (view: MerchantViewState) => void;
  // Lifted Driver State
  driverViewState: DriverViewState;
  setDriverViewState: (view: DriverViewState) => void;
  // Lifted Admin State
  adminViewState: AdminViewState;
  setAdminViewState: (view: AdminViewState) => void;
  
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  cartStoreId: string | null;
  resetOrders: () => void; // New: For forcing a reset of orders
  darkMode: boolean;
  toggleDarkMode: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  notifications: AppNotification[];
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Global Config
  config: GlobalConfig;
  updateConfig: (data: Partial<GlobalConfig>) => void;
  
  // Driver GPS Simulation
  driverLocation: { lat: number, lng: number };
  setDriverLocation: (loc: { lat: number, lng: number }) => void;
  completeTour: (tourId: string) => void;
  requestAdminAccess: () => Promise<void>;
  
  // Referral System
  validateReferralCode: (code: string) => Promise<boolean>;
  applyReferralCode: (code: string) => Promise<void>;
  setPendingRole: (role: UserRole | null) => void;
  setPendingAction: (action: { type: 'PLACE_ORDER'; data: any } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
    uid: 'guest',
    name: 'Invitado',
    email: 'invitado@demo.com',
    role: UserRole.NONE,
    avatar: undefined,
    isDriver: false,
    ownedStoreId: undefined,
    addresses: ['Mi Ubicación Actual']
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { user: authUser, profile: authProfile, isAuthReady } = useAuth();

  const [role, setRoleState] = useState<UserRole>(UserRole.NONE);
  
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'PLACE_ORDER'; data: any } | null>(null);

  const updateUser = useCallback(async (data: Partial<UserProfile>) => {
    if (!authUser?.uid || authUser.uid === 'guest') {
      setUser(prev => ({ ...prev, ...data }));
      return;
    }
    try {
      await updateDoc(doc(db, 'users', authUser.uid), data);
      // Local state will be updated by the onSnapshot listener in AuthContext -> useEffect in AppContext
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, [authUser?.uid]);

  const updateAnyUser = useCallback(async (userId: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      console.error('Error updating any user:', error);
    }
  }, []);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDriverOnline, setIsDriverOnline] = useState(false); // Session state

  // Global Config State
  const [config, setConfig] = useState<GlobalConfig>({
    platformCommissionPct: APP_CONFIG.platformCommissionPct,
    driverCommissionPct: APP_CONFIG.driverCommissionPct,
    baseDeliveryFee: APP_CONFIG.baseDeliveryFee,
    feePerKm: APP_CONFIG.feePerKm,
    supportEmail: 'soporte@telollevo.com',
    maintenanceMode: false,
    paymentMode: 'CENTRALIZED',
    categories: ['Comida', 'Supermercado', 'Farmacia', 'Mascotas', 'Servicios Profesionales'],
    maxDeliveryRadiusKm: 10, // Default 10km
    centerCoordinates: { lat: -34.6037, lng: -58.3816 }, // Default center
    referralRewardAmount: 500, // $500 reward
    referralDiscountPct: 0.05, // 5% off for the new user
    firstPurchaseDiscountPct: 0.20 // 20% off
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('codex_notifications_v1');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('codex_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50

    // Trigger Native Browser Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/vite.svg', // Fallback icon
          badge: '/vite.svg',
          vibrate: [200, 100, 200]
        });
      } catch (e) {
        console.error('Error showing native notification:', e);
      }
    }
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  const initialLoadRef = React.useRef({
    orders: true,
    stores: true,
    users: true,
    reviews: true
  });

  // Derive real drivers from users collection
  const drivers = useMemo(() => {
    return users
      .filter(u => u.role === UserRole.DRIVER)
      .map(u => ({ id: u.uid, name: u.name }));
  }, [users]);

  // Socket.io State
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the same host that serves the frontend
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && authUser?.uid && isDriverOnline) {
      socket.emit('driver_online', authUser.uid);
    }
  }, [socket, authUser?.uid, isDriverOnline]);

  // Driver GPS State
  const [driverLocation, setDriverLocation] = useState({ lat: -34.6037, lng: -58.3816 });

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setDriverLocation({ lat, lng });
    if (authUser?.uid) {
      // 1. High-frequency update via WebSockets
      if (socket) {
        socket.emit('update_location', { driverId: authUser.uid, lat, lng });
      }
      
      // 2. Low-frequency update to Firestore (throttled/optional, keeping it here for persistence but could be optimized further)
      try {
        await updateDoc(doc(db, 'users', authUser.uid), { lat, lng });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }
  }, [authUser?.uid, socket]);

  const updateConfig = async (data: Partial<GlobalConfig>) => {
    const newConfig = { ...config, ...data };
    setConfig(newConfig);
    try {
      await setDoc(doc(db, 'config', 'global'), newConfig);
    } catch (error) {
      console.error('Error updating global config:', error);
    }
  };

  // Listen for foreground FCM messages
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      if (payload.notification) {
        addNotification({
          title: payload.notification.title || 'Nueva Notificación',
          message: payload.notification.body || '',
          type: 'SYSTEM'
        });
      }
    });
    return () => unsubscribe();
  }, [addNotification]);

  // Referral Code Generation
  useEffect(() => {
    if (authUser?.uid && user.name && !user.referralCode && user.role !== UserRole.NONE) {
      const generateCode = () => {
        const prefix = user.name.slice(0, 4).toUpperCase().replace(/\s/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${random}`;
      };
      
      const newCode = generateCode();
      updateUser({ referralCode: newCode, referralEarnings: 0, isFirstPurchaseDone: false });
    }
  }, [authUser?.uid, user.name, user.referralCode, user.role, updateUser]);

  const validateReferralCode = async (code: string): Promise<boolean> => {
    if (!code) return false;
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', code.toUpperCase()));
      const snapshot = await onSnapshot(q, () => {}); // This is just to check existence, but we need a one-time get
      // Actually, let's use a simple fetch or assume it's valid if found in users state
      const found = users.find(u => u.referralCode === code.toUpperCase());
      return !!found && found.uid !== authUser?.uid;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!authUser?.uid) return;
    const isValid = await validateReferralCode(code);
    if (isValid) {
      await updateUser({ referredBy: code.toUpperCase() });
      showToast(`¡Código aplicado! Obtendrás un ${(config.referralDiscountPct * 100)}% extra en tu primera compra`, 'success');
    } else {
      showToast('Código de referido inválido', 'error');
    }
  };

  // Sync User Profile from AuthContext
  useEffect(() => {
    console.log('AuthProfile changed:', authProfile);
    if (authProfile) {
      setUser(authProfile);
      
      // Handle pending role selection from AuthView
      if (pendingRole) {
        setRoleState(pendingRole);
        updateUser({ role: pendingRole });
        setPendingRole(null);
      } else if (authProfile.role && role === UserRole.NONE) {
        // Automatically restore role from profile if none is set
        setRoleState(authProfile.role);
      }

      setIsDriverOnline(!!authProfile.isOnline);
    } else {
      setUser(DEFAULT_USER);
      setRoleState(UserRole.NONE);
      setIsDriverOnline(false);
    }
  }, [authProfile, pendingRole, role, updateUser]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    // Listen to Stores (Phase 1: Cached Backend Fetch)
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const storesData = await response.json();
          // If merchant, filter locally to avoid complex backend logic for now
          if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
            setStores(storesData.filter((s: Store) => s.id === authProfile.ownedStoreId));
          } else {
            setStores(storesData);
          }
        } else {
          console.error('Failed to fetch stores from backend');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };

    fetchStores();
    // Refresh stores every 5 minutes (matches Redis TTL)
    const storesInterval = setInterval(fetchStores, 300000);

    // Listen to Orders (Filtered by role)
    let ordersQuery;
    if (authProfile?.role === 'ADMIN') {
      ordersQuery = collection(db, 'orders');
    } else if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
      ordersQuery = query(collection(db, 'orders'), where('storeId', '==', authProfile.ownedStoreId));
    } else if (authProfile?.role === 'DRIVER' && authUser?.uid) {
      ordersQuery = query(collection(db, 'orders'), or(
        where('driverId', '==', authUser.uid),
        where('status', 'in', ['READY', 'PREPARING', 'ACCEPTED'])
      ));
    } else if (authUser?.uid) {
      // Default to CLIENT
      ordersQuery = query(collection(db, 'orders'), where('customerId', '==', authUser.uid));
    }

    let unsubscribeOrders = () => {};
    if (ordersQuery) {
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data, 
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() 
          } as Order;
        });

        // Sound feedback for new orders or status changes
        if (!initialLoadRef.current.orders) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              soundService.play('NEW_ORDER');
              addNotification({
                title: 'Nuevo Pedido',
                message: `Has recibido un nuevo pedido (#${change.doc.id.slice(-4)})`,
                type: 'ORDER',
                orderId: change.doc.id
              });
            } else if (change.type === 'modified') {
              const newData = change.doc.data() as Order;
              soundService.play('NOTIFICATION');
              addNotification({
                title: 'Actualización de Pedido',
                message: `El pedido #${change.doc.id.slice(-4)} ahora está ${newData.status}`,
                type: 'ORDER',
                orderId: change.doc.id
              });
            }
          });
        }

        setOrders(ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        initialLoadRef.current.orders = false;
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Orders permission denied - user might not have access yet');
        } else {
          handleFirestoreError(error, OperationType.GET, 'orders');
        }
      });
    }

    // Listen to Users (Admins see all, others see drivers for tracking)
    let usersQuery;
    if (authProfile?.role === 'ADMIN') {
      usersQuery = collection(db, 'users');
    } else {
      // Everyone can see drivers for real-time tracking
      usersQuery = query(collection(db, 'users'), where('role', '==', 'DRIVER'));
    }

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn('Users permission denied - access not yet propagated');
      } else {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    });

    // Listen to Reviews (Optimized by role)
    let reviewsQuery;
    if (authProfile?.role === 'ADMIN') {
      reviewsQuery = collection(db, 'reviews');
    } else if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
      reviewsQuery = query(collection(db, 'reviews'), where('storeId', '==', authProfile.ownedStoreId));
    } else if (authUser?.uid) {
      // Clients see reviews for stores (could be limited later)
      reviewsQuery = collection(db, 'reviews');
    }

    let unsubscribeReviews = () => {};
    if (reviewsQuery) {
      unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(reviewsData);
      }, (error) => {
        console.warn('Reviews listener error:', error.message);
      });
    }

    // Listen to Global Config
    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GlobalConfig;
        setConfig(prev => ({
          ...prev,
          ...data,
          categories: data.categories || prev.categories
        }));
      } else {
        // Create initial config if it doesn't exist
        setDoc(doc(db, 'config', 'global'), {
          platformCommissionPct: APP_CONFIG.platformCommissionPct,
          driverCommissionPct: APP_CONFIG.driverCommissionPct,
          baseDeliveryFee: APP_CONFIG.baseDeliveryFee,
          feePerKm: APP_CONFIG.feePerKm,
          supportEmail: 'soporte@telollevo.com',
          maintenanceMode: false,
          paymentMode: 'CENTRALIZED',
          categories: ['Comida', 'Supermercado', 'Farmacia', 'Mascotas', 'Servicios Profesionales']
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'config/global'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/global');
    });

    // Listen to Coupons
    let couponsQuery;
    if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
      couponsQuery = query(collection(db, 'coupons'), where('storeId', '==', authProfile.ownedStoreId));
    } else {
      // Clients and Admins see all coupons (Clients will filter by storeId in UI)
      couponsQuery = collection(db, 'coupons');
    }

    const unsubscribeCoupons = onSnapshot(couponsQuery, (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
      setCoupons(couponsData);
    });

    return () => {
      clearInterval(storesInterval);
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeReviews();
      unsubscribeConfig();
      unsubscribeCoupons();
    };
  }, [isAuthReady, authProfile, authUser?.uid, addNotification]);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('codex_theme') === 'dark';
      }
      return false;
  });

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('codex_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('codex_theme', 'light');
      }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Lifted State
  const [clientViewState, setClientViewState] = useState<ViewState>('BROWSE');
  const [merchantViewState, setMerchantViewState] = useState<MerchantViewState>('ORDERS');
  const [driverViewState, setDriverViewState] = useState<DriverViewState>('MAP');
  const [adminViewState, setAdminViewState] = useState<AdminViewState>('DASHBOARD');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      soundService.setEnabled(next);
      return next;
    });
  };

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
      const loaded = loadCart();
      if (!loaded) return [];
      // Safety check for legacy cart items
      if (loaded.length > 0 && typeof (loaded[0] as unknown as { totalPrice?: number }).totalPrice === 'undefined') {
          return [];
      }
      return loaded as unknown as CartItem[];
  });
  
  const [cartStoreId, setCartStoreId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('codex_cart_store_v1');
      }
      return null; 
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('codex_favorites_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('codex_favorites_v1', JSON.stringify(favorites));
  }, [favorites]);

  const toggleSettings = () => setIsSettingsOpen(prev => !prev);
  
  const toggleDriverStatus = () => {
      const nextStatus = !isDriverOnline;
      setIsDriverOnline(nextStatus);
      updateUser({ isOnline: nextStatus });
      showToast(nextStatus ? 'Ahora estás en línea' : 'Desconectado', 'info');
  };

  const createStore = async (newStore: Store) => {
      try {
        const storeId = newStore.id || `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, 'stores', storeId), {
          ...newStore,
          id: storeId,
          createdAt: serverTimestamp()
        });
        await updateUser({ ownedStoreId: storeId });
        showToast('Tienda creada con éxito', 'success');
      } catch (error) {
        console.error('Error creating store:', error);
        showToast('Error al crear la tienda. Verifica que hayas iniciado sesión.', 'error');
      }
  };

  const addToCart = (product: Product, quantity: number, modifiers: Modifier[], storeId: string) => {
    // Check for store conflict
    if (cart.length > 0 && cartStoreId && cartStoreId !== storeId) {
        // Automatically clear cart if adding from a different store to avoid blocking confirm dialogs
        setCart([]);
        saveCart([]);
    }
    
    setCartStoreId(storeId);
    localStorage.setItem('codex_cart_store_v1', storeId);

    const modifiersTotal = modifiers.reduce((acc, mod) => acc + mod.price, 0);
    const unitPrice = product.price + modifiersTotal;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => {
          if (item.product.id !== product.id) return false;
          if (item.selectedModifiers.length !== modifiers.length) return false;
          const itemModIds = item.selectedModifiers.map(m => m.id).sort().join(',');
          const newModIds = modifiers.map(m => m.id).sort().join(',');
          return itemModIds === newModIds;
      });

      let newCart;
      if (existingIndex > -1) {
        newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
      } else {
        newCart = [...prev, { product, quantity, selectedModifiers: modifiers, totalPrice: unitPrice }];
      }
      
      saveCart(newCart);
      return newCart;
    });
  };

  const clearCart = useCallback(() => {
      setCart([]);
      saveCart([]);
      setCartStoreId(null);
      localStorage.removeItem('codex_cart_store_v1');
  }, []);

  const updateCartItemQuantity = (index: number, quantity: number) => {
      setCart(prev => {
          const newCart = [...prev];
          if (quantity <= 0) {
              newCart.splice(index, 1);
          } else {
              newCart[index].quantity = quantity;
          }
          saveCart(newCart);
          if (newCart.length === 0) {
              setCartStoreId(null);
              localStorage.removeItem('codex_cart_store_v1');
          }
          return newCart;
      });
  };

  const removeFromCart = (index: number) => {
      setCart(prev => {
          const newCart = [...prev];
          newCart.splice(index, 1);
          saveCart(newCart);
          if (newCart.length === 0) {
              setCartStoreId(null);
              localStorage.removeItem('codex_cart_store_v1');
          }
          return newCart;
      });
  };

  const resetOrders = () => {
      // For demo purposes, we could clear local state, but Firestore is the source of truth
      showToast('Los pedidos se gestionan en tiempo real desde la nube.', 'info');
  };

  const toggleFavorite = (storeId: string) => {
    setFavorites(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  // Payment Callback Handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const path = window.location.pathname;

    if (path === '/order-success' && orderId) {
      // Update order status to PAID
      const updateRef = doc(db, 'orders', orderId);
      updateDoc(updateRef, { paymentStatus: 'PAID' }).then(() => {
          clearCart();
          setSelectedStore(null);
          setClientViewState('TRACKING');
          showToast('¡Pago exitoso! Tu pedido está siendo procesado.', 'success');
          // Clean URL
          window.history.replaceState({}, '', '/');
      });
    } else if (path === '/order-failure' && orderId) {
      const updateRef = doc(db, 'orders', orderId);
      updateDoc(updateRef, { paymentStatus: 'FAILED' }).then(() => {
          showToast('El pago ha fallado. Intenta de nuevo.', 'error');
          setClientViewState('CHECKOUT');
          window.history.replaceState({}, '', '/');
      });
    } else if (path === '/order-pending' && orderId) {
      showToast('Pago pendiente de acreditación.', 'info');
      setClientViewState('TRACKING');
      window.history.replaceState({}, '', '/');
    }
  }, [clearCart, showToast, setClientViewState]);

  const getRouteDistance = useCallback(async (start: { lat: number, lng: number }, end: { lat: number, lng: number }): Promise<number> => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes.length > 0) {
        return data.routes[0].distance / 1000; // Convert meters to km
      }
      return 0;
    } catch (error) {
      console.error('Error fetching OSRM route:', error);
      return 0;
    }
  }, []);

  const requestAdminAccess = async () => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db, 'users', authUser.uid), { 
        adminAccessRequested: true,
        requestedAt: serverTimestamp()
      });
      showToast('Solicitud enviada. Contacta al desarrollador para aprobación.', 'info');
    } catch (error) {
      console.error('Error requesting admin access:', error);
      showToast('Error al enviar solicitud', 'error');
    }
  };

  const sendMessage = async (orderId: string, text: string) => {
    if (!authUser || !user) return;
    try {
      const message: Omit<ChatMessage, 'id'> = {
        orderId,
        senderId: authUser.uid,
        senderName: user.name,
        senderRole: role,
        text,
        timestamp: serverTimestamp(),
        readBy: [authUser.uid]
      };
      await addDoc(collection(db, 'chats', orderId, 'messages'), message);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Error al enviar mensaje', 'error');
    }
  };

  const subscribeToChat = (orderId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(collection(db, 'chats', orderId, 'messages'), where('orderId', '==', orderId));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date() 
        } as ChatMessage;
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback(messages);
    }, (error) => {
      console.error('Chat subscription error:', error);
    });
  };

  const createPaymentPreference = useCallback(async (orderId: string, items: { name: string, price: number, quantity: number }[], storeId: string) => {
    try {
      const store = stores.find(s => s.id === storeId);
      const customAccessToken = config.paymentMode === 'DECENTRALIZED' ? store?.mpAccessToken : null;

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, items, customAccessToken })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error creating payment preference:', error);
      return null;
    }
  }, [stores, config]);

  const placeOrder = useCallback(async (storeId: string, storeName: string, address: string, paymentMethod: PaymentMethod, notes: string, type: OrderType, discount: number = 0, coordinates?: { lat: number, lng: number }) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    
    // Geofencing Check
    if (type === OrderType.DELIVERY && coordinates && config.maxDeliveryRadiusKm > 0) {
      const distance = await getRouteDistance(config.centerCoordinates, coordinates);
      if (distance > config.maxDeliveryRadiusKm) {
        showToast(`Lo sentimos, el domicilio está fuera de nuestra zona de cobertura (${config.maxDeliveryRadiusKm}km)`, 'error');
        return;
      }
    }

    // Dynamic Delivery Fee Logic
    const store = stores.find(s => s.id === storeId);
    const deliveryFee = type === OrderType.DELIVERY ? (store?.deliveryFee ?? config.baseDeliveryFee) : 0;
    
    // Retention Logic: First Purchase & Referral
    let firstPurchaseDiscount = 0;
    let referralDiscount = 0;

    if (!user.isFirstPurchaseDone) {
      firstPurchaseDiscount = subtotal * config.firstPurchaseDiscountPct;
    }

    if (user.referredBy && !user.isFirstPurchaseDone) {
      referralDiscount = subtotal * config.referralDiscountPct;
    }

    const totalDiscount = (discount || 0) + firstPurchaseDiscount + referralDiscount;
    const total = Math.max(0, subtotal + deliveryFee - totalDiscount);

    // Commissions Calculation: Use store-specific commission if available, otherwise global
    const storeCommissionPct = store?.commissionPct ?? config.platformCommissionPct;
    const platformCommission = subtotal * storeCommissionPct;
    const driverEarnings = deliveryFee * config.driverCommissionPct;
    const merchantEarnings = subtotal - platformCommission;
    
    const orderId = `ord-${Date.now()}`;
    const newOrder: Partial<Order> = {
      storeId,
      storeName,
      total,
      subtotal,
      deliveryFee,
      platformCommission,
      driverEarnings,
      merchantEarnings,
      status: OrderStatus.PENDING,
      items: cart,
      createdAt: serverTimestamp(),
      address: type === OrderType.PICKUP ? 'Retiro en Local' : address,
      customerName: user.name,
      customerId: authUser?.uid,
      paymentMethod,
      notes,
      type,
      isReviewed: false,
      paymentStatus: paymentMethod === PaymentMethod.MERCADO_PAGO ? 'PENDING' : 'PAID',
      coordinates,
      firstPurchaseDiscount,
      referralDiscount
    };
    
    try {
      // If payment is Mercado Pago, we create the preference but don't clear cart yet
      // The actual order creation happens after the user returns from MP or we create it as PENDING
      if (paymentMethod === PaymentMethod.MERCADO_PAGO) {
          const items = cart.map(item => ({
              name: item.product.name,
              price: item.totalPrice,
              quantity: item.quantity
          }));
          
          // Add delivery fee as an item if applicable
          if (deliveryFee > 0) {
              items.push({
                  name: 'Costo de Envío',
                  price: deliveryFee,
                  quantity: 1
              });
          }

          const preference = await createPaymentPreference(orderId, items, storeId);
          if (preference) {
              // Save order as PENDING with preferenceId
              await setDoc(doc(db, 'orders', orderId), { ...newOrder, preferenceId: preference.id });
              // Redirect to Mercado Pago
              window.location.href = preference.init_point;
              return;
          } else {
              throw new Error('Error al crear la preferencia de pago');
          }
      }

      // For Cash/Card, create order immediately
      await setDoc(doc(db, 'orders', orderId), newOrder);
      
      // Update User Retention Flags
      if (!user.isFirstPurchaseDone) {
        await updateUser({ isFirstPurchaseDone: true });
        
        // If referred, reward the referrer
        if (user.referredBy) {
          const referrer = users.find(u => u.referralCode === user.referredBy);
          if (referrer) {
            await updateAnyUser(referrer.uid, { 
              referralEarnings: (referrer.referralEarnings || 0) + config.referralRewardAmount 
            });
            
            // Notify referrer
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: referrer.uid,
                title: '¡Ganaste un premio!',
                body: `Tu amigo ${user.name} hizo su primera compra. ¡Recibiste $${config.referralRewardAmount}!`,
                url: '/wallet'
              })
            }).catch(console.error);
          }
        }
      }

      clearCart();
      setSelectedStore(null);
      setClientViewState('TRACKING');
      showToast('¡Pedido realizado con éxito!', 'success');
      
      // Notify Merchant
      if (store?.ownerId) {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: store.ownerId,
            title: 'Nuevo Pedido',
            body: `Has recibido un nuevo pedido de ${user.name}`,
            url: '/merchant/orders'
          })
        }).catch(console.error);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error al procesar el pedido', 'error');
    }
  }, [cart, config, getRouteDistance, stores, user, authUser, updateUser, updateAnyUser, clearCart, setSelectedStore, setClientViewState, showToast, users, createPaymentPreference]);

  // Execute pending actions after login and role restoration
  useEffect(() => {
    if (authUser && role !== UserRole.NONE && pendingAction) {
      if (pendingAction.type === 'PLACE_ORDER') {
        const { storeId, storeName, address, paymentMethod, notes, type, discount, coordinates } = pendingAction.data;
        placeOrder(storeId, storeName, address, paymentMethod, notes, type, discount, coordinates);
        setPendingAction(null);
        setClientViewState('TRACKING');
        showToast('Pedido realizado automáticamente tras iniciar sesión', 'success');
      }
    }
  }, [authUser, role, pendingAction, placeOrder, setClientViewState, showToast]);

  const updateOrder = async (orderId: string, status: OrderStatus) => {
    try {
      const updateData: Partial<Order> = { status };
      if (status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = serverTimestamp();
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: OrderStatus.CANCELLED,
        cancelledReason: reason,
        cancelledAt: serverTimestamp()
      });
      showToast('Pedido cancelado', 'error');
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const submitClaim = async (orderId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: OrderStatus.DISPUTED,
        claimReason: reason,
        claimStatus: 'OPEN'
      });
      showToast('Reclamo enviado. Nos contactaremos pronto.', 'info');
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  const resolveClaim = async (orderId: string, resolution: 'RESOLVED' | 'REJECTED') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: resolution === 'RESOLVED' ? OrderStatus.CANCELLED : OrderStatus.DELIVERED,
        claimStatus: resolution,
        cancelledReason: resolution === 'RESOLVED' ? 'Reembolso por reclamo' : undefined,
        cancelledAt: resolution === 'RESOLVED' ? serverTimestamp() : undefined
      });
    } catch (error) {
      console.error('Error resolving claim:', error);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: OrderStatus.DRIVER_ASSIGNED,
        driverId: driver.id,
        driverName: driver.name
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const addProduct = async (storeId: string, product: Product) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    
    try {
      const newProduct = { ...product, id: `prod-${Date.now()}`, isAvailable: true };
      await updateDoc(doc(db, 'stores', storeId), {
        products: [...store.products, newProduct]
      });
      showToast('Producto añadido', 'success');
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Error al añadir producto', 'error');
    }
  };

  const updateProduct = async (storeId: string, updatedProduct: Product) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        products: store.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      });
      showToast('Producto actualizado', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Error al actualizar producto', 'error');
    }
  };

  const deleteProduct = async (storeId: string, productId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        products: store.products.filter(p => p.id !== productId)
      });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const bulkAddProducts = async (storeId: string, newProducts: Product[]) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        products: [...store.products, ...newProducts]
      });
    } catch (error) {
      console.error('Error bulk adding products:', error);
    }
  };

  const addCoupon = async (coupon: Coupon) => {
      try {
        await setDoc(doc(db, 'coupons', coupon.id), coupon);
      } catch (error) {
        console.error('Error adding coupon:', error);
      }
  };

  const deleteCoupon = async (id: string) => {
      try {
        await updateDoc(doc(db, 'coupons', id), { active: false }); // Soft delete or real delete
        // await deleteDoc(doc(db, 'coupons', id)); // Real delete
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
  };

  const toggleCoupon = async (id: string) => {
      const coupon = coupons.find(c => c.id === id);
      if (!coupon) return;
      try {
        await updateDoc(doc(db, 'coupons', id), { active: !coupon.active });
      } catch (error) {
        console.error('Error toggling coupon:', error);
      }
  };

  const settleMerchantOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        merchantSettled: true,
        settledAt: serverTimestamp()
      });
      showToast('Liquidación de comercio completada', 'success');
    } catch (error) {
      console.error('Error settling merchant order:', error);
    }
  };

  const settleDriverOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        driverSettled: true,
        settledAt: serverTimestamp()
      });
      showToast('Liquidación de repartidor completada', 'success');
    } catch (error) {
      console.error('Error settling driver order:', error);
    }
  };

  const addReview = async (review: Review) => {
    try {
      // 1. Save Review
      await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: serverTimestamp()
      });
      
      // 2. Mark Order as Reviewed
      await updateDoc(doc(db, 'orders', review.orderId), {
        isReviewed: true
      });

      // 3. Update Store Rating (Weighted Average)
      const store = stores.find(s => s.id === review.storeId);
      if (store) {
        const newCount = store.reviewsCount + 1;
        const oldTotal = store.rating * store.reviewsCount;
        const newRating = (oldTotal + review.rating) / newCount;
        
        await updateDoc(doc(db, 'stores', review.storeId), {
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newCount
        });
      }
      
      showToast('Reseña enviada con éxito', 'success');
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const updateStore = async (storeId: string, data: Partial<Store>) => {
    try {
      await updateDoc(doc(db, 'stores', storeId), data);
    } catch (error) {
      console.error('Error updating store:', error);
    }
  };

  // FCM Integration
  useEffect(() => {
    if (!messaging || !authUser) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      if (payload.notification) {
        addNotification({
          title: payload.notification.title || 'Nueva Notificación',
          message: payload.notification.body || '',
          type: 'INFO'
        });
        showToast(payload.notification.title || 'Nueva Notificación', 'info');
      }
    });

    return () => unsubscribe();
  }, [authUser, addNotification, showToast]);

  // Listen to Driver Location if there's an active order
  useEffect(() => {
    const activeOrder = orders.find(o => o.customerId === authUser?.uid && (o.status === OrderStatus.PREPARING || o.status === OrderStatus.PICKED_UP));
    if (activeOrder && activeOrder.driverId) {
      const unsubscribe = onSnapshot(doc(db, 'users', activeOrder.driverId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.lat && data.lng) {
            setDriverLocation({ lat: data.lat, lng: data.lng });
          }
        }
      });
      return () => unsubscribe();
    }
  }, [orders, authUser]);

  const completeTour = useCallback((tourId: string) => {
    const currentTours = user.completedTours || [];
    if (!currentTours.includes(tourId)) {
      updateUser({ completedTours: [...currentTours, tourId] });
    }
  }, [user.completedTours, updateUser]);

  return (
    <AppContext.Provider value={{ 
      role, 
      setRole: setRoleState,
      user,
      users,
      updateUser,
      updateAnyUser,
      createStore,
      orders, 
      stores, 
      cart, 
      favorites,
      coupons,
      drivers,
      isSettingsOpen,
      toggleSettings,
      toggleFavorite,
      addToCart, 
      updateCartItemQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      getRouteDistance,
      updateOrder,
      cancelOrder,
      submitClaim,
      resolveClaim,
      assignDriver,
      settleMerchantOrder,
      settleDriverOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      bulkAddProducts,
      addCoupon,
      deleteCoupon,
      toggleCoupon,
      addReview,
      reviews,
      createPaymentPreference,
      updateStore,
      updateLocation,
      socket,
      clientViewState,
      setClientViewState,
      merchantViewState,
      setMerchantViewState,
      driverViewState,
      setDriverViewState,
      adminViewState,
      setAdminViewState,
      selectedStore,
      setSelectedStore,
      isDriverOnline,
      toggleDriverStatus,
      cartStoreId,
      resetOrders,
      darkMode,
      toggleDarkMode,
      soundEnabled,
      toggleSound,
      notifications,
      isNotificationsOpen,
      setIsNotificationsOpen,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      config,
      updateConfig,
      driverLocation,
      setDriverLocation,
      completeTour,
      requestAdminAccess,
      sendMessage,
      subscribeToChat,
      validateReferralCode,
      applyReferralCode,
      setPendingRole,
      setPendingAction
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

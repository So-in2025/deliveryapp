
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { soundService } from '../services/soundService';
import { UserRole, Order, Store, Product, OrderStatus, CartItem, Modifier, PaymentMethod, OrderType, Coupon, UserProfile, ViewState, Review, MerchantViewState, DriverViewState, AdminViewState, AppNotification } from '../types';
import { loadCart, saveCart } from '../services/dataService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { db, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp, Timestamp, query, where, OperationType, handleFirestoreError } from '../firebase';

// Mock Drivers for Manual Dispatch
const MOCK_DRIVERS = [
    { id: 'd1', name: 'Carlos R. (Moto)' },
    { id: 'd2', name: 'Ana M. (Bici)' },
    { id: 'd3', name: 'Jorge L. (Moto)' }
];

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: UserProfile; 
  users: UserProfile[];
  updateUser: (data: Partial<UserProfile>) => void;
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
  clearCart: () => void;
  placeOrder: (storeId: string, storeName: string, address: string, paymentMethod: PaymentMethod, notes: string, type: OrderType, discount?: number) => void;
  updateOrder: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  submitClaim: (orderId: string, reason: string) => void;
  resolveClaim: (orderId: string, resolution: 'RESOLVED' | 'REJECTED') => void;
  assignDriver: (orderId: string, driverId: string) => void;
  addProduct: (storeId: string, product: Product) => void;
  updateProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
  addReview: (review: Review) => void;
  reviews: Review[];
  updateStore: (storeId: string, data: Partial<Store>) => void;
  
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_COUPONS: Coupon[] = [
    { id: 'c1', code: 'BENVENUTO20', discountPct: 0.20, active: true, description: '20% descuento bienvenida' },
    { id: 'c2', code: 'PIZZA10', discountPct: 0.10, active: true, description: '10% en pizzas' },
    { id: 'c3', code: 'DELIVERYFREE', discountPct: 0.05, active: false, description: 'Envío gratis (Simulado)' }
];

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

  const setRole = useCallback(async (newRole: UserRole) => {
    setRoleState(newRole);
    if (authUser) {
      try {
        await updateDoc(doc(db, 'users', authUser.uid), { role: newRole });
      } catch (error) {
        console.error('Error updating role:', error);
      }
    }
  }, [authUser]);
  
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [drivers] = useState(MOCK_DRIVERS);
  const [isDriverOnline, setIsDriverOnline] = useState(false); // Session state

  // Sync User Profile from AuthContext
  useEffect(() => {
    if (authProfile) {
      setUser(authProfile);
      setRoleState(authProfile.role);
    } else {
      setUser(DEFAULT_USER);
      setRoleState(UserRole.NONE);
    }
  }, [authProfile]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    // Listen to Stores (Optimized by role)
    let storesQuery;
    if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
      // Merchants only need their own store data for management
      storesQuery = query(collection(db, 'stores'), where('id', '==', authProfile.ownedStoreId));
    } else {
      // Clients and Admins need all stores
      storesQuery = collection(db, 'stores');
    }

    const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
      const storesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
      setStores(storesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stores');
    });

    // Listen to Orders (Filtered by role)
    let ordersQuery;
    if (authProfile?.role === 'ADMIN') {
      ordersQuery = collection(db, 'orders');
    } else if (authProfile?.role === 'MERCHANT' && authProfile.ownedStoreId) {
      ordersQuery = query(collection(db, 'orders'), where('storeId', '==', authProfile.ownedStoreId));
    } else if (authProfile?.role === 'DRIVER' && authUser?.uid) {
      ordersQuery = query(collection(db, 'orders'), where('driverId', '==', authUser.uid));
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
        handleFirestoreError(error, OperationType.GET, 'orders');
      });
    }

    // Listen to Users (Admin only)
    let unsubscribeUsers = () => {};
    if (authProfile?.role === 'ADMIN') {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
    }

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
        handleFirestoreError(error, OperationType.GET, 'reviews');
      });
    }

    return () => {
      unsubscribeStores();
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeReviews();
    };
  }, [isAuthReady, authProfile]);
  
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
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('codex_notifications_v1');
      if (!stored) return [];
      return JSON.parse(stored).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
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
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      soundService.setEnabled(next);
      return next;
    });
  };

  const initialLoadRef = React.useRef({
    orders: true,
    stores: true,
    users: true,
    reviews: true
  });
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
      const loaded = loadCart();
      if (!loaded) return [];
      // Safety check for legacy cart items
      if (loaded.length > 0 && typeof (loaded[0] as any).totalPrice === 'undefined') {
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
      setIsDriverOnline(prev => !prev);
      showToast(isDriverOnline ? 'Desconectado' : 'Ahora estás en línea', 'info');
  };

  const updateUser = async (data: Partial<UserProfile>) => {
      setUser(prev => ({ ...prev, ...data }));
      if (authUser) {
        try {
          await updateDoc(doc(db, 'users', authUser.uid), data);
        } catch (error) {
          console.error('Error updating user:', error);
        }
      }
  };

  const createStore = async (newStore: Store) => {
      try {
        await setDoc(doc(db, 'stores', newStore.id), {
          ...newStore,
          createdAt: serverTimestamp()
        });
        await updateUser({ ownedStoreId: newStore.id });
        showToast('Tienda creada con éxito', 'success');
      } catch (error) {
        console.error('Error creating store:', error);
        showToast('Error al crear la tienda', 'error');
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

  const clearCart = () => {
      setCart([]);
      saveCart([]);
      setCartStoreId(null);
      localStorage.removeItem('codex_cart_store_v1');
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

  const placeOrder = async (storeId: string, storeName: string, address: string, paymentMethod: PaymentMethod, notes: string, type: OrderType, discount: number = 0) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    
    // Dynamic Delivery Fee Logic
    const store = stores.find(s => s.id === storeId);
    const deliveryFee = type === OrderType.DELIVERY ? (store?.deliveryFee ?? 45) : 0;
    
    const total = Math.max(0, subtotal + deliveryFee - discount);
    
    const orderId = `ord-${Date.now()}`;
    const newOrder: any = {
      storeId,
      storeName,
      total,
      deliveryFee,
      status: OrderStatus.PENDING,
      items: cart,
      createdAt: serverTimestamp(),
      address: type === OrderType.PICKUP ? 'Retiro en Local' : address,
      customerName: user.name,
      customerId: authUser?.uid,
      paymentMethod,
      notes,
      type,
      isReviewed: false
    };
    
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      clearCart();
      setSelectedStore(null);
      showToast('Pedido realizado con éxito', 'success');
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error al realizar el pedido', 'error');
    }
  };

  const updateOrder = async (orderId: string, status: OrderStatus) => {
    try {
      const updateData: any = { status };
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
      await updateDoc(doc(db, 'stores', storeId), {
        products: [...store.products, product]
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (storeId: string, updatedProduct: Product) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        products: store.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      });
    } catch (error) {
      console.error('Error updating product:', error);
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

  const addCoupon = (coupon: Coupon) => {
      setCoupons(prev => [...prev, coupon]);
  };

  const deleteCoupon = (id: string) => {
      setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const toggleCoupon = (id: string) => {
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
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

  return (
    <AppContext.Provider value={{ 
      role, 
      setRole,
      user,
      users,
      updateUser,
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
      clearCart,
      placeOrder,
      updateOrder,
      cancelOrder,
      submitClaim,
      resolveClaim,
      assignDriver,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      deleteCoupon,
      toggleCoupon,
      addReview,
      reviews,
      updateStore,
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
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

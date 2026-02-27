
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Order, Store, Product, OrderStatus, CartItem, Modifier, PaymentMethod, OrderType, Coupon, UserProfile, ViewState, Review } from '../types';
import { INITIAL_ORDERS } from '../constants';
import { updateOrderStatus, createOrder, loadOrders, loadCart, saveCart, saveOrders, loadStores, saveStores, loadReviews, saveReviews } from '../services/dataService';
import { useConnectivity } from './ConnectivityContext';
import { useToast } from './ToastContext';

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
  assignDriver: (orderId: string, driverId: string) => void;
  addProduct: (storeId: string, product: Product) => void;
  updateProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
  addReview: (review: Review) => void;
  
  isDriverOnline: boolean;
  toggleDriverStatus: () => void;
  // Lifted Client State for Global Navigation
  clientViewState: ViewState;
  setClientViewState: (view: ViewState) => void;
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  cartStoreId: string | null;
  resetOrders: () => void; // New: For forcing a reset of orders
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_COUPONS: Coupon[] = [
    { id: 'c1', code: 'BENVENUTO20', discountPct: 0.20, active: true, description: '20% descuento bienvenida' },
    { id: 'c2', code: 'PIZZA10', discountPct: 0.10, active: true, description: '10% en pizzas' },
    { id: 'c3', code: 'DELIVERYFREE', discountPct: 0.05, active: false, description: 'Envío gratis (Simulado)' }
];

const DEFAULT_USER: UserProfile = {
    name: 'Juan Pérez',
    email: 'juan.perez@demo.com',
    avatar: undefined,
    isDriver: false,
    ownedStoreId: undefined,
    addresses: ['Mi Ubicación Actual', 'Casa (Av. Libertador 1234)', 'Trabajo (Centro)']
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOnline } = useConnectivity();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  
  const [user, setUser] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('codex_user_v1');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [stores, setStores] = useState<Store[]>(() => loadStores());
  const [orders, setOrders] = useState<Order[]>(() => loadOrders() || INITIAL_ORDERS);
  const [reviews, setReviews] = useState<Review[]>(() => loadReviews());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [drivers] = useState(MOCK_DRIVERS);
  const [isDriverOnline, setIsDriverOnline] = useState(false); // Session state
  
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
      // Try to recover store ID from cart items context if possible, or reset
      // For MVP, we'll reset if not explicitly saved. 
      // Ideally, we should save cartStoreId to localStorage too.
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

  useEffect(() => {
    saveCart(cart as any);
    if (cart.length === 0) setCartStoreId(null);
  }, [cart]);

  useEffect(() => {
    saveStores(stores);
  }, [stores]);
  
  useEffect(() => {
      saveReviews(reviews);
  }, [reviews]);

  useEffect(() => {
      localStorage.setItem('codex_user_v1', JSON.stringify(user));
  }, [user]);

  // Sync Logic
  useEffect(() => {
    if (isOnline) {
      setOrders(prevOrders => {
        // Migration: Auto-complete stale demo order if found (Fix for "Always says order in progress")
        const staleOrderIndex = prevOrders.findIndex(o => o.id === 'ord-001' && o.status === OrderStatus.PREPARING);
        if (staleOrderIndex > -1) {
            const newOrders = [...prevOrders];
            newOrders[staleOrderIndex] = { ...newOrders[staleOrderIndex], status: OrderStatus.DELIVERED };
            saveOrders(newOrders);
            return newOrders;
        }

        const hasPending = prevOrders.some(o => o.isOfflinePending);
        if (hasPending) {
           const updatedOrders = prevOrders.map(o => 
             o.isOfflinePending ? { ...o, isOfflinePending: false } : o
           );
           saveOrders(updatedOrders);
           setTimeout(() => {
               const count = prevOrders.filter(o => o.isOfflinePending).length;
               showToast(`Conexión restaurada. ${count} pedido(s) enviado(s).`, 'success');
           }, 1000);
           return updatedOrders;
        }
        return prevOrders;
      });
    }
  }, [isOnline, showToast]);

  const toggleSettings = () => setIsSettingsOpen(prev => !prev);
  
  const toggleDriverStatus = () => {
      setIsDriverOnline(prev => !prev);
      showToast(isDriverOnline ? 'Desconectado' : 'Ahora estás en línea', 'info');
  };

  const updateUser = (data: Partial<UserProfile>) => {
      setUser(prev => ({ ...prev, ...data }));
  };

  const createStore = (newStore: Store) => {
      setStores(prev => [newStore, ...prev]);
      updateUser({ ownedStoreId: newStore.id });
  };

  const addToCart = (product: Product, quantity: number, modifiers: Modifier[], storeId: string) => {
    // Check for store conflict
    if (cart.length > 0 && cartStoreId && cartStoreId !== storeId) {
        // Automatically clear cart if adding from a different store to avoid blocking confirm dialogs
        setCart([]);
    }
    
    setCartStoreId(storeId);

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

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }
      return [...prev, { product, quantity, selectedModifiers: modifiers, totalPrice: unitPrice }];
    });
  };

  const clearCart = () => {
      setCart([]);
      setCartStoreId(null);
  };

  const resetOrders = () => {
      setOrders(INITIAL_ORDERS);
      saveOrders(INITIAL_ORDERS);
      showToast('Pedidos reiniciados a estado Demo.', 'success');
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

  const placeOrder = (storeId: string, storeName: string, address: string, paymentMethod: PaymentMethod, notes: string, type: OrderType, discount: number = 0) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    
    // Dynamic Delivery Fee Logic
    const store = stores.find(s => s.id === storeId);
    const deliveryFee = type === OrderType.DELIVERY ? (store?.deliveryFee || 0) : 0;
    
    const total = Math.max(0, subtotal + deliveryFee - discount);
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      storeId,
      storeName,
      total,
      deliveryFee,
      status: OrderStatus.PENDING,
      items: cart,
      createdAt: new Date(),
      address: type === OrderType.PICKUP ? 'Retiro en Local' : address,
      customerName: user.name,
      paymentMethod,
      notes,
      type,
      isOfflinePending: !isOnline,
      isReviewed: false
    };
    
    setOrders(prev => createOrder(prev, newOrder));
    clearCart();
    setSelectedStore(null); // Clear selection to return to home on back

    if (!isOnline) {
        showToast('Guardado Offline. Se enviará al conectar.', 'info');
    }
  };

  const updateOrder = (orderId: string, status: OrderStatus) => {
    setOrders(prev => {
        const updated = updateOrderStatus(prev, orderId, status);
        // If delivered, set deliveredAt
        if (status === OrderStatus.DELIVERED) {
            return updated.map(o => o.id === orderId ? { ...o, deliveredAt: new Date() } : o);
        }
        return updated;
    });
  };

  const cancelOrder = (orderId: string, reason: string) => {
      setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          return {
              ...o,
              status: OrderStatus.CANCELLED,
              cancelledReason: reason,
              cancelledAt: new Date()
          };
      }));
      showToast('Pedido cancelado', 'error');
  };

  const submitClaim = (orderId: string, reason: string) => {
      setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          return {
              ...o,
              status: OrderStatus.DISPUTED,
              claimReason: reason,
              claimStatus: 'OPEN'
          };
      }));
      showToast('Reclamo enviado. Nos contactaremos pronto.', 'info');
  };

  const assignDriver = (orderId: string, driverId: string) => {
      const driver = drivers.find(d => d.id === driverId);
      if(!driver) return;

      setOrders(prev => prev.map(o => {
          if(o.id !== orderId) return o;
          return {
              ...o,
              status: OrderStatus.DRIVER_ASSIGNED,
              driverId: driver.id,
              driverName: driver.name
          };
      }));
      saveOrders(orders); // Sync
  };

  const addProduct = (storeId: string, product: Product) => {
    setStores(prevStores => prevStores.map(store => {
      if (store.id !== storeId) return store;
      return { ...store, products: [...store.products, product] };
    }));
  };

  const updateProduct = (storeId: string, updatedProduct: Product) => {
    setStores(prevStores => prevStores.map(store => {
      if (store.id !== storeId) return store;
      return {
        ...store,
        products: store.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      };
    }));
  };

  const deleteProduct = (storeId: string, productId: string) => {
    setStores(prevStores => prevStores.map(store => {
      if (store.id !== storeId) return store;
      return {
        ...store,
        products: store.products.filter(p => p.id !== productId)
      };
    }));
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

  const addReview = (review: Review) => {
      // 1. Save Review
      setReviews(prev => [...prev, review]);
      
      // 2. Mark Order as Reviewed
      setOrders(prev => {
          const updated = prev.map(o => o.id === review.orderId ? { ...o, isReviewed: true } : o);
          saveOrders(updated);
          return updated;
      });

      // 3. Update Store Rating (Weighted Average)
      setStores(prev => prev.map(store => {
          if (store.id !== review.storeId) return store;
          
          const newCount = store.reviewsCount + 1;
          // Formula: (OldRating * OldCount + NewRating) / NewCount
          const oldTotal = store.rating * store.reviewsCount;
          const newRating = (oldTotal + review.rating) / newCount;
          
          return {
              ...store,
              rating: Number(newRating.toFixed(1)), // Keep it to 1 decimal
              reviewsCount: newCount
          };
      }));
  };

  return (
    <AppContext.Provider value={{ 
      role, 
      setRole,
      user,
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
      assignDriver,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      deleteCoupon,
      toggleCoupon,
      addReview,
      clientViewState,
      setClientViewState,
      selectedStore,
      setSelectedStore,
      isDriverOnline,
      toggleDriverStatus,
      cartStoreId,
      resetOrders,
      darkMode,
      toggleDarkMode
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

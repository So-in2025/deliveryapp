
import { Order, OrderStatus, Product, Store, Review } from '../types';
import { MOCK_STORES } from '../constants';

// STORAGE KEYS
const KEYS = {
  ORDERS: 'codex_orders_v1',
  CART: 'codex_cart_v1',
  STORES: 'codex_stores_v1',
  REVIEWS: 'codex_reviews_v1' // New key
};

// --- PERSISTENCE LAYER ---

// Helper to revive Dates from JSON
const dateReviver = (key: string, value: unknown) => {
  if (key === 'createdAt' && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const loadOrders = (): Order[] | null => {
  try {
    const stored = localStorage.getItem(KEYS.ORDERS);
    return stored ? JSON.parse(stored, dateReviver) : null;
  } catch (e) {
    console.error("Failed to load orders", e);
    return null;
  }
};

export const saveOrders = (orders: Order[]) => {
  try {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders", e);
  }
};

export const loadCart = (): { product: Product; quantity: number }[] | null => {
  try {
    const stored = localStorage.getItem(KEYS.CART);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveCart = (cart: { product: Product; quantity: number }[]) => {
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
};

export const loadReviews = (): Review[] => {
    try {
        const stored = localStorage.getItem(KEYS.REVIEWS);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveReviews = (reviews: Review[]) => {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
};

// --- STORE & PRODUCT MANAGEMENT ---

export const loadStores = (): Store[] => {
  try {
    const stored = localStorage.getItem(KEYS.STORES);
    if (!stored) return MOCK_STORES;
    
    const parsed = JSON.parse(stored);
    
    return parsed; 
  } catch {
    return MOCK_STORES;
  }
};

export const saveStores = (stores: Store[]) => {
  try {
    localStorage.setItem(KEYS.STORES, JSON.stringify(stores));
  } catch (e) {
    console.error("Failed to save stores", e);
  }
};

// --- LOGIC LAYER ---

export const updateOrderStatus = (orders: Order[], orderId: string, newStatus: OrderStatus): Order[] => {
  const updated = orders.map(order => 
    order.id === orderId ? { ...order, status: newStatus } : order
  );
  saveOrders(updated); // Auto-persist on change
  return updated;
};

export const createOrder = (orders: Order[], newOrder: Order): Order[] => {
  const updated = [newOrder, ...orders];
  saveOrders(updated); // Auto-persist on change
  return updated;
};

// UTILS
export const resetAppData = () => {
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.CART);
    localStorage.removeItem(KEYS.STORES);
    localStorage.removeItem(KEYS.REVIEWS);
    localStorage.removeItem('codex_favorites_v1');
    window.location.reload();
};

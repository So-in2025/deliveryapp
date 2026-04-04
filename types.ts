
// Core Domain Entities based on Codex Layer 1

export enum UserRole {
  NONE = 'NONE', // Initial Landing State
  DEV = 'DEV', // Project Management Dashboard
  CLIENT = 'CLIENT',
  MERCHANT = 'MERCHANT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN' // Super Admin / Platform Owner
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string; // URL or base64 placeholder
  isDriver?: boolean; // Has completed driver onboarding
  ownedStoreId?: string; // Has completed merchant onboarding
  addresses?: string[]; // Saved addresses
  isOnline?: boolean; // New: For Driver availability in real-time
  fcmToken?: string; // New: For Push Notifications
  lat?: number; // New: For real-time tracking
  lng?: number; // New: For real-time tracking
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED', // Layer 3: Orchestration
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED' // New: For claims/complaints
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MERCADO_PAGO = 'MERCADO_PAGO'
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP'
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number; // 0 = Optional, 1 = Required
  max: number; // 1 = Single select, >1 = Multi select
  options: Modifier[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  modifierGroups?: ModifierGroup[]; // Layer 4: Customization
}

export interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number; // New: For "New Store" logic (0 reviews = 5 stars)
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number; // Base delivery fee for the store
  image: string;
  products: Product[];
  createdAt: string; // New: ISO Date string for "New" badge
  customFont?: string; // New: Store customization
  customColor?: string; // New: Store customization
  isActive?: boolean; // New: For Admin suspension/approval
  isOpen?: boolean; // New: For Merchant to toggle store status
  mpAccessToken?: string; // New: For Decentralized Payment Mode
  ownerId?: string; // New: For ownership check
  lat?: number; // New: For map placement
  lng?: number; // New: For map placement
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedModifiers: Modifier[]; // Store selected options
  totalPrice: number; // Base + Modifiers
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  total: number;
  deliveryFee: number; // New: Business logic requirement
  status: OrderStatus;
  type: OrderType; // New field for Delivery vs Pickup
  items: CartItem[]; // Updated to use CartItem structure
  createdAt: Date;
  address: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isOfflinePending?: boolean; // Phase 6: Sync Queue Flag
  driverId?: string; // New: For Manual Dispatch
  driverName?: string; // New: For Manual Dispatch UI
  isReviewed?: boolean; // New: To check if user already rated this order
  preferenceId?: string; // New: For Mercado Pago integration
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED'; // New: For Mercado Pago integration
  tip?: number; // New: Driver Tip
  cutlery?: boolean; // New: Request Cutlery
  cancelledReason?: string; // Audit: Why it was cancelled
  cancelledAt?: Date; // Audit: When it was cancelled
  deliveredAt?: Date; // Audit: When it was delivered
  claimReason?: string; // Audit: Why it is disputed
  claimStatus?: 'OPEN' | 'RESOLVED' | 'REJECTED'; // Audit: Dispute status
}

export interface Review {
    id: string;
    storeId: string;
    orderId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: string;
    userName: string;
}

export interface Coupon {
    id: string;
    code: string;
    discountPct: number; // 0.10 for 10%
    active: boolean;
    description: string;
    storeId?: string; // Optional: if null, it's a platform-wide coupon
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'ORDER' | 'SYSTEM' | 'PROMO';
    timestamp: Date;
    read: boolean;
    orderId?: string;
}

export interface GlobalConfig {
  platformCommission: number; // e.g., 15 for 15%
  baseDeliveryFee: number; // e.g., 45
  supportEmail: string;
  maintenanceMode: boolean;
  paymentMode: 'CENTRALIZED' | 'DECENTRALIZED'; // New: For Payment Strategy
}

// UI State Types - Standardized
export type ViewState = 'BROWSE' | 'CHECKOUT' | 'TRACKING' | 'HISTORY' | 'RECEIPT' | 'FAVORITES' | 'PROFILE';
export type MerchantViewState = 'ORDERS' | 'MENU' | 'COUPONS' | 'HISTORY' | 'SETTINGS';
export type DriverViewState = 'MAP' | 'DELIVERIES' | 'HISTORY' | 'PROFILE';
export type AdminViewState = 'DASHBOARD' | 'USERS' | 'STORES' | 'FLEET' | 'DISPUTES' | 'SETTINGS' | 'ORDERS';

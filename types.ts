
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
  name: string;
  email: string;
  avatar?: string; // URL or base64 placeholder
  isDriver?: boolean; // Has completed driver onboarding
  ownedStoreId?: string; // Has completed merchant onboarding
  addresses?: string[]; // Saved addresses
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
  CARD = 'CARD'
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
}

// UI State Types - Standardized
export type ViewState = 'BROWSE' | 'CHECKOUT' | 'TRACKING' | 'HISTORY' | 'RECEIPT';


// Core Domain Entities based on Codex Layer 1

export enum UserRole {
  NONE = 'NONE', // Initial Landing State
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
  isApprovedDriver?: boolean; // Platform Admin approval status
  ownedStoreId?: string; // Has completed merchant onboarding
  addresses?: string[]; // Saved addresses
  phone?: string; // New: Driver phone number
  isOnline?: boolean; // New: For Driver availability in real-time
  fcmToken?: string; // New: For Push Notifications
  lat?: number; // New: For real-time tracking
  lng?: number; // New: For real-time tracking
  completedTours?: string[]; // New: Track which onboarding tours have been seen
  referralCode?: string; // New: Unique code for this user
  referredBy?: string; // New: Code used to sign up
  isFirstPurchaseDone?: boolean; // New: Track first purchase status
  referralEarnings?: number; // New: Credit earned from referrals
  driverLicense?: string; // Strict: Licencia de conducir
  vehicleInsurance?: string; // Strict: Seguro del vehículo
  vehiclePlate?: string; // Strict: Placa del vehículo
  vehicleType?: string; // Tipo de vehículo (MOTO, BICI, AUTO)
  driverSelfieUrl?: string; // Foto del repartidor tomada en el registro
  driverIneUrl?: string; // Foto de la identificación oficial (INE)
  driverAddress?: string; // Dirección del repartidor
  driverPersonalReference?: string; // Nombre y teléfono de una referencia personal
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
  isAvailable?: boolean; // New: Inventory management
  modifierGroups?: ModifierGroup[]; // Layer 4: Customization
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  link?: string;
  isActive: boolean;
  priority: number;
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
  autoSchedule?: boolean; // New: Automate open/close based on schedule
  schedules?: { [day: number]: { open: string, close: string, active: boolean } }; // New: 0=Sun, 6=Sat
  mpAccessToken?: string; // New: For Decentralized Payment Mode
  mpPublicKey?: string; // New: For Decentralized Payment Mode UI
  ownerId?: string; // New: For ownership check
  lat?: number; // New: For map placement
  lng?: number; // New: For map placement
  legalName?: string; // Strict: Razón Social
  taxId?: string; // Strict: RFC/CUIT/RUT
  phone?: string; // Strict: Teléfono de contacto
  bankName?: string; // New: Nombre del banco
  bankAccount?: string; // Strict: Cuenta Bancaria (CLABE/CBU)
  clabe?: string; // New: CLABE Interbancaria (18 digits)
  commissionPct?: number; // New: Custom commission for this store (overrides global)
  pendingName?: string; // New: Store name change pending admin approval
}

export interface CartItem {
  id: string; // New: For tracking and React keys
  product: Product;
  quantity: number;
  selectedModifiers: Modifier[]; // Store selected options
  totalPrice: number; // Base + Modifiers
  storeId: string; // New: For tracking store context
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  total: number;
  subtotal: number; // New: Base amount before fees
  deliveryFee: number; // New: Business logic requirement
  platformCommission: number; // New: Platform's cut
  driverEarnings: number; // New: Driver's cut
  merchantEarnings: number; // New: Merchant's net
  status: OrderStatus;
  type: OrderType; // New field for Delivery vs Pickup
  items: CartItem[]; // Updated to use CartItem structure
  createdAt: Date;
  address: string;
  customerName: string;
  customerId: string; // Required for security rules
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
  coordinates?: { lat: number; lng: number }; // New: For precise delivery
  referralDiscount?: number; // New: Discount from referral
  firstPurchaseDiscount?: number; // New: Discount for first purchase
  merchantSettled?: boolean; // New: For Admin Settlement tracking
  driverSettled?: boolean; // New: For Admin Settlement tracking
  settledAt?: Date; // New: When it was settled
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

export interface DeliveryRatesConfig {
  localRadiusKm: number;
  baseDistanceKm: number;
  localBaseDay: number;
  localBaseNight: number;
  localExtraPer100mDay: number;
  localExtraPer100mNight: number;
  foraneoBaseDay: number;
  foraneoBaseNight: number;
  foraneoExtraPerKmDay: number;
  foraneoExtraPerKmNight: number;
  nightStartHour: number;
  nightEndHour: number;
  platformFeeLocal: number;
  platformFeeForaneo: number;
}

export interface GlobalConfig {
  platformCommissionPct: number; // e.g., 0.15 for 15%
  driverCommissionPct: number; // e.g., 0.80 for 80% of delivery fee
  baseDeliveryFee: number; // e.g., 45
  feePerKm: number; // e.g., 12
  supportEmail: string;
  maintenanceMode: boolean;
  paymentMode: 'CENTRALIZED' | 'DECENTRALIZED'; // New: For Payment Strategy
  categories: string[]; // New: Dynamic categories for stores and services
  maxDeliveryRadiusKm: number; // New: Geofencing
  centerCoordinates: { lat: number; lng: number }; // New: Geofencing center
  referralRewardAmount: number; // New: Fixed amount for referral reward
  referralDiscountPct: number; // New: e.g., 0.05 for 5% off for the new user
  firstPurchaseDiscountPct: number; // New: e.g., 0.20 for 20% off
  adminEmails: string[]; // New: For UI visibility of Admin Panel
  deliveryRates?: DeliveryRatesConfig; // New: Dynamic pricing parameters
  mpAccessToken?: string; // New: Platform Master Access Token
  mpPublicKey?: string; // New: Platform Master Public Key
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: any; // Firestore Timestamp
  readBy: string[]; // List of UIDs who read it
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// UI State Types - Standardized
export type ViewState = 'BROWSE' | 'CHECKOUT' | 'TRACKING' | 'HISTORY' | 'RECEIPT' | 'FAVORITES' | 'PROFILE';
export type MerchantViewState = 'ORDERS' | 'MENU' | 'COUPONS' | 'HISTORY' | 'SETTINGS';
export type DriverViewState = 'MAP' | 'DELIVERIES' | 'HISTORY' | 'PROFILE' | 'WALLET';
export type AdminViewState = 'DASHBOARD' | 'USERS' | 'STORES' | 'FLEET' | 'DISPUTES' | 'SETTINGS' | 'ORDERS' | 'SETTLEMENTS' | 'BANNERS';

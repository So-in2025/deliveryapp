
import { Store, Order } from './types';

// --- PROJECT METADATA ---
export const PROJECT_METRICS = {
  currentPhase: '14. Final Release (Gold)',
  totalProgress: 100,
  phaseProgress: 100,
  completedPhases: 14,
  totalPhases: 14, 
  roadmap: [
    { id: 1, title: 'Arquitectura General y Modelo Mental', completed: true },
    { id: 2, title: 'Modelo de Datos y Entidades', completed: true },
    { id: 3, title: 'Flujos Funcionales por Rol', completed: true },
    { id: 4, title: 'UX / UI System (Design System)', completed: true },
    { id: 5, title: 'Web App Funcional (MVP)', completed: true },
    { id: 6, title: 'Offline-first y Cache', completed: true },
    { id: 7, title: 'Integraciones (Pagos, Mapas)', completed: true },
    { id: 8, title: 'Optimización y Performance', completed: true },
    { id: 9, title: 'Preparación Android', completed: true },
    { id: 10, title: 'Preparación iOS', completed: true },
    { id: 11, title: 'Testing y Validación', completed: true },
    { id: 12, title: 'Documentación Final', completed: true },
    { id: 13, title: 'Heurística y Onboarding', completed: true },
    { id: 14, title: 'Integración de Identidad Final', completed: true, active: true },
  ]
};

// --- MOCK DATA ---
// Images sourced from Unsplash for High Fidelity

export const MOCK_STORES: Store[] = [
  {
    id: 'store-demo-1',
    name: 'Pizza Elite & Co',
    category: 'Comida',
    rating: 4.9,
    reviewsCount: 154,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 45,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000',
    isActive: true,
    isOpen: true,
    createdAt: new Date().toISOString(),
    products: [
      {
        id: 'p1',
        name: 'Pizza Pepperoni Supreme',
        description: 'Masa artesanal, salsa de tomate premium y doble pepperoni.',
        price: 180,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=500',
        isAvailable: true,
        modifierGroups: [
          {
            id: 'mg1',
            name: 'Tamaño',
            min: 1,
            max: 1,
            options: [
              { id: 'm1', name: 'Mediana', price: 0 },
              { id: 'm2', name: 'Grande', price: 60 },
              { id: 'm3', name: 'Familiar', price: 120 }
            ]
          }
        ]
      },
      {
        id: 'p2',
        name: 'Pizza Margarita',
        description: 'Sencillez perfecta: albahaca fresca y mozzarella premium.',
        price: 150,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&q=80&w=500',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-demo-2',
    name: 'Sushi Master Zen',
    category: 'Comida',
    rating: 4.8,
    reviewsCount: 89,
    deliveryTimeMin: 35,
    deliveryTimeMax: 50,
    deliveryFee: 60,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1000',
    isActive: true,
    isOpen: true,
    createdAt: new Date().toISOString(),
    products: [
      {
        id: 'p3',
        name: 'Combo Samurai (15 piezas)',
        description: 'Variedad de rolls premium seleccionados por el chef.',
        price: 450,
        image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=500',
        isAvailable: true
      }
    ]
  },
  {
    id: 'store-demo-3',
    name: 'Farmacia 24/7',
    category: 'Farmacia',
    rating: 5.0,
    reviewsCount: 42,
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    deliveryFee: 30,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=1000',
    isActive: true,
    isOpen: true,
    createdAt: new Date().toISOString(),
    products: [
      {
        id: 'p4',
        name: 'Paracetamol 500mg',
        description: 'Caja con 20 tabletas.',
        price: 85,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500',
        isAvailable: true
      }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const APP_CONFIG = {
  version: '1.0.6', // Increment this to force all clients to reload and clear state if needed
  currency: '$',
  appName: 'Te lo Llevo',
  logoUrl: 'https://res.cloudinary.com/dfrb7fkni/image/upload/v1775205995/117a5ec6-76ad-444d-ade2-7077d936ded3_ubbnbi.jpg',
  platformCommissionPct: 0.10, // 10%
  driverCommissionPct: 0.80, // 80% of delivery fee
  baseDeliveryFee: 35,
  feePerKm: 12
};

export const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const isStoreOpen = (store: Store): boolean => {
  if (store.autoSchedule && store.schedules) {
    const now = new Date();
    const day = now.getDay();
    const todaySchedule = store.schedules[day];
    
    if (!todaySchedule || !todaySchedule.active) return false;
    
    const timeNow = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
    
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    
    return timeNow >= openTime && timeNow <= closeTime;
  }
  
  return store.isOpen !== false;
};

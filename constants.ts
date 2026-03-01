
import { Store, Order, OrderStatus, UserRole, PaymentMethod, OrderType } from './types';

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

const NOW = new Date();
const ONE_DAY = 24 * 60 * 60 * 1000;

export const MOCK_STORES: Store[] = [
  {
    id: 's1',
    name: 'Burger & Co.',
    category: 'Hamburguesas',
    rating: 4.8,
    reviewsCount: 1240,
    deliveryTimeMin: 20,
    deliveryTimeMax: 35,
    deliveryFee: 45.00,
    createdAt: new Date(NOW.getTime() - (100 * ONE_DAY)).toISOString(), // Old store
    image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=800&q=80',
    products: [
      { 
        id: 'p1', 
        name: 'Classic Smash', 
        description: 'Doble carne smash, queso cheddar americano, cebolla, pickles y salsa secreta.', 
        price: 165.00, 
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60',
        modifierGroups: [
          {
            id: 'mg1',
            name: 'Punto de la carne',
            min: 1,
            max: 1,
            options: [
              { id: 'm1', name: 'Jugoso', price: 0 },
              { id: 'm2', name: 'A punto', price: 0 },
              { id: 'm3', name: 'Bien cocido', price: 0 }
            ]
          },
          {
            id: 'mg2',
            name: 'Extras',
            min: 0,
            max: 3,
            options: [
              { id: 'm4', name: 'Tocino Extra', price: 25.00 },
              { id: 'm5', name: 'Huevo Frito', price: 15.00 },
              { id: 'm6', name: 'Queso Cheddar Extra', price: 20.00 }
            ]
          }
        ]
      },
      { 
        id: 'p2', 
        name: 'Bacon Royale', 
        description: 'Tocino crujiente artesanal, aros de cebolla y barbacoa honey.', 
        price: 185.00, 
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=60',
        modifierGroups: [
             {
            id: 'mg3',
            name: 'Bebida',
            min: 1,
            max: 1,
            options: [
              { id: 'm7', name: 'Coca-Cola', price: 0 },
              { id: 'm8', name: 'Agua', price: 0 }
            ]
          }
        ]
      },
    ]
  },
  {
    id: 's2',
    name: 'Sushi Zen',
    category: 'Japonesa',
    rating: 4.9,
    reviewsCount: 850,
    deliveryTimeMin: 40,
    deliveryTimeMax: 55,
    deliveryFee: 55.00,
    createdAt: new Date(NOW.getTime() - (50 * ONE_DAY)).toISOString(),
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    products: [
      { 
          id: 'p3', 
          name: 'Spicy Tuna Roll', 
          description: 'Atún rojo fresco, mayo sriracha, pepino y topping de sésamo.', 
          price: 145.00, 
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd43fb?auto=format&fit=crop&w=500&q=60' 
      },
      { 
          id: 'p4', 
          name: 'Salmon Nigiri Set', 
          description: 'Selección premium de salmón noruego sobre arroz de sushi avinagrado.', 
          price: 195.00, 
          image: 'https://images.unsplash.com/photo-1617196034438-f4657536d05b?auto=format&fit=crop&w=500&q=60' 
      },
    ]
  },
  {
    id: 's3',
    name: 'La Dolce Vita',
    category: 'Pizza & Pasta',
    rating: 4.5,
    reviewsCount: 200,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
    deliveryFee: 40.00,
    createdAt: new Date(NOW.getTime() - (30 * ONE_DAY)).toISOString(),
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    products: [
      { 
          id: 'p5', 
          name: 'Pizza Margherita DOC', 
          description: 'Tomate San Marzano D.O.P., mozzarella di bufala campana, albahaca fresca.', 
          price: 220.00, 
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60' 
      },
      { 
          id: 'p6', 
          name: 'Pasta Carbonara', 
          description: 'Spaghetti, guanciale, pecorino romano, yema de huevo y pimienta negra.', 
          price: 180.00, 
          image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=500&q=60' 
      },
    ]
  },
  {
    id: 's4',
    name: 'Tacos El Pastor',
    category: 'Mexicana',
    rating: 5.0, // New Store rule
    reviewsCount: 0, // New Store
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    deliveryFee: 30.00,
    createdAt: new Date().toISOString(), // Brand new (Today)
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    products: [
      { 
          id: 'p7', 
          name: 'Tacos al Pastor (x3)', 
          description: 'Cerdo marinado, piña, cilantro y cebolla en tortilla de maíz.', 
          price: 75.00, 
          image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=60' 
      }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-001',
    storeId: 's1',
    storeName: 'Burger & Co.',
    total: 375.00,
    deliveryFee: 45.00,
    status: OrderStatus.DELIVERED,
    items: [
      { product: MOCK_STORES[0].products[0], quantity: 2, selectedModifiers: [], totalPrice: 330.00 }
    ],
    createdAt: new Date(NOW.getTime() - (2 * 60 * 60 * 1000)), // 2 hours ago
    address: 'Av. Libertador 1234, 4B',
    customerName: 'Juan Pérez',
    paymentMethod: PaymentMethod.CARD,
    type: OrderType.DELIVERY
  },
  {
    id: 'ord-demo-002',
    storeId: 's2',
    storeName: 'Sushi Zen',
    total: 490.00,
    deliveryFee: 55.00,
    status: OrderStatus.READY, // Ready for Driver to Pick Up
    items: [
      { product: MOCK_STORES[1].products[0], quantity: 3, selectedModifiers: [], totalPrice: 435.00 }
    ],
    createdAt: new Date(NOW.getTime() - (15 * 60 * 1000)), // 15 mins ago
    address: 'Calle Falsa 123',
    customerName: 'Maria Garcia',
    paymentMethod: PaymentMethod.CASH,
    type: OrderType.DELIVERY
  },
  {
    id: 'ord-demo-003',
    storeId: 's4',
    storeName: 'Tacos El Pastor',
    total: 180.00,
    deliveryFee: 30.00,
    status: OrderStatus.PREPARING, // Visible in Merchant View (if Tacos selected)
    items: [
      { product: MOCK_STORES[3].products[0], quantity: 2, selectedModifiers: [], totalPrice: 150.00 }
    ],
    createdAt: new Date(NOW.getTime() - (5 * 60 * 1000)), // 5 mins ago
    address: 'Av. Santa Fe 500',
    customerName: 'Carlos Lopez',
    paymentMethod: PaymentMethod.CARD,
    type: OrderType.DELIVERY
  }
];

export const APP_CONFIG = {
  currency: '$',
  appName: 'Mazamitla'
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

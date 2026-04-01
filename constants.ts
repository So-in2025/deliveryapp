
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

export const MOCK_STORES: Store[] = [];

export const INITIAL_ORDERS: Order[] = [];

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

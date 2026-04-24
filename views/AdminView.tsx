import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Store, OrderType, UserRole, Order } from '../types';
import { formatCurrency } from '../constants';
import { Badge, PaymentBadge, StoreBadge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { Button } from '../components/ui/Button';
import { 
  TrendingUp, Users, Store as StoreIcon, Activity, 
  DollarSign, Shield, Search, 
  AlertTriangle, ChevronRight, Truck, MapPin, ArrowLeft, Mail,
  BarChart3, PieChart as PieChartIcon, Filter, Tag, X, Plus
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}

const KpiCard = ({ title, value, sub, icon: Icon, color }: KpiCardProps) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex items-start justify-between dark:bg-stone-900 dark:border-stone-800">
    <div>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{value}</h3>
      <p className={`text-xs font-bold mt-1 ${color}`}>{sub}</p>
    </div>
    <div className={`p-2 rounded-lg bg-stone-50 ${color.replace('text-', 'text-opacity-80 text-')} dark:bg-stone-900`}>
      <Icon size={20} />
    </div>
  </div>
);

const SettlementsTab = ({ orders, settleMerchantOrder, settleDriverOrder }: { 
    orders: Order[], 
    settleMerchantOrder: (id: string) => Promise<void>,
    settleDriverOrder: (id: string) => Promise<void>
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'MERCHANTS' | 'DRIVERS'>('MERCHANTS');

    const merchantSettlements = useMemo(() => {
        const settlements: { [storeId: string]: { storeName: string, pending: number, settled: number, total: number, orders: Order[] } } = {};
        
        orders.filter(o => o.status === OrderStatus.DELIVERED).forEach(order => {
            if (!settlements[order.storeId]) {
                settlements[order.storeId] = { storeName: order.storeName, pending: 0, settled: 0, total: 0, orders: [] };
            }
            const amount = order.merchantEarnings || 0;
            if (order.merchantSettled) {
                settlements[order.storeId].settled += amount;
            } else {
                settlements[order.storeId].pending += amount;
            }
            settlements[order.storeId].total += amount;
            settlements[order.storeId].orders.push(order);
        });

        return Object.entries(settlements).map(([id, data]) => ({ id, ...data }));
    }, [orders]);

    const driverSettlements = useMemo(() => {
        const settlements: { [driverId: string]: { driverName: string, pending: number, settled: number, total: number, orders: Order[] } } = {};
        
        orders.filter(o => o.status === OrderStatus.DELIVERED && o.driverId).forEach(order => {
            if (!settlements[order.driverId!]) {
                settlements[order.driverId!] = { driverName: order.driverName || 'Repartidor', pending: 0, settled: 0, total: 0, orders: [] };
            }
            const amount = order.driverEarnings || 0;
            if (order.driverSettled) {
                settlements[order.driverId!].settled += amount;
            } else {
                settlements[order.driverId!].pending += amount;
            }
            settlements[order.driverId!].total += amount;
            settlements[order.driverId!].orders.push(order);
        });

        return Object.entries(settlements).map(([id, data]) => ({ id, ...data }));
    }, [orders]);

    return (
        <div className="space-y-6 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
            <div className="flex bg-stone-100 p-1 rounded-xl border border-amber-300 dark:bg-stone-800 dark:border-stone-800">
                <button 
                    onClick={() => setActiveSubTab('MERCHANTS')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'MERCHANTS' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'} dark:text-white`}
                >
                    Comercios
                </button>
                <button 
                    onClick={() => setActiveSubTab('DRIVERS')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'DRIVERS' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'} dark:text-white`}
                >
                    Repartidores
                </button>
            </div>

            {activeSubTab === 'MERCHANTS' ? (
                <div className="space-y-4">
                    {merchantSettlements.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <DollarSign size={48} className="mx-auto mb-4 text-stone-300" />
                            <p className="font-medium text-stone-900 dark:text-white">No hay liquidaciones pendientes</p>
                        </div>
                    ) : merchantSettlements.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4 dark:bg-stone-900 dark:border-stone-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-stone-900 text-lg uppercase tracking-tight dark:text-white">{s.storeName}</h3>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">ID: {s.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Pendiente</p>
                                    <p className="text-xl font-black text-red-500">{formatCurrency(s.pending)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-50">
                                <div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Liquidado</p>
                                    <p className="font-bold text-stone-900 dark:text-white">{formatCurrency(s.settled)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Total Histórico</p>
                                    <p className="font-bold text-stone-900 dark:text-white">{formatCurrency(s.total)}</p>
                                </div>
                            </div>
                            {s.pending > 0 && (
                                <Button 
                                    fullWidth 
                                    onClick={() => {
                                        const pendingOrders = s.orders.filter(o => !o.merchantSettled);
                                        pendingOrders.forEach(o => settleMerchantOrder(o.id));
                                    }}
                                    className="bg-stone-950 text-white"
                                >
                                    Liquidar Todo
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {driverSettlements.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <Truck size={48} className="mx-auto mb-4 text-stone-300" />
                            <p className="font-medium text-stone-900 dark:text-white">No hay liquidaciones pendientes</p>
                        </div>
                    ) : driverSettlements.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4 dark:bg-stone-900 dark:border-stone-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-stone-900 text-lg uppercase tracking-tight dark:text-white">{s.driverName}</h3>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">ID: {s.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Pendiente</p>
                                    <p className="text-xl font-black text-red-500">{formatCurrency(s.pending)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-50">
                                <div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Liquidado</p>
                                    <p className="font-bold text-stone-900 dark:text-white">{formatCurrency(s.settled)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Total Histórico</p>
                                    <p className="font-bold text-stone-900 dark:text-white">{formatCurrency(s.total)}</p>
                                </div>
                            </div>
                            {s.pending > 0 && (
                                <Button 
                                    fullWidth 
                                    onClick={() => {
                                        const pendingOrders = s.orders.filter(o => !o.driverSettled);
                                        pendingOrders.forEach(o => settleDriverOrder(o.id));
                                    }}
                                    className="bg-stone-950 text-white"
                                >
                                    Liquidar Todo
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const OrdersTab = ({ orders }: { orders: Order[] }) => {
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
    
    // Diccionario de traducción para los estados del pedido
    const statusLabels: Record<OrderStatus, string> = {
        [OrderStatus.PENDING]: 'Pendiente',
        [OrderStatus.ACCEPTED]: 'Aceptado',
        [OrderStatus.PREPARING]: 'Preparando',
        [OrderStatus.READY]: 'Listo',
        [OrderStatus.DRIVER_ASSIGNED]: 'Asignado',
        [OrderStatus.PICKED_UP]: 'En Camino',
        [OrderStatus.DELIVERED]: 'Entregado',
        [OrderStatus.CANCELLED]: 'Cancelado',
        [OrderStatus.DISPUTED]: 'En Disputa',
    };

    const roleLabels: Record<UserRole, string> = {
        [UserRole.NONE]: 'Ninguno',
        [UserRole.CLIENT]: 'Cliente',
        [UserRole.MERCHANT]: 'Comercio',
        [UserRole.DRIVER]: 'Repartidor',
        [UserRole.ADMIN]: 'Admin',
    };

    const filteredOrders = useMemo(() => {
        if (statusFilter === 'ALL') return orders;
        return orders.filter(o => o.status === statusFilter);
    }, [orders, statusFilter]);

    return (
        <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${statusFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-amber-300'} dark:text-stone-400`}
                >
                    Todos
                </button>
                {Object.values(OrderStatus).map(status => (
                    <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${statusFilter === status ? 'bg-stone-900 text-white border-stone-900' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-amber-300'} dark:text-stone-400`}
                    >
                        {statusLabels[status]}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex justify-between items-center dark:bg-stone-900 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center dark:bg-stone-900">
                                <Activity size={20} className="text-stone-400" />
                            </div>
                            <div>
                                <p className="font-bold text-stone-900 text-sm dark:text-white">{order.storeName}</p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400">#{order.id.slice(-6)} • {order.customerName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-stone-900 text-sm dark:text-white">{formatCurrency(order.total)}</p>
                            <div className="flex flex-col items-end gap-1">
                                <Badge status={order.status} />
                                <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BannersManagementTab = ({ 
    banners, 
    addBanner, 
    updateBanner, 
    deleteBanner 
}: { 
    banners: any[], 
    addBanner: (b: any) => void, 
    updateBanner: (id: string, d: any) => void, 
    deleteBanner: (id: string) => void 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newBanner, setNewBanner] = useState({
        title: '',
        subtitle: '',
        image: '',
        badge: 'PROMO',
        isActive: true,
        priority: 0,
        link: ''
    });

    const handleAdd = () => {
        if (!newBanner.title || !newBanner.image) return;
        addBanner(newBanner);
        setIsAdding(false);
        setNewBanner({ title: '', subtitle: '', image: '', badge: 'PROMO', isActive: true, priority: 0, link: '' });
    };

    return (
        <div className="space-y-6 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
            <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-4 rounded-xl border border-amber-200 dark:border-stone-800 shadow-sm transition-colors">
                <div>
                    <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tighter">Promociones Globales</h3>
                    <p className="text-xs text-stone-500 font-medium dark:text-stone-400">Gestiona los banners de la pantalla principal</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>
                        {isAdding ? <X size={20} /> : <div className="flex items-center gap-2"><Plus size={20} /> <span className="hidden sm:inline">Nueva Promo</span></div>}
                    </Button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-brand-500/30 shadow-2xl animate-slide-in-bottom space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Título Principal</label>
                            <input 
                                className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all font-bold"
                                placeholder="Ej. 20% OFF en Tu Primera Orden"
                                value={newBanner.title}
                                onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Subtítulo / Texto</label>
                            <input 
                                className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all"
                                placeholder="Ej. Toca para aplicar"
                                value={newBanner.subtitle}
                                onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">URL de la Imagen (Unsplash/Directo)</label>
                            <input 
                                className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all"
                                placeholder="https://images.unsplash.com/..."
                                value={newBanner.image}
                                onChange={e => setNewBanner({...newBanner, image: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Badge / Etiqueta</label>
                            <input 
                                className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                                placeholder="PROMO, NUEVO, HOT"
                                value={newBanner.badge}
                                onChange={e => setNewBanner({...newBanner, badge: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>
                    <Button fullWidth onClick={handleAdd} className="h-14 text-lg">Guardar Promoción</Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(banner => (
                    <div key={banner.id} className="group bg-white dark:bg-stone-900 rounded-3xl border border-amber-200 dark:border-stone-800 shadow-lg overflow-hidden transition-all hover:shadow-2xl">
                        <div className="relative h-40 overflow-hidden">
                            <img src={banner.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit mb-2">{banner.badge}</span>
                                <h4 className="text-white font-black text-xl leading-tight">{banner.title}</h4>
                                <p className="text-stone-300 text-xs">{banner.subtitle}</p>
                            </div>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    onClick={() => updateBanner(banner.id, { isActive: !banner.isActive })}
                                    className={`p-2 rounded-xl backdrop-blur-md transition-all ${banner.isActive ? 'bg-green-500 text-white shadow-green-500/40' : 'bg-red-50 dark:bg-red-900/200 text-white shadow-red-500/40'}`}
                                >
                                    <TrendingUp size={16} />
                                </button>
                                <button 
                                    onClick={() => deleteBanner(banner.id)}
                                    className="p-2 bg-black/40 text-white rounded-xl backdrop-blur-md hover:bg-red-600 transition-all border border-white/10"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-green-500' : 'bg-stone-300 animate-pulse'}`}></div>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{banner.isActive ? 'Activo' : 'Desactivado'}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <label className="text-[10px] font-black text-stone-400 uppercase">Prioridad:</label>
                                    <input 
                                        type="number"
                                        className="w-12 bg-stone-50 dark:bg-stone-950 rounded border dark:border-stone-800 text-[10px] font-bold p-1"
                                        value={banner.priority}
                                        onChange={(e) => updateBanner(banner.id, { priority: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-stone-50 dark:bg-stone-900/40 rounded-3xl border-2 border-dashed border-amber-300 dark:border-stone-800">
                        <Tag size={48} className="mx-auto text-stone-300 mb-4" />
                        <h4 className="text-stone-900 dark:text-white font-black text-xl">Sin Promociones Activas</h4>
                        <p className="text-stone-500 dark:text-stone-400">Haz clic en el botón "+" para crear tu primer banner promocional.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const AdminView: React.FC = () => {
  const { 
    orders, stores, assignDriver, drivers, resolveClaim, users, 
    adminViewState, setAdminViewState, updateAnyUser, updateStore, 
    config, updateConfig, user, completeTour, settleMerchantOrder, 
    settleDriverOrder, banners, addBanner, updateBanner, deleteBanner 
  } = useApp();
  const { showToast } = useToast();

  const isMobile = window.innerWidth < 1024;

  const adminTourSteps: TourStep[] = [
    {
        targetId: isMobile ? 'admin-stats' : 'dashboard-tab',
        title: 'Métricas del Negocio',
        description: 'Visualiza las ventas totales, pedidos activos y el rendimiento general de la plataforma en tiempo real.',
        position: isMobile ? 'bottom' : 'right'
    },
    {
        targetId: isMobile ? 'stores-tab-mobile' : 'stores-tab',
        title: 'Gestión de Comercios',
        description: 'Administra todos los locales, revisa sus productos, ajusta comisiones y aprueba nuevos registros.',
        position: isMobile ? 'bottom' : 'right'
    },
    {
        targetId: isMobile ? 'users-tab-mobile' : 'users-tab',
        title: 'Control de Usuarios',
        description: 'Gestiona los roles de Clientes, Merchants, Drivers y otros Administradores. Bloquea o desbloquea cuentas.',
        position: isMobile ? 'bottom' : 'right'
    },
    {
        targetId: isMobile ? 'fleet-tab-mobile' : 'fleet-tab',
        title: 'Logística y Flota',
        description: 'Supervisa a los repartidores, asigna pedidos manualmente si es necesario y monitorea su ubicación.',
        position: isMobile ? 'bottom' : 'right'
    },
    {
        targetId: isMobile ? 'disputes-tab-mobile' : 'disputes-tab',
        title: 'Resolución de Reclamos',
        description: 'Atiende disputas entre clientes, comercios y repartidores. Reembolsa o compensa según sea necesario.',
        position: isMobile ? 'bottom' : 'right'
    },
    {
        targetId: isMobile ? 'config-tab-mobile' : 'config-tab',
        title: 'Configuración Global',
        description: 'Ajusta comisiones, tarifas de envío y el modo de mantenimiento de la app.',
        position: isMobile ? 'bottom' : 'right'
    }
  ];

  const showTour = !user.completedTours?.includes('admin-onboarding') && adminViewState === 'DASHBOARD';
  
  // Local settings state for the form
  const [localConfig, setLocalConfig] = useState(config);
  
  // Local drill-down state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // storing customerName for simplicity in MVP
  const [storeSearch, setStoreSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // --- ANALYTICS LOGIC ---
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return startOfDay(date);
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => isSameDay(new Date(o.createdAt), date));
      return {
        name: format(date, 'EEE', { locale: es }),
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
        commission: dayOrders.reduce((sum, o) => sum + (o.platformCommission || 0), 0)
      };
    });
  }, [orders]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  const kpis = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const platformCommission = orders.reduce((acc, o) => acc + (o.platformCommission || 0), 0);
    const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const pendingStores = stores.filter(s => !s.isActive).length;
    const onlineUsers = users.filter(u => u.isOnline).length;

    return {
      totalSales,
      platformCommission,
      activeOrders,
      completedOrders,
      totalStores: stores.length,
      pendingStores,
      onlineUsers
    };
  }, [orders, stores, users]);

  const recentActivity = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  // Derive unique users from users collection for the Users list
  const userList = useMemo(() => {
      const list = users.map(u => {
          const userOrders = orders.filter(o => o.customerName === u.name || o.uid === u.uid);
          const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
          return {
              ...u,
              totalOrders: userOrders.length,
              totalSpent,
              lastActive: userOrders[0]?.createdAt || new Date()
          };
      });

      if (!userSearch) return list;
      return list.filter(u => 
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
      );
  }, [orders, users, userSearch]);

  const filteredStores = useMemo(() => {
    if (!storeSearch) return stores;
    return stores.filter(s => 
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(storeSearch.toLowerCase())
    );
  }, [stores, storeSearch]);

  // --- SUB-COMPONENTS ---

  const renderDashboardTab = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      <div id="admin-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pt-2 lg:w-full lg:px-8">
        <KpiCard 
          title="Ingresos Globales" 
          value={formatCurrency(kpis.totalSales)}
          sub={`${kpis.completedOrders} pedidos finalizados`}
          icon={DollarSign}
          color="text-brand-950"
        />
        <KpiCard 
          title="Comisiones" 
          value={formatCurrency(kpis.platformCommission)}
          sub="Ingreso Bruto Plataforma"
          icon={TrendingUp}
          color="text-brand-950"
        />
        <KpiCard 
          title="Tiendas" 
          value={kpis.totalStores}
          sub={`${kpis.pendingStores} por aprobar`}
          icon={StoreIcon}
          color="text-amber-700"
        />
        <KpiCard 
          title="Usuarios Activos" 
          value={kpis.onlineUsers}
          sub="En línea ahora"
          icon={Users}
          color="text-orange-700"
        />
      </div>

      {/* Charts Section */}
      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:w-full lg:px-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 dark:text-white">
              <BarChart3 size={18} className="text-brand-800" /> Ventas (Últimos 7 días)
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-500"></div> Ventas</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stone-300"></div> Pedidos</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#a8a29e'}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area type="monotone" dataKey="sales" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2 dark:text-white">
            <PieChartIcon size={18} className="text-brand-800" /> Estado de Pedidos
          </h3>
          <div className="h-64 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-[10px] font-bold text-stone-500 truncate dark:text-stone-400">{entry.name}</span>
                  <span className="text-[10px] font-bold text-stone-900 ml-auto dark:text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:w-full lg:px-8">
        <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2 dark:text-white">
          <Activity size={18} className="text-brand-800" /> Actividad en Vivo
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 divide-y divide-stone-50 overflow-hidden lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-4 lg:p-4 dark:bg-stone-900 dark:border-stone-800">
          {recentActivity.map(order => (
            <div key={order.id} className="p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors lg:rounded-xl lg:border lg:border-amber-200">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                    {order.customerName.charAt(0)}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-stone-900 leading-none mb-1 dark:text-white">
                      {order.storeName}
                      <span className="text-stone-400 font-normal"> vendió </span> 
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-[10px] text-stone-400 flex items-center gap-1">
                      Hace 2 min • {order.items.length} items • <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                    </p>
                 </div>
              </div>
              <Badge status={order.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDispatchTab = () => {
      // Logic: Show orders that are READY but NOT assigned (or pending assignment)
      const dispatchableOrders = orders.filter(o => 
          (o.status === OrderStatus.READY || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING) 
          && o.type === OrderType.DELIVERY
      );

      return (
          <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 lg:mb-6">
                   <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                   <div>
                       <h3 className="font-bold text-amber-800 text-sm">Despacho Manual Activo</h3>
                       <p className="text-xs text-amber-700 mt-1">
                           Asigna conductores manualmente. Los conductores solo verán pedidos asignados a ellos.
                       </p>
                   </div>
               </div>

               {dispatchableOrders.length === 0 ? (
                   <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                       <Truck size={40} className="mx-auto text-stone-300 mb-2" />
                       <p className="text-stone-500 font-bold dark:text-stone-400">Sin pedidos para despachar</p>
                   </div>
               ) : (
                   <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                   {dispatchableOrders.map(order => (
                       <div key={order.id} className="bg-white rounded-xl border border-amber-300 shadow-sm overflow-hidden h-full flex flex-col dark:bg-stone-900 dark:border-stone-800">
                           <div className="p-3 bg-stone-50 border-b border-amber-200 flex justify-between items-center dark:bg-stone-900 dark:border-stone-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">{order.id.slice(-6)}</span>
                                    <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                                </div>
                                <Badge status={order.status} />
                           </div>
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h4 className="font-bold text-stone-900 dark:text-white">{order.storeName}</h4>
                                       <div className="flex items-center gap-1 text-xs text-stone-500 mt-1 dark:text-stone-400">
                                           <MapPin size={12} /> {order.address}
                                       </div>
                                   </div>
                                   <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(order.total)}</span>
                               </div>

                               <div className="space-y-2">
                                   <p className="text-xs font-bold text-stone-400 uppercase">Asignar Repartidor:</p>
                                   <div className="grid grid-cols-2 gap-2">
                                       {drivers.map(driver => (
                                           <button 
                                                key={driver.id}
                                                onClick={() => {
                                                    assignDriver(order.id, driver.id);
                                                    showToast(`Asignado a ${driver.name}`, 'success');
                                                }}
                                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${order.driverId === driver.id ? 'bg-brand-500 dark:bg-brand-600 text-brand-950 dark:text-stone-900 border-brand-500' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-amber-300 hover:border-stone-300'} dark:text-stone-400 dark:border-stone-800`}
                                           >
                                               {driver.name}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))}
                   </div>
               )}
          </div>
      );
  };

  const renderStoreDetail = () => {
      if(!selectedStore) return null;
      const storeStats = orders.filter(o => o.storeId === selectedStore.id);
      const totalRevenue = storeStats.reduce((sum, o) => sum + o.total, 0);

      return (
          <div className="bg-stone-50 h-full animate-slide-in-right flex flex-col dark:bg-stone-900">
              <div className="bg-white p-4 border-b border-amber-200 flex gap-3 items-center sticky top-0 z-10 dark:bg-stone-900 dark:border-stone-800">
                  <button onClick={() => setSelectedStore(null)} className="p-2 -ml-2 hover:bg-stone-50 dark:hover:bg-stone-800/30 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">{selectedStore.name}</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                      <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden dark:bg-stone-800">
                          <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full" />
                      </div>
                      <div>
                          <p className="text-stone-500 text-sm dark:text-stone-400">{selectedStore.category}</p>
                          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-white">
                              <StoreIcon size={14} /> ID: {selectedStore.id}
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-center dark:bg-stone-900 dark:border-stone-800">
                          <p className="text-xs font-bold text-stone-400 uppercase">Ventas Totales</p>
                          <p className="text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-center dark:bg-stone-900 dark:border-stone-800">
                          <p className="text-xs font-bold text-stone-400 uppercase">Pedidos</p>
                          <p className="text-xl font-bold text-stone-900 dark:text-white">{storeStats.length}</p>
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 dark:bg-stone-900 dark:border-stone-800">
                      <h3 className="font-bold text-stone-900 text-sm dark:text-white">Configuración de Comisiones</h3>
                      <div className="space-y-4">
                          <div>
                              <p className="text-xs font-bold text-stone-400 uppercase mb-1">Comisión Personalizada (%)</p>
                              <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    defaultValue={(selectedStore.commissionPct || config.platformCommissionPct) * 100}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) / 100;
                                        updateStore(selectedStore.id, { commissionPct: val });
                                    }}
                                    className="flex-1 p-2 bg-stone-50 border border-amber-300 rounded-lg text-sm dark:bg-stone-900 dark:border-stone-800"
                                  />
                                  <div className="bg-stone-100 px-3 flex items-center rounded-lg font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">%</div>
                              </div>
                              <p className="text-[10px] text-stone-400 mt-1 italic">* Sobrescribe la comisión global del {(config.platformCommissionPct * 100).toFixed(0)}%</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 dark:bg-stone-900 dark:border-stone-800">
                      <h3 className="font-bold text-stone-900 text-sm dark:text-white">Estado del Comercio</h3>
                      <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            fullWidth 
                            className="bg-red-50 text-red-600 border-red-100"
                            onClick={() => {
                                updateStore(selectedStore.id, { isActive: false });
                                showToast('Comercio Suspendido', 'info');
                            }}
                          >
                              Suspender
                          </Button>
                          <Button 
                            fullWidth 
                            className="bg-brand-500 text-brand-950"
                            onClick={() => {
                                updateStore(selectedStore.id, { isActive: true });
                                showToast('Comercio Aprobado', 'success');
                            }}
                          >
                              Aprobar
                          </Button>
                      </div>
                  </div>

                  <div>
                      <h3 className="font-bold text-stone-900 mb-2 dark:text-white">Productos ({selectedStore.products.length})</h3>
                      <div className="bg-white rounded-xl border border-amber-200 divide-y divide-stone-50 dark:bg-stone-900 dark:border-stone-800">
                          {selectedStore.products.map(p => (
                              <div key={p.id} className="p-3 flex justify-between items-center">
                                  <span className="text-sm font-medium">{p.name}</span>
                                  <span className="text-sm text-stone-500 dark:text-stone-400">{formatCurrency(p.price)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const renderStoresTab = () => (
    <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
      <div className="bg-white p-2 rounded-xl border border-amber-300 flex items-center gap-2 lg:max-w-md dark:bg-stone-900 dark:border-stone-800">
         <Search size={18} className="text-stone-400 ml-2" />
         <input 
            placeholder="Buscar comercio..." 
            className="flex-1 outline-none text-sm" 
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
         />
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
      {filteredStores.map(store => (
        <div 
            key={store.id} 
            onClick={() => setSelectedStore(store)}
            className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex gap-4 items-center active:scale-[0.99] transition-transform cursor-pointer h-full dark:bg-stone-900 dark:border-stone-800"
        >
           <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden shrink-0 dark:bg-stone-800">
              <LazyImage src={store.image} alt={store.name} className="w-full h-full" />
           </div>
           <div className="flex-1">
              <h4 className="font-bold text-stone-900 dark:text-white">{store.name}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">{store.category} • {store.createdAt ? 'Nuevo' : 'Veterano'}</p>
              <div className="flex items-center gap-3 mt-1">
                 <StoreBadge isActive={store.isActive} />
                 <span className="text-[10px] text-stone-400">ID: {store.id}</span>
              </div>
           </div>
           <ChevronRight size={18} className="text-stone-300" />
        </div>
      ))}
      </div>
    </div>
  );

  const renderUserDetail = () => {
      if(!selectedUser) return null;
      const userProfile = users.find(u => u.name === selectedUser || u.uid === selectedUser);
      const userOrders = orders.filter(o => o.customerName === selectedUser || o.uid === selectedUser);
      const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);

      return (
          <div className="bg-stone-50 h-full animate-slide-in-right flex flex-col dark:bg-stone-900">
               <div className="bg-white p-4 border-b border-amber-200 flex gap-3 items-center sticky top-0 z-10 dark:bg-stone-900 dark:border-stone-800">
                  <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 hover:bg-stone-50 dark:hover:bg-stone-800/30 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">Perfil de Usuario</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="text-center py-6 bg-white rounded-2xl border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                      <div className="w-20 h-20 bg-stone-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                          {userProfile?.name?.charAt(0) || selectedUser.charAt(0)}
                      </div>
                      <h2 className="text-xl font-bold text-stone-900 dark:text-white">{userProfile?.name || selectedUser}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-stone-500 dark:text-stone-400">
                          <Mail size={14} /> <span>{userProfile?.email || 'usuario@demo.com'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-4">
                          <div className="text-center">
                              <p className="text-xl font-bold text-stone-900 dark:text-white">{userOrders.length}</p>
                              <p className="text-[10px] uppercase font-bold text-stone-400">Pedidos</p>
                          </div>
                           <div className="text-center">
                              <p className="text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(totalSpent)}</p>
                              <p className="text-[10px] uppercase font-bold text-stone-400">Total Gastado</p>
                          </div>
                      </div>
                      
                      {userProfile && (
                        <div className="mt-6 pt-6 border-t border-amber-200 dark:border-stone-800">
                          <p className="text-xs font-bold text-stone-400 uppercase mb-3">Gestión de Rol</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {Object.values(UserRole).map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            updateAnyUser(userProfile.uid, { role });
                            showToast(`Rol actualizado a ${roleLabels[role]}`, 'success');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${userProfile.role === role ? 'bg-stone-900 text-white border-stone-900' : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-amber-300 hover:border-stone-400'} dark:text-stone-400 dark:border-stone-800`}
                        >
                          {roleLabels[role]}
                        </button>
                      ))}
                          </div>
                        </div>
                      )}

                      {userProfile?.role === UserRole.DRIVER && (
                        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-stone-800">
                          <p className="text-xs font-bold text-stone-400 uppercase mb-3">Seguridad Repartidor</p>
                          <div className="flex flex-col gap-3 text-left">
                             <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                                <div>
                                   <p className="text-xs font-bold text-stone-700 dark:text-stone-300">Estado de Aprobación</p>
                                   <p className="text-[10px] text-stone-500 dark:text-stone-400">{userProfile.isApprovedDriver ? 'Aprobado para trabajar' : 'Pendiente de revisión'}</p>
                                </div>
                                <Button 
                                  size="sm"
                                  variant={userProfile.isApprovedDriver ? 'outline' : 'primary'}
                                  onClick={() => {
                                    updateAnyUser(userProfile.uid, { isApprovedDriver: !userProfile.isApprovedDriver });
                                    showToast(userProfile.isApprovedDriver ? 'Acceso revocado' : 'Repartidor aprobado', 'success');
                                  }}
                                >
                                  {userProfile.isApprovedDriver ? 'Revocar' : 'Aprobar'}
                                </Button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-stone-50 rounded-lg dark:bg-stone-900">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">Dirección M.</p>
                                   <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{userProfile.driverAddress || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-stone-50 rounded-lg dark:bg-stone-900">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">Referencia Per.</p>
                                   <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{userProfile.driverPersonalReference || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-stone-50 rounded-lg dark:bg-stone-900">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">T. Vehículo</p>
                                   <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{userProfile.vehicleType || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-stone-50 rounded-lg dark:bg-stone-900">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">Teléfono</p>
                                   <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{userProfile.phone || 'N/A'}</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-2 mt-2">
                                {userProfile.driverIneUrl && (
                                    <div className="relative group cursor-pointer" onClick={() => window.open(userProfile.driverIneUrl, '_blank')}>
                                        <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">INE</p>
                                        <img src={userProfile.driverIneUrl} alt="INE" className="w-full h-24 object-cover rounded-xl border border-amber-300 dark:border-stone-800" />
                                    </div>
                                )}
                                {userProfile.driverSelfieUrl && (
                                    <div className="relative group cursor-pointer" onClick={() => window.open(userProfile.driverSelfieUrl, '_blank')}>
                                        <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Selfie</p>
                                        <img src={userProfile.driverSelfieUrl} alt="Selfie" className="w-full h-24 object-cover rounded-xl border border-amber-300 dark:border-stone-800" />
                                    </div>
                                )}
                             </div>
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                      <h3 className="font-bold text-stone-900 mb-3 ml-1 dark:text-white">Historial de Pedidos</h3>
                      <div className="space-y-3">
                          {userOrders.map(order => (
                              <div key={order.id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center dark:bg-stone-900 dark:border-stone-800">
                                  <div>
                                      <p className="font-bold text-sm text-stone-900 dark:text-white">{order.storeName}</p>
                                      <p className="text-xs text-stone-500 dark:text-stone-400">{new Date(order.createdAt).toLocaleDateString()} • {formatCurrency(order.total)}</p>
                                  </div>
                                  <Badge status={order.status} />
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const renderUsersTab = () => (
    <div className="px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
       <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="bg-white p-2 rounded-xl border border-amber-300 flex items-center gap-2 flex-1 dark:bg-stone-900 dark:border-stone-800">
            <Search size={18} className="text-stone-400 ml-2" />
            <input 
                placeholder="Buscar usuario..." 
                className="flex-1 outline-none text-sm" 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${roleFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-amber-300'} dark:text-stone-400`}
            >
                <Filter size={14} /> Todos
            </button>
            {Object.values(UserRole).map(role => (
                <button 
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${roleFilter === role ? 'bg-stone-900 text-white border-stone-900 dark:bg-brand-500 dark:text-brand-950 dark:border-brand-500' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-amber-300'} dark:text-stone-400 dark:border-white/5`}
                >
                    {roleLabels[role]}
                </button>
            ))}
          </div>
       </div>
       
       <div className="bg-white rounded-xl shadow-sm border border-amber-200 text-left overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:bg-transparent lg:shadow-none lg:border-0 dark:bg-stone-900 dark:border-stone-800">
           <div className="p-3 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center lg:hidden">
              <span className="text-xs font-bold text-stone-500 uppercase dark:text-stone-400">Lista de Usuarios ({userList.filter(u => roleFilter === 'ALL' || u.role === roleFilter).length})</span>
            </div>
            {userList
            .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
            .map((u, i) => (
               <div 
                    key={u.uid || i} 
                    onClick={() => setSelectedUser(u.uid || u.name)}
                    className="p-3 flex justify-between items-center border-b border-stone-50 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/30 cursor-pointer active:bg-stone-100 transition-colors dark:border-white/5 lg:bg-white lg:dark:bg-stone-900/50 lg:rounded-xl lg:border lg:border-amber-200 lg:dark:border-white/5 lg:shadow-sm"
                >
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                           {u.name?.charAt(0) || '?'}
                       </div>
                       <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-stone-900 dark:text-white">{u.name || 'Sin nombre'}</p>
                             <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">{roleLabels[u.role] || u.role}</span>
                             {u.role === UserRole.DRIVER && !u.isApprovedDriver && (
                               <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/20">Pendiente</span>
                             )}
                           </div>
                           <p className="text-[10px] text-stone-500 dark:text-stone-400">{u.totalOrders} pedidos • LTV: {formatCurrency(u.totalSpent)}</p>
                       </div>
                   </div>
                   <ChevronRight size={16} className="text-stone-300" />
               </div>
           ))}
       </div>
    </div>
  );


  const renderDisputesTab = () => {
    const disputedOrders = orders.filter(o => o.status === OrderStatus.DISPUTED);

    const handleResolveDispute = (orderId: string, resolution: 'RESOLVED' | 'REJECTED') => {
        resolveClaim(orderId, resolution);
        showToast(`Reclamo ${resolution === 'RESOLVED' ? 'Aceptado (Reembolsado)' : 'Rechazado'}`, 'success');
    };

    return (
        <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
            {disputedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                    <Shield size={40} className="mx-auto text-stone-300 mb-2" />
                    <p className="text-stone-500 font-bold dark:text-stone-400">No hay reclamos activos</p>
                </div>
            ) : (
                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {disputedOrders.map(order => (
                    <div key={order.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-amber-900">Pedido #{order.id.slice(-6)}</p>
                                <p className="text-xs text-amber-700">{order.storeName} • {order.customerName}</p>
                            </div>
                            <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase">En Revisión</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 mb-4 dark:bg-stone-900">
                            <p className="text-sm font-medium text-stone-800 dark:text-stone-100">"{order.claimReason}"</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" fullWidth className="bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-stone-900" onClick={() => handleResolveDispute(order.id, 'REJECTED')}>
                                Rechazar
                            </Button>
                            <Button fullWidth className="bg-brand-500 text-brand-950 hover:bg-brand-600" onClick={() => handleResolveDispute(order.id, 'RESOLVED')}>
                                Reembolsar
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="h-full bg-stone-50 flex flex-col dark:bg-stone-900">
       {/* Drill-down Views */}
       {selectedStore ? renderStoreDetail() :
        selectedUser ? renderUserDetail() : (
            <>
                <div className="bg-stone-950 text-white p-6 pt-safe-pt shadow-2xl z-10 sticky top-0 border-b border-white/5">
                    <div className="lg:w-full lg:px-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-black flex items-center gap-3 tracking-tighter uppercase">
                                    <div className="p-2 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 text-brand-950">
                                        <Shield size={24} strokeWidth={3} />
                                    </div>
                                    Panel de Control
                                </h1>
                                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1 mt-1 dark:text-stone-400">Administración Centralizada</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest dark:text-stone-400">Estado del Sistema</p>
                                    <div className="flex items-center gap-2 justify-end mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Operativo</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                                    <span className="font-black text-sm text-brand-500">AD</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 overflow-x-auto lg:hidden">
                            {[
                                { id: 'DASHBOARD', label: 'Resumen', icon: <BarChart3 size={16} /> },
                                { id: 'FLEET', label: 'Logística', icon: <Truck size={16} /> },
                                { id: 'ORDERS', label: 'Pedidos', icon: <Activity size={16} /> },
                                { id: 'BANNERS', label: 'Promos', icon: <Tag size={16} /> },
                                { id: 'SETTLEMENTS', label: 'Liquidaciones', icon: <DollarSign size={16} /> },
                                { id: 'STORES', label: 'Comercios', icon: <StoreIcon size={16} /> },
                                { id: 'USERS', label: 'Usuarios', icon: <Users size={16} /> },
                                { id: 'DISPUTES', label: 'Reclamos', icon: <AlertTriangle size={16} /> },
                                { id: 'SETTINGS', label: 'Ajustes', icon: <Tag size={16} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAdminViewState(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative ${adminViewState === tab.id ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xl' : 'text-stone-500 hover:text-white'}`}
                                >
                                    {tab.icon}
                                    <span className="hidden md:inline">{tab.label}</span>
                                    {tab.id === 'DISPUTES' && orders.some(o => o.status === OrderStatus.DISPUTED && o.claimStatus === 'PENDING') && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-50 dark:bg-red-900/200"></span>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <div className="lg:w-full lg:px-8">
                        {adminViewState === 'DASHBOARD' && renderDashboardTab()}
                        {adminViewState === 'FLEET' && renderDispatchTab()}
                        {adminViewState === 'ORDERS' && <OrdersTab orders={orders} />}
                        {adminViewState === 'BANNERS' && <BannersManagementTab banners={banners} addBanner={addBanner} updateBanner={updateBanner} deleteBanner={deleteBanner} />}
                        {adminViewState === 'SETTLEMENTS' && <SettlementsTab orders={orders} settleMerchantOrder={settleMerchantOrder} settleDriverOrder={settleDriverOrder} />}
                        {adminViewState === 'STORES' && renderStoresTab()}
                        {adminViewState === 'USERS' && renderUsersTab()}
                        {adminViewState === 'DISPUTES' && renderDisputesTab()}
                        {adminViewState === 'SETTINGS' && (
                            <div className="p-6 space-y-8 animate-fade-in lg:w-full lg:px-8">

                            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden divide-y divide-stone-50 dark:bg-stone-900 dark:border-stone-800">
                                <div className="p-4">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 dark:text-white">
                                        <DollarSign size={18} className="text-brand-800" /> Parámetros Financieros
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Comisión de Plataforma</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">Porcentaje cobrado a los comercios (0.15 = 15%)</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={localConfig.platformCommissionPct} 
                                                    onChange={(e) => setLocalConfig({...localConfig, platformCommissionPct: Number(e.target.value)})}
                                                    className="w-16 p-2 bg-stone-50 border border-amber-300 rounded-lg text-center font-bold dark:bg-stone-900 dark:border-stone-800" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Comisión de Driver</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">Porcentaje del envío para el driver (0.80 = 80%)</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={localConfig.driverCommissionPct} 
                                                    onChange={(e) => setLocalConfig({...localConfig, driverCommissionPct: Number(e.target.value)})}
                                                    className="w-16 p-2 bg-stone-50 border border-amber-300 rounded-lg text-center font-bold dark:bg-stone-900 dark:border-stone-800" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MOTOR DINÁMICO DE TARIFAS */}
                                {localConfig.deliveryRates && (
                                <div className="p-4 border-b border-amber-200 dark:border-stone-800">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 dark:text-white">
                                        <MapPin size={18} className="text-brand-800" /> Motor Dinámico de Tarifas
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-stone-50 p-4 rounded-xl space-y-4 border border-amber-300 dark:bg-stone-900 dark:border-stone-800">
                                            <h4 className="font-bold text-xs text-stone-500 uppercase tracking-widest border-b pb-2 dark:text-stone-400">Zonificación</h4>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300">Radio Local (km)</p>
                                                    <input type="number" value={localConfig.deliveryRates.localRadiusKm} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, localRadiusKm: Number(e.target.value)}})} className="w-full p-2 bg-white border border-amber-300 rounded-lg text-sm font-bold dark:bg-stone-900 dark:border-stone-800" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300">KM Base (Sin Extra)</p>
                                                    <input type="number" value={localConfig.deliveryRates.baseDistanceKm} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, baseDistanceKm: Number(e.target.value)}})} className="w-full p-2 bg-white border border-amber-300 rounded-lg text-sm font-bold dark:bg-stone-900 dark:border-stone-800" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300">Plataforma Com. Local ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.platformFeeLocal} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, platformFeeLocal: Number(e.target.value)}})} className="w-full p-2 bg-white border border-amber-300 rounded-lg text-sm font-bold dark:bg-stone-900 dark:border-stone-800" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300">Com. Foránea ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.platformFeeForaneo} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, platformFeeForaneo: Number(e.target.value)}})} className="w-full p-2 bg-white border border-amber-300 rounded-lg text-sm font-bold dark:bg-stone-900 dark:border-stone-800" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl space-y-4 border border-blue-100">
                                            <h4 className="font-bold text-xs text-blue-500 uppercase tracking-widest border-b border-blue-200 pb-2">Tarifa Día (Normal)</h4>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700">Base Local ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.localBaseDay} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, localBaseDay: Number(e.target.value)}})} className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm font-bold dark:bg-stone-900" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700">Base Foráneo ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.foraneoBaseDay} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, foraneoBaseDay: Number(e.target.value)}})} className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm font-bold dark:bg-stone-900" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700">+ Extra / 100m Local</p>
                                                    <input type="number" value={localConfig.deliveryRates.localExtraPer100mDay} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, localExtraPer100mDay: Number(e.target.value)}})} className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm font-bold dark:bg-stone-900" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-700">+ Extra / 1km Foráneo</p>
                                                    <input type="number" value={localConfig.deliveryRates.foraneoExtraPerKmDay} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, foraneoExtraPerKmDay: Number(e.target.value)}})} className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm font-bold dark:bg-stone-900" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-950 p-4 rounded-xl space-y-4 border border-indigo-900">
                                            <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest border-b border-indigo-800 pb-2">Tarifa Noche</h4>
                                            
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-indigo-300">Inicia (Hr)</p>
                                                    <input type="number" value={localConfig.deliveryRates.nightStartHour} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, nightStartHour: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-indigo-300">Termina (Hr)</p>
                                                    <input type="number" value={localConfig.deliveryRates.nightEndHour} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, nightEndHour: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-300">Base Local Noche ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.localBaseNight} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, localBaseNight: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-300">Base Foráneo Noche ($)</p>
                                                    <input type="number" value={localConfig.deliveryRates.foraneoBaseNight} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, foraneoBaseNight: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-300">+ Extra / 100m Noche</p>
                                                    <input type="number" value={localConfig.deliveryRates.localExtraPer100mNight} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, localExtraPer100mNight: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-300">+ Extra / 1km Noche</p>
                                                    <input type="number" value={localConfig.deliveryRates.foraneoExtraPerKmNight} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, foraneoExtraPerKmNight: Number(e.target.value)}})} className="w-full p-2 bg-indigo-900 text-white border border-indigo-800 rounded-lg text-sm font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}

                                <div className="p-4 border-b border-amber-200 dark:border-stone-800">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 dark:text-white">
                                        <Tag size={18} className="text-brand-800" /> Gestión de Categorías
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {localConfig.categories.map((cat, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-amber-300 dark:bg-stone-800 dark:border-stone-800">
                                                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{cat}</span>
                                                    <button 
                                                        onClick={() => {
                                                            const newCats = localConfig.categories.filter((_, i) => i !== idx);
                                                            setLocalConfig({...localConfig, categories: newCats});
                                                        }}
                                                        className="text-stone-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                id="new-category-input"
                                                placeholder="Nueva categoría..."
                                                className="flex-1 p-2 bg-stone-50 border border-amber-300 rounded-lg text-sm outline-none focus:border-brand-500 dark:bg-stone-900 dark:border-stone-800"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim();
                                                        if (val && !localConfig.categories.includes(val)) {
                                                            setLocalConfig({...localConfig, categories: [...localConfig.categories, val]});
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    const input = document.getElementById('new-category-input') as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val && !localConfig.categories.includes(val)) {
                                                        setLocalConfig({...localConfig, categories: [...localConfig.categories, val]});
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 dark:text-white">
                                        <Shield size={18} className="text-brand-800" /> Seguridad y Soporte
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Email de Soporte</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">Para reclamos y ayuda</p>
                                            </div>
                                            <input 
                                                type="email" 
                                                value={localConfig.supportEmail} 
                                                onChange={(e) => setLocalConfig({...localConfig, supportEmail: e.target.value})}
                                                className="w-48 p-2 bg-stone-50 border border-amber-300 rounded-lg text-right text-sm dark:bg-stone-900 dark:border-stone-800" 
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1 pr-4">
                                                <p className="text-sm font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 group/tooltip relative cursor-help">
                                                    Modo de Pago 
                                                    <HelpCircle size={14} className="text-stone-400" />
                                                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-stone-800 text-stone-950 dark:text-white text-[10px] p-4 rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-black/5 dark:border-white/10 translate-y-2 group-hover/tooltip:translate-y-0">
                                                        <p className="font-black mb-1 border-b border-black/5 dark:border-white/5 pb-1 uppercase tracking-widest text-brand-600">Centralizado:</p>
                                                        <p className="mb-3 font-medium opacity-80">La App centraliza los fondos. El cliente paga a la plataforma (vía Tarjeta/MercadoPago) y la plataforma liquida posteriormente a los comercios descontando comisiones de forma automática.</p>
                                                        <p className="font-black mb-1 border-b border-black/5 dark:border-white/5 pb-1 uppercase tracking-widest text-blue-500">Descentralizado:</p>
                                                        <p className="font-medium opacity-80">El cliente paga directo al comercio o repartidor (Efectivo/Transferencia). La App solo registra la orden. Los comercios deben pagar su comisión a la App manualmente.</p>
                                                    </div>
                                                </p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">Define el flujo de dinero en la plataforma</p>
                                            </div>
                                            <div className="flex bg-stone-100 p-1 rounded-lg gap-1 dark:bg-stone-800">
                                                <button 
                                                    onClick={() => setLocalConfig({...localConfig, paymentMode: 'CENTRALIZED'})}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${localConfig.paymentMode === 'CENTRALIZED' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'} `}
                                                >
                                                    Centralizado
                                                </button>
                                                <button 
                                                    onClick={() => setLocalConfig({...localConfig, paymentMode: 'DECENTRALIZED'})}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${localConfig.paymentMode === 'DECENTRALIZED' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'} `}
                                                >
                                                    Descentralizado
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Modo Mantenimiento</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">Desactiva pedidos temporalmente</p>
                                            </div>
                                            <div 
                                                onClick={() => setLocalConfig({...localConfig, maintenanceMode: !localConfig.maintenanceMode})}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${localConfig.maintenanceMode ? 'bg-red-50 dark:bg-red-900/200' : 'bg-stone-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localConfig.maintenanceMode ? 'left-7' : 'left-1'} dark:bg-stone-900`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-stone-50 dark:bg-stone-900">
                                    <Button fullWidth onClick={() => {
                                        updateConfig(localConfig);
                                        showToast('Configuración guardada', 'success');
                                    }}>
                                        Guardar Cambios Globales
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-white/5 p-5 rounded-3xl">
                                <h4 className="text-red-800 dark:text-red-400 font-black text-sm mb-1 uppercase tracking-wider">Zona de Peligro</h4>
                                <p className="text-red-700/70 dark:text-red-400/60 text-[10px] font-bold mb-4 uppercase tracking-[0.1em]">Estas acciones son irreversibles y afectan a toda la plataforma.</p>
                                        <div className="flex gap-3">
                                            <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20 bg-white dark:bg-stone-900 font-black shadow-sm">Resetear Estadísticas</Button>
                                            <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20 bg-white dark:bg-stone-900 font-black shadow-sm">Limpiar Caché Global</Button>
                                        </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </>
        )}
        {showTour && (
            <OnboardingTour 
                tourId="admin-onboarding" 
                steps={adminTourSteps} 
                onComplete={() => completeTour('admin-onboarding')} 
            />
        )}
    </div>
  );
};

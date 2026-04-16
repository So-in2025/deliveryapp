import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Store, OrderType, UserRole, Order } from '../types';
import { formatCurrency } from '../constants';
import { Badge, PaymentBadge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { Button } from '../components/ui/Button';
import { 
  TrendingUp, Users, Store as StoreIcon, Activity, 
  DollarSign, Shield, Search, 
  AlertTriangle, ChevronRight, Truck, MapPin, ArrowLeft, Mail,
  BarChart3, PieChart as PieChartIcon, Filter, Tag, X
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
  <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-start justify-between">
    <div>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
      <p className={`text-xs font-bold mt-1 ${color}`}>{sub}</p>
    </div>
    <div className={`p-2 rounded-lg bg-stone-50 ${color.replace('text-', 'text-opacity-80 text-')}`}>
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
        <div className="space-y-6 px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button 
                    onClick={() => setActiveSubTab('MERCHANTS')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'MERCHANTS' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    Comercios
                </button>
                <button 
                    onClick={() => setActiveSubTab('DRIVERS')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'DRIVERS' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    Repartidores
                </button>
            </div>

            {activeSubTab === 'MERCHANTS' ? (
                <div className="space-y-4">
                    {merchantSettlements.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <DollarSign size={48} className="mx-auto mb-4 text-stone-300" />
                            <p className="font-medium text-stone-900">No hay liquidaciones pendientes</p>
                        </div>
                    ) : merchantSettlements.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-stone-900 text-lg uppercase tracking-tight">{s.storeName}</h3>
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
                                    <p className="font-bold text-stone-900">{formatCurrency(s.settled)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Total Histórico</p>
                                    <p className="font-bold text-stone-900">{formatCurrency(s.total)}</p>
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
                            <p className="font-medium text-stone-900">No hay liquidaciones pendientes</p>
                        </div>
                    ) : driverSettlements.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-stone-900 text-lg uppercase tracking-tight">{s.driverName}</h3>
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
                                    <p className="font-bold text-stone-900">{formatCurrency(s.settled)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Total Histórico</p>
                                    <p className="font-bold text-stone-900">{formatCurrency(s.total)}</p>
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
    
    const filteredOrders = useMemo(() => {
        if (statusFilter === 'ALL') return orders;
        return orders.filter(o => o.status === statusFilter);
    }, [orders, statusFilter]);

    return (
        <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${statusFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                >
                    Todos
                </button>
                {Object.values(OrderStatus).map(status => (
                    <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${statusFilter === status ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center">
                                <Activity size={20} className="text-stone-400" />
                            </div>
                            <div>
                                <p className="font-bold text-stone-900 text-sm">{order.storeName}</p>
                                <p className="text-[10px] text-stone-500">#{order.id.slice(-6)} • {order.customerName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-stone-900 text-sm">{formatCurrency(order.total)}</p>
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

export const AdminView: React.FC = () => {
  const { orders, stores, assignDriver, drivers, resolveClaim, users, adminViewState, setAdminViewState, updateAnyUser, updateStore, config, updateConfig, user, completeTour, settleMerchantOrder, settleDriverOrder } = useApp();
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
      <div id="admin-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pt-2 lg:max-w-7xl lg:mx-auto lg:w-full">
        <KpiCard 
          title="Revenue Global" 
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
      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:max-w-7xl lg:mx-auto lg:w-full">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2">
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
                  <span className="text-[10px] font-bold text-stone-500 truncate">{entry.name}</span>
                  <span className="text-[10px] font-bold text-stone-900 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:max-w-7xl lg:mx-auto lg:w-full">
        <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Activity size={18} className="text-brand-800" /> Actividad en Vivo
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 divide-y divide-stone-50 overflow-hidden lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-4 lg:p-4">
          {recentActivity.map(order => (
            <div key={order.id} className="p-3 flex items-center justify-between hover:bg-stone-50 transition-colors lg:rounded-xl lg:border lg:border-stone-100">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-500">
                    {order.customerName.charAt(0)}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-stone-900 leading-none mb-1">
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
          <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
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
                   <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                       <Truck size={40} className="mx-auto text-stone-300 mb-2" />
                       <p className="text-stone-500 font-bold">Sin pedidos para despachar</p>
                   </div>
               ) : (
                   <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                   {dispatchableOrders.map(order => (
                       <div key={order.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden h-full flex flex-col">
                           <div className="p-3 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-stone-500">{order.id.slice(-6)}</span>
                                    <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                                </div>
                                <Badge status={order.status} />
                           </div>
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h4 className="font-bold text-stone-900">{order.storeName}</h4>
                                       <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                                           <MapPin size={12} /> {order.address}
                                       </div>
                                   </div>
                                   <span className="font-bold text-stone-900">{formatCurrency(order.total)}</span>
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
                                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${order.driverId === driver.id ? 'bg-brand-500 text-brand-950 border-brand-500' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
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
          <div className="bg-stone-50 h-full animate-slide-in-right flex flex-col">
              <div className="bg-white p-4 border-b border-stone-100 flex gap-3 items-center sticky top-0 z-10">
                  <button onClick={() => setSelectedStore(null)} className="p-2 -ml-2 hover:bg-stone-50 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">{selectedStore.name}</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-stone-100">
                      <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden">
                          <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full" />
                      </div>
                      <div>
                          <p className="text-stone-500 text-sm">{selectedStore.category}</p>
                          <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                              <StoreIcon size={14} /> ID: {selectedStore.id}
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-stone-100 text-center">
                          <p className="text-xs font-bold text-stone-400 uppercase">Ventas Totales</p>
                          <p className="text-xl font-bold text-stone-900">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-stone-100 text-center">
                          <p className="text-xs font-bold text-stone-400 uppercase">Pedidos</p>
                          <p className="text-xl font-bold text-stone-900">{storeStats.length}</p>
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                      <h3 className="font-bold text-stone-900 text-sm">Configuración de Comisiones</h3>
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
                                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                                  />
                                  <div className="bg-stone-100 px-3 flex items-center rounded-lg font-bold text-stone-500">%</div>
                              </div>
                              <p className="text-[10px] text-stone-400 mt-1 italic">* Sobrescribe la comisión global del {(config.platformCommissionPct * 100).toFixed(0)}%</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-100 space-y-3">
                      <h3 className="font-bold text-stone-900 text-sm">Estado del Comercio</h3>
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
                      <h3 className="font-bold text-stone-900 mb-2">Productos ({selectedStore.products.length})</h3>
                      <div className="bg-white rounded-xl border border-stone-100 divide-y divide-stone-50">
                          {selectedStore.products.map(p => (
                              <div key={p.id} className="p-3 flex justify-between items-center">
                                  <span className="text-sm font-medium">{p.name}</span>
                                  <span className="text-sm text-stone-500">{formatCurrency(p.price)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const renderStoresTab = () => (
    <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
      <div className="bg-white p-2 rounded-xl border border-stone-200 flex items-center gap-2 lg:max-w-md">
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
            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 items-center active:scale-[0.99] transition-transform cursor-pointer h-full"
        >
           <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden shrink-0">
              <LazyImage src={store.image} alt={store.name} className="w-full h-full" />
           </div>
           <div className="flex-1">
              <h4 className="font-bold text-stone-900">{store.name}</h4>
              <p className="text-xs text-stone-500">{store.category} • {store.createdAt ? 'Nuevo' : 'Veterano'}</p>
              <div className="flex items-center gap-3 mt-1">
                 <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${store.isActive ? 'bg-brand-500 text-brand-950' : 'bg-amber-100 text-amber-700'}`}>
                    {store.isActive ? 'Activo' : 'Pendiente'}
                 </span>
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
          <div className="bg-stone-50 h-full animate-slide-in-right flex flex-col">
               <div className="bg-white p-4 border-b border-stone-100 flex gap-3 items-center sticky top-0 z-10">
                  <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 hover:bg-stone-50 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">Perfil de Usuario</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="text-center py-6 bg-white rounded-2xl border border-stone-100">
                      <div className="w-20 h-20 bg-stone-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-stone-500">
                          {userProfile?.name?.charAt(0) || selectedUser.charAt(0)}
                      </div>
                      <h2 className="text-xl font-bold text-stone-900">{userProfile?.name || selectedUser}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-stone-500">
                          <Mail size={14} /> <span>{userProfile?.email || 'usuario@demo.com'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-4">
                          <div className="text-center">
                              <p className="text-xl font-bold text-stone-900">{userOrders.length}</p>
                              <p className="text-[10px] uppercase font-bold text-stone-400">Pedidos</p>
                          </div>
                           <div className="text-center">
                              <p className="text-xl font-bold text-stone-900">{formatCurrency(totalSpent)}</p>
                              <p className="text-[10px] uppercase font-bold text-stone-400">Total Gastado</p>
                          </div>
                      </div>
                      
                      {userProfile && (
                        <div className="mt-6 pt-6 border-t border-stone-100">
                          <p className="text-xs font-bold text-stone-400 uppercase mb-3">Gestión de Rol</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {Object.values(UserRole).map(role => (
                              <button
                                key={role}
                                onClick={() => {
                                  updateAnyUser(userProfile.uid, { role });
                                  showToast(`Rol actualizado a ${role}`, 'success');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${userProfile.role === role ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {userProfile?.role === UserRole.DRIVER && (
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <p className="text-xs font-bold text-stone-400 uppercase mb-3">Seguridad Repartidor</p>
                          <div className="flex flex-col gap-3 text-left">
                             <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                                <div>
                                   <p className="text-xs font-bold text-stone-700">Estado de Aprobación</p>
                                   <p className="text-[10px] text-stone-500">{userProfile.isApprovedDriver ? 'Aprobado para trabajar' : 'Pendiente de revisión'}</p>
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
                                <div className="p-2 bg-stone-50 rounded-lg">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">Placa</p>
                                   <p className="text-xs font-bold text-stone-800">{userProfile.vehiclePlate || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-stone-50 rounded-lg">
                                   <p className="text-[8px] uppercase font-bold text-stone-400">Licencia</p>
                                   <p className="text-xs font-bold text-stone-800">{userProfile.driverLicense || 'N/A'}</p>
                                </div>
                             </div>
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                      <h3 className="font-bold text-stone-900 mb-3 ml-1">Historial de Pedidos</h3>
                      <div className="space-y-3">
                          {userOrders.map(order => (
                              <div key={order.id} className="bg-white p-3 rounded-xl border border-stone-100 flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-sm text-stone-900">{order.storeName}</p>
                                      <p className="text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString()} • {formatCurrency(order.total)}</p>
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
    <div className="px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
       <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="bg-white p-2 rounded-xl border border-stone-200 flex items-center gap-2 flex-1">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${roleFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
            >
                <Filter size={14} /> Todos
            </button>
            {Object.values(UserRole).map(role => (
                <button 
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${roleFilter === role ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                >
                    {role}
                </button>
            ))}
          </div>
       </div>
       
       <div className="bg-white rounded-xl shadow-sm border border-stone-100 text-left overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:bg-transparent lg:shadow-none lg:border-0">
           <div className="p-3 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center lg:hidden">
              <span className="text-xs font-bold text-stone-500 uppercase">Lista de Usuarios ({userList.filter(u => roleFilter === 'ALL' || u.role === roleFilter).length})</span>
           </div>
           {userList
            .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
            .map((u, i) => (
               <div 
                    key={u.uid || i} 
                    onClick={() => setSelectedUser(u.uid || u.name)}
                    className="p-3 flex justify-between items-center border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer active:bg-stone-100 transition-colors lg:bg-white lg:rounded-xl lg:border lg:border-stone-100 lg:shadow-sm"
                >
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600">
                           {u.name?.charAt(0) || '?'}
                       </div>
                       <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-stone-900">{u.name || 'Sin nombre'}</p>
                             <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{u.role}</span>
                             {u.role === UserRole.DRIVER && !u.isApprovedDriver && (
                               <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600">Pendiente</span>
                             )}
                           </div>
                           <p className="text-[10px] text-stone-500">{u.totalOrders} pedidos • LTV: {formatCurrency(u.totalSpent)}</p>
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
        <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20 lg:max-w-7xl lg:mx-auto lg:w-full">
            {disputedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                    <Shield size={40} className="mx-auto text-stone-300 mb-2" />
                    <p className="text-stone-500 font-bold">No hay reclamos activos</p>
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
                        <div className="bg-white p-3 rounded-lg border border-amber-100 mb-4">
                            <p className="text-sm font-medium text-stone-800">"{order.claimReason}"</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" fullWidth className="bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleResolveDispute(order.id, 'REJECTED')}>
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
    <div className="h-full bg-stone-50 flex flex-col">
       {/* Drill-down Views */}
       {selectedStore ? renderStoreDetail() :
        selectedUser ? renderUserDetail() : (
            <>
                <div className="bg-stone-950 text-white p-6 pt-safe-pt shadow-2xl z-10 sticky top-0 border-b border-white/5">
                    <div className="lg:max-w-7xl lg:mx-auto lg:w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-black flex items-center gap-3 tracking-tighter uppercase">
                                    <div className="p-2 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 text-brand-950">
                                        <Shield size={24} strokeWidth={3} />
                                    </div>
                                    Panel de Control
                                </h1>
                                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1 mt-1">Administración Centralizada</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Estado del Sistema</p>
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

                        <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 overflow-x-auto lg:overflow-visible lg:justify-center lg:max-w-4xl lg:mx-auto">
                            {[
                                { id: 'DASHBOARD', label: 'Resumen', icon: <BarChart3 size={16} /> },
                                { id: 'FLEET', label: 'Logística', icon: <Truck size={16} /> },
                                { id: 'ORDERS', label: 'Pedidos', icon: <Activity size={16} /> },
                                { id: 'SETTLEMENTS', label: 'Liquidaciones', icon: <DollarSign size={16} /> },
                                { id: 'STORES', label: 'Comercios', icon: <StoreIcon size={16} /> },
                                { id: 'USERS', label: 'Usuarios', icon: <Users size={16} /> },
                                { id: 'DISPUTES', label: 'Reclamos', icon: <AlertTriangle size={16} /> },
                                { id: 'SETTINGS', label: 'Ajustes', icon: <Tag size={16} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAdminViewState(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative ${adminViewState === tab.id ? 'bg-white text-stone-950 shadow-xl' : 'text-stone-500 hover:text-white'}`}
                                >
                                    {tab.icon}
                                    <span className="hidden md:inline">{tab.label}</span>
                                    {tab.id === 'DISPUTES' && orders.some(o => o.status === OrderStatus.DISPUTED && o.claimStatus === 'PENDING') && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <div className="lg:max-w-7xl lg:mx-auto lg:w-full">
                        {adminViewState === 'DASHBOARD' && renderDashboardTab()}
                        {adminViewState === 'FLEET' && renderDispatchTab()}
                        {adminViewState === 'ORDERS' && <OrdersTab orders={orders} />}
                        {adminViewState === 'SETTLEMENTS' && <SettlementsTab orders={orders} settleMerchantOrder={settleMerchantOrder} settleDriverOrder={settleDriverOrder} />}
                        {adminViewState === 'STORES' && renderStoresTab()}
                        {adminViewState === 'USERS' && renderUsersTab()}
                        {adminViewState === 'DISPUTES' && renderDisputesTab()}
                        {adminViewState === 'SETTINGS' && (
                            <div className="p-6 space-y-8 animate-fade-in lg:max-w-4xl lg:mx-auto">

                            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-50">
                                <div className="p-4">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                                        <DollarSign size={18} className="text-brand-800" /> Parámetros Financieros
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Comisión de Plataforma</p>
                                                <p className="text-xs text-stone-500">Porcentaje cobrado a los comercios (0.15 = 15%)</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={localConfig.platformCommissionPct} 
                                                    onChange={(e) => setLocalConfig({...localConfig, platformCommissionPct: Number(e.target.value)})}
                                                    className="w-16 p-2 bg-stone-50 border border-stone-200 rounded-lg text-center font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Comisión de Driver</p>
                                                <p className="text-xs text-stone-500">Porcentaje del envío para el driver (0.80 = 80%)</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={localConfig.driverCommissionPct} 
                                                    onChange={(e) => setLocalConfig({...localConfig, driverCommissionPct: Number(e.target.value)})}
                                                    className="w-16 p-2 bg-stone-50 border border-stone-200 rounded-lg text-center font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Costo de Envío Base</p>
                                                <p className="text-xs text-stone-500">Tarifa mínima</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-400">$</span>
                                                <input 
                                                    type="number" 
                                                    value={localConfig.baseDeliveryFee} 
                                                    onChange={(e) => setLocalConfig({...localConfig, baseDeliveryFee: Number(e.target.value)})}
                                                    className="w-20 p-2 bg-stone-50 border border-stone-200 rounded-lg text-center font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Costo por KM</p>
                                                <p className="text-xs text-stone-500">Tarifa adicional por distancia</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-400">$</span>
                                                <input 
                                                    type="number" 
                                                    value={localConfig.feePerKm} 
                                                    onChange={(e) => setLocalConfig({...localConfig, feePerKm: Number(e.target.value)})}
                                                    className="w-20 p-2 bg-stone-50 border border-stone-200 rounded-lg text-center font-bold" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-b border-stone-100">
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                                        <Tag size={18} className="text-brand-800" /> Gestión de Categorías
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {localConfig.categories.map((cat, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                                                    <span className="text-xs font-bold text-stone-700">{cat}</span>
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
                                                className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-brand-500"
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
                                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                                        <Shield size={18} className="text-brand-800" /> Seguridad y Soporte
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Email de Soporte</p>
                                                <p className="text-xs text-stone-500">Para reclamos y ayuda</p>
                                            </div>
                                            <input 
                                                type="email" 
                                                value={localConfig.supportEmail} 
                                                onChange={(e) => setLocalConfig({...localConfig, supportEmail: e.target.value})}
                                                className="w-48 p-2 bg-stone-50 border border-stone-200 rounded-lg text-right text-sm" 
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Modo de Pago</p>
                                                <p className="text-xs text-stone-500">Centralizado (App) o Descentralizado (Comercio)</p>
                                            </div>
                                            <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
                                                <button 
                                                    onClick={() => setLocalConfig({...localConfig, paymentMode: 'CENTRALIZED'})}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${localConfig.paymentMode === 'CENTRALIZED' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                                                >
                                                    Centralizado
                                                </button>
                                                <button 
                                                    onClick={() => setLocalConfig({...localConfig, paymentMode: 'DECENTRALIZED'})}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${localConfig.paymentMode === 'DECENTRALIZED' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                                                >
                                                    Descentralizado
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">Modo Mantenimiento</p>
                                                <p className="text-xs text-stone-500">Desactiva pedidos temporalmente</p>
                                            </div>
                                            <div 
                                                onClick={() => setLocalConfig({...localConfig, maintenanceMode: !localConfig.maintenanceMode})}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${localConfig.maintenanceMode ? 'bg-red-500' : 'bg-stone-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localConfig.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-stone-50">
                                    <Button fullWidth onClick={() => {
                                        updateConfig(localConfig);
                                        showToast('Configuración guardada', 'success');
                                    }}>
                                        Guardar Cambios Globales
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                                <h4 className="text-red-800 font-bold text-sm mb-1">Zona de Peligro</h4>
                                <p className="text-red-700 text-xs mb-3">Estas acciones son irreversibles y afectan a toda la plataforma.</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-100">Resetear Estadísticas</Button>
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-100">Limpiar Caché Global</Button>
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

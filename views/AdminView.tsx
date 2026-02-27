import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Store, UserRole, OrderType, Order } from '../types';
import { APP_CONFIG } from '../constants';
import { Badge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { Button } from '../components/ui/Button';
import { 
  TrendingUp, Users, Store as StoreIcon, Activity, 
  DollarSign, BarChart3, Shield, Search, MoreVertical, 
  Lock, AlertTriangle, CheckCircle2, ChevronRight, Truck, MapPin, ArrowLeft, Mail, Calendar, Receipt
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { orders, stores, user, assignDriver, drivers, updateOrder } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DISPATCH' | 'STORES' | 'USERS' | 'DISPUTES'>('DASHBOARD');
  
  // Local drill-down state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // storing customerName for simplicity in MVP

  // --- ANALYTICS LOGIC ---
  const kpis = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const platformCommission = totalSales * 0.15; // 15% fee simulation
    const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

    return {
      totalSales,
      platformCommission,
      activeOrders,
      completedOrders,
      totalStores: stores.length
    };
  }, [orders, stores]);

  const recentActivity = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  // Derive unique users from orders for the Users list (MVP approach)
  const userList = useMemo(() => {
      const uniqueNames = Array.from(new Set(orders.map(o => o.customerName)));
      return uniqueNames.map(name => {
          const userOrders = orders.filter(o => o.customerName === name);
          const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
          return {
              name,
              totalOrders: userOrders.length,
              totalSpent,
              lastActive: userOrders[0]?.createdAt || new Date()
          };
      });
  }, [orders]);

  // --- SUB-COMPONENTS ---

  const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        <p className={`text-xs font-bold mt-1 ${color}`}>{sub}</p>
      </div>
      <div className={`p-2 rounded-lg bg-slate-50 ${color.replace('text-', 'text-opacity-80 text-')}`}>
        <Icon size={20} />
      </div>
    </div>
  );

  const DashboardTab = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="grid grid-cols-2 gap-4 px-4 pt-2">
        <KpiCard 
          title="Revenue Global" 
          value={`${APP_CONFIG.currency}${kpis.totalSales.toFixed(0)}`}
          sub="+12% vs ayer"
          icon={DollarSign}
          color="text-emerald-600"
        />
        <KpiCard 
          title="Comisiones (15%)" 
          value={`${APP_CONFIG.currency}${kpis.platformCommission.toFixed(0)}`}
          sub="Ganancia Neta"
          icon={TrendingUp}
          color="text-brand-600"
        />
        <KpiCard 
          title="Tiendas Activas" 
          value={kpis.totalStores}
          sub="2 pendientes"
          icon={StoreIcon}
          color="text-blue-600"
        />
        <KpiCard 
          title="Usuarios Online" 
          value="142"
          sub="Estimado"
          icon={Users}
          color="text-purple-600"
        />
      </div>

      <div className="px-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Activity size={18} className="text-brand-600" /> Actividad en Vivo
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
          {recentActivity.map(order => (
            <div key={order.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                    {order.customerName.charAt(0)}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                      {order.storeName}
                      <span className="text-slate-400 font-normal"> vendió </span> 
                      {APP_CONFIG.currency}{order.total.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      Hace 2 min • {order.items.length} items
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

  const DispatchTab = () => {
      // Logic: Show orders that are READY but NOT assigned (or pending assignment)
      const dispatchableOrders = orders.filter(o => 
          (o.status === OrderStatus.READY || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING) 
          && o.type === OrderType.DELIVERY
      );

      return (
          <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20">
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                   <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                   <div>
                       <h3 className="font-bold text-amber-800 text-sm">Despacho Manual Activo</h3>
                       <p className="text-xs text-amber-700 mt-1">
                           Asigna conductores manualmente. Los conductores solo verán pedidos asignados a ellos.
                       </p>
                   </div>
               </div>

               {dispatchableOrders.length === 0 ? (
                   <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                       <Truck size={40} className="mx-auto text-slate-300 mb-2" />
                       <p className="text-slate-500 font-bold">Sin pedidos para despachar</p>
                   </div>
               ) : (
                   dispatchableOrders.map(order => (
                       <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                           <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-500">{order.id.slice(-6)}</span>
                                <Badge status={order.status} />
                           </div>
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h4 className="font-bold text-slate-900">{order.storeName}</h4>
                                       <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                           <MapPin size={12} /> {order.address}
                                       </div>
                                   </div>
                                   <span className="font-bold text-slate-900">{APP_CONFIG.currency}{order.total.toFixed(2)}</span>
                               </div>

                               <div className="space-y-2">
                                   <p className="text-xs font-bold text-slate-400 uppercase">Asignar Repartidor:</p>
                                   <div className="grid grid-cols-2 gap-2">
                                       {drivers.map(driver => (
                                           <button 
                                                key={driver.id}
                                                onClick={() => {
                                                    assignDriver(order.id, driver.id);
                                                    showToast(`Asignado a ${driver.name}`, 'success');
                                                }}
                                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${order.driverId === driver.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                           >
                                               {driver.name}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))
               )}
          </div>
      );
  };

  const StoreDetail = () => {
      if(!selectedStore) return null;
      const storeStats = orders.filter(o => o.storeId === selectedStore.id);
      const totalRevenue = storeStats.reduce((sum, o) => sum + o.total, 0);

      return (
          <div className="bg-slate-50 h-full animate-slide-in-right flex flex-col">
              <div className="bg-white p-4 border-b border-slate-100 flex gap-3 items-center sticky top-0 z-10">
                  <button onClick={() => setSelectedStore(null)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">{selectedStore.name}</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                          <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full" />
                      </div>
                      <div>
                          <p className="text-slate-500 text-sm">{selectedStore.category}</p>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                              <StoreIcon size={14} /> ID: {selectedStore.id}
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase">Ventas Totales</p>
                          <p className="text-xl font-bold text-slate-900">{APP_CONFIG.currency}{totalRevenue.toFixed(0)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase">Pedidos</p>
                          <p className="text-xl font-bold text-slate-900">{storeStats.length}</p>
                      </div>
                  </div>

                  <div>
                      <h3 className="font-bold text-slate-900 mb-2">Productos ({selectedStore.products.length})</h3>
                      <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                          {selectedStore.products.map(p => (
                              <div key={p.id} className="p-3 flex justify-between items-center">
                                  <span className="text-sm font-medium">{p.name}</span>
                                  <span className="text-sm text-slate-500">{APP_CONFIG.currency}{p.price}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const StoresTab = () => (
    <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20">
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
         <Search size={18} className="text-slate-400 ml-2" />
         <input placeholder="Buscar comercio..." className="flex-1 outline-none text-sm" />
      </div>

      {stores.map(store => (
        <div 
            key={store.id} 
            onClick={() => setSelectedStore(store)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center active:scale-[0.99] transition-transform cursor-pointer"
        >
           <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
              <LazyImage src={store.image} alt={store.name} className="w-full h-full" />
           </div>
           <div className="flex-1">
              <h4 className="font-bold text-slate-900">{store.name}</h4>
              <p className="text-xs text-slate-500">{store.category} • {store.createdAt ? 'Nuevo' : 'Veterano'}</p>
              <div className="flex items-center gap-3 mt-1">
                 <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Activo</span>
                 <span className="text-[10px] text-slate-400">ID: {store.id}</span>
              </div>
           </div>
           <ChevronRight size={18} className="text-slate-300" />
        </div>
      ))}
    </div>
  );

  const UserDetail = () => {
      if(!selectedUser) return null;
      const userOrders = orders.filter(o => o.customerName === selectedUser);
      const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);

      return (
          <div className="bg-slate-50 h-full animate-slide-in-right flex flex-col">
               <div className="bg-white p-4 border-b border-slate-100 flex gap-3 items-center sticky top-0 z-10">
                  <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
                  <h2 className="font-bold text-lg">Perfil de Usuario</h2>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto">
                  <div className="text-center py-6 bg-white rounded-2xl border border-slate-100">
                      <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-slate-500">
                          {selectedUser.charAt(0)}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedUser}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500">
                          <Mail size={14} /> <span>usuario@demo.com</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-4">
                          <div className="text-center">
                              <p className="text-xl font-bold text-slate-900">{userOrders.length}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Pedidos</p>
                          </div>
                           <div className="text-center">
                              <p className="text-xl font-bold text-slate-900">{APP_CONFIG.currency}{totalSpent.toFixed(0)}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Total Gastado</p>
                          </div>
                      </div>
                  </div>

                  <div>
                      <h3 className="font-bold text-slate-900 mb-3 ml-1">Historial de Pedidos</h3>
                      <div className="space-y-3">
                          {userOrders.map(order => (
                              <div key={order.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-sm text-slate-900">{order.storeName}</p>
                                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()} • {APP_CONFIG.currency}{order.total}</p>
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

  const UsersTab = () => (
    <div className="px-4 pt-2 animate-fade-in pb-20">
       <div className="text-center py-8">
            <Shield size={40} className="mx-auto text-slate-200 mb-2" />
            <h3 className="font-bold text-slate-900">Base de Usuarios</h3>
            <p className="text-xs text-slate-500">Clientes generados dinámicamente</p>
       </div>
       
       <div className="bg-white rounded-xl shadow-sm border border-slate-100 text-left overflow-hidden">
           <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Lista de Clientes ({userList.length})</span>
           </div>
           {userList.map((u, i) => (
               <div 
                    key={i} 
                    onClick={() => setSelectedUser(u.name)}
                    className="p-3 flex justify-between items-center border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors"
                >
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                           {u.name.charAt(0)}
                       </div>
                       <div>
                           <p className="text-sm font-bold text-slate-900">{u.name}</p>
                           <p className="text-[10px] text-slate-500">{u.totalOrders} pedidos • LTV: {APP_CONFIG.currency}{u.totalSpent.toFixed(0)}</p>
                       </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-300" />
               </div>
           ))}
       </div>
    </div>
  );

  const DisputesTab = () => {
    const disputedOrders = orders.filter(o => o.status === OrderStatus.DISPUTED);

    const handleResolveDispute = (orderId: string, resolution: 'RESOLVED' | 'REJECTED') => {
        updateOrder(orderId, resolution === 'RESOLVED' ? OrderStatus.CANCELLED : OrderStatus.DELIVERED);
        showToast(`Reclamo ${resolution === 'RESOLVED' ? 'Aceptado (Reembolsado)' : 'Rechazado'}`, 'success');
    };

    return (
        <div className="space-y-4 px-4 pt-2 animate-fade-in pb-20">
            {disputedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <Shield size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 font-bold">No hay reclamos activos</p>
                </div>
            ) : (
                disputedOrders.map(order => (
                    <div key={order.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-amber-900">Pedido #{order.id.slice(-6)}</p>
                                <p className="text-xs text-amber-700">{order.storeName} • {order.customerName}</p>
                            </div>
                            <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase">En Revisión</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 mb-4">
                            <p className="text-sm font-medium text-slate-800">"{order.claimReason}"</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" fullWidth className="bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleResolveDispute(order.id, 'REJECTED')}>
                                Rechazar
                            </Button>
                            <Button fullWidth className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleResolveDispute(order.id, 'RESOLVED')}>
                                Reembolsar
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
       {/* Drill-down Views */}
       {selectedStore ? <StoreDetail /> :
        selectedUser ? <UserDetail /> : (
            <>
                <div className="bg-slate-900 text-white p-4 pt- safe-pt shadow-md z-10 sticky top-0">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                            <Shield size={20} className="text-brand-400" />
                            Admin Panel
                            </h1>
                            <p className="text-xs text-slate-400">Vista de Propietario</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                            <span className="font-bold text-xs">OP</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('DASHBOARD')}
                            className={`flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Resumen
                        </button>
                        <button 
                            onClick={() => setActiveTab('DISPATCH')}
                            className={`flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'DISPATCH' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Logística
                        </button>
                        <button 
                            onClick={() => setActiveTab('STORES')}
                            className={`flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'STORES' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Comercios
                        </button>
                        <button 
                            onClick={() => setActiveTab('USERS')}
                            className={`flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Usuarios
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'DASHBOARD' && <DashboardTab />}
                    {activeTab === 'DISPATCH' && <DispatchTab />}
                    {activeTab === 'STORES' && <StoresTab />}
                    {activeTab === 'USERS' && <UsersTab />}
                </div>
            </>
        )}
    </div>
  );
};
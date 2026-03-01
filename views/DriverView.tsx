
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, PaymentMethod, OrderType } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Navigation, DollarSign, LocateFixed, Bike, Banknote, CreditCard, Shield } from 'lucide-react';
import { formatCurrency } from '../constants';

export const DriverView: React.FC = () => {
  const { user, orders, updateOrder, isDriverOnline, toggleDriverStatus } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'FEED' | 'ROUTE' | 'HISTORY'>('FEED');

  // FEED: Orders ready to be picked up by ANY driver (Simulated Pool)
  // FILTER: Only show DELIVERY orders AND if driver is ONLINE
  const availableOrders = isDriverOnline 
    ? orders.filter(o => (o.status === OrderStatus.READY || o.status === OrderStatus.PREPARING) && o.type === OrderType.DELIVERY)
    : [];

  // ROUTE: Orders assigned to THIS driver
  const myTasks = orders.filter(o => 
    o.status === OrderStatus.DRIVER_ASSIGNED || o.status === OrderStatus.PICKED_UP
  );

  // HISTORY: Orders completed or cancelled by THIS driver
  const myHistory = orders.filter(o => 
    (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.DISPUTED) && o.driverId === user.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate Total Earnings (Simulated for Demo)
  // Sum of delivery fees for all DELIVERED orders
  const totalEarnings = myHistory
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.type === OrderType.DELIVERY ? (o.deliveryFee ?? 45) : 0), 0);

  const handleAcceptOrder = (orderId: string) => {
    updateOrder(orderId, OrderStatus.DRIVER_ASSIGNED);
    showToast('¡Entrega aceptada! Dirígete al local.', 'success');
    setActiveTab('ROUTE');
  };

  const handleProgress = (orderId: string, currentStatus: OrderStatus) => {
    if (currentStatus === OrderStatus.DRIVER_ASSIGNED) {
      updateOrder(orderId, OrderStatus.PICKED_UP);
      showToast('Pedido recogido. ¡En ruta al cliente!', 'info');
    } else if (currentStatus === OrderStatus.PICKED_UP) {
      updateOrder(orderId, OrderStatus.DELIVERED);
      showToast('¡Pedido entregado! Ganancias actualizadas.', 'success');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in">
      
      {/* Driver Header / Tab Switcher */}
      <div className="bg-white dark:bg-slate-800 p-4 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Driver</h2>
                <div onClick={toggleDriverStatus} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isDriverOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    <p className={`text-sm font-bold ${isDriverOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isDriverOnline ? 'En línea para recibir' : 'Desconectado'}
                    </p>
                </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-600">
                <DollarSign size={16} className="text-brand-600 dark:text-brand-400" />
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalEarnings)}</span>
            </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setActiveTab('FEED')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'FEED' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Disponibles ({availableOrders.length})
            </button>
            <button 
                onClick={() => setActiveTab('ROUTE')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'ROUTE' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Mi Ruta ({myTasks.length})
            </button>
            <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                Historial
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        
        {/* === TAB: FEED === */}
        {activeTab === 'FEED' && (
            <>
                {!isDriverOnline ? (
                    <div className="text-center py-20 opacity-50">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-lg">Estás desconectado</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Conéctate para recibir nuevas entregas</p>
                        <Button onClick={toggleDriverStatus}>Conectar Ahora</Button>
                    </div>
                ) : availableOrders.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <LocateFixed size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600 animate-pulse" />
                        <p className="font-medium text-slate-900 dark:text-white">Buscando entregas...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Mantente en zonas de alta demanda</p>
                    </div>
                ) : (
                    availableOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                             
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                            <Bike size={20} className="text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Ganancia Estimada</span>
                                            <p className="font-bold text-xl text-slate-900 dark:text-white">{formatCurrency(order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0)}</p>
                                        </div>
                                    </div>
                                    {order.paymentMethod === PaymentMethod.CASH && (
                                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-900/50">
                                            <Banknote size={12} /> Cobrar Efectivo
                                        </div>
                                    )}
                                </div>
                                
                                {/* Route Visualization */}
                                <div className="relative pl-4 space-y-6 border-l-2 border-slate-100 dark:border-slate-700 ml-2 mb-5">
                                    {/* Pickup */}
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800"></div>
                                        <div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Retiro</p>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{order.storeName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">1.2 km</p>
                                        </div>
                                    </div>
                                    
                                    {/* Dropoff */}
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-slate-800 ring-2 ring-brand-100 dark:ring-brand-900/30"></div>
                                        <div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Entrega</p>
                                            {/* Removed 'truncate' and added 'break-words' to ensure full address visibility */}
                                            <p className="font-bold text-slate-900 dark:text-white text-sm break-words pr-2 leading-tight">{order.address}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">2.3 km</p>
                                        </div>
                                    </div>
                                </div>

                                <Button fullWidth onClick={() => handleAcceptOrder(order.id)} className="font-bold">
                                    Aceptar Entrega
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </>
        )}

        {/* === TAB: ROUTE === */}
        {activeTab === 'ROUTE' && (
             <>
             {myTasks.length === 0 ? (
                 <div className="text-center py-20">
                     <p className="text-slate-500 dark:text-slate-400">No tienes entregas activas.</p>
                     <Button variant="ghost" onClick={() => setActiveTab('FEED')} className="mt-2 text-brand-600 dark:text-brand-400 font-bold">
                         Ir a Disponibles
                     </Button>
                 </div>
             ) : (
               myTasks.map(task => (
                 <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border-l-4 border-l-brand-500 overflow-hidden">
                   
                   {/* Map Placeholder */}
                   <div className="h-40 bg-slate-200 dark:bg-slate-700 relative border-b border-slate-100 dark:border-slate-700">
                        <div className="absolute inset-0 bg-[url('https://placehold.co/600x400/e2e8f0/94a3b8?text=Navigation+View')] dark:bg-[url('https://placehold.co/600x400/1e293b/475569?text=Navigation+View')] bg-cover bg-center opacity-70"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-brand-600 rounded-full border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center animate-pulse-soft">
                                <Navigation size={20} className="text-white" />
                            </div>
                        </div>
                        {/* Status Overlay */}
                        <div className="absolute top-3 left-3">
                             <Badge status={task.status} />
                        </div>
                   </div>

                   <div className="p-4">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                             <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                {task.status === OrderStatus.DRIVER_ASSIGNED ? 'Ir al Local' : 'Ir al Cliente'}
                             </h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400">
                                {task.status === OrderStatus.DRIVER_ASSIGNED ? task.storeName : task.address}
                             </p>
                        </div>
                        <div className="text-right">
                             <span className="block font-bold text-slate-900 dark:text-white">{task.customerName}</span>
                             <div className="flex items-center gap-1 justify-end text-xs font-bold text-slate-500 dark:text-slate-400">
                                {task.paymentMethod === PaymentMethod.CASH ? (
                                    <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                                        <Banknote size={10} /> Cobrar
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                        <CreditCard size={10} /> Pagado
                                    </span>
                                )}
                             </div>
                        </div>
                     </div>
     
                     <div className="space-y-6 relative pl-2 border-l-2 border-slate-100 dark:border-slate-700 ml-1.5 mb-6">
                       {/* Pickup Point */}
                       <div className={`flex gap-3 relative z-10 transition-opacity ${task.status !== OrderStatus.DRIVER_ASSIGNED ? 'opacity-40 grayscale' : ''}`}>
                         <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 border-2 border-white dark:border-slate-800"></div>
                         <div className="w-full">
                           <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Retiro</p>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">{task.storeName}</p>
                           {task.status === OrderStatus.DRIVER_ASSIGNED && (
                               <Button size="sm" variant="secondary" fullWidth className="mt-2 h-9 text-xs" onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(task.storeName)}`, '_blank')}>
                                   <Navigation size={14} className="mr-2" /> Navegar (Waze)
                               </Button>
                           )}
                         </div>
                       </div>
     
                       {/* Dropoff Point */}
                       <div className={`flex gap-3 relative z-10 transition-opacity ${task.status === OrderStatus.DRIVER_ASSIGNED ? 'opacity-40 grayscale' : ''}`}>
                         <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-600 border-2 border-white dark:border-slate-800"></div>
                         <div className="w-full">
                           <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Entrega</p>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">{task.address}</p>
                           {task.status === OrderStatus.PICKED_UP && (
                               <Button size="sm" variant="secondary" fullWidth className="mt-2 h-9 text-xs" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank')}>
                                   <Navigation size={14} className="mr-2" /> Navegar (Google Maps)
                               </Button>
                           )}
                         </div>
                       </div>
                     </div>
                   
                     {task.status === OrderStatus.CANCELLED ? (
                         <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
                             <span className="font-bold">Pedido Cancelado:</span> {task.cancelledReason}
                         </div>
                     ) : (
                         <Button 
                           fullWidth 
                           size="lg"
                           className={task.status === OrderStatus.DRIVER_ASSIGNED ? 'bg-brand-600 shadow-brand-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}
                           onClick={() => handleProgress(task.id, task.status)}
                         >
                           {task.status === OrderStatus.DRIVER_ASSIGNED ? 'Confirmar Recogida' : 'Confirmar Entrega'}
                         </Button>
                     )}
                   </div>
                 </div>
               ))
             )}
           </>
        )}

        {/* === TAB: HISTORY === */}
        {activeTab === 'HISTORY' && (
             <>
             {myHistory.length === 0 ? (
                 <div className="text-center py-20">
                     <p className="text-slate-500 dark:text-slate-400">No tienes historial de entregas.</p>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                         <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Ganancias Totales</p>
                             <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalEarnings)}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Entregas</p>
                             <p className="text-xl font-bold text-slate-900 dark:text-white">{myHistory.filter(o => o.status === OrderStatus.DELIVERED).length}</p>
                         </div>
                     </div>
                     {myHistory.map(task => (
                         <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <p className="font-bold text-slate-900 dark:text-white">{task.storeName}</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</p>
                                 </div>
                                 <Badge status={task.status} />
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-500 dark:text-slate-400">{task.customerName}</span>
                                 <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(task.type === OrderType.DELIVERY ? (task.deliveryFee ?? 45) : 0)}</span>
                             </div>
                             {task.status === OrderStatus.CANCELLED && task.cancelledReason && (
                                 <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
                                     <span className="font-bold">Motivo:</span> {task.cancelledReason}
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             )}
             </>
        )}

      </div>
    </div>
  );
};

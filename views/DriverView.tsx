
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, PaymentMethod, OrderType, Order, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Navigation, DollarSign, LocateFixed, Bike, Banknote, Shield, MapPin, Truck, FileText, X, Clock, Eye, MessageSquare } from 'lucide-react';
import { ChatOverlay } from '../components/ui/ChatOverlay';
import { formatCurrency } from '../constants';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';

// Reusing the MapUpdater
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        try {
            map.setView(center, map.getZoom());
        } catch (e) {
            // Map might be unmounting
        }
    }, [center, map]);
    return null;
};

// Driver Map Component
const DriverTrackingMap: React.FC<{ 
    driverLat: number; 
    driverLng: number; 
    destLat?: number; 
    destLng?: number; 
    destLabel?: string;
}> = ({ driverLat, driverLng, destLat, destLng, destLabel }) => {
    const center: [number, number] = [driverLat, driverLng];
    const [route, setRoute] = useState<[number, number][]>([]);

    useEffect(() => {
        if (driverLat && driverLng && destLat && destLng) {
            fetch(`https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${destLng},${destLat}?overview=full&geometries=geojson`)
                .then(res => res.json())
                .then(data => {
                    if (data.code === 'Ok' && data.routes.length > 0) {
                        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                        setRoute(coords);
                    }
                })
                .catch(console.error);
        } else {
            setRoute([]);
        }
    }, [driverLat, driverLng, destLat, destLng]);

    const driverIcon = React.useMemo(() => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute -inset-4 bg-brand-500/30 rounded-full animate-ping"></div>
                <div class="w-10 h-10 bg-brand-500 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-950"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    }), []);

    const destIcon = React.useMemo(() => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 bg-stone-900 dark:bg-white rounded-xl border-2 border-white dark:border-stone-800 shadow-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white dark:text-stone-900"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    }), []);

    return (
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapUpdater center={center} />
            
            {route.length > 0 && (
                <Polyline positions={route} color="#ffef00" weight={5} opacity={0.8} />
            )}

            <Marker position={[driverLat, driverLng]} icon={driverIcon}>
                <Popup>Tu ubicación</Popup>
            </Marker>

            {destLat && destLng && (
                <Marker position={[destLat, destLng]} icon={destIcon}>
                    <Popup>{destLabel || 'Destino'}</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export const DriverView: React.FC = () => {
    console.log('DriverView component mounted');
  const { user, role, setRole, orders, stores, updateOrder, isDriverOnline, toggleDriverStatus, driverViewState, setDriverViewState, soundEnabled, toggleSound, driverLocation, updateLocation, completeTour } = useApp();
  const { showToast } = useToast();

  const { UserRole: UR } = { UserRole }; // Dummy to avoid unused import if needed, but it is used in types.ts anyway

  const isMobile = window.innerWidth < 1024;

  const driverTourSteps: TourStep[] = [
    {
        targetId: 'driver-status',
        title: 'Estado de Conexión',
        description: 'Toca aquí para ponerte en línea y empezar a recibir pedidos de delivery. ¡Asegúrate de estar activo para ganar!',
        position: 'bottom'
    },
    {
        targetId: 'deliveries-tab',
        title: 'Pedidos Disponibles',
        description: 'Aquí aparecerán todos los pedidos listos para ser recogidos en los locales. Acepta los que más te convengan.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: 'route-tab',
        title: 'Tu Ruta Activa',
        description: 'Cuando aceptes un pedido, aquí verás el mapa y las instrucciones paso a paso para la entrega.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: 'earnings-card',
        title: 'Tus Ganancias',
        description: 'Lleva el control de tus ingresos diarios por entregas y propinas. ¡Transparencia total!',
        position: 'bottom'
    },
    {
        targetId: 'history-tab',
        title: 'Historial de Entregas',
        description: 'Revisa el detalle de todas las entregas que has completado exitosamente.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: 'settings-tab',
        title: 'Ajustes y Soporte',
        description: 'Modifica tu perfil, revisa tu vehículo y contacta a soporte si tienes algún problema en ruta.',
        position: isMobile ? 'bottom' : 'right'
    }
  ];

  const showTour = !user.completedTours?.includes('driver-onboarding') && driverViewState === 'DELIVERIES' && user.isApprovedDriver;
  
  useEffect(() => {
      console.log('DriverView tour check:', {
          notCompleted: !user.completedTours?.includes('driver-onboarding'),
          isDeliveries: driverViewState === 'DELIVERIES',
          isApproved: user.isApprovedDriver,
          showTour
      });
  }, [user.completedTours, driverViewState, user.isApprovedDriver, showTour]);

  const [wasPending, setWasPending] = useState(!user.isApprovedDriver);

  useEffect(() => {
    if (user.isApprovedDriver && wasPending) {
        soundService.play('SUCCESS');
        showToast('¡Tu cuenta ha sido aprobada! 🎉 Empieza a ganar hoy.', 'success');
        setWasPending(false);
    }
  }, [user.isApprovedDriver, wasPending, showToast]);

  const [selectedTask, setSelectedTask] = useState<Order | null>(null);
  const [vehicleType, setVehicleType] = useState<'MOTO' | 'BICI' | 'AUTO'>('MOTO');
    const [isSimulating, setIsSimulating] = useState(false);
    const [activeChatOrder, setActiveChatOrder] = useState<string | null>(null);
  const [simulatedDistance, setSimulatedDistance] = useState(0.8);

  // Real GPS Tracking Logic
    useEffect(() => {
        if (!isDriverOnline) return;

        let watchId: number;
        
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Use active order ID for prioritized tracking if available
                const myActiveOrder = orders.find(o => o.driverId === user.uid && 
                    (o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING || 
                     o.status === OrderStatus.READY || o.status === OrderStatus.DRIVER_ASSIGNED || 
                     o.status === OrderStatus.PICKED_UP));
                
                updateLocation(latitude, longitude, myActiveOrder?.id);
                },
                (error) => {
                    // CODE 1: PERMISSION_DENIED
                    // CODE 2: POSITION_UNAVAILABLE
                    // CODE 3: TIMEOUT
                    
                    // Only log errors that are NOT timeouts or permission issues if already muted
                    if (error.code !== 3) {
                        console.error("GPS Tracking Error:", error.message);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 5000
                }
            );
        } else {
            showToast("Tu navegador no soporta GPS", "error");
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isDriverOnline, updateLocation, showToast]);

    // Simulation Logic (Only if user explicitly wants it for testing)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isSimulating && isDriverOnline) {
            interval = setInterval(() => {
                updateLocation(
                    driverLocation.lat + (Math.random() - 0.5) * 0.0005,
                    driverLocation.lng + (Math.random() - 0.5) * 0.0005
                );
                setSimulatedDistance(prev => Math.max(0.1, prev - 0.05));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isSimulating, isDriverOnline, driverLocation, updateLocation]);

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
    (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.DISPUTED) && o.driverId === user.uid
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate Total Earnings (Simulated for Demo)
  // Sum of delivery fees for all DELIVERED orders
  const deliveryEarnings = myHistory
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.type === OrderType.DELIVERY ? (o.deliveryFee ?? 45) : 0), 0);
  
  const tipEarnings = myHistory
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.tip ?? 0), 0);

  const totalEarnings = deliveryEarnings + tipEarnings;

  const dailyEarnings = myHistory
    .filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return o.status === OrderStatus.DELIVERED && 
               orderDate.getDate() === today.getDate() &&
               orderDate.getMonth() === today.getMonth() &&
               orderDate.getFullYear() === today.getFullYear();
    })
    .reduce((sum, o) => sum + (o.driverEarnings ?? 0), 0);

  const weeklyEarnings = myHistory
    .filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return o.status === OrderStatus.DELIVERED && diffDays <= 7;
    })
    .reduce((sum, o) => sum + (o.driverEarnings ?? 0), 0);

  const handleAcceptOrder = (orderId: string) => {
    updateOrder(orderId, OrderStatus.DRIVER_ASSIGNED, { driverId: user.uid, driverName: user.name || 'Repartidor' });
    showToast('¡Entrega aceptada! Dirígete al local.', 'success');
    setDriverViewState('MAP');
  };

  const handleProgress = async (orderId: string, currentStatus: OrderStatus) => {
    try {
        if (currentStatus === OrderStatus.DRIVER_ASSIGNED) {
          await updateOrder(orderId, OrderStatus.PICKED_UP);
          showToast('Pedido recogido. ¡En ruta al cliente!', 'info');
        } else if (currentStatus === OrderStatus.PICKED_UP) {
          await updateOrder(orderId, OrderStatus.DELIVERED);
          showToast('¡Pedido entregado! Ganancias actualizadas.', 'success');
        }
    } catch (e) {
        console.error('Error in handleProgress:', e);
        showToast('Error al actualizar el pedido. Intenta de nuevo.', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 animate-fade-in">
      
      {/* Driver Header / Tab Switcher */}
      <div className="bg-white dark:bg-stone-800 p-4 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Panel Driver</h2>
                <div id="driver-status" onClick={toggleDriverStatus} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isDriverOnline ? 'bg-green-500 animate-pulse' : 'bg-stone-400 dark:bg-stone-600'}`}></span>
                    <p className={`text-sm font-bold ${isDriverOnline ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'}`}>
                        {isDriverOnline ? 'En línea para recibir' : 'Desconectado'}
                    </p>
                </div>
            </div>
            <div id="earnings-card" className="bg-stone-100 dark:bg-stone-700 p-2 rounded-lg flex items-center gap-1 border border-amber-300 dark:border-stone-600">
                <DollarSign size={16} className="text-brand-950 dark:text-brand-400" />
                <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(totalEarnings)}</span>
            </div>
        </div>
        
        <div className="flex lg:hidden p-1 bg-stone-100 dark:bg-stone-700/50 rounded-xl border border-amber-300 dark:border-stone-700 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x">
            <button 
                id="deliveries-tab"
                onClick={() => setDriverViewState('DELIVERIES')}
                className={`flex-none w-32 py-2 text-sm font-bold rounded-lg transition-all relative snap-start ${driverViewState === 'DELIVERIES' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
                Disponibles ({availableOrders.length})
                {availableOrders.some(o => o.status === OrderStatus.READY) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                  </span>
                )}
            </button>
            <button 
                id="route-tab"
                onClick={() => setDriverViewState('MAP')}
                className={`flex-none w-28 py-2 text-sm font-bold rounded-lg transition-all snap-start ${driverViewState === 'MAP' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
                Mi Ruta ({myTasks.length})
            </button>
            <button 
                onClick={() => setDriverViewState('WALLET')}
                className={`flex-none w-28 py-2 text-sm font-bold rounded-lg transition-all snap-start ${driverViewState === 'WALLET' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
                Billetera
            </button>
            <button 
                id="history-tab"
                onClick={() => setDriverViewState('HISTORY')}
                className={`flex-none w-28 py-2 text-sm font-bold rounded-lg transition-all snap-start ${driverViewState === 'HISTORY' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
                Historial
            </button>
            <button 
                id="settings-tab"
                onClick={() => setDriverViewState('PROFILE')}
                className={`flex-none w-28 py-2 text-sm font-bold rounded-lg transition-all snap-start ${driverViewState === 'PROFILE' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
                Perfil
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto lg:max-w-7xl lg:mx-auto lg:w-full lg:p-8">
        
        {/* === TAB: DELIVERIES (FEED) === */}
        {driverViewState === 'DELIVERIES' && (
            <>
                {!isDriverOnline ? (
                    <div className="text-center py-20 opacity-50">
                        <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} className="text-stone-400 dark:text-stone-500" />
                        </div>
                        <p className="font-bold text-stone-900 dark:text-white text-lg">Estás desconectado</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Conéctate para recibir nuevas entregas</p>
                        <Button onClick={toggleDriverStatus}>Conectar Ahora</Button>
                    </div>
                ) : availableOrders.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <LocateFixed size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600 animate-pulse" />
                        <p className="font-medium text-stone-900 dark:text-white">Buscando entregas...</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Mantente en zonas de alta demanda</p>
                    </div>
                ) : (
                    <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                        {availableOrders.map(order => {
                            // Mock calculations based on order ID for consistency in demo
                            const distToStore = (parseInt(order.id.slice(-2), 16) % 20 / 10 + 0.5).toFixed(1);
                            const distToClient = (parseInt(order.id.slice(-4, -2), 16) % 50 / 10 + 1.2).toFixed(1);
                            const estTime = Math.floor(parseInt(order.id.slice(-1), 16) % 15 + 20);

                            return (
                                <div key={order.id} className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-md border border-amber-300 dark:border-stone-700 relative overflow-hidden group h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                                    
                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center border border-brand-500/20">
                                                    <Bike size={24} className="text-brand-600 dark:text-brand-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 dark:text-stone-500">Ganancia Neta</span>
                                                    <p className="font-black text-2xl text-stone-900 dark:text-white leading-none mt-1">{formatCurrency(order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0)}</p>
                                                </div>
                                            </div>
                                            {order.paymentMethod === PaymentMethod.CASH && (
                                                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1 border border-amber-200 dark:border-amber-900/50 shadow-sm">
                                                    <Banknote size={12} /> Efectivo
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-amber-200 dark:border-stone-700/50">
                                            <div className="text-center">
                                                <p className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 mb-0.5">Al Local</p>
                                                <div className="flex items-center justify-center gap-1">
                                                    <MapPin size={10} className="text-stone-400" />
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">{distToStore} km</p>
                                                </div>
                                            </div>
                                            <div className="text-center border-x border-amber-300 dark:border-stone-700/50 px-1">
                                                <p className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 mb-0.5">Al Cliente</p>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Truck size={10} className="text-stone-400" />
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">{distToClient} km</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 mb-0.5">Tiempo</p>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Clock size={10} className="text-stone-400" />
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">{estTime} min</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Route Visualization */}
                                        <div className="relative pl-5 space-y-6 border-l-2 border-dashed border-amber-300 dark:border-stone-700 ml-2.5 mb-6 flex-1">
                                            {/* Pickup */}
                                            <div className="relative">
                                                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">Punto de Retiro</p>
                                                    <p className="font-bold text-stone-900 dark:text-white text-sm">{order.storeName}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Dropoff */}
                                            <div className="relative">
                                                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-brand-500 border-2 border-white dark:border-stone-800 shadow-sm flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-950"></div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">Punto de Entrega</p>
                                                    <p className="font-bold text-stone-900 dark:text-white text-sm break-words pr-2 leading-tight">{order.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                <div className="flex gap-3 mt-auto">
                                            <Button 
                                                variant="secondary" 
                                                className="flex-1 font-bold bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 border border-amber-300 dark:border-stone-600"
                                                onClick={() => setSelectedTask(order)}
                                            >
                                                <Eye size={16} className="mr-2" /> Detalles
                                            </Button>
                                            <Button 
                                                className="flex-[2] font-bold shadow-lg shadow-brand-500/20 bg-brand-500 text-brand-950 hover:bg-brand-400"
                                                onClick={() => handleAcceptOrder(order.id)}
                                            >
                                                Aceptar Entrega
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
        )}

        {/* === TAB: MAP (ROUTE) === */}
        {driverViewState === 'MAP' && (
             <div className="space-y-6 animate-fade-in pb-24">
                {/* Active Navigation Summary */}
                {myTasks.length > 0 && (
                    <>
                        <div className="bg-brand-500 text-brand-950 p-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-between border border-brand-400">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-950/10 rounded-full flex items-center justify-center">
                                <Navigation size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Siguiente Parada</p>
                                <p className="font-black text-lg leading-none mt-1">
                                    {myTasks[0].status === OrderStatus.DRIVER_ASSIGNED ? 'Retiro en Local' : 'Entrega a Cliente'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Distancia</p>
                            <p className="font-black text-lg leading-none mt-1">{simulatedDistance.toFixed(1)} km</p>
                        </div>
                    </div>
                    {/* Route Progress Bar */}
                    <div className="mt-2 h-1.5 bg-brand-900/20 rounded-full overflow-hidden border border-brand-400/20">
                        <div 
                            className="h-full bg-brand-950 transition-all duration-1000" 
                            style={{ width: `${Math.max(0, Math.min(100, (1 - simulatedDistance / 0.8) * 100))}%` }}
                        ></div>
                    </div>
                </>
            )}

                {/* GPS Simulation Section */}
                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-amber-200 dark:border-stone-700 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                            <MapPin size={18} className="text-brand-500" /> GPS en Tiempo Real
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></span>
                            <span className="text-[10px] font-bold text-stone-400 uppercase">{isSimulating ? 'Activo' : 'Pausado'}</span>
                        </div>
                    </div>
                    
                    <Button 
                        variant={isSimulating ? "secondary" : "primary"} 
                        fullWidth 
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={isSimulating ? "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-amber-300 dark:border-stone-600 mb-4" : "bg-brand-500 text-brand-950 font-black mb-4"}
                    >
                        {isSimulating ? "Detener Navegación" : "Iniciar Navegación GPS"}
                    </Button>
                </div>

             {myTasks.length === 0 ? (
                 <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-3xl border border-dashed border-amber-300 dark:border-stone-700">
                     <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Navigation size={32} className="text-stone-300 dark:text-stone-600" />
                     </div>
                     <p className="text-stone-500 dark:text-stone-400 font-bold">No tienes entregas activas.</p>
                     <Button variant="ghost" onClick={() => setDriverViewState('DELIVERIES')} className="mt-4 text-brand-600 dark:text-brand-400 font-black uppercase text-xs tracking-widest">
                         Buscar Pedidos
                     </Button>
                 </div>
             ) : (
               <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                   {myTasks.map(task => {
                       let destLat, destLng, destLabel;
                       if (task.status === OrderStatus.DRIVER_ASSIGNED) {
                           const store = stores.find(s => s.id === task.storeId);
                           if (store && store.coordinates) {
                               destLat = store.coordinates.lat;
                               destLng = store.coordinates.lng;
                               destLabel = `Tienda: ${store.name}`;
                           }
                       } else if (task.status === OrderStatus.PICKED_UP) {
                           if (task.coordinates) {
                               destLat = task.coordinates.lat;
                               destLng = task.coordinates.lng;
                               destLabel = `Cliente: ${task.customerName}`;
                           }
                       }

                       return (
                     <div key={task.id} className="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-amber-200 dark:border-stone-700 overflow-hidden h-full flex flex-col group hover:border-brand-500/30 transition-all duration-500">
                       
                       {/* Interactive Navigation Interface */}
                       <div className="h-56 bg-stone-200 dark:bg-stone-700 relative border-b border-amber-200 dark:border-stone-700 shrink-0 overflow-hidden z-0">
                            <div className="absolute inset-0 z-0">
                                <DriverTrackingMap 
                                    driverLat={driverLocation.lat}
                                    driverLng={driverLocation.lng}
                                    destLat={destLat}
                                    destLng={destLng}
                                    destLabel={destLabel}
                                />
                            </div>
                            
                            {/* Navigation Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none z-10"></div>
                            
                            {/* Floating Action Button (Directly on Map) */}
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-20">
                                <Button 
                                    fullWidth 
                                    className={`font-black uppercase tracking-tighter text-sm h-12 shadow-2xl ${task.status === OrderStatus.DRIVER_ASSIGNED ? 'bg-brand-500 text-brand-950' : 'bg-green-500 text-white'}`}
                                    onClick={() => handleProgress(task.id, task.status)}
                                >
                                    {task.status === OrderStatus.DRIVER_ASSIGNED ? (
                                        <><Bike size={18} className="mr-2" /> Confirmar Recogida</>
                                    ) : (
                                        <><Truck size={18} className="mr-2" /> Confirmar Entrega</>
                                    )}
                                </Button>
                                <button 
                                    onClick={() => setSelectedTask(task)}
                                    className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                    title="Ver Detalles"
                                >
                                    <FileText size={20} />
                                </button>
                                <button 
                                    onClick={() => setActiveChatOrder(task.id)}
                                    className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                    title="Chat"
                                >
                                    <MessageSquare size={20} />
                                </button>
                            </div>

                            {/* Status and Info Overlays */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                 <Badge status={task.status} />
                                 <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 border border-white/20">
                                    <Clock size={12} className="text-brand-500" />
                                    <span className="text-[10px] font-black text-stone-900 dark:text-white">LLEGADA: 8 MIN</span>
                                 </div>
                            </div>

                            <div className="absolute top-4 right-4 z-20">
                                <button className="w-10 h-10 bg-brand-500 rounded-full shadow-lg flex items-center justify-center text-brand-950 hover:scale-110 transition-transform">
                                    <Navigation size={20} />
                                </button>
                            </div>
                       </div>

                       <div className="p-6 flex-1 flex flex-col">
                         <div className="flex justify-between items-start mb-6">
                            <div>
                                 <h3 className="font-black text-xl text-stone-900 dark:text-white tracking-tight">
                                    {task.status === OrderStatus.DRIVER_ASSIGNED ? 'Ruta al Local' : 'Ruta al Cliente'}
                                 </h3>
                                 <div className="flex items-center gap-1 mt-1">
                                    <MapPin size={14} className="text-stone-400" />
                                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400">
                                        {task.status === OrderStatus.DRIVER_ASSIGNED ? task.storeName : task.address}
                                    </p>
                                 </div>
                            </div>
                            <div className="text-right">
                                 <span className="block font-black text-stone-900 dark:text-white">{task.customerName}</span>
                                 <div className="flex items-center gap-1 justify-end mt-1">
                                    {task.paymentMethod === PaymentMethod.CASH ? (
                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider">
                                            Cobrar Efectivo
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/30 uppercase tracking-wider">
                                            Pagado Online
                                        </span>
                                    )}
                                 </div>
                            </div>
                         </div>
         
                         <div className="space-y-8 relative pl-6 border-l-2 border-amber-200 dark:border-stone-700 ml-2 mb-8 flex-1">
                           {/* Pickup Point */}
                           <div className={`relative z-10 transition-all duration-500 ${task.status !== OrderStatus.DRIVER_ASSIGNED ? 'opacity-30 scale-95' : 'scale-100'}`}>
                             <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full border-4 border-white dark:border-stone-800 shadow-sm flex items-center justify-center ${task.status !== OrderStatus.DRIVER_ASSIGNED ? 'bg-stone-300' : 'bg-stone-900 dark:bg-stone-100'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${task.status !== OrderStatus.DRIVER_ASSIGNED ? 'bg-stone-50 dark:bg-stone-800/500' : 'bg-white dark:bg-stone-900'}`}></div>
                             </div>
                             <div className="w-full">
                               <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest">Paso 1: Recoger Pedido</p>
                               <p className="text-base font-black text-stone-900 dark:text-white mt-0.5">{task.storeName}</p>
                               {task.status === OrderStatus.DRIVER_ASSIGNED && (
                                   <div className="flex gap-2 mt-3">
                                       <Button size="sm" variant="secondary" className="flex-1 h-10 text-[10px] font-black uppercase tracking-wider bg-stone-100 dark:bg-stone-700 border-amber-300 dark:border-stone-600" onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(task.storeName)}`, '_blank')}>
                                           <Navigation size={14} className="mr-2" /> Waze
                                       </Button>
                                       <Button size="sm" variant="secondary" className="flex-1 h-10 text-[10px] font-black uppercase tracking-wider bg-stone-100 dark:bg-stone-700 border-amber-300 dark:border-stone-600" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.storeName)}`, '_blank')}>
                                           <MapPin size={14} className="mr-2" /> Maps
                                       </Button>
                                   </div>
                               )}
                             </div>
                           </div>
         
                           {/* Dropoff Point */}
                           <div className={`relative z-10 transition-all duration-500 ${task.status === OrderStatus.DRIVER_ASSIGNED ? 'opacity-30 scale-95' : 'scale-100'}`}>
                             <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full border-4 border-white dark:border-stone-800 shadow-sm flex items-center justify-center ${task.status === OrderStatus.DRIVER_ASSIGNED ? 'bg-stone-300' : 'bg-brand-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${task.status === OrderStatus.DRIVER_ASSIGNED ? 'bg-stone-50 dark:bg-stone-800/500' : 'bg-brand-950'}`}></div>
                             </div>
                             <div className="w-full">
                               <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest">Paso 2: Entregar a Cliente</p>
                               <p className="text-base font-black text-stone-900 dark:text-white mt-0.5">{task.address}</p>
                               {task.status === OrderStatus.PICKED_UP && (
                                   <div className="flex gap-2 mt-3">
                                       <Button size="sm" variant="secondary" className="flex-1 h-10 text-[10px] font-black uppercase tracking-wider bg-stone-100 dark:bg-stone-700 border-amber-300 dark:border-stone-600" onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(task.address)}`, '_blank')}>
                                           <Navigation size={14} className="mr-2" /> Waze
                                       </Button>
                                       <Button size="sm" variant="secondary" className="flex-1 h-10 text-[10px] font-black uppercase tracking-wider bg-stone-100 dark:bg-stone-700 border-amber-300 dark:border-stone-600" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`, '_blank')}>
                                           <MapPin size={14} className="mr-2" /> Maps
                                       </Button>
                                   </div>
                               )}
                             </div>
                           </div>
                         </div>
                       
                         {task.status === OrderStatus.CANCELLED && (
                             <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-4 flex items-center gap-3">
                                 <X size={20} className="shrink-0" />
                                 <p><span className="font-black uppercase text-[10px] block">Pedido Cancelado</span> {task.cancelledReason}</p>
                             </div>
                         )}
                       </div>
                     </div>
                   );
                   })}
               </div>
             )}
            </div>
        )}

        {/* === TAB: WALLET === */}
        {driverViewState === 'WALLET' && (
            <div className="space-y-6 animate-fade-in pb-20">
                <div className="bg-brand-500 rounded-[2.5rem] p-8 text-brand-950 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-400/30 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Balance Disponible</p>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-6">{formatCurrency(totalEarnings)}</h2>
                        <div className="flex gap-4">
                            <div className="bg-brand-600/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-brand-400/30">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Hoy</p>
                                <p className="text-xl font-black">{formatCurrency(dailyEarnings)}</p>
                            </div>
                            <div className="bg-brand-600/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-brand-400/30">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Esta Semana</p>
                                <p className="text-xl font-black">{formatCurrency(weeklyEarnings)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl border border-amber-200 dark:border-stone-700 shadow-sm">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                            <DollarSign className="text-green-500" size={20} />
                        </div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Propinas</p>
                        <p className="text-2xl font-black text-stone-900 dark:text-white">{formatCurrency(tipEarnings)}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl border border-amber-200 dark:border-stone-700 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/200/10 rounded-xl flex items-center justify-center mb-4">
                            <Bike className="text-blue-500" size={20} />
                        </div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Envíos</p>
                        <p className="text-2xl font-black text-stone-900 dark:text-white">{formatCurrency(deliveryEarnings)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-3xl border border-amber-200 dark:border-stone-700 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-amber-200 dark:border-stone-700 flex justify-between items-center">
                        <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-widest text-sm">Últimos Pagos</h3>
                        <button className="text-brand-600 text-xs font-bold">Ver Todo</button>
                    </div>
                    <div className="divide-y divide-stone-100 dark:divide-stone-700">
                        {myHistory.filter(o => o.status === OrderStatus.DELIVERED).slice(0, 5).map(order => (
                            <div key={order.id} className="p-4 flex justify-between items-center hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center">
                                        <Banknote size={20} className="text-stone-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-900 dark:text-white">{order.storeName}</p>
                                        <p className="text-[10px] text-stone-500 uppercase font-bold dark:text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-stone-900 dark:text-white">+{formatCurrency(order.driverEarnings)}</p>
                                    <p className="text-[10px] text-green-500 font-bold uppercase">Completado</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === TAB: HISTORY === */}
        {driverViewState === 'HISTORY' && (
             <>
             {myHistory.length === 0 ? (
                 <div className="text-center py-20">
                     <p className="text-stone-500 dark:text-stone-400">No tienes historial de entregas.</p>
                 </div>
             ) : (
                 <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
                     <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-amber-300 dark:border-stone-700 shadow-sm flex justify-between items-center lg:col-span-2 xl:col-span-3 lg:mb-4">
                         <div>
                             <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Ganancias Totales</p>
                             <p className="text-2xl font-bold text-brand-950 dark:text-brand-400">{formatCurrency(totalEarnings)}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Entregas</p>
                             <p className="text-xl font-bold text-stone-900 dark:text-white">{myHistory.filter(o => o.status === OrderStatus.DELIVERED).length}</p>
                         </div>
                     </div>
                     {myHistory.map(task => (
                         <div key={task.id} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-amber-300 dark:border-stone-700 p-4">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <p className="font-bold text-stone-900 dark:text-white">{task.storeName}</p>
                                     <p className="text-xs text-stone-500 dark:text-stone-400">{new Date(task.createdAt).toLocaleDateString()}</p>
                                 </div>
                                 <Badge status={task.status} />
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-stone-500 dark:text-stone-400">{task.customerName}</span>
                                 <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(task.type === OrderType.DELIVERY ? (task.deliveryFee ?? 45) : 0)}</span>
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

        {/* === TAB: PROFILE (SECURITY) === */}
        {driverViewState === 'PROFILE' && (
            <div className="space-y-6 animate-fade-in pb-20">
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
                        <Shield size={40} className="text-brand-500" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Seguridad y Perfil</h3>
                    <p className="text-stone-500 dark:text-stone-400 max-w-xs mx-auto">Configura tus opciones de seguridad y revisa tu perfil de repartidor.</p>
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-amber-200 dark:border-stone-700 p-4 shadow-sm">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-4">Vehículo de Entrega</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(['MOTO', 'BICI', 'AUTO'] as const).map(type => (
                            <button 
                                key={type}
                                onClick={() => setVehicleType(type)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${vehicleType === type ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20' : 'border-amber-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-brand-300'}`}
                            >
                                {type === 'MOTO' && <Bike size={24} />}
                                {type === 'BICI' && <Bike size={24} className="rotate-12" />}
                                {type === 'AUTO' && <Truck size={24} />}
                                <span className="text-[10px] font-bold uppercase">{type === 'AUTO' ? 'Auto' : type === 'BICI' ? 'Bici' : 'Moto'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-amber-200 dark:border-stone-700 p-4 shadow-sm">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-4">Preferencias</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-stone-900 dark:text-white">Sonidos de Notificación</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">Alertas para nuevos pedidos</p>
                            </div>
                            <button 
                                onClick={toggleSound}
                                className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-brand-500' : 'bg-stone-200 dark:bg-stone-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'right-1' : 'left-1'} dark:bg-stone-900`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-amber-200 dark:border-stone-700 p-4 shadow-sm">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-4">Seguridad</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Verificación de Identidad</span>
                            <Badge status={OrderStatus.DELIVERED} /> {/* Using DELIVERED as a green badge for 'Verified' */}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Antecedentes Penales</span>
                            <span className="text-xs font-bold text-green-500">LIMPIO</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* Order Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-amber-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
                    <div>
                        <h3 className="font-bold dark:text-white">Detalle de Entrega</h3>
                        <p className="text-[10px] font-mono text-stone-400">#{selectedTask.id.slice(-6)}</p>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="dark:text-white p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-stone-400 uppercase mb-2">Productos</h4>
                        <div className="space-y-2">
                            {selectedTask.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-stone-900 dark:text-white"><span className="font-bold">{item.quantity}x</span> {item.product.name}</span>
                                    <span className="text-stone-500 dark:text-stone-400">{formatCurrency(item.totalPrice)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedTask.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mb-1">Instrucciones del Cliente</h4>
                            <p className="text-sm text-amber-900 dark:text-amber-200 italic">"{selectedTask.notes}"</p>
                        </div>
                    )}

                    <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-amber-200 dark:border-stone-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-stone-500 dark:text-stone-400">Método de Pago</span>
                            <span className="text-sm font-bold text-stone-900 dark:text-white">
                                {selectedTask.paymentMethod === PaymentMethod.CASH ? 'Efectivo' : 'Tarjeta (Pagado)'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-stone-500 dark:text-stone-400">Total a Cobrar</span>
                            <span className="text-lg font-bold text-stone-900 dark:text-white">
                                {selectedTask.paymentMethod === PaymentMethod.CASH ? formatCurrency(selectedTask.total) : formatCurrency(0)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-t dark:border-stone-800">
                    <Button fullWidth onClick={() => setSelectedTask(null)}>Cerrar Detalle</Button>
                </div>
            </div>
        </div>
      )}
        {showTour && (
            <OnboardingTour 
                tourId="driver-onboarding" 
                steps={driverTourSteps} 
                onComplete={() => completeTour('driver-onboarding')} 
            />
        )}

        <ChatOverlay 
          orderId={activeChatOrder || ''} 
          isOpen={!!activeChatOrder} 
          onClose={() => setActiveChatOrder(null)} 
          title="Chat de Entrega" 
        />
    </div>
  );
};

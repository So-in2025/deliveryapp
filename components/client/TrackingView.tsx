
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types';
import { Package, CheckCircle2, ChefHat, ShoppingBag, MapPin, Bike, ArrowLeft, MessageSquare, Phone, Star } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Component to handle center and bounds updates
const MapController: React.FC<{ 
    driverPos?: [number, number], 
    storePos?: [number, number], 
    userPos?: [number, number] 
}> = ({ driverPos, storePos, userPos }) => {
    const map = useMap();
    
    useEffect(() => {
        if (!map) return;

        const points: L.LatLngExpression[] = [];
        if (driverPos) points.push(driverPos);
        if (storePos) points.push(storePos);
        if (userPos) points.push(userPos);
        
        if (points.length > 1) {
            try {
                const bounds = L.latLngBounds(points);
                // Large bottom padding to push markers above the tracking card
                map.fitBounds(bounds, { paddingBottomRight: [50, 400], paddingTopLeft: [50, 50], maxZoom: 16 });
            } catch (e) {
                console.warn('Map fitBounds failed', e);
            }
        } else if (points.length === 1) {
            map.setView(points[0], 16);
        }
    }, [driverPos, storePos, userPos, map]);

    // Force invalidateSize on mount and when positions change to ensure correct rendering
    useEffect(() => {
        if (!map) return;

        const timer = setTimeout(() => {
            try {
                map.invalidateSize();
            } catch (e) {
                // Silently fail if map is already destroyed
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [map, driverPos, storePos, userPos]);

    return null;
};

const TrackingMap: React.FC<{ driverLat?: number; driverLng?: number; storeLat?: number; driverId?: string; storePosKey?: string; storeLogo?: string; userLat?: number; userLng?: number }> = ({ driverLat, driverLng, storeLat, driverId, storePosKey, storeLogo, userLat, userLng }) => {
    const defaultCenter: [number, number] = [-34.6037, -58.3816];
    
    const driverPos: [number, number] | undefined = typeof driverLat === 'number' && typeof driverLng === 'number' && !isNaN(driverLat) && !isNaN(driverLng) ? [driverLat, driverLng] : undefined;
    const storePos: [number, number] | undefined = typeof storeLat === 'number' && typeof storeLng === 'number' && !isNaN(storeLat) && !isNaN(storeLng) ? [storeLat, storeLng] : undefined;
    const userPos: [number, number] | undefined = typeof userLat === 'number' && typeof userLng === 'number' && !isNaN(userLat) && !isNaN(userLng) ? [userLat, userLng] : undefined;

    // Memoize icons to prevent constant recreation
    const driverIcon = React.useMemo(() => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute -inset-6 bg-brand-500/30 rounded-full animate-ping"></div>
                <div class="w-14 h-14 bg-stone-950 dark:bg-brand-500 rounded-[1.5rem] border-4 border-white dark:border-stone-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500 dark:text-brand-950"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
               </div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
    }), []);

    const storeIcon = React.useMemo(() => {
        const storeIconHtml = storeLogo 
            ? `<div class="w-14 h-14 bg-white dark:bg-stone-900 rounded-[1.5rem] border-4 border-white dark:border-stone-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden p-0.5"><img src="${storeLogo}" alt="store" class="w-full h-full object-cover rounded-2xl" /></div>`
            : `<div class="w-14 h-14 bg-brand-500 rounded-[1.5rem] border-4 border-white dark:border-stone-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-950"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>`;
        
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="relative flex items-center justify-center">${storeIconHtml}</div>`,
            iconSize: [56, 56],
            iconAnchor: [28, 28]
        });
    }, [storeLogo]);

    const userIcon = React.useMemo(() => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute -inset-4 bg-blue-500/20 rounded-full animate-pulse"></div>
                <div class="w-10 h-10 bg-blue-500 rounded-full border-4 border-white dark:border-stone-900 shadow-2xl flex items-center justify-center">
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    }), []);

    // Create polyline paths
    const routePath: [number, number][] = [];
    if (driverPos && userPos) {
        routePath.push(driverPos, userPos);
    } else if (storePos && userPos) {
        routePath.push(storePos, userPos);
    }

    return (
        <MapContainer 
            center={driverPos || userPos || storePos || defaultCenter} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
            scrollWheelZoom={true}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController driverPos={driverPos} storePos={storePos} userPos={userPos} />
            
            {routePath.length > 1 && <Polyline positions={routePath} color="#000000" weight={4} dashArray="10, 10" opacity={0.4} />}

            {storePos && <Marker position={storePos} icon={storeIcon}><Popup>Tienda</Popup></Marker>}
            {userPos && <Marker position={userPos} icon={userIcon}><Popup>Tu ubicación</Popup></Marker>}
            {driverPos && <Marker position={driverPos} icon={driverIcon}><Popup>Repartidor</Popup></Marker>}
        </MapContainer>
    );
};

export const TrackingView: React.FC = () => {
    const { orders, setClientViewState, stores, user, socket } = useApp();
    const [liveDriverLocation, setLiveDriverLocation] = useState<{lat: number, lng: number} | null>(null);

    const activeOrder = orders.find(o => 
        o.customerId === user.uid && 
        o.status !== OrderStatus.DELIVERED && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.DISPUTED
    );
    
    const pastOrders = orders.filter(o => 
        o.customerId === user.uid && 
        (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // If no active, show most recent past order for context
    const displayOrder = activeOrder || pastOrders[0];

    // Better store lookup moved AFTER displayOrder is defined
    const orderStore = stores.find(s => s.id === displayOrder?.storeId);

    // Coordinates safety: ensure we always have something to show
    const isValidCoord = (lat: any, lng: any) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

    const mapDriverLat = liveDriverLocation?.lat || displayOrder?.driverLat || orderStore?.lat;
    const mapDriverLng = liveDriverLocation?.lng || displayOrder?.driverLng || orderStore?.lng;
    const mapUserLat = displayOrder?.coordinates?.lat || user.lat || -34.6037;
    const mapUserLng = displayOrder?.coordinates?.lng || user.lng || -58.3816;
    const mapStoreLat = orderStore?.lat || displayOrder?.storeLat;
    const mapStoreLng = orderStore?.lng || displayOrder?.storeLng;

    useEffect(() => {
        if (displayOrder && socket && (displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP)) {
            socket.emit('join_tracking', displayOrder.driverId);
            const update = (data: any) => {
                if (data.driverId === displayOrder.driverId && isValidCoord(data.lat, data.lng)) {
                    setLiveDriverLocation({ lat: data.lat, lng: data.lng });
                }
            };
            socket.on('driver_location', update);
            return () => { socket.off('driver_location', update); };
        }
    }, [displayOrder, socket]);

    useEffect(() => {
        if (displayOrder?.status === OrderStatus.DELIVERED) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FACC15', '#F27D26', '#000000'] });
        }
    }, [displayOrder?.status]);

    if (!displayOrder) return null;

    const translateStatus = (status: OrderStatus) => {
        const labels: Record<OrderStatus, string> = {
            [OrderStatus.PENDING]: 'Pendiente',
            [OrderStatus.ACCEPTED]: 'Aceptado',
            [OrderStatus.PREPARING]: 'Cocinando',
            [OrderStatus.READY]: 'Listo',
            [OrderStatus.DRIVER_ASSIGNED]: 'Repartidor',
            [OrderStatus.PICKED_UP]: 'En camino',
            [OrderStatus.DELIVERED]: 'Entregado',
            [OrderStatus.CANCELLED]: 'Cancelado',
            [OrderStatus.DISPUTED]: 'Reclamo',
        };
        return labels[status] || status;
    };

    const steps = [
        { status: OrderStatus.PENDING, label: 'Enviado', icon: Package },
        { status: OrderStatus.ACCEPTED, label: 'Aceptado', icon: CheckCircle2 },
        { status: OrderStatus.PREPARING, label: 'Cocinando', icon: ChefHat },
        { status: OrderStatus.READY, label: 'Listo', icon: ShoppingBag },
        { status: OrderStatus.DRIVER_ASSIGNED, label: 'Asignado', icon: MapPin },
        { status: OrderStatus.PICKED_UP, label: 'En camino', icon: Bike },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === displayOrder.status);
    const safeIndex = currentStepIndex === -1 ? (displayOrder.status === OrderStatus.DELIVERED ? 6 : 0) : currentStepIndex;
    const progressWidth = `${Math.max(5, Math.min(100, (safeIndex / (steps.length - 1)) * 100))}%`;

    return (
        <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950 animate-fade-in relative overflow-hidden">
            {/* Background Map Overlay Area */}
            <div className="absolute inset-0 z-0">
                <TrackingMap 
                    driverLat={mapDriverLat} 
                    driverLng={mapDriverLng}
                    storeLat={mapStoreLat}
                    storeLng={mapStoreLng}
                    storeLogo={orderStore?.image || orderStore?.logo}
                    userLat={mapUserLat}
                    userLng={mapUserLng}
                />
                {/* Vignette effect for depth */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-stone-950/20 via-transparent to-stone-950/5" />
            </div>

            {/* Top Bar Overlay */}
            <div className="relative z-30 p-6 flex items-start justify-between pointer-events-none">
                <button 
                  onClick={() => setClientViewState('BROWSE')} 
                  className="w-14 h-14 bg-white/90 dark:bg-stone-950/90 backdrop-blur-2xl border border-stone-200/50 dark:border-white/10 rounded-[1.5rem] flex items-center justify-center text-stone-950 dark:text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] active:scale-90 transition-all pointer-events-auto group"
                >
                    <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                {activeOrder && (
                     <div className="bg-white/90 dark:bg-stone-950/90 backdrop-blur-2xl px-6 py-4 rounded-[1.5rem] border border-stone-200/50 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] pointer-events-auto flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-950 dark:text-white">Siguiendo envío</span>
                     </div>
                )}
            </div>

            {/* Bottom Card Overlay */}
            <div className="mt-auto relative z-20 pointer-events-none p-4 lg:p-6 pb-6">
                <div className="bg-white/95 dark:bg-stone-900/98 backdrop-blur-3xl rounded-[2.5rem] p-6 lg:p-8 shadow-[0_-40px_100px_-20px_rgba(0,0,0,0.35)] border-2 border-stone-200 dark:border-white/5 space-y-6 max-w-xl mx-auto pointer-events-auto animate-slide-up relative overflow-hidden">
                    {/* Visual Handle */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-200 dark:bg-white/10 rounded-full" />
                    
                    {/* Interior Glow */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
                    
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-2xl lg:text-3xl font-black text-stone-950 dark:text-white tracking-tighter leading-none truncate uppercase italic">{displayOrder.storeName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-white/10">
                                    <span className="text-stone-500 dark:text-stone-400 font-mono text-[8px] font-black uppercase tracking-widest">#{displayOrder.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <span className="w-1 h-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
                                <span className="text-stone-400 font-black text-[9px] uppercase tracking-widest">{new Date(displayOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                             {displayOrder.status === OrderStatus.DELIVERED ? (
                                <div className="bg-emerald-500 text-brand-950 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400">
                                    <CheckCircle2 size={16} strokeWidth={3} /> ENTREGADO
                                </div>
                             ) : (
                                <div className="flex flex-col items-end">
                                    <p className="text-[8px] font-black text-brand-500 uppercase tracking-[0.3em] leading-none mb-1">Estado</p>
                                    <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                        <p className="text-sm font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">{translateStatus(displayOrder.status)}</p>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Compact Progress Steps */}
                    <div className="relative pt-4 px-1">
                        <div className="flex justify-between relative z-10 font-black">
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                const isCompleted = i <= safeIndex;
                                const isCurrent = i === safeIndex;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-all duration-700 border-2 ${isCompleted ? 'bg-brand-500 border-brand-400 text-brand-950 shadow-md rotate-0' : 'bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-white/5 text-stone-300 dark:text-stone-600 -rotate-12 group-hover:rotate-0'}`}>
                                            <Icon size={isCurrent ? 22 : 18} strokeWidth={isCurrent ? 3 : 2} className={isCurrent ? 'animate-bounce' : ''} />
                                        </div>
                                        <span className={`hidden sm:block text-[8px] font-black uppercase tracking-tighter ${isCurrent ? 'text-brand-500 scale-105' : isCompleted ? 'text-stone-950 dark:text-white' : 'text-stone-400 opacity-30'}`}>{step.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="absolute top-[26px] lg:top-[28px] left-8 right-8 h-1.5 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-white/5 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: progressWidth }} 
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-brand-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] relative" 
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                            </motion.div>
                        </div>
                    </div>

                    {/* Driver Card - Compact */}
                    {(displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP || displayOrder.status === OrderStatus.DELIVERED) && displayOrder.driverName && (
                        <div className="flex items-center gap-4 bg-stone-50 dark:bg-white/5 p-4 lg:p-5 rounded-[2rem] border-2 border-stone-100 dark:border-white/10 animate-slide-up group relative overflow-hidden">
                            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-brand-950 font-black text-xl shadow-lg border-4 border-white dark:border-stone-800 overflow-hidden shrink-0">
                                <span className="group-hover:scale-125 transition-transform duration-700">{displayOrder.driverName[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Repartidor</p>
                                <h4 className="font-black text-stone-950 dark:text-white text-xl tracking-tighter leading-none truncate uppercase italic">{displayOrder.driverName}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Star size={10} fill="#FACC15" color="#FACC15" />
                                    <span className="text-[9px] font-black text-brand-700 dark:text-brand-500">4.9 • {displayOrder.vehicleType || 'Delivery'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-950 dark:text-white shadow-md border border-stone-100 dark:border-white/5 hover:bg-brand-500 hover:text-brand-950 transition-all active:scale-90">
                                    <MessageSquare size={18} />
                                </button>
                                <button className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-brand-950 shadow-md border border-brand-400 hover:bg-brand-600 transition-all active:scale-90">
                                    <Phone size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

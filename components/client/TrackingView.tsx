
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { OrderStatus, OrderType } from '../../types';
import { Package, CheckCircle2, ChefHat, ShoppingBag, MapPin, Bike, ArrowLeft, X, Clock, WifiOff, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Component to handle center updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const TrackingMap: React.FC<{ driverLat?: number; driverLng?: number; storeLat?: number; storeLng?: number }> = ({ driverLat, driverLng, storeLat, storeLng }) => {
    const defaultCenter: [number, number] = [-34.6037, -58.3816];
    const center: [number, number] = driverLat && driverLng ? [driverLat, driverLng] : defaultCenter;

    const driverIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute -inset-4 bg-brand-500/30 rounded-full animate-ping"></div>
                <div class="w-10 h-10 bg-brand-500 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-950"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const storeIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 bg-stone-900 dark:bg-white rounded-xl border-2 border-white dark:border-stone-800 shadow-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white dark:text-stone-900"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    return (
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            <MapUpdater center={center} />
            {driverLat && driverLng && <Marker position={[driverLat, driverLng]} icon={driverIcon} />}
            {storeLat && storeLng && <Marker position={[storeLat, storeLng]} icon={storeIcon} />}
        </MapContainer>
    );
};

export const TrackingView: React.FC = () => {
    const { orders, setClientViewState, stores, user, socket } = useApp();
    const [liveDriverLocation, setLiveDriverLocation] = useState<{lat: number, lng: number} | null>(null);

    const activeOrder = orders.find(o => o.customerId === user.uid && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DISPUTED);
    const pastOrders = orders.filter(o => o.customerId === user.uid && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED));
    
    const displayOrder = activeOrder || pastOrders[0];

    useEffect(() => {
        if (displayOrder && socket && (displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP)) {
            socket.emit('join_tracking', displayOrder.driverId);
            const update = (data: any) => data.driverId === displayOrder.driverId && setLiveDriverLocation({ lat: data.lat, lng: data.lng });
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

    const steps = [
        { status: OrderStatus.PENDING, label: 'Enviado', icon: Package },
        { status: OrderStatus.ACCEPTED, label: 'Aceptado', icon: CheckCircle2 },
        { status: OrderStatus.PREPARING, label: 'Preparando', icon: ChefHat },
        { status: OrderStatus.READY, label: 'Listo', icon: ShoppingBag },
        { status: OrderStatus.DRIVER_ASSIGNED, label: 'Asignado', icon: MapPin },
        { status: OrderStatus.PICKED_UP, label: 'En camino', icon: Bike },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === displayOrder.status);
    const safeIndex = currentStepIndex === -1 ? (displayOrder.status === OrderStatus.DELIVERED ? 6 : 0) : currentStepIndex;
    const progressWidth = `${Math.max(5, Math.min(100, (safeIndex / (steps.length - 1)) * 100))}%`;

    const orderStore = stores.find(s => s.id === displayOrder.storeId);

    return (
        <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-900 animate-fade-in relative overflow-hidden">
            <div className="absolute top-6 left-6 z-30">
                <button onClick={() => setClientViewState('BROWSE')} className="w-12 h-12 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl flex items-center justify-center text-stone-900 dark:text-white shadow-xl active:scale-95 transition-all"><ArrowLeft size={24} /></button>
            </div>

            <div className="flex-1 relative">
                <TrackingMap 
                    driverLat={liveDriverLocation?.lat || displayOrder.driverLat} 
                    driverLng={liveDriverLocation?.lng || displayOrder.driverLng}
                    storeLat={orderStore?.lat}
                    storeLng={orderStore?.lng}
                />
            </div>

            <div className="relative z-20 -mt-10">
                <div className="bg-white/90 dark:bg-stone-950/90 backdrop-blur-3xl rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] border-t border-white/20 dark:border-white/5 space-y-8 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">{displayOrder.storeName}</h3>
                            <p className="text-stone-400 font-bold text-[8px] uppercase tracking-widest mt-2">ID: #{displayOrder.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                             {displayOrder.status === OrderStatus.DELIVERED ? (
                                <span className="bg-green-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Entregado</span>
                             ) : (
                                <div className="animate-pulse">
                                    <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none mb-1">Llegando en</p>
                                    <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">20-25 <span className="text-sm">min</span></p>
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <div className="flex justify-between relative z-10">
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                const isCompleted = i <= safeIndex;
                                const isCurrent = i === safeIndex;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${isCompleted ? 'bg-brand-500 border-brand-400 text-brand-950 shadow-lg shadow-brand-500/20' : 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-400'}`}>
                                            <Icon size={18} strokeWidth={isCurrent ? 3 : 2} className={isCurrent ? 'animate-bounce' : ''} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="absolute top-[22px] left-5 right-5 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full">
                            <motion.div initial={{ width: 0 }} animate={{ width: progressWidth }} className="h-full bg-brand-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        </div>
                    </div>

                    {(displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP) && displayOrder.driverName && (
                        <div className="flex items-center gap-4 bg-stone-50 dark:bg-white/5 p-5 rounded-2xl border border-black/[0.03] animate-slide-up">
                            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-brand-950 font-black text-xl shadow-lg border-4 border-white dark:border-stone-800">
                                {displayOrder.driverName[0]}
                            </div>
                            <div className="flex-1">
                                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Tu repartidor</p>
                                <h4 className="font-black text-stone-900 dark:text-white text-lg tracking-tight leading-none">{displayOrder.driverName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Star size={12} fill="#FACC15" color="#FACC15" />
                                    <span className="text-[10px] font-black text-stone-500">4.9 • {displayOrder.vehicleType || 'Moto'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-950 dark:text-white shadow-lg"><MessageSquare size={20} /></button>
                                <button className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-brand-500 shadow-lg border border-brand-500/10"><Phone size={20} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

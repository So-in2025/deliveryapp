import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { OrderStatus, Store, OrderType, UserRole, Order } from '../types';
import { formatCurrency } from '../constants';
import { generateBannerWithAI } from '../services/geminiService';
import { Badge, PaymentBadge, StoreBadge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { Button } from '../components/ui/Button';
import { 
  TrendingUp, Users, Store as StoreIcon, Activity, HelpCircle,
  DollarSign, Shield, Search, LayoutDashboard, Bike, ClipboardList, Megaphone, Banknote,
  AlertTriangle, ChevronRight, Truck, MapPin, ArrowLeft, Mail, ChevronDown, Settings, LogOut,
  BarChart3, PieChart as PieChartIcon, Filter, Tag as TagIcon, X, Plus, Trash2, AlertCircle,
  Compass, Sun, Moon, Zap, MoreHorizontal,
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs, getDoc, deleteDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { setupDemoStore } from '../src/services/seedService';

import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';

const roleLabels: Record<UserRole, string> = {
  [UserRole.NONE]: 'Ninguno',
  [UserRole.CLIENT]: 'Cliente',
  [UserRole.MERCHANT]: 'Comercio',
  [UserRole.DRIVER]: 'Repartidor',
  [UserRole.ADMIN]: 'Admin',
};

interface KpiCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const KpiCard = ({ title, value, sub, icon: Icon, color, onClick }: KpiCardProps) => (
  <div onClick={onClick} className={`bg-white/40 dark:bg-black/10 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-stone-200/50 dark:border-white/[0.05] backdrop-blur-md flex items-start justify-between group transition-all duration-500 ${onClick ? 'cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 active:scale-95' : 'hover:border-brand-500/30'}`}>
    <div>
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">{title}</p>
      <h3 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{value}</h3>
      <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${color}`}>{sub}</p>
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-stone-50 dark:bg-white/5 border border-transparent dark:border-white/5 shadow-inner transition-all duration-500 ${color.replace('text-', 'text-')} ${onClick ? 'group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-brand-950 group-hover:rotate-12' : 'group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-brand-950'}`}>
      <Icon size={22} strokeWidth={2.5} />
    </div>
  </div>
);

const SettlementsTab = ({ orders, stores, settleMerchantOrder, settleDriverOrder }: { 
    orders: Order[], 
    stores: Store[],
    settleMerchantOrder: (id: string) => Promise<void>,
    settleDriverOrder: (id: string) => Promise<void>
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'MERCHANTS' | 'DRIVERS'>('MERCHANTS');

    useEffect(() => {
    console.log('[DEBUG] AdminView Stores:', stores.length, stores.map(s => s.name));
  }, [stores]);

  const merchantSettlements = useMemo(() => {
        const settlements: { [storeId: string]: { storeName: string, pending: number, settled: number, total: number, orders: Order[] } } = {};
        
        // Initialize with all stores to ensure they are visible even with 0 balance
        stores.forEach(s => {
            settlements[s.id] = { storeName: s.name, pending: 0, settled: 0, total: 0, orders: [] };
        });

        // Debug: Log total stores in settlements
        console.log(`Settlements processing for ${Object.keys(settlements).length} stores`);

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
    }, [orders, stores]);

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
                        <div key={s.id} className="bg-white/40 dark:bg-black/10 p-8 rounded-[3rem] border border-stone-200/50 dark:border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md space-y-6 group hover:border-brand-500/30 transition-all duration-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-stone-950 text-xl uppercase tracking-tighter italic dark:text-white">{s.storeName}</h3>
                                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">ID Comercio: {s.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Por pagar</p>
                                    <p className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(s.pending)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 py-6 border-y border-stone-200/50 dark:border-white/[0.05]">
                                <div>
                                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Liquidado</p>
                                    <p className="font-black text-stone-950 dark:text-white text-lg tracking-tight">{formatCurrency(s.settled)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Total Histórico</p>
                                    <p className="font-black text-stone-950 dark:text-white text-lg tracking-tight">{formatCurrency(s.total)}</p>
                                </div>
                            </div>
                            {s.pending > 0 && (
                                <Button 
                                    fullWidth 
                                    size="lg"
                                    onClick={() => {
                                        const pendingOrders = s.orders.filter(o => !o.merchantSettled);
                                        pendingOrders.forEach(o => settleMerchantOrder(o.id));
                                    }}
                                    className="!bg-stone-950 !text-white !rounded-2xl shadow-xl shadow-stone-950/20"
                                >
                                    LIQUIDAR FONDOS
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
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">ID Repartidor: {s.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase">Por pagar</p>
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
    const { showToast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newBanner, setNewBanner] = useState({
        title: '',
        subtitle: '',
        image: '',
        badge: 'PROMO',
        isActive: true,
        priority: 0,
        link: ''
    });

    const handleGenerateAI = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const result = await generateBannerWithAI(aiPrompt);
            setNewBanner(prev => ({
                ...prev,
                title: result.title,
                subtitle: result.subtitle,
                badge: result.badge,
                image: result.image
            }));
            showToast('Promoción generada con éxito!', 'success');
        } catch (error) {
            showToast('Error al generar la promoción', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAdd = () => {
        if (!newBanner.title || !newBanner.image) return;
        if (editingId) {
            updateBanner(editingId, newBanner);
            setEditingId(null);
            showToast('Banner actualizado', 'success');
        } else {
            addBanner(newBanner);
            showToast('Banner creado', 'success');
        }
        setIsAdding(false);
        setNewBanner({ title: '', subtitle: '', image: '', badge: 'PROMO', isActive: true, priority: 0, link: '' });
        setAiPrompt('');
    };

    const startEdit = (banner: any) => {
        setEditingId(banner.id);
        setNewBanner({
            title: banner.title,
            subtitle: banner.subtitle,
            image: banner.image,
            badge: banner.badge,
            isActive: banner.isActive,
            priority: banner.priority,
            link: banner.link || ''
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6 px-4 pt-2 animate-fade-in pb-20 lg:w-full lg:px-8">
            <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-4 rounded-xl border border-amber-200 dark:border-stone-800 shadow-sm transition-colors">
                <div>
                    <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tighter">Promociones Globales</h3>
                    <p className="text-xs text-stone-500 font-medium dark:text-stone-400">Gestiona los banners de la pantalla principal</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { setIsAdding(!isAdding); if(isAdding) setEditingId(null); }} variant={isAdding ? 'secondary' : 'primary'}>
                        {isAdding ? <X size={20} /> : <div className="flex items-center gap-2"><Plus size={20} /> <span className="hidden sm:inline">Nueva Promo</span></div>}
                    </Button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-brand-500/30 shadow-2xl animate-slide-in-bottom space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-widest italic">
                            {editingId ? 'Editando Banner Existente' : 'Crear Nueva Promoción Inteligente'}
                        </h4>
                        {editingId && (
                            <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 px-3 py-1 rounded-lg">Cancelar Edición</button>
                        )}
                    </div>
                    
                    {!editingId && (
                        <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-200 dark:border-brand-500/20 flex flex-col gap-3">
                            <label className="text-xs font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                                ✨ Magic AI (0 Fricción)
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-3 rounded-lg border border-brand-200 dark:border-stone-700 bg-white dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all font-bold text-sm"
                                    placeholder="Ej: 50% de descuento en sushi esta semana"
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                />
                                <Button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt} className="px-6 relative overflow-hidden">
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-brand-950 border-t-transparent rounded-full animate-spin" />
                                    ) : 'Generar'}
                                </Button>
                            </div>
                        </div>
                    )}

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
                        <div className="space-y-2 flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Badge</label>
                                <input 
                                    className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                                    placeholder="PROMO"
                                    value={newBanner.badge}
                                    onChange={e => setNewBanner({...newBanner, badge: e.target.value.toUpperCase()})}
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Prioridad</label>
                                <input 
                                    type="number"
                                    className="w-full p-4 rounded-xl border dark:border-stone-800 dark:bg-stone-950 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                                    value={newBanner.priority}
                                    onChange={e => setNewBanner({...newBanner, priority: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest italic flex items-center gap-2">
                            🔍 Vista Previa en Vivo (Full Surface)
                        </label>
                        <div className="relative group/preview overflow-hidden rounded-[2.5rem] border-4 border-stone-100 dark:border-white/5 shadow-2xl bg-stone-100 dark:bg-stone-950">
                            <div className="p-8 aspect-[16/7] relative overflow-hidden flex flex-col items-start justify-end group-hover/preview:scale-[1.01] transition-transform duration-700">
                                {newBanner.image ? (
                                    <img 
                                        src={newBanner.image} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity dark:mix-blend-normal group-hover/preview:scale-110 transition-transform duration-[5s] ease-out" 
                                        alt="Preview"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-stone-900">
                                        <Plus size={48} className="text-stone-400 animate-pulse" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                                
                                <div className="relative z-20 space-y-3">
                                    <div className="bg-brand-500 text-brand-950 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] inline-block shadow-2xl animate-bounce-slow">
                                        {newBanner.badge || 'PROMO'}
                                    </div>
                                    <h4 className="text-white font-black text-3xl lg:text-4xl tracking-tighter uppercase leading-none italic drop-shadow-2xl">
                                        {newBanner.title || 'Título de Oro'}
                                    </h4>
                                    <p className="text-white/70 text-xs lg:text-sm font-medium tracking-tight max-w-sm drop-shadow-md leading-relaxed">
                                        {newBanner.subtitle || 'Define un pitch de venta agresivo para incrementar el CTR.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button 
                            fullWidth 
                            onClick={handleAdd} 
                            disabled={!newBanner.title || !newBanner.image}
                            className="!h-16 !text-[11px] !bg-stone-950 dark:!bg-white text-white dark:text-stone-950 shadow-2xl !rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-black tracking-widest uppercase italic border border-white/10"
                        >
                            {editingId ? 'ACTUALIZAR PROMOCIÓN' : 'CONFIRMAR Y PUBLICAR'}
                        </Button>
                    </div>
                </div>
            )}

            {banners.length === 0 && !isAdding && (
                <div className="border hover:border-brand-500/50 transition-colors border-dashed border-stone-300 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-12 py-20 text-center gap-6 group mt-6 bg-stone-50/50 dark:bg-stone-900/50 cursor-pointer"
                     onClick={() => {
                        addBanner({
                            title: 'LO MEJOR DE \nLA CIUDAD.',
                            subtitle: 'Lo mejor de tu comunidad local en la puerta de tu casa.',
                            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920',
                            badge: 'PREMIUM',
                            isActive: true,
                            priority: 10,
                            link: ''
                        });
                        showToast('Banner Clásico Recuperado', 'success');
                     }}
                >
                    <div className="w-20 h-20 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TagIcon size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">Sin Promociones</h3>
                        <p className="text-sm font-medium text-stone-500 mt-2 max-w-sm mx-auto">Toca aquí para cargar el banner de bienvenida inmersivo y edítalo.</p>
                    </div>
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
                                    onClick={() => startEdit(banner)}
                                    className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-md hover:bg-white/40 transition-all border border-white/10"
                                >
                                    <Settings size={16} />
                                </button>
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
                                        className="w-12 bg-stone-50 dark:bg-stone-950 rounded border dark:border-stone-800 text-[10px] font-bold p-1 dark:text-white text-stone-900"
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
                        <TagIcon size={48} className="mx-auto text-stone-300 mb-4" />
                        <h4 className="text-stone-900 dark:text-white font-black text-xl">Sin Promociones Activas</h4>
                        <p className="text-stone-500 dark:text-stone-400">Haz clic en el botón "+" para crear tu primer banner promocional.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// Safe Date parser
const safeParseDate = (val: any): Date => {
  if (!val) return new Date();
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const AdminView: React.FC = () => {
  const { 
    orders, stores, assignDriver, drivers, resolveClaim, users, 
    seedDemoData, adminViewState, setAdminViewState, updateAnyUser, updateStore, deleteStore,
    config, updateConfig, user, completeTour, settleMerchantOrder, 
    settleDriverOrder, banners, addBanner, updateBanner, deleteBanner, setRole
  } = useApp();
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const isMobile = window.innerWidth < 1024;

  const adminTourSteps: TourStep[] = [
    {
        targetId: 'dashboard-tab',
        title: 'Métricas del Negocio',
        description: 'Visualiza las ventas totales, pedidos activos y el rendimiento general de la plataforma en tiempo real.',
        position: 'bottom'
    },
    {
        targetId: 'stores-tab',
        title: 'Gestión de Comercios',
        description: 'Administra todos los locales, revisa sus productos, ajusta comisiones y aprueba nuevos registros.',
        position: 'bottom'
    },
    {
        targetId: 'users-tab',
        title: 'Control de Usuarios',
        description: 'Gestiona los roles de Clientes, Merchants, Drivers y otros Administradores. Bloquea o desbloquea cuentas.',
        position: 'bottom'
    },
    {
        targetId: 'fleet-tab',
        title: 'Logística y Flota',
        description: 'Supervisa a los repartidores, asigna pedidos manualmente si es necesario y monitorea su ubicación.',
        position: 'bottom'
    },
    {
        targetId: 'disputes-tab',
        title: 'Resolución de Reclamos',
        description: 'Atiende disputas entre clientes, comercios y repartidores. Reembolsa o compensa según sea necesario.',
        position: 'bottom'
    },
    {
        targetId: 'settings-tab',
        title: 'Configuración Global',
        description: 'Ajusta comisiones, tarifas de envío y el modo de mantenimiento de la app.',
        position: 'bottom'
    }
  ];

  const showTour = !user.completedTours?.includes('admin-onboarding') && adminViewState === 'DASHBOARD';
  
  // Local settings state for the form
  const [localConfig, setLocalConfig] = useState(config);
  const [mpCredentials, setMpCredentials] = useState({ mpAccessToken: '', mpPublicKey: '' });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Fetch secrets only for admin
  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const secretsDoc = await getDoc(doc(db, 'config', 'global', 'private', 'mercadoPago'));
        if (secretsDoc.exists()) {
          setMpCredentials(secretsDoc.data() as any);
        }
      } catch (err) {
        console.warn('Could not fetch MP secrets (likely permission restricted or not set yet)');
      }
    };
    fetchSecrets();
  }, []);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  useEffect(() => {
    if (selectedStore) {
      const updated = stores.find(s => s.id === selectedStore.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedStore)) {
        setSelectedStore(updated);
      }
    }
  }, [stores, selectedStore]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // storing customerName for simplicity in MVP
  const [storeSearch, setStoreSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Close overlays when tab changes
  useEffect(() => {
    setSelectedStore(null);
    setSelectedUser(null);
  }, [adminViewState]);

  // --- ANALYTICS LOGIC ---
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return startOfDay(date);
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => isSameDay(safeParseDate(o.createdAt), date));
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
      .sort((a, b) => safeParseDate(b.createdAt).getTime() - safeParseDate(a.createdAt).getTime())
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

      if (!userSearch) return list.sort((a, b) => {
          const aPending = a.role === UserRole.DRIVER && !a.isApprovedDriver;
          const bPending = b.role === UserRole.DRIVER && !b.isApprovedDriver;
          if (aPending && !bPending) return -1;
          if (!aPending && bPending) return 1;
          return 0;
      });
      return list.filter(u => 
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
      ).sort((a, b) => {
          const aPending = a.role === UserRole.DRIVER && !a.isApprovedDriver;
          const bPending = b.role === UserRole.DRIVER && !b.isApprovedDriver;
          if (aPending && !bPending) return -1;
          if (!aPending && bPending) return 1;
          return 0;
      });
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
      {stores.length === 0 && (
         <div className="mx-4 lg:mx-8 mt-2 bg-brand-500 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 border-b-8 border-brand-700 animate-pulse transition-all">
            <div className="w-20 h-20 bg-white/20 rounded-[1.8rem] flex items-center justify-center text-white shrink-0">
                <Plus size={48} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-brand-950 uppercase tracking-tighter leading-none mb-2">Plataforma Vacía</h2>
                <p className="text-brand-900 font-bold text-sm tracking-tight opacity-80 mb-6 max-w-xl">No hay comercios configurados. ¿Deseas inicializar la plataforma con datos de demostración (Pizza, Sushi, Farmacia) para realizar pruebas inmediatas?</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Button 
                        className="bg-brand-950 text-white !rounded-2xl px-8 h-14 font-black tracking-widest text-xs shadow-2xl hover:scale-105 transition-transform"
                        onClick={() => seedDemoData()}
                    >
                        INICIALIZAR DEMO
                    </Button>
                </div>
            </div>
         </div>
      )}
      <div id="admin-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pt-2 lg:w-full lg:px-8">
        <KpiCard 
          title="Ingresos Globales" 
          value={formatCurrency(kpis.totalSales)}
          sub={`${kpis.completedOrders} pedidos finalizados`}
          icon={DollarSign}
          color="text-brand-950"
          onClick={() => setAdminViewState('ORDERS')}
        />
        <KpiCard 
          title="Comisiones" 
          value={formatCurrency(kpis.platformCommission)}
          sub="Ingreso Bruto Plataforma"
          icon={TrendingUp}
          color="text-brand-950"
          onClick={() => setAdminViewState('SETTLEMENTS')}
        />
        <KpiCard 
          title="Tiendas" 
          value={kpis.totalStores}
          sub={`${kpis.pendingStores} por aprobar`}
          icon={StoreIcon}
          color="text-amber-700"
          onClick={() => setAdminViewState('STORES')}
        />
        <KpiCard 
          title="Usuarios Activos" 
          value={kpis.onlineUsers}
          sub="En línea ahora"
          icon={Users}
          color="text-orange-700"
          onClick={() => setAdminViewState('USERS')}
        />
      </div>

      {/* Pending Drivers Section */}
      {users.some(u => u.isDriver && !u.isApprovedDriver) && (
          <div className="px-4 lg:px-8 mt-6">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <AlertTriangle className="text-red-600" size={20} />
                      <p className="text-sm font-bold text-red-900 dark:text-red-200">
                          {users.filter(u => u.isDriver && !u.isApprovedDriver).length} Solicitud(es) de repartidor pendiente(s)
                      </p>
                  </div>
                  <Button onClick={() => setAdminViewState('USERS')} className="bg-red-600 text-white hover:bg-red-700">
                      Ver Solicitudes
                  </Button>
              </div>
          </div>
      )}

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
          <div className="h-[300px] w-full min-h-[300px] max-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="99%" height="99%" minHeight={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a8a29e'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-xs"> No hay datos de ventas recientes </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2 dark:text-white">
            <PieChartIcon size={18} className="text-brand-800" /> Estado de Pedidos
          </h3>
          <div className="h-[250px] w-full flex flex-col items-center justify-center min-h-[250px] relative">
            {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="99%" height="99%" minHeight={250}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
            ) : (
                <div className="w-24 h-24 rounded-full border-4 border-stone-100 flex items-center justify-center text-[10px] text-stone-300 font-bold text-center p-2 mb-4"> Sin datos de pedidos </div>
            )}
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
                      Hace 2 min • {order.items.length} productos • <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
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
          <div className="flex-1 flex flex-col h-full animate-fade-in bg-stone-50 dark:bg-stone-900 overflow-y-auto">
              <div className="bg-white/80 dark:bg-stone-950/80 p-6 border-b border-stone-200/50 dark:border-white/5 flex gap-4 items-center sticky top-0 z-20 backdrop-blur-md">
                  <button 
                    onClick={() => setSelectedStore(null)} 
                    className="w-12 h-12 flex items-center justify-center bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-2xl transition-all border border-stone-200 dark:border-white/10"
                  >
                    <ArrowLeft size={20} className="dark:text-white" />
                  </button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">{selectedStore.name}</h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-tight">Gestión Profesional de Comercio</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StoreBadge isActive={selectedStore.isActive} />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                  <div className="max-w-6xl mx-auto space-y-8">
                      {/* Header Section */}
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="w-full md:w-1/3 aspect-square bg-stone-100 dark:bg-white/5 rounded-[3rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-white/10 shrink-0">
                              <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-6 w-full">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="bg-white dark:bg-black/20 p-6 rounded-[2rem] border border-stone-200/50 dark:border-white/[0.05] shadow-xl backdrop-blur-md">
                                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <TrendingUp size={12} className="text-brand-500" /> Rendimiento de Ventas
                                      </p>
                                      <p className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter">{formatCurrency(totalRevenue)}</p>
                                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-2">Venta Bruta Histórica</p>
                                  </div>
                                  <div className="bg-white dark:bg-black/20 p-6 rounded-[2rem] border border-stone-200/50 dark:border-white/[0.05] shadow-xl backdrop-blur-md">
                                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Activity size={12} className="text-brand-500" /> Volumen Operativo
                                      </p>
                                      <p className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter">{storeStats.length}</p>
                                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-2">Órdenes Procesadas</p>
                                  </div>
                              </div>

                              <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-stone-200/50 dark:border-white/[0.05] shadow-xl backdrop-blur-md space-y-6">
                                  <div className="flex items-center justify-between">
                                      <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Propietario y Detalles</h3>
                                      <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-white/5 flex items-center justify-center">
                                          <Users size={18} className="text-brand-500" />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Dueño Reclamado</p>
                                          <p className="text-lg font-black text-stone-950 dark:text-white">{users.find(u => u.uid === selectedStore.ownerId)?.name || 'Sin Asignar'}</p>
                                          <p className="text-xs text-stone-500 font-bold">{users.find(u => u.uid === selectedStore.ownerId)?.email || 'No disponible'}</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Fecha de Registro</p>
                                          <p className="text-sm font-black text-stone-950 dark:text-white">{selectedStore.createdAt ? format(safeParseDate(selectedStore.createdAt), "dd MMM yyyy, hh:mm a", { locale: es }) : 'Desconocida'}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-stone-200/50 dark:border-white/[0.05] shadow-xl backdrop-blur-md space-y-6">
                                  <div className="flex items-center justify-between">
                                      <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Configuración de Comisiones</h3>
                                      <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-white/5 flex items-center justify-center">
                                          <DollarSign size={18} className="text-brand-500" />
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                          <div className="flex-1">
                                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Comisión Personalizada</p>
                                              <div className="flex gap-2 group">
                                                  <input type="number" 
                                                    defaultValue={(selectedStore.commissionPct || config.platformCommissionPct) * 100}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) / 100;
                                                        updateStore(selectedStore.id, { commissionPct: val });
                                                    }}
                                                    className="flex-1 p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/5 rounded-2xl text-xl font-black focus:border-brand-500 outline-none transition-all"
                                                  />
                                                  <div className="bg-stone-100 dark:bg-stone-800 px-6 flex items-center rounded-2xl font-black text-stone-400 border border-stone-200 dark:border-white/5">%</div>
                                              </div>
                                          </div>
                                          <div className="sm:w-1/3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 self-end">
                                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-tight italic">
                                                * Sobrescribe la comisión global del {(config.platformCommissionPct * 100).toFixed(0)}% para este comercio específico.
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Store Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-xl space-y-6">
                              <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Control de Estado</h3>
                              
                              {selectedStore.pendingName && (
                                  <div className="p-6 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 mb-4 animate-pulse">
                                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Solicitud de Cambio de Nombre</p>
                                      <p className="text-2xl font-black text-stone-950 dark:text-white mb-6 italic tracking-tighter">"{selectedStore.pendingName}"</p>
                                      <div className="flex gap-3">
                                          <Button 
                                              variant="secondary" 
                                              className="flex-1 !bg-white dark:!bg-stone-800 !text-red-500 !rounded-2xl"
                                              onClick={() => {
                                                  updateStore(selectedStore.id, { pendingName: null });
                                                  showToast('Cambio de nombre rechazado', 'info');
                                              }}
                                          >
                                              RECHAZAR
                                          </Button>
                                          <Button 
                                              className="flex-1 !bg-brand-500 !text-brand-950 !rounded-2xl shadow-lg shadow-brand-500/20"
                                              onClick={() => {
                                                  updateStore(selectedStore.id, { name: selectedStore.pendingName, pendingName: null });
                                                  showToast('Nuevo nombre aprobado', 'success');
                                              }}
                                          >
                                              APROBAR
                                          </Button>
                                      </div>
                                  </div>
                              )}

                              <div className="flex flex-col gap-4">
                                  {selectedStore.isActive ? (
                                      <div className="flex flex-col items-center gap-3 w-full">
                                          <div className="w-full bg-green-500/10 text-green-500 p-4 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                              COMERCIO ACTIVO Y APROBADO
                                          </div>
                                          
                                          {(() => {
                                              const owner = users.find(u => u.uid === selectedStore.ownerId);
                                              const phone = selectedStore.phone || owner?.phone || '';
                                              const msg = `¡Hola ${owner?.name || 'aliado'}! 🎉 Te escribimos del equipo de administración. Nos complace informarte que tu comercio "${selectedStore.name}" ha sido verificado. ¡Estamos listos para recibir pedidos! 🚀`;
                                              const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                                              
                                              return (
                                                  <div className="grid grid-cols-2 gap-3 w-full">
                                                      {phone.length > 5 ? (
                                                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full flex justify-center p-4 bg-[#25D366] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-[#128C7E] transition-all text-center items-center shadow-lg shadow-green-500/20">
                                                             Aviso WhatsApp
                                                          </a>
                                                      ) : (
                                                          <div className="flex justify-center p-4 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center items-center">
                                                             Sin Celular
                                                          </div>
                                                      )}
                                                      <Button onClick={() => setRole(UserRole.CLIENT)} className="!rounded-2xl !bg-stone-900 dark:!bg-white !text-white dark:!text-stone-900 font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl h-auto">
                                                          Ver Tienda
                                                      </Button>
                                                  </div>
                                              );
                                          })()}

                                          <Button 
                                            variant="outline" 
                                            fullWidth 
                                            className="!text-red-500 !border-red-500/30 hover:!bg-red-500 hover:!text-white transition-all !rounded-2xl uppercase tracking-widest font-black text-xs mt-3 h-14"
                                            onClick={async () => {
                                                try {
                                                    setSelectedStore(prev => prev ? { ...prev, isActive: false } : null);
                                                    await updateStore(selectedStore.id, { isActive: false });
                                                    showToast('Comercio Suspendido Correctamente', 'info');
                                                } catch (err) {
                                                    setSelectedStore(prev => prev ? { ...prev, isActive: true } : null);
                                                    showToast('Error al suspender', 'error');
                                                }
                                            }}
                                          >
                                              Revocar Aprobación (Suspender)
                                          </Button>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col gap-3 w-full">
                                          <div className="w-full bg-amber-500/10 text-amber-600 dark:text-amber-400 p-4 rounded-xl font-bold text-center border border-amber-500/20">
                                              PENDIENTE DE APROBACIÓN
                                          </div>
                                          <Button 
                                            fullWidth 
                                            size="lg"
                                            className="!bg-brand-500 !text-brand-950 !rounded-2xl shadow-xl shadow-brand-500/20 py-6 text-sm font-black uppercase tracking-widest"
                                            onClick={async () => {
                                                try {
                                                    setSelectedStore(prev => prev ? { ...prev, isActive: true } : null);
                                                    await updateStore(selectedStore.id, { isActive: true });
                                                    showToast('Comercio Aprobado Exitosamente', 'success');
                                                } catch (err) {
                                                    setSelectedStore(prev => prev ? { ...prev, isActive: false } : null);
                                                    showToast('Error al aprobar', 'error');
                                                }
                                            }}
                                          >
                                              🚀 APROBAR COMERCIO
                                          </Button>
                                      </div>
                                  )}
                              </div>

                              <div className="pt-6 border-t border-stone-100 dark:border-white/5">
                                  <Button 
                                    variant="outline" 
                                    fullWidth 
                                    className="!text-red-500 !border-red-500/30 hover:!bg-red-500 hover:!text-white transition-all !rounded-2xl uppercase tracking-widest font-black text-xs h-14"
                                    onClick={() => {
                                        deleteStore(selectedStore.id);
                                        setSelectedStore(null);
                                        showToast('Comercio eliminado permanentemente', 'info');
                                    }}
                                  >
                                      ELIMINAR DEFINITIVAMENTE
                                  </Button>
                              </div>
                          </div>

                          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-xl">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Catálogo de Productos</h3>
                                  <span className="text-[10px] font-black text-stone-400 bg-stone-50 dark:bg-white/5 px-2 py-1 rounded">Total: {selectedStore.products.length}</span>
                              </div>
                              <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
                                  {selectedStore.products.map(p => (
                                      <div key={p.id} className="p-4 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-100 dark:border-white/5 flex justify-between items-center group/prod hover:border-brand-500/30 transition-all">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-black text-stone-950 dark:text-stone-100 tracking-tight leading-none mb-1">{p.name}</span>
                                            <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{p.category}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-brand-600 italic tracking-tighter">{formatCurrency(p.price)}</span>
                                            <button 
                                              onClick={() => {
                                                const updatedProducts = selectedStore.products.filter(item => item.id !== p.id);
                                                updateStore(selectedStore.id, { products: updatedProducts });
                                                setSelectedStore({ ...selectedStore, products: updatedProducts });
                                                showToast('Producto eliminado', 'info');
                                              }}
                                              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                      </div>
                                  ))}
                                  {selectedStore.products.length === 0 && (
                                      <div className="py-12 text-center opacity-30">
                                          <TagIcon size={48} className="mx-auto mb-4" />
                                          <p className="text-xs font-black uppercase tracking-widest">Sin productos activos</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )
  };

  const renderStoresTab = () => {
    const storesWithPending = stores.filter(s => s.pendingName);
    
    return (
    <div className="space-y-6 px-4 pt-4 animate-fade-in pb-24 lg:w-full lg:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">Gestión de Comercios</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Supervisión de la Red de {stores.length} Tiendas</p>
          </div>
          
          <div className="bg-white p-1.5 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-2 w-full md:w-96 dark:bg-stone-900 dark:border-white/5">
             <Search size={18} className="text-stone-400 ml-3" />
             <input 
                placeholder="Buscar por nombre o ID..." 
                className="flex-1 outline-none text-sm p-2.5 bg-transparent dark:text-white font-medium" 
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
             />
          </div>
      </div>

      {storesWithPending.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2rem] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-amber-950 shadow-lg shadow-amber-500/20">
                      <AlertCircle size={24} />
                  </div>
                  <div>
                      <p className="text-amber-600 dark:text-amber-400 font-black text-sm tracking-tight leading-none">Acciones Pendientes</p>
                      <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-2">{storesWithPending.length} solicitudes de cambio de nombre</p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStores.map(store => (
            <div 
                key={store.id} 
                onClick={() => setSelectedStore(store)}
                className="group bg-white dark:bg-stone-900/50 p-6 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-stone-100 dark:border-white/5 flex flex-col gap-5 hover:border-brand-500/30 transition-all cursor-pointer relative overflow-hidden active:scale-95"
            >
                <div className="absolute top-4 right-4 flex gap-2">
                    {store.pendingName && (
                        <div className="flex h-3 w-3 relative mt-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm border border-white dark:border-stone-800"></span>
                        </div>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteStore(store.id);
                            showToast('Comercio eliminado', 'info');
                        }}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                      <LazyImage src={store.image} alt={store.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xl text-stone-900 dark:text-white tracking-tighter truncate leading-none mb-2">{store.name}</h4>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{store.category} • {store.isActive ? 'Activo' : 'Suspendido'}</p>
                   </div>
               </div>

               <div className="w-full h-px bg-stone-50 dark:bg-white/5" />

               <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                     <StoreBadge isActive={store.isActive} />
                     {store.pendingName && <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">Solicitud</span>}
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest">#{store.id.slice(0,6)}</span>
                      <ChevronRight size={16} className="text-stone-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                  </div>
               </div>
            </div>
        ))}
      </div>
    </div>
    );
  };

  const renderUserDetail = () => {
      if(!selectedUser) return null;
      const userProfile = users.find(u => u.name === selectedUser || u.uid === selectedUser);
      const userOrders = orders.filter(o => o.customerName === selectedUser || o.uid === selectedUser);
      const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);

      const userInitials = (userProfile?.name || selectedUser).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      return (
          <div className="flex-1 flex flex-col h-full animate-fade-in bg-stone-50 dark:bg-stone-900 overflow-y-auto">
               <div className="bg-white/80 dark:bg-stone-950/80 p-6 border-b border-stone-200/50 dark:border-white/5 flex gap-4 items-center sticky top-0 z-20 backdrop-blur-md">
                  <button 
                    onClick={() => setSelectedUser(null)} 
                    className="w-12 h-12 flex items-center justify-center bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-2xl transition-all border border-stone-200 dark:border-white/10"
                  >
                    <ArrowLeft size={20} className="dark:text-white" />
                  </button>
                  <div className="flex-1 text-left">
                    <h2 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">Perfil Operativo</h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-tight">Gestión Profesional de Entidad</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-stone-950 dark:bg-white text-white dark:text-stone-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">#{userProfile?.uid?.slice(-6).toUpperCase() || 'ID_DEMO'}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                  <div className="max-w-4xl mx-auto space-y-8">
                      {/* Identity Card */}
                      <div className="bg-white dark:bg-black/20 p-10 rounded-[3.5rem] border border-stone-200/50 dark:border-white/[0.05] shadow-2xl backdrop-blur-md relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-500/20 transition-all duration-1000" />
                          
                          <div className="relative z-10 flex flex-col items-center text-center">
                              <div className="w-32 h-32 bg-stone-950 dark:bg-white rounded-[2.5rem] mb-6 flex items-center justify-center text-4xl font-black text-brand-500 dark:text-brand-950 shadow-2xl border-4 border-white/10 dark:border-black/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                  {userInitials}
                              </div>
                              <h2 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter italic uppercase">{userProfile?.name || selectedUser}</h2>
                              <div className="flex items-center justify-center gap-2 mt-3 p-2 px-4 bg-stone-100/50 dark:bg-white/5 rounded-full border border-stone-100 dark:border-white/5">
                                  <Mail size={14} className="text-stone-400" /> 
                                  <span className="text-sm font-bold text-stone-500 dark:text-stone-400">{userProfile?.email || 'usuario@demo.com'}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-12 mt-12 w-full max-w-md border-t border-stone-100 dark:border-white/5 pt-8">
                                  <div className="text-center group/kpi">
                                      <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] mb-2 group-hover/kpi:text-brand-500 transition-colors">Volumen</p>
                                      <p className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter italic">{userOrders.length}</p>
                                      <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mt-1">Órdenes Totales</p>
                                  </div>
                                  <div className="text-center group/kpi">
                                      <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] mb-2 group-hover/kpi:text-brand-500 transition-colors">LTV (Ventas)</p>
                                      <p className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter italic">{formatCurrency(totalSpent)}</p>
                                      <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mt-1">Inversión Bruta</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Role Management */}
                          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-xl space-y-8">
                              <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Privilegios & Roles</h3>
                                  <Shield size={20} className="text-stone-400" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.values(UserRole).map(role => (
                                    <button
                                      key={role}
                                      onClick={() => {
                                        if (userProfile) {
                                            updateAnyUser(userProfile.uid, { role });
                                            showToast(`Rol actualizado a ${roleLabels[role]}`, 'success');
                                        }
                                      }}
                                      className={`px-4 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${userProfile?.role === role ? 'bg-stone-950 text-white border-stone-950 dark:bg-white dark:text-stone-950 dark:border-white shadow-xl scale-105 z-10' : 'bg-stone-50 dark:bg-black/20 text-stone-400 border-transparent hover:border-brand-500/30'}`}
                                    >
                                      {roleLabels[role]}
                                    </button>
                                  ))}
                              </div>

                              {(userProfile?.role === UserRole.DRIVER || userProfile?.isDriver) && (
                                <div className="pt-8 border-t border-stone-100 dark:border-white/5">
                                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-6">Credenciales de Flota</p>
                                  <div className="space-y-4">
                                     <div className="flex justify-between items-center bg-stone-950 dark:bg-white p-5 rounded-[2rem] shadow-2xl">
                                        <div className="text-left">
                                           <p className="text-[10px] font-black text-white/50 dark:text-black/50 uppercase tracking-widest mb-1">Estatus Profesional</p>
                                           <p className="text-sm font-black text-white dark:text-stone-950 italic tracking-tight">{userProfile.isApprovedDriver ? 'APROBADO' : 'PENDIENTE'}</p>
                                        </div>
                                        <Button 
                                          size="sm"
                                          className={`!rounded-2xl !px-6 !h-12 !font-black !tracking-widest !text-[10px] ${userProfile.isApprovedDriver ? '!bg-transparent !text-brand-500 !border-brand-500/50 !border-2' : '!bg-brand-500 !text-brand-950'}`}
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            // Debug log visible para el desarrollador
                                            console.log('--- ACCIÓN DE ADMINISTRACIÓN ---');
                                            console.log('Usuario:', userProfile.uid || userProfile.id);
                                            console.log('Estado actual:', userProfile.isApprovedDriver);

                                            try {
                                              const targetId = userProfile.uid || userProfile.id;
                                              const nextState = !userProfile.isApprovedDriver;
                                              const actionText = nextState ? 'Aprobando' : 'Revocando';
                                              
                                              showToast(`${actionText} acceso del repartidor...`, 'info');
                                              
                                              // Usamos el ID del documento explícitamente
                                              await updateAnyUser(targetId, { isApprovedDriver: nextState });
                                              
                                              showToast(nextState ? 'Repartidor aprobado exitosamente' : 'Acceso de repartidor revocado', 'success');
                                            } catch (err) {
                                              console.error('Error crítico en cambio de estatus:', err);
                                              showToast('Error al procesar la solicitud. Verifica permisos.', 'error');
                                            }
                                          }}
                                        >
                                          {userProfile.isApprovedDriver ? 'REVOCAR' : 'APROBAR'}
                                        </Button>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-stone-50 dark:bg-black/20 rounded-[1.5rem] border border-stone-100 dark:border-white/5">
                                           <p className="text-[8px] uppercase font-black text-stone-400 tracking-widest mb-2">Vehículo Operativo</p>
                                           <p className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">{userProfile.vehicleType || 'S/E'}</p>
                                        </div>
                                        <div className="p-5 bg-stone-50 dark:bg-black/20 rounded-[1.5rem] border border-stone-100 dark:border-white/5">
                                           <p className="text-[8px] uppercase font-black text-stone-400 tracking-widest mb-2">Contacto Directo</p>
                                           <p className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">{userProfile.phone || 'S/E'}</p>
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-2 gap-4 mt-4">
                                        {userProfile.driverIneUrl && (
                                            <div className="group cursor-pointer space-y-2" onClick={() => window.open(userProfile.driverIneUrl, '_blank')}>
                                                <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Documento ID (INE)</p>
                                                <div className="relative h-32 overflow-hidden rounded-[1.5rem] border-2 border-stone-100 dark:border-white/5 group-hover:border-brand-500 transition-all">
                                                    <img src={userProfile.driverIneUrl} alt="INE" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-brand-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}
                                        {userProfile.driverSelfieUrl && (
                                            <div className="group cursor-pointer space-y-2" onClick={() => window.open(userProfile.driverSelfieUrl, '_blank')}>
                                                <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Verificación Facial</p>
                                                <div className="relative h-32 overflow-hidden rounded-[1.5rem] border-2 border-stone-100 dark:border-white/5 group-hover:border-brand-500 transition-all">
                                                    <img src={userProfile.driverSelfieUrl} alt="Selfie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-brand-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Historical Activity */}
                          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-white/10 shadow-xl flex flex-col">
                              <div className="flex justify-between items-center mb-8 shrink-0">
                                  <h3 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tighter italic">Log de Actividad</h3>
                                  <Activity size={20} className="text-stone-400" />
                              </div>
                              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                                  {userOrders.map(order => (
                                      <div key={order.id} className="p-5 bg-stone-50 dark:bg-black/20 rounded-3xl border border-stone-100 dark:border-white/5 flex justify-between items-center hover:border-brand-500/30 transition-all group/order">
                                          <div className="text-left">
                                              <p className="font-black text-sm text-stone-900 dark:text-white italic tracking-tighter leading-none mb-1">{order.storeName}</p>
                                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{format(safeParseDate(order.createdAt), 'dd MMM, yyyy')} • {formatCurrency(order.total)}</p>
                                          </div>
                                          <Badge status={order.status} />
                                      </div>
                                  ))}
                                  {userOrders.length === 0 && (
                                      <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                                          <Activity size={48} className="mb-4" />
                                          <p className="text-xs font-black uppercase tracking-widest text-center">No hay registros de transacciones</p>
                                      </div>
                                  )}
                              </div>
                          </div>
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
                className="flex-1 outline-none text-sm dark:text-white text-stone-900" 
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
                                <span className="ml-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm">Pendiente</span>
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
        <div className="space-y-6 px-4 pt-4 animate-fade-in pb-24 lg:w-full lg:px-12">
            {disputedOrders.length === 0 ? (
                <div className="text-center py-24 bg-white/40 dark:bg-black/10 rounded-[3rem] border border-stone-200/50 dark:border-white/[0.05] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-stone-300">
                      <Shield size={40} strokeWidth={1.5} />
                    </div>
                    <p className="text-stone-950 dark:text-white font-black text-xl uppercase tracking-tighter">Sin incidencias activas</p>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">Todo el ecosistema funciona correctamente</p>
                </div>
            ) : (
                <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                {disputedOrders.map(order => (
                    <div key={order.id} className="bg-orange-500/10 border border-orange-500/20 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm h-full flex flex-col justify-between group hover:border-orange-500/50 transition-all duration-500">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-orange-950 shadow-lg shadow-orange-500/20">
                                <AlertCircle size={24} />
                              </div>
                              <div>
                                <p className="font-black text-stone-950 dark:text-white uppercase tracking-tighter italic text-lg leading-tight">Reclamo #{order.id.slice(-6).toUpperCase()}</p>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">{order.storeName} • {order.customerName}</p>
                              </div>
                            </div>
                            <span className="bg-orange-500 text-orange-950 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.15em] shadow-sm animate-pulse">En Revisión</span>
                          </div>
                          <div className="bg-white/60 dark:bg-stone-900/60 p-5 rounded-2xl border border-orange-500/10 mb-8 backdrop-blur-md shadow-inner">
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 leading-relaxed italic">"{order.claimReason}"</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" fullWidth size="lg" className="!bg-white !text-stone-950 !rounded-2xl border-stone-200 dark:!bg-stone-800 dark:!text-stone-400" onClick={() => handleResolveDispute(order.id, 'REJECTED')}>
                                RECHAZAR
                            </Button>
                            <Button fullWidth size="lg" className="!bg-brand-500 !text-brand-950 !rounded-2xl shadow-xl shadow-brand-500/20" onClick={() => handleResolveDispute(order.id, 'RESOLVED')}>
                                REEMBOLSAR
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
    <div className="h-full bg-stone-50 flex flex-col dark:bg-stone-900 overflow-hidden relative">
        <AnimatePresence>
            {selectedStore && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-50 bg-stone-50 dark:bg-stone-900 overflow-y-auto"
                >
                    {renderStoreDetail()}
                </motion.div>
            )}
            {selectedUser && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-50 bg-stone-50 dark:bg-stone-900 overflow-y-auto"
                >
                    {renderUserDetail()}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="bg-stone-950 text-white p-6 pt-safe-pt shadow-2xl z-10 sticky top-0 border-b border-white/5 shrink-0">
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
                                
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
                                        >
                                            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-brand-950 text-xs font-black">
                                                {(user.name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-left hidden md:block">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none">Cuenta Activa</p>
                                                <p className="text-xs font-black text-white leading-tight">Administrador</p>
                                            </div>
                                            <ChevronDown size={14} className={`text-stone-500 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isRoleDropdownOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 transition-all overflow-hidden z-50">
                                                <div className="p-4 border-b border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-stone-800/50">
                                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Cambiar de Vista</p>
                                                    <p className="text-xs font-black text-stone-900 dark:text-white truncate">{user.email}</p>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    <button onClick={() => { setRole(UserRole.CLIENT); setIsRoleDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                                                        <Search size={14} /> Vista Cliente
                                                    </button>
                                                    <button onClick={() => { setRole(UserRole.MERCHANT); setIsRoleDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                                                        <StoreIcon size={14} /> Vista Comercio
                                                    </button>
                                                    <button onClick={() => { setRole(UserRole.DRIVER); setIsRoleDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                                                        <Truck size={14} /> Vista Repartidor
                                                    </button>
                                                    <div className="h-px bg-stone-100 dark:bg-white/5 my-1" />
                                                    <button onClick={() => { signOut(); setIsRoleDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                        <LogOut size={14} /> Cerrar Sesión
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 overflow-x-auto lg:hidden no-scrollbar shadow-2xl mt-4">
                            {[
                                { id: 'DASHBOARD', label: 'Tablero', icon: <LayoutDashboard size={18} /> },
                                { id: 'ORDERS', label: 'Pedidos', icon: <ClipboardList size={18} /> },
                                { id: 'STORES', label: 'Comercios', icon: <StoreIcon size={18} /> },
                                { id: 'FLEET', label: 'Flota', icon: <Bike size={18} /> },
                                { id: 'MORE', label: 'Más', icon: <MoreHorizontal size={18} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    id={`${tab.id.toLowerCase()}-tab`}
                                    onClick={() => {
                                        if (tab.id === 'MORE') {
                                            setIsMoreMenuOpen(!isMoreMenuOpen);
                                        } else {
                                            setAdminViewState(tab.id as any);
                                            setIsMoreMenuOpen(false);
                                        }
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative ${adminViewState === tab.id ? 'bg-brand-500 text-brand-950 shadow-lg shadow-brand-500/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className={`${adminViewState === tab.id ? 'scale-110' : 'scale-100'} transition-transform`}>
                                        {tab.icon}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {isMoreMenuOpen && (
                            <div className="fixed inset-0 z-50 flex items-end justify-center">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)}></div>
                                <div className="relative w-full max-w-lg bg-stone-900 border-t border-white/10 p-6 rounded-t-3xl shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Más Opciones</h3>
                                        <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-white/10 rounded-full text-white">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'USERS', label: 'Usuarios', icon: <Users size={20} /> },
                                            { id: 'BANNERS', label: 'Promos', icon: <Megaphone size={20} /> },
                                            { id: 'SETTLEMENTS', label: 'Pagos', icon: <Banknote size={20} /> },
                                            { id: 'DISPUTES', label: 'Reclamos', icon: <AlertTriangle size={20} /> },
                                            { id: 'SETTINGS', label: 'Ajustes', icon: <Settings size={20} /> }
                                        ].map(item => (
                                            <button key={item.id} onClick={() => { setAdminViewState(item.id as any); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl text-white gap-2 hover:bg-brand-500 hover:text-brand-950 transition-colors">
                                                {item.icon}
                                                <span className="text-xs font-bold uppercase">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <div className="lg:w-full lg:px-8">
                        {adminViewState === 'DASHBOARD' && renderDashboardTab()}
                        {adminViewState === 'FLEET' && renderDispatchTab()}
                        {adminViewState === 'ORDERS' && <OrdersTab orders={orders} />}
                        {adminViewState === 'BANNERS' && <BannersManagementTab banners={banners} addBanner={addBanner} updateBanner={updateBanner} deleteBanner={deleteBanner} />}
                        {adminViewState === 'SETTLEMENTS' && <SettlementsTab orders={orders} stores={stores} settleMerchantOrder={settleMerchantOrder} settleDriverOrder={settleDriverOrder} />}
                        {adminViewState === 'STORES' && renderStoresTab()}
                        {adminViewState === 'USERS' && renderUsersTab()}
                        {adminViewState === 'DISPUTES' && renderDisputesTab()}
                        {adminViewState === 'SETTINGS' && (
                            <div className="p-4 lg:p-12 space-y-12 animate-fade-in max-w-7xl mx-auto">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">Ajustes del Sistema</h2>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] leading-tight">Configuración general de la plataforma</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {/* SECCIÓN FINANCIERA */}
                                    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-white/10 shadow-2xl space-y-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        
                                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-stone-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-500 shadow-inner">
                                                    <DollarSign size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">Ganancias y Comisiones</h3>
                                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Cómo se reparte el dinero</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5 group/input hover:border-brand-500/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">Lo que cobra la aplicación</div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Porcentaje de cada venta (0.15 = 15%)</p>
                                                </div>
                                                <div className="relative group-hover/input:scale-105 transition-transform">
                                                    <input type="number" 
                                                        step="0.01"
                                                        value={localConfig.platformCommissionPct} 
                                                        onChange={(e) => setLocalConfig({...localConfig, platformCommissionPct: Number(e.target.value)})}
                                                        className="w-24 p-4 bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-white/10 rounded-2xl text-center text-xl font-black text-brand-600 outline-none focus:border-brand-500 transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5 group/input hover:border-brand-500/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">Ganancia del Repartidor</div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Lo que recibe el chofer (0.80 = 80%)</p>
                                                </div>
                                                <div className="relative group-hover/input:scale-105 transition-transform">
                                                    <input type="number" 
                                                        step="0.01"
                                                        value={localConfig.driverCommissionPct} 
                                                        onChange={(e) => setLocalConfig({...localConfig, driverCommissionPct: Number(e.target.value)})}
                                                        className="w-24 p-4 bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-white/10 rounded-2xl text-center text-xl font-black text-brand-600 outline-none focus:border-brand-500 transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-brand-500/5 dark:bg-brand-500/10 p-6 rounded-[2rem] border border-brand-500/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1 italic">Entorno de Pruebas</p>
                                                    <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 max-w-[200px] leading-tight">Configura o remueve instantáneamente un comercio demo para testeo.</p>
                                                </div>
                                                {stores.some(s => s.id?.includes('demo') || s.name?.toLowerCase().includes('demo')) ? (
                                                    <Button 
                                                        size="sm" 
                                                        className="!bg-red-500 !text-white !rounded-xl font-black uppercase tracking-widest text-[9px] !h-12 !px-6 shadow-lg shadow-red-500/20"
                                                        onClick={async () => {
                                                            const demoStores = stores.filter(s => s.id?.includes('demo') || s.name?.toLowerCase().includes('demo'));
                                                            try {
                                                                for (const ds of demoStores) {
                                                                    await deleteDoc(doc(db, 'stores', ds.id));
                                                                }
                                                                showToast('Entorno demo deshabilitado y purgado', 'success');
                                                            } catch(error) {
                                                                console.error(error);
                                                                showToast('Error al deshabilitar', 'error');
                                                            }
                                                        }}
                                                    >
                                                        DESHABILITAR DEMO
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary"
                                                        className="!bg-brand-500 !text-brand-950 !rounded-xl font-black uppercase tracking-widest text-[9px] !h-12 !px-6 shadow-lg shadow-brand-500/20"
                                                        onClick={() => setupDemoStore(showToast, user.email)}
                                                    >
                                                        HABILITAR DEMO
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* MOTOR DE TARIFAS - ZONIFICACIÓN */}
                                    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-white/10 shadow-2xl space-y-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        
                                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-stone-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                                    <MapPin size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">Área de Entrega y Envíos</h3>
                                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Control de distancias y costos</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Máxima Distancia', sub: 'Cobertura en KM', key: 'localRadiusKm', icon: <Compass size={12} /> },
                                                { label: 'Km gratuitos', sub: 'Envío Gratis hasta', key: 'baseDistanceKm', icon: <Zap size={12} /> },
                                                { label: 'Costo de Envío', sub: 'Tarifa básica $', key: 'platformFeeLocal', icon: <DollarSign size={12} /> },
                                                { label: 'Recargo Lejos', sub: 'Extra por distancia', key: 'platformFeeForaneo', icon: <Plus size={12} /> }
                                            ].map((param) => (
                                                <div key={param.key} className="bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5 group/p transition-all hover:bg-white dark:hover:bg-white/5">
                                                    <div className="flex items-center gap-2 mb-3 text-stone-400">
                                                        {param.icon}
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{param.label}</span>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <input type="number" 
                                                            value={(localConfig.deliveryRates as any)[param.key]} 
                                                            onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, [param.key]: Number(e.target.value)}})} 
                                                            className="bg-transparent text-2xl font-black text-stone-950 dark:text-white outline-none w-full tracking-tighter"
                                                        />
                                                        <span className="text-[9px] font-black text-stone-400 uppercase">{param.sub}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TARIFARIOS DINÁMICOS */}
                                    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-white/10 shadow-2xl space-y-8 relative overflow-hidden group col-span-1 xl:col-span-2">
                                        <div className="flex flex-col lg:flex-row gap-8 relative">
                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center gap-3 p-4 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                                                    <Sun size={20} className="text-brand-500" />
                                                    <h4 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-widest italic">Horarios de Día (08:00 - 22:00)</h4>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Base Local', key: 'localBaseDay' },
                                                        { label: 'Base Foráneo', key: 'foraneoBaseDay' },
                                                        { label: 'Extra 100m', key: 'localExtraPer100mDay' },
                                                        { label: 'Extra KM', key: 'foraneoExtraPerKmDay' }
                                                    ].map(p => (
                                                        <div key={p.key} className="bg-stone-50 dark:bg-black/20 p-4 rounded-2xl border border-stone-100 dark:border-white/5">
                                                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">{p.label}</p>
                                                            <input type="number" value={(localConfig.deliveryRates as any)[p.key]} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, [p.key]: Number(e.target.value)}})} className="bg-transparent text-xl font-black text-stone-900 dark:text-white outline-none w-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                                    <Moon size={20} className="text-indigo-500" />
                                                    <h4 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-widest italic">Horarios de Noche (22:00 - 08:00)</h4>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Base Local', key: 'localBaseNight' },
                                                        { label: 'Base Foráneo', key: 'foraneoBaseNight' },
                                                        { label: 'Extra 100m', key: 'localExtraPer100mNight' },
                                                        { label: 'Extra KM', key: 'foraneoExtraPerKmNight' }
                                                    ].map(p => (
                                                        <div key={p.key} className="bg-stone-50 dark:bg-black/20 p-4 rounded-2xl border border-stone-100 dark:border-white/5">
                                                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">{p.label}</p>
                                                            <input type="number" value={(localConfig.deliveryRates as any)[p.key]} onChange={(e) => setLocalConfig({...localConfig, deliveryRates: {...localConfig.deliveryRates!, [p.key]: Number(e.target.value)}})} className="bg-transparent text-xl font-black text-stone-900 dark:text-white outline-none w-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CATEGORÍAS */}
                                    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-white/10 shadow-2xl space-y-6">
                                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-4">
                                            <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic flex items-center gap-2"><TagIcon size={20} className="text-brand-500" /> Categorías Disponibles</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[100px] bg-stone-50 dark:bg-black/20 p-4 rounded-3xl border border-stone-100 dark:border-white/5">
                                            {localConfig.categories.map((cat, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-stone-800 px-4 py-2 rounded-xl border border-stone-200 dark:border-white/5 shadow-sm group">
                                                    <span className="text-[10px] font-black text-stone-900 dark:text-white italic">{cat}</span>
                                                    <button 
                                                        onClick={() => setLocalConfig({...localConfig, categories: localConfig.categories.filter((_, i) => i !== idx)})}
                                                        className="text-stone-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                id="new-category-input"
                                                placeholder="Nueva categoría estratégica..."
                                                className="flex-1 p-5 bg-stone-100 dark:bg-stone-950 border-2 border-stone-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-brand-500 transition-all text-stone-900 dark:text-white"
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
                                            <button 
                                                onClick={() => {
                                                    const input = document.getElementById('new-category-input') as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val) { setLocalConfig({...localConfig, categories: [...localConfig.categories, val]}); input.value = ''; }
                                                }}
                                                className="w-16 h-16 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-2xl flex items-center justify-center font-black hover:rotate-90 transition-all"
                                            >
                                                <Plus size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* SEGURIDAD Y SOPORTE */}
                                    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-200 dark:border-white/10 shadow-2xl space-y-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-950/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        
                                        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-stone-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                                    <Shield size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">Ayuda y Mantenimiento</h3>
                                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Gestión de soporte al usuario</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5 group/input hover:border-brand-500/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">Email de Soporte</div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Canal Directo de Ayuda</p>
                                                </div>
                                                <input type="email" 
                                                    value={localConfig.supportEmail} 
                                                    onChange={(e) => setLocalConfig({...localConfig, supportEmail: e.target.value})}
                                                    className="w-48 p-4 bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-white/10 rounded-2xl text-center text-xs font-black text-brand-600 outline-none focus:border-brand-500 transition-all" 
                                                />
                                            </div>

                                            <div className="flex justify-between items-center bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5 group/input hover:border-brand-500/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight">WhatsApp de Soporte</div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Atención Inmediata</p>
                                                </div>
                                                <input type="text" 
                                                    value={localConfig.supportPhone || ''} 
                                                    onChange={(e) => setLocalConfig({...localConfig, supportPhone: e.target.value})}
                                                    placeholder="+521..."
                                                    className="w-48 p-4 bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-white/10 rounded-2xl text-center text-xs font-black text-green-600 outline-none focus:border-green-500 transition-all font-mono" 
                                                />
                                            </div>

                                            <div className="flex justify-between items-center bg-stone-50 dark:bg-black/20 p-5 rounded-3xl border border-stone-100 dark:border-white/5">
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-stone-800 dark:text-stone-100 italic tracking-tight flex items-center gap-2 group/tooltip relative cursor-help">
                                                        Modo de Pago 
                                                        <HelpCircle size={14} className="text-stone-400" />
                                                        <div className="absolute bottom-full left-0 mb-4 w-72 bg-white dark:bg-stone-800 text-stone-950 dark:text-white text-[10px] p-6 rounded-3xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl border border-black/5 dark:border-white/10 translate-y-2 group-hover/tooltip:translate-y-0 backdrop-blur-xl">
                                                            <div className="font-black mb-1 border-b border-black/5 dark:border-white/5 pb-1 uppercase tracking-widest text-brand-600 italic">Centralizado:</div>
                                                            <div className="mb-3 font-medium opacity-80 leading-relaxed">Liquidación automática vía APP (Tarjeta/MP).</div>
                                                            <div className="font-black mb-1 border-b border-black/5 dark:border-white/5 pb-1 uppercase tracking-widest text-blue-500 italic">Descentralizado:</div>
                                                            <div className="font-medium opacity-80 leading-relaxed">Pago directo al comercio (Efectivo/Transferencia).</div>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Arquitectura Financiera</p>
                                                </div>
                                                <div className="flex bg-stone-950 dark:bg-black p-1 rounded-2xl gap-1">
                                                    {['CENTRALIZED', 'DECENTRALIZED'].map(mode => (
                                                        <button 
                                                            key={mode}
                                                            onClick={() => setLocalConfig({...localConfig, paymentMode: mode as any})}
                                                            className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${localConfig.paymentMode === mode ? 'bg-white text-stone-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-stone-600 hover:text-white'}`}
                                                        >
                                                            {mode === 'CENTRALIZED' ? 'Auto' : 'Cash'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center bg-red-950/10 p-6 rounded-[2rem] border border-red-500/10">
                                                <div>
                                                    <p className="text-sm font-black text-red-600 dark:text-red-400 italic tracking-tight">Modo Mantenimiento</p>
                                                    <p className="text-[10px] text-red-700/50 dark:text-red-400/30 font-black uppercase tracking-widest mt-1 italic">Bloqueo de Tráfico Global</p>
                                                </div>
                                                <button 
                                                    onClick={() => setLocalConfig({...localConfig, maintenanceMode: !localConfig.maintenanceMode})}
                                                    className={`w-16 h-8 rounded-full relative transition-all shadow-inner ${localConfig.maintenanceMode ? 'bg-red-500' : 'bg-stone-200 dark:bg-white/5'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white dark:bg-stone-950 rounded-full transition-all shadow-md ${localConfig.maintenanceMode ? 'left-9' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PASARELA DE PAGOS */}
                                    <div className="bg-stone-950 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-8 col-span-1 xl:col-span-2 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        
                                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-500 shadow-inner">
                                                    <Zap size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">Pasarela de Pagos (Mercado Pago)</h3>
                                                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mt-1">Conexión de Alta Seguridad</p>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="!bg-brand-500 !text-brand-950 !rounded-xl font-black uppercase tracking-widest text-[9px] !h-12 !px-8"
                                                onClick={async () => {
                                                    try {
                                                        await updateConfig(localConfig);
                                                        await setDoc(doc(db, 'config', 'global', 'private', 'mercadoPago'), {
                                                            mpAccessToken: mpCredentials.mpAccessToken,
                                                            mpPublicKey: mpCredentials.mpPublicKey,
                                                            updatedAt: serverTimestamp()
                                                        }, { merge: true });
                                                        showToast('Pasarela sincronizada', 'success');
                                                    } catch (err) { showToast('Error en sincronización', 'error'); }
                                                }}
                                            >
                                                ACTUALIZAR PASARELA
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-stone-500 uppercase tracking-[0.2em] ml-2">Access Token (Private)</label>
                                                <input type="password" 
                                                    value={mpCredentials.mpAccessToken || ''} 
                                                    onChange={(e) => setMpCredentials({...mpCredentials, mpAccessToken: e.target.value})}
                                                    placeholder="APP_USR-..."
                                                    className="w-full p-6 bg-white/5 border-2 border-transparent focus:border-brand-500 rounded-3xl text-xs font-mono text-white outline-none transition-all placeholder:text-stone-700" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-stone-500 uppercase tracking-[0.2em] ml-2">Public Key (Client Side)</label>
                                                <input type="text" 
                                                    value={mpCredentials.mpPublicKey || ''} 
                                                    onChange={(e) => setMpCredentials({...mpCredentials, mpPublicKey: e.target.value})}
                                                    placeholder="APP_USR-..."
                                                    className="w-full p-6 bg-white/5 border-2 border-transparent focus:border-brand-500 rounded-3xl text-xs font-mono text-white outline-none transition-all placeholder:text-stone-700" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* DANGER ZONE */}
                                    <div className="bg-red-950/20 rounded-[2.5rem] p-10 border border-red-500/20 shadow-2xl col-span-1 xl:col-span-2 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20" />
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="text-center md:text-left">
                                                <h4 className="text-red-500 font-black text-2xl tracking-tighter uppercase italic mb-2">Protocolo de Emergencia</h4>
                                                <p className="text-red-400/50 text-[10px] font-black uppercase tracking-[0.2em]">Acciones críticas irreversibles de desestabilización de datos.</p>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-4">
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            // Logic to clear stats collection (simulated/real for production)
                                                            const statsRef = collection(db, 'stats');
                                                            const snap = await getDocs(statsRef);
                                                            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
                                                            showToast('Purga de estadísticas completada', 'success');
                                                        } catch (err) { showToast('Error en purga de datos', 'error'); }
                                                    }}
                                                    className="px-8 h-14 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
                                                >
                                                    Purga de Estadísticas
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setLocalConfig({ ...config, updatedAt: serverTimestamp() });
                                                        showToast('Caché global de configuración reseteada', 'success');
                                                    }}
                                                    className="px-8 h-14 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 active:scale-95 text-nowrap"
                                                >
                                                    Wipe de Caché Global
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón Guardar Flotante Personalizado */}
                                <div className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center px-4 lg:left-64 pointer-events-none">
                                    <motion.div 
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="pointer-events-auto"
                                    >
                                        <Button 
                                            size="lg"
                                            onClick={() => {
                                                updateConfig(localConfig);
                                                showToast('🎉 ¡Ajustes actualizados correctamente!', 'success');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="!bg-stone-950 dark:!bg-white !text-white dark:!text-stone-950 !rounded-full !px-16 !h-16 font-black tracking-[0.2em] text-[11px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-stone-200/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                                        >
                                            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-brand-500/30">
                                                <Zap size={14} className="text-brand-950" />
                                            </div>
                                            GUARDAR TODOS LOS AJUSTES
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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

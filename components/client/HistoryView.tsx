
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../constants';
import { ArrowLeft, LogOut, History as HistoryIcon, Clock, FileText, Star } from 'lucide-react';
import { OrderStatus } from '../../types';
import { motion } from 'motion/react';

export const HistoryView: React.FC = () => {
    const { orders, user, setClientViewState, setReviewOrder, setSelectedReceiptOrder } = useApp();
    const { signOut } = useAuth();
    
    const pastOrders = orders
        .filter(o => o.customerName === user.name && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.DISPUTED))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleViewReceipt = (order: any) => {
        setSelectedReceiptOrder(order);
        setClientViewState('RECEIPT');
    };

    return (
        <div className="h-full flex flex-col bg-stone-50 dark:bg-[#050505] overflow-hidden">
            {/* Header */}
            <div className="w-full bg-white dark:bg-stone-900 px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"><ArrowLeft size={24} /></button>
                    <div>
                        <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none">Mis Pedidos</h2>
                        <p className="text-stone-400 font-bold text-[8px] uppercase tracking-widest mt-1 hidden sm:block">Historial completo</p>
                    </div>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border border-red-500/20"
                >
                    <LogOut size={16} /> <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
                <div className="max-w-3xl mx-auto space-y-6 pb-32">
                    {pastOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-[2.5rem] border-2 border-dashed border-stone-100 dark:border-white/5">
                            <div className="w-20 h-20 bg-stone-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <HistoryIcon size={32} className="text-stone-200 dark:text-stone-700" />
                            </div>
                            <h3 className="text-lg font-black text-stone-950 dark:text-white tracking-tight">Sin historial aún</h3>
                            <p className="text-stone-400 text-xs mt-2 max-w-[200px] mx-auto font-medium">Tus pedidos aparecerán aquí una vez que realices tu primera compra.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pastOrders.map((order, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={order.id} 
                                    className="bg-white dark:bg-stone-900 rounded-[2rem] p-5 shadow-lg border border-black/[0.02] dark:border-white/5 group transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                order.status === OrderStatus.DELIVERED ? 'bg-green-500/10 text-green-500' : 
                                                order.status === OrderStatus.DISPUTED ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                                <Clock size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-base text-stone-950 dark:text-white tracking-tight truncate">{order.storeName}</h3>
                                                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest truncate">
                                                    #{order.id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-lg text-stone-950 dark:text-white tracking-tighter leading-none">{formatCurrency(order.total)}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                                                order.status === OrderStatus.DELIVERED ? 'text-green-500' : 
                                                order.status === OrderStatus.DISPUTED ? 'text-amber-500' :
                                                'text-red-500'
                                            }`}>
                                                { order.status === OrderStatus.DELIVERED ? 'Entregado' : (order.status === OrderStatus.DISPUTED ? 'Reclamo' : 'Cancelado') }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-black/[0.03] dark:border-white/[0.03]">
                                        <div className="flex -space-x-2">
                                            {order.items?.slice(0, 3).map((item: any, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-sm">
                                                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-950 text-white text-[8px] font-black flex items-center justify-center shadow-sm">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {order.status === OrderStatus.DELIVERED && !order.isReviewed && (
                                                <button onClick={() => setReviewOrder(order)} className="p-2.5 bg-stone-50 dark:bg-white/5 text-stone-400 hover:text-amber-500 rounded-xl transition-all border border-black/[0.03]"><Star size={16} /></button>
                                            )}
                                            <button onClick={() => handleViewReceipt(order)} className="px-4 py-2 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                                                <FileText size={14} /> Recibo
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

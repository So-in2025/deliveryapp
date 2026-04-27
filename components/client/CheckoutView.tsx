
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../constants';
import { ArrowLeft, MapPin, Tag, CreditCard, Banknote, Trash2, Plus, Minus, Zap, X, ShoppingBag } from 'lucide-react';
import { OrderType, PaymentMethod } from '../../types';
import { motion } from 'motion/react';

export const CheckoutView: React.FC = () => {
    const { cart, removeFromCart, updateCartItemQuantity, user, placeOrder, setClientViewState, stores, coupons } = useApp();
    const { showToast } = useToast();
    const [couponCode, setCouponCode] = useState('');
    const [orderType, setOrderType] = useState<OrderType>(OrderType.DELIVERY);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [isPlacing, setIsPlacing] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);

    const cartTotal = cart.reduce((a, b) => a + (b.totalPrice * b.quantity), 0);
    const storeId = cart[0]?.storeId;
    const store = stores.find(s => s.id === storeId);
    
    const deliveryFee = orderType === OrderType.DELIVERY ? (store?.deliveryFee ?? 0) : 0;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, cartTotal + deliveryFee - discount);

    const handlePlaceOrder = async () => {
        if (!storeId) {
            showToast('El carrito tiene un error. Por favor, vacíalo.', 'error');
            return;
        }

        if (!user.addresses?.[0] && orderType === OrderType.DELIVERY) {
            showToast('Por favor agrega una dirección de entrega', 'error');
            return;
        }

        setIsPlacing(true);
        try {
            await placeOrder(
                storeId,
                store?.name || 'Tienda',
                user.addresses![0],
                paymentMethod,
                '', // notes
                orderType,
                discount,
                (user.lat && user.lng) ? { lat: user.lat, lng: user.lng } : undefined
            );
            // clearCart and navigation handled in AppContext
        } catch {
            showToast('Error al procesar el pedido', 'error');
        } finally {
            setIsPlacing(false);
        }
    };

    const handleApplyCoupon = () => {
        const coupon = coupons.find(c => c.code.toLowerCase() === couponCode.trim().toLowerCase() && c.active);
        if (coupon) {
            if (coupon.storeId && coupon.storeId !== storeId) {
                showToast('Este cupón no es válido para este comercio', 'error');
                return;
            }
            if (cartTotal < (coupon.minPurchase || 0)) {
                showToast(`Compra mínima requerida: ${formatCurrency(coupon.minPurchase || 0)}`, 'error');
                return;
            }
            const discountAmount = coupon.discountPct ? (cartTotal * coupon.discountPct) : (coupon.amount || 0);
            setAppliedCoupon({ code: coupon.code, discount: discountAmount });
            showToast('Cupón aplicado con éxito', 'success');
            setCouponCode('');
        } else {
            showToast('Cupón inválido o expirado', 'error');
        }
    };

    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-[#050505]">
                <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                    <ShoppingBag size={40} className="text-stone-300 dark:text-stone-700" />
                </div>
                <h2 className="text-2xl font-black dark:text-white tracking-tighter">Tu carrito está vacío</h2>
                <p className="text-stone-400 text-sm mt-2 mb-8 max-w-[200px] mx-auto">Agrega algunos productos para continuar con tu pedido.</p>
                <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-xl px-8">IR A EXPLORAR</Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-stone-50 dark:bg-[#050505] overflow-hidden">
            {/* Lock Overlay during processing */}
            {isPlacing && (
                <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-md flex flex-col items-center justify-center cursor-wait">
                    <div className="bg-stone-900 border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl max-w-xs w-full text-center animate-slide-up">
                        <div className="w-16 h-16 border-4 border-stone-800 border-t-brand-500 rounded-full animate-spin mb-6" />
                        <h2 className="text-white text-xl font-black tracking-tight uppercase">Procesando...</h2>
                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-4">Asegurando tu transacción</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full bg-white dark:bg-stone-900 px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] flex items-center gap-4 z-50 shrink-0">
                <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"><ArrowLeft size={24} /></button>
                <h2 className="text-xl font-black dark:text-white tracking-tighter">Finalizar Pedido</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-32">
                    
                    {/* Left Column: Details */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Order Type Selector */}
                        <div className="bg-white dark:bg-stone-900 p-2 rounded-[1.8rem] border-2 border-stone-100 dark:border-white/5 flex gap-2 shadow-sm">
                            {(Object.values(OrderType)).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${orderType === type ? 'bg-stone-950 dark:bg-brand-500 text-white dark:text-brand-950 shadow-xl' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                                >
                                    {type === OrderType.DELIVERY ? 'Delivery' : 'Retiro Local'}
                                </button>
                            ))}
                        </div>

                        {/* Delivery Info */}
                        {orderType === OrderType.DELIVERY && (
                            <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-xl border-2 border-stone-100 dark:border-white/5 space-y-6">
                                <h3 className="font-black text-xs text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <MapPin size={16} strokeWidth={3} /> Entrega
                                </h3>
                                <div className="flex items-start gap-4 p-5 bg-stone-50 dark:bg-white/5 rounded-3xl border-2 border-stone-100 dark:border-white/5 relative overflow-hidden group">
                                    <div className="w-12 h-12 bg-brand-500 text-brand-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                        <MapPin size={22} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-stone-950 dark:text-white tracking-tighter truncate text-lg">
                                            {user.addresses?.[0] || 'Sin dirección configurada'}
                                        </p>
                                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest mt-1">Tu ubicación actual</p>
                                    </div>
                                    <button onClick={() => setClientViewState('PROFILE')} className="bg-white dark:bg-brand-500 text-stone-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-stone-100 dark:border-brand-400 shadow-sm hover:scale-105 transition-transform">Cambiar</button>
                                </div>
                            </div>
                        )}

                        {/* Payment Selection */}
                        <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-xl border-2 border-stone-100 dark:border-white/5 space-y-6">
                            <h3 className="font-black text-xs text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <CreditCard size={16} strokeWidth={3} /> Pago
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
                                    { id: PaymentMethod.CARD, label: 'Tarjeta', icon: CreditCard },
                                    { id: PaymentMethod.MERCADO_PAGO, label: 'Mercado Pago', icon: Zap }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === method.id ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10' : 'border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/5 hover:border-brand-500/30'}`}
                                    >
                                        <method.icon size={24} className={paymentMethod === method.id ? 'text-brand-600 dark:text-brand-400' : 'text-stone-400'} strokeWidth={3} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-brand-600 dark:text-brand-400' : 'text-stone-400'}`}>{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-black/[0.02] dark:border-white/5">
                            <h3 className="font-black text-sm text-stone-400 uppercase tracking-widest mb-6">Tu Pedido</h3>
                            <div className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
                                {cart.map(item => (
                                    <div key={item.id} className="py-4 flex gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                                            <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-stone-900 dark:text-white tracking-tight truncate">{item.product.name}</h4>
                                            <p className="text-[10px] text-stone-400 font-medium truncate mb-2">
                                                {item.selectedModifiers?.map(m => m.name).join(' • ')}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-stone-50 dark:bg-white/5 rounded-lg border border-black/[0.03]">
                                                    <button onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 px-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"><Minus size={12} strokeWidth={3} /></button>
                                                    <span className="text-xs font-black text-stone-900 dark:text-white w-6 text-center tabular-nums">{item.quantity}</span>
                                                    <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="p-1 px-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"><Plus size={12} strokeWidth={3} /></button>
                                                </div>
                                                <span className="text-xs font-black text-stone-900 dark:text-white">{formatCurrency(item.totalPrice * item.quantity)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors self-center"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Summary - Élite Overhaul */}
                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-8 lg:p-10 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] border-2 border-stone-100 dark:border-white/5 space-y-8 sticky top-8">
                            <h3 className="font-black text-xs text-stone-400 uppercase tracking-[0.3em] border-b-2 border-stone-50 dark:border-white/[0.03] pb-6">Resumen del Pedido</h3>
                            
                            {/* Coupon Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-2"><Tag size={12} /> Descuentos Especiales</label>
                                <div className="flex gap-2 p-1.5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-white/5">
                                    <input 
                                        type="text" 
                                        placeholder="CÓDIGO DE CUPÓN" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-transparent px-4 text-sm font-black outline-none text-stone-950 dark:text-white placeholder-stone-400"
                                    />
                                    <button onClick={handleApplyCoupon} className="px-6 py-4 bg-stone-950 dark:bg-brand-500 text-white dark:text-brand-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg">Aplicar</button>
                                </div>
                                {appliedCoupon && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-brand-500/10 border-2 border-brand-500/20 p-4 rounded-xl flex justify-between items-center text-brand-600 dark:text-brand-400">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="fill-brand-500" />
                                            <span className="text-xs font-black uppercase tracking-widest leading-none">{appliedCoupon.code}</span>
                                        </div>
                                        <button onClick={() => setAppliedCoupon(null)} className="p-1 hover:bg-brand-500/20 rounded-full transition-colors"><X size={16} /></button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-stone-50 dark:border-white/[0.03]">
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-400 font-black uppercase tracking-tighter italic text-base">Subtotal</span>
                                    <span className="font-black text-stone-950 dark:text-white italic text-base">{formatCurrency(cartTotal)}</span>
                                </div>
                                {orderType === OrderType.DELIVERY && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-400 font-black uppercase tracking-tighter italic text-base">Servicio Postales</span>
                                        <span className="font-black text-stone-950 dark:text-white italic text-base">{formatCurrency(deliveryFee)}</span>
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center text-brand-600 dark:text-brand-400">
                                        <span className="font-black uppercase tracking-tighter italic text-base">Ahorro Élite</span>
                                        <span className="font-black italic text-base">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                <div className="pt-6 border-t border-black/[0.03] dark:border-white/[0.03] flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="font-black text-stone-400 text-[10px] uppercase tracking-widest leading-none mb-2">Total Final</span>
                                        <span className="font-black text-stone-950 dark:text-white text-2xl tracking-tighter uppercase italic leading-none">Checkout</span>
                                    </div>
                                    <span className="font-black text-5xl text-brand-600 dark:text-brand-500 tracking-tighter leading-none">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <Button 
                                fullWidth 
                                size="lg" 
                                disabled={isPlacing || (orderType === OrderType.DELIVERY && !user.addresses?.[0])}
                                onClick={handlePlaceOrder}
                                className="!py-8 !rounded-[2rem] !text-xl !shadow-2xl !shadow-brand-500/30 font-black uppercase tracking-[0.1em] mt-2 transition-all hover:scale-[1.02]"
                            >
                                {isPlacing ? 'VERIFICANDO...' : 'CONFIRMAR OPERACIÓN'}
                            </Button>
                            
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <Zap size={14} className="text-brand-500" />
                                <p className="text-[9px] text-stone-400 font-black text-center uppercase tracking-widest leading-relaxed">
                                    Transacción Segura de Grado Empresarial
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

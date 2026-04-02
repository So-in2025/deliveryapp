
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Store, OrderStatus, Product, Modifier, PaymentMethod, OrderType, Order } from '../types';
import { Button } from '../components/ui/Button';
import { LazyImage } from '../components/ui/LazyImage';
import { Clock, Star, Plus, ShoppingBag, ArrowLeft, Bike, CheckCircle2, ChefHat, Package, MapPin, X, Minus, ChevronDown, CreditCard, Banknote, WifiOff, Store as StoreIcon, Heart, Ticket, Tag, Flame, Utensils, Coffee, Pizza, Search, Sparkles, Zap, History, ChevronRight, Download, AlertTriangle, User, Phone, MessageSquare, Settings, Trash2, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '../constants';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

// --- HELPER LOGIC ---

// Heuristic: Is the store considered "New"? (Less than 7 days old)
const isNewStore = (dateString: string): boolean => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
};

  // --- MEMOIZED COMPONENTS ---

  const StoreCard = React.memo(({ store, onClick, index, isFavorite, onToggleFavorite, compact = false }: { store: Store; onClick: (s: Store) => void; index: number; isFavorite: boolean; onToggleFavorite: (e: React.MouseEvent, id: string) => void; compact?: boolean }) => {
    const isNew = isNewStore(store.createdAt);
    // Use store.rating directly unless it's new and has 0 reviews
    const displayRating = (isNew && store.reviewsCount === 0) ? 5.0 : store.rating;
    
    return (
        <div 
            onClick={() => onClick(store)}
            className={`group bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-3 shadow-xl shadow-black/5 border border-black/5 dark:border-white/5 active:scale-[0.98] transition-all duration-300 cursor-pointer animate-slide-up relative overflow-hidden ${compact ? 'min-w-[240px] w-[240px]' : 'w-full h-full flex flex-col'}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`relative w-full rounded-[1.5rem] overflow-hidden mb-4 bg-stone-100 dark:bg-stone-900 ${compact ? 'h-32' : 'h-48 shrink-0'}`}>
                <LazyImage 
                    src={store.image} 
                    alt={store.name} 
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${store.isOpen === false ? 'grayscale opacity-50' : ''}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                
                {store.isOpen === false && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 shadow-2xl transform -rotate-12">
                            <span className="text-white font-black text-xl tracking-widest uppercase">CERRADO</span>
                        </div>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
                    <div className="bg-white/90 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg text-stone-900 dark:text-white border border-white/20">
                        <Clock size={12} /> {store.deliveryTimeMin} min
                    </div>
                    {isNew && (
                        <div className="bg-brand-500 text-black px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg animate-pulse-soft tracking-widest">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Favorite Button Overlay */}
                <button 
                    onClick={(e) => onToggleFavorite(e, store.id)}
                    className="absolute top-3 left-3 p-2.5 rounded-xl bg-white/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/40 dark:hover:bg-black/40 active:scale-90 transition-all z-10 border border-white/20"
                >
                    <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : "text-white"} />
                </button>
            </div>
            <div className="px-2 flex-1 flex flex-col pb-1">
                <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-bold text-stone-900 dark:text-white leading-tight tracking-tight ${compact ? 'text-base' : 'text-xl'}`}>{store.name}</h3>
                    <div className="flex items-center gap-1 text-stone-900 dark:text-white bg-stone-100 dark:bg-white/10 px-2 py-1 rounded-lg shrink-0">
                        <Star size={12} fill="currentColor" className="text-amber-400" />
                        <span className="text-xs font-bold">{displayRating.toFixed(1)}</span>
                    </div>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-auto pt-2 font-medium">{store.category} • Envío {formatCurrency(store.deliveryFee ?? 45)}</p>
            </div>
        </div>
    );
});

const ProductRow = React.memo(({ product, onAdd, onCustomize, accentColor }: { product: Product; onAdd: () => void; onCustomize: () => void; accentColor?: string }) => (
    <div className="flex gap-4 p-4 rounded-[2rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 relative overflow-hidden shadow-xl shadow-black/5 group hover:border-black/10 dark:hover:border-white/10 transition-colors duration-300">
        <div className="flex-1 space-y-2 relative z-10 py-1">
            <h4 className="font-bold text-lg text-stone-900 dark:text-white tracking-tight">{product.name}</h4>
            <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">{product.description}</p>
            <p className="font-bold text-lg mt-3" style={accentColor ? { color: accentColor } : { color: '#FACC15' }}>{formatCurrency(product.price)}</p>
        </div>
        <div className="flex flex-col justify-between items-end gap-3 relative z-10">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 shadow-inner">
                <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (product.modifierGroups && product.modifierGroups.length > 0) {
                        onCustomize();
                    } else {
                        onAdd();
                    }
                }}
                className="absolute bottom-0 right-0 bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl shadow-2xl active:scale-90 transition-transform hover:scale-105"
                style={accentColor ? { backgroundColor: accentColor, color: '#000' } : {}}
                aria-label="Agregar"
            >
                <Plus size={20} strokeWidth={3} />
            </button>
        </div>
    </div>
));

export const ClientView: React.FC = () => {
  // Consume Global State for navigation
  const { stores, addToCart, cart, placeOrder, orders, favorites, toggleFavorite, coupons, toggleSettings, user, updateUser, clientViewState, setClientViewState, selectedStore, setSelectedStore, addReview, reviews, addCoupon, cancelOrder, submitClaim } = useApp();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  
  // Modal State
  const [productToCustomize, setProductToCustomize] = useState<Product | null>(null);
  
  // Local View State
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  // Claim Modal State
  const [claimOrder, setClaimOrder] = useState<Order | null>(null);

  // Location Modal State
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(stores.map(s => s.category)));
    return ['Todos', ...cats];
  }, [stores]);

  // --- ALGORITHMIC LISTS (HEURISTICS) ---

  const recommendedStores = useMemo(() => {
      return [...stores]
        .map(s => ({
            ...s,
            score: (s.rating * 20) - (s.deliveryTimeMin) // Simple efficient algo
        }))
        .sort((a, b) => b.score - a.score) // Descending
        .slice(0, 5); // Top 5
  }, [stores]);

  const newStores = useMemo(() => {
      return [...stores]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
  }, [stores]);

  const fastestStores = useMemo(() => {
      return stores
        .filter(s => s.isActive !== false)
        .sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin)
        .slice(0, 5);
  }, [stores]);

  const filteredStores = useMemo(() => {
    const sorted = stores
        .filter(s => s.isActive !== false)
        .sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });

    return sorted.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || selectedCategory === 'Todos' || store.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
  }, [stores, searchQuery, selectedCategory, favorites]);

  // Active orders for tracking
  const activeOrder = useMemo(() => {
     return orders
        .filter(o => o.customerName === user.name && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DISPUTED)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [orders, user.name]);

  // All past orders for history
  const pastOrders = useMemo(() => {
      return orders
        .filter(o => o.customerName === user.name && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.DISPUTED))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, user.name]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleViewReceipt = (order: Order) => {
      setSelectedReceiptOrder(order);
      setClientViewState('RECEIPT');
  };

  const ClaimModal = () => {
    const [reason, setReason] = useState('');
    
    if (!claimOrder) return null;

    const handleSubmit = () => {
        if (!reason.trim()) {
            showToast('Por favor describe el problema', 'error');
            return;
        }
        submitClaim(claimOrder.id, reason);
        setClaimOrder(null);
        setClientViewState('HISTORY');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setClaimOrder(null)}></div>
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slide-up z-10">
                <button onClick={() => setClaimOrder(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"><X size={20}/></button>
                
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
                    <AlertTriangle size={24} />
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Iniciar Reclamo</h2>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Cuéntanos qué pasó con tu pedido de {claimOrder.storeName}. Te ayudaremos a resolverlo.</p>

                <textarea 
                    placeholder="Describe el problema (ej: pedido incompleto, comida fría...)"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 mb-4 outline-none focus:border-brand-500 text-sm h-32 resize-none text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                />

                <div className="flex gap-3">
                    <Button fullWidth variant="secondary" onClick={() => setClaimOrder(null)}>Cancelar</Button>
                    <Button fullWidth onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white">Enviar Reclamo</Button>
                </div>
            </div>
        </div>
    );
  };

  const ReviewModal = () => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!reviewOrder) return null;

    const handleSubmit = () => {
        addReview({
            id: `rev-${Date.now()}`,
            storeId: reviewOrder.storeId,
            orderId: reviewOrder.id,
            rating,
            comment,
            createdAt: new Date().toISOString(),
            userName: user.name
        });
        showToast('¡Gracias por tu calificación!', 'success');
        setReviewOrder(null);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReviewOrder(null)}></div>
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slide-up z-10 text-center">
                <button onClick={() => setReviewOrder(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"><X size={20}/></button>
                
                <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-1">Califica tu pedido</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{reviewOrder.storeName}</p>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-90"
                        >
                            <Star 
                                size={32} 
                                className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} 
                            />
                        </button>
                    ))}
                </div>

                <textarea 
                    placeholder="¿Qué te pareció la comida?"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 mb-4 outline-none focus:border-brand-500 text-sm h-24 resize-none text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <Button fullWidth onClick={handleSubmit}>Enviar Calificación</Button>
            </div>
        </div>
    );
  };

  const ProductModal = () => {
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});

    if (!productToCustomize) return null;

    const handleModifierChange = (groupId: string, modifier: Modifier, isMulti: boolean) => {
        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            if (isMulti) {
                const exists = current.find(m => m.id === modifier.id);
                if (exists) {
                    return { ...prev, [groupId]: current.filter(m => m.id !== modifier.id) };
                } else {
                    return { ...prev, [groupId]: [...current, modifier] };
                }
            } else {
                return { ...prev, [groupId]: [modifier] };
            }
        });
    };

    const allModifiers = Object.values(selectedModifiers).flat() as Modifier[];
    const modifiersTotal = allModifiers.reduce((sum, m) => sum + m.price, 0);
    const total = (productToCustomize.price + modifiersTotal) * quantity;

    const isValid = productToCustomize.modifierGroups?.every(group => {
        const selectedCount = selectedModifiers[group.id]?.length || 0;
        return selectedCount >= group.min && selectedCount <= (group.max > 1 ? 999 : 1);
    }) ?? true;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto animate-fade-in"
                onClick={() => setProductToCustomize(null)}
            ></div>
            
            <div className="bg-white dark:bg-stone-900 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up overflow-hidden">
                 <div className="relative h-56 shrink-0 bg-stone-100 dark:bg-stone-800">
                    <LazyImage src={productToCustomize.image} alt={productToCustomize.name} className="w-full h-full" />
                    <button 
                        onClick={() => setProductToCustomize(null)}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X size={20} />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{productToCustomize.name}</h2>
                        <p className="text-stone-500 dark:text-stone-400 mt-1">{productToCustomize.description}</p>
                    </div>
                    {productToCustomize.modifierGroups?.map(group => (
                        <div key={group.id} className="space-y-3">
                            <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg">
                                <h3 className="font-bold text-stone-800 dark:text-stone-200">{group.name}</h3>
                                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-1 rounded border border-stone-100 dark:border-stone-700">
                                    {group.min > 0 ? 'Obligatorio' : 'Opcional'} • {group.max > 1 ? `Máx ${group.max}` : 'Elige 1'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {group.options.map(option => {
                                    const isSelected = selectedModifiers[group.id]?.some(m => m.id === option.id);
                                    return (
                                        <div 
                                            key={option.id}
                                            onClick={() => handleModifierChange(group.id, option, group.max > 1)}
                                            className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-stone-300 dark:border-stone-600'}`}>
                                                    {isSelected && <CheckCircle2 size={14} className="text-brand-950" />}
                                                </div>
                                                <span className={`${isSelected ? 'font-bold text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-300'}`}>{option.name}</span>
                                            </div>
                                            {option.price > 0 && (
                                                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">+{formatCurrency(option.price)}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 safe-pb">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl p-1 border border-stone-100 dark:border-stone-700">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-white dark:bg-stone-700 shadow-sm border border-stone-200 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-600 active:scale-95 transition-all"><Minus size={18} /></button>
                            <span className="font-bold w-6 text-center text-lg dark:text-white">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-3 bg-white dark:bg-stone-700 shadow-sm border border-stone-200 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-600 active:scale-95 transition-all"><Plus size={18} /></button>
                        </div>
                        <div className="flex-1 text-right">
                             <span className="text-xs text-stone-400 font-bold uppercase block">Total</span>
                             <span className="text-2xl font-bold text-brand-800">{formatCurrency(total)}</span>
                        </div>
                    </div>
                    <Button 
                        fullWidth 
                        size="lg" 
                        disabled={!isValid}
                        onClick={() => {
                            if (selectedStore) {
                                addToCart(productToCustomize, quantity, allModifiers, selectedStore.id);
                                setProductToCustomize(null);
                                showToast('Agregado al carrito', 'success');
                            }
                        }}
                    >
                        Agregar al Pedido
                    </Button>
                 </div>
            </div>
        </div>
    );
  };

  const LocationModal = () => {
      if (!showLocationSelector) return null;
      
      const handleSelectAddress = (addr: string) => {
          // Move selected address to the front (primary)
          const otherAddresses = user.addresses.filter(a => a !== addr);
          updateUser({ addresses: [addr, ...otherAddresses] });
          showToast(`Ubicación actualizada: ${addr.split('(')[0]}`, 'success');
          setShowLocationSelector(false);
      };

      const handleAddAddress = () => {
          const newAddress = window.prompt("Ingresa tu nueva dirección:");
          if (newAddress && newAddress.trim()) {
              const updatedAddresses = [newAddress.trim(), ...user.addresses];
              updateUser({ addresses: updatedAddresses });
              showToast('Dirección agregada y establecida como principal', 'success');
          }
      };

      return (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowLocationSelector(false)}></div>
              <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8 relative animate-slide-up z-10 border-t border-white/10">
                  <div className="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mb-6 sm:hidden"></div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">¿A dónde enviamos?</h3>
                    <button onClick={() => setShowLocationSelector(false)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                      {user.addresses.map((addr, idx) => (
                          <button 
                              key={idx}
                              onClick={() => handleSelectAddress(addr)}
                              className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left border-2 ${
                                  idx === 0 
                                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-4 ring-brand-500/10' 
                                  : 'border-stone-100 dark:border-stone-800 hover:border-brand-200 dark:hover:border-brand-900/50 hover:bg-stone-50 dark:hover:bg-stone-800/30'
                              }`}
                          >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                  idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                              }`}>
                                  <MapPin size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-base truncate ${idx === 0 ? 'text-brand-950 dark:text-brand-100' : 'text-stone-900 dark:text-white'}`}>{addr}</p>
                                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{idx === 0 ? 'Dirección Principal' : 'Dirección Guardada'}</p>
                              </div>
                              {idx === 0 && (
                                <div className="bg-brand-500/20 p-1.5 rounded-full">
                                    <CheckCircle2 size={18} className="text-brand-600 dark:text-brand-400" />
                                </div>
                              )}
                          </button>
                      ))}
                      
                      <button 
                          onClick={handleAddAddress}
                          className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-bold text-sm mt-4 hover:bg-stone-50 dark:hover:bg-stone-800/30 hover:border-brand-500 transition-all group"
                      >
                          <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl group-hover:bg-brand-500 group-hover:text-brand-950 transition-colors">
                            <Plus size={20} />
                          </div>
                          Agregar nueva dirección
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const BannerCarousel = () => (
      <div className="overflow-x-auto scrollbar-hide flex gap-4 px-4 pb-4 snap-x lg:grid lg:grid-cols-2 lg:gap-6 lg:px-8 lg:overflow-visible">
            <div 
                onClick={() => {
                    addCoupon({ id: `promo-${Date.now()}`, code: 'BENVENUTO20', discountPct: 0.2, active: true, description: 'Promo Bienvenida' });
                    showToast('¡Cupón BENVENUTO20 copiado y aplicado!', 'success');
                }}
                className="snap-center shrink-0 w-[85%] relative h-40 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform lg:w-full lg:h-56"
            >
             <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-6">
                 <div>
                     <span className="bg-brand-500 text-brand-950 text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 inline-block">PROMO</span>
                     <h3 className="text-white text-xl font-bold leading-tight lg:text-3xl">20% OFF en<br/>Tu Primera Orden</h3>
                     <p className="text-stone-200 text-xs mt-1 lg:text-sm">Toca para aplicar</p>
                 </div>
             </div>
          </div>
          <div 
            onClick={() => {
                setSelectedCategory('Pizza & Pasta');
                showToast('Filtrando: Pizza Artesanal', 'info');
            }}
            className="snap-center shrink-0 w-[85%] relative h-40 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform lg:w-full lg:h-56"
          >
             <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-orange-900/70 to-transparent flex items-center p-6">
                 <div>
                     <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 inline-block">NUEVO</span>
                     <h3 className="text-white text-xl font-bold leading-tight lg:text-3xl">Festival de<br/>Pizza Artesanal</h3>
                     <p className="text-stone-200 text-xs mt-1 lg:text-sm">Ver restaurantes</p>
                 </div>
             </div>
          </div>
      </div>
  );

  const CategoryPills = () => (
      <div className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide">
           {categories.map((cat) => {
              let Icon = Utensils;
              if(cat === 'Hamburguesas') Icon = Flame;
              if(cat === 'Pizza & Pasta') Icon = Pizza;
              if(cat === 'Japonesa') Icon = Coffee; 
              const isSelected = (selectedCategory === cat || (selectedCategory === 'ALL' && cat === 'Todos'));

              return (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Todos' ? 'ALL' : cat)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 border ${
                        isSelected
                        ? 'bg-stone-900 dark:bg-brand-500 text-white dark:text-brand-950 border-stone-900 dark:border-brand-500 shadow-md' 
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-100 dark:border-stone-700 hover:border-stone-300'
                    }`}
                >
                    {cat !== 'Todos' && <Icon size={14} className={isSelected ? "text-brand-400 dark:text-white" : "text-stone-400 dark:text-stone-500"} />}
                    {cat}
                </button>
              )
          })}
      </div>
  );

  const HorizontalSection = ({ title, icon, data }: { title: string, icon: React.ReactNode, data: Store[] }) => (
      <div className="mt-2">
         <div className="px-4 flex justify-between items-end mb-2">
            <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">{icon} {title}</h3>
         </div>
         <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x">
             {data.map((store, idx) => (
                 <div key={`${title}-${store.id}`} className="snap-center">
                     <StoreCard 
                        store={store} 
                        onClick={setSelectedStore} 
                        index={idx} 
                        isFavorite={favorites.includes(store.id)} 
                        onToggleFavorite={handleToggleFavorite}
                        compact={true}
                     />
                 </div>
             ))}
         </div>
      </div>
  );

  const StoreList = () => (
    <div className="space-y-4 animate-fade-in pt-2 bg-transparent">
      <div className="px-6 py-4 flex flex-col gap-5 sticky top-0 z-20 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5">
          <div className="flex justify-between items-center">
              <div onClick={() => setShowLocationSelector(true)} className="cursor-pointer group">
                  <p className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Entregar en</p>
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-base group-hover:opacity-70 transition-opacity">
                      <MapPin size={16} className="text-brand-500" />
                      {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : 'Sin dirección'}
                      <ChevronDown size={16} className="text-stone-400" />
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setClientViewState('HISTORY')}
                    className="flex items-center gap-2 bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                      <History size={16} className="text-stone-900 dark:text-white" />
                      <span className="font-bold text-sm text-stone-900 dark:text-white hidden sm:block">Pedidos</span>
                  </button>
                  <button 
                    onClick={toggleSettings}
                    className="w-10 h-10 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors lg:hidden"
                  >
                      <span className="font-bold text-sm text-stone-900 dark:text-white">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </span>
                  </button>
              </div>
          </div>

          <div className="w-full">
             <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-1 rounded-2xl flex items-center gap-2 transition-all focus-within:bg-white dark:focus-within:bg-[#0A0A0A] focus-within:ring-2 focus-within:ring-brand-500/50 border border-transparent focus-within:border-brand-500/30 shadow-inner">
                 <div className="p-3 bg-white dark:bg-[#141414] rounded-xl shadow-sm">
                     <Search size={18} className="text-stone-900 dark:text-white" />
                 </div>
                 <input 
                    placeholder="¿Qué vas a comer hoy?"
                    className="flex-1 outline-none text-base p-2 bg-transparent text-stone-900 dark:text-white placeholder-stone-500 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>
          </div>
      </div>
    </div>
  );

    const TrackingView = () => {
        const { orders, cancelOrder, setClientViewState, stores, showToast } = useApp();
        const activeOrder = orders.find(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
        const pastOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);

        // Logic to show the just-finished order
        let displayOrder = activeOrder;
        
        // If no active order, check if we just finished one or cancelled one
        if (!displayOrder) {
            displayOrder = pastOrders[0];
        }

        useEffect(() => {
            if (displayOrder?.status === OrderStatus.DELIVERED) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FACC15', '#F27D26', '#000000']
                });
            }
        }, [displayOrder?.status]);

        if (!displayOrder) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-brand-50 dark:bg-brand-900 animate-fade-in">
                <div className="bg-white dark:bg-stone-800 p-6 rounded-full shadow-sm mb-6">
                    <ShoppingBag size={48} className="text-stone-300 dark:text-stone-600" />
                </div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">No hay pedido activo</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xs mx-auto">Explora los restaurantes y realiza tu primer pedido.</p>
                <Button onClick={() => setClientViewState('BROWSE')}>Ir al Inicio</Button>
            </div>
        );
    }
    
    const steps = [
        { status: OrderStatus.PENDING, label: 'Enviado', icon: Package },
        { status: OrderStatus.ACCEPTED, label: 'Aceptado', icon: CheckCircle2 },
        { status: OrderStatus.PREPARING, label: 'Preparando', icon: ChefHat },
        { status: OrderStatus.READY, label: 'Listo', icon: ShoppingBag },
        { status: OrderStatus.DRIVER_ASSIGNED, label: 'Asignado', icon: MapPin },
        { status: OrderStatus.PICKED_UP, label: 'En camino', icon: Bike },
    ];
    
    // Handle Cancelled State
    if (displayOrder.status === OrderStatus.CANCELLED) {
         return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-brand-50 dark:bg-brand-900 animate-fade-in">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full shadow-sm mb-6 border border-red-100 dark:border-red-900/30">
                    <X size={48} className="text-red-500 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Pedido Cancelado</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xs mx-auto">El pedido ha sido cancelado.</p>
                <Button onClick={() => setClientViewState('BROWSE')}>Volver al Inicio</Button>
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(s => s.status === displayOrder.status);
    const safeIndex = currentStepIndex === -1 ? (displayOrder.status === OrderStatus.DELIVERED ? 6 : 0) : currentStepIndex;
    const getProgressWidth = () => `${Math.max(5, Math.min(100, (safeIndex / (steps.length - 1)) * 100))}%`;

    // Find store to get estimated time
    const orderStore = stores.find(s => s.id === displayOrder.storeId);
    const estimatedTime = orderStore ? `${orderStore.deliveryTimeMin}-${orderStore.deliveryTimeMax} min` : '15-20 min';

    return (
        <div className="h-full flex flex-col bg-brand-50 dark:bg-brand-900 animate-slide-up">
            <div className="bg-white dark:bg-stone-800 p-6 pb-8 rounded-b-[2.5rem] shadow-sm z-10">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-right">
                        <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Tiempo estimado</p>
                        <p className="text-2xl font-bold text-stone-900 dark:text-white">
                            {displayOrder.status === OrderStatus.DELIVERED ? 'Entregado' : estimatedTime}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-8">
                     <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-brand-500 text-brand-950' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-950 dark:text-brand-400 animate-pulse'}`}>
                            {(() => {
                                if (displayOrder.status === OrderStatus.DELIVERED) return <CheckCircle2 size={40} />;
                                const Icon = steps[Math.min(safeIndex, steps.length-1)]?.icon || Bike;
                                return <Icon size={40} />;
                            })()}
                        </div>
                        {displayOrder.isOfflinePending && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1.5 border-2 border-white">
                                <WifiOff size={12} className="text-white" />
                            </div>
                        )}
                     </div>
                     <h2 className="text-xl font-bold text-stone-900 dark:text-white transition-all">
                        {displayOrder.isOfflinePending ? "Esperando conexión..." : 
                        (displayOrder.status === OrderStatus.DELIVERED ? "¡Disfruta tu comida!" : 
                         steps[safeIndex]?.label || "Procesando")}
                     </h2>
                     <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{displayOrder.storeName}</p>
                     
                     {/* Emergency Cancel Button for Demo */}
                     {(displayOrder.status === OrderStatus.PENDING || displayOrder.status === OrderStatus.ACCEPTED) && (
                         <div className="mt-4">
                             <button 
                                onClick={() => {
                                    cancelOrder(displayOrder.id, 'Cancelado por el cliente');
                                    setClientViewState('BROWSE');
                                }}
                                className="text-xs text-red-500 font-bold underline hover:text-red-700"
                             >
                                 Cancelar Pedido
                             </button>
                         </div>
                     )}
                     
                     {displayOrder.status === OrderStatus.DELIVERED && (
                         <div className="mt-4 flex gap-2 justify-center">
                             <button 
                                onClick={() => setClaimOrder(displayOrder)}
                                className="text-xs text-red-500 font-bold border border-red-200 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100"
                             >
                                 Reclamar
                             </button>
                         </div>
                     )}
                     
                     {displayOrder.type === OrderType.PICKUP && (
                         <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-700 rounded-full text-xs font-bold text-stone-700 dark:text-stone-300">
                             <StoreIcon size={12} /> Retiro en Local
                         </div>
                     )}
                </div>

                <div className="relative h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-2">
                    <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-brand-500' : displayOrder.isOfflinePending ? 'bg-stone-300 dark:bg-stone-500' : 'bg-brand-500'}`} style={{ width: getProgressWidth() }}></div>
                </div>
            </div>

            {displayOrder.type === OrderType.DELIVERY && (displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP) && (
                <div className="px-6 mt-6 mb-2">
                    <div className="h-64 rounded-[2.5rem] bg-stone-200 dark:bg-stone-800 overflow-hidden relative shadow-inner border border-stone-200 dark:border-stone-700">
                        {/* Simulated Town Map with dynamic movement */}
                        <div className="absolute inset-0 bg-stone-200 dark:bg-stone-800 opacity-60">
                             <div className="w-full h-full" style={{backgroundImage: 'radial-gradient(var(--tw-colors-stone-400) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                             {/* Roads */}
                             <div className="absolute top-1/2 left-0 w-full h-4 bg-white dark:bg-stone-700 transform -rotate-12 shadow-sm"></div>
                             <div className="absolute top-0 left-1/3 w-4 h-full bg-white dark:bg-stone-700 transform shadow-sm"></div>
                             <div className="absolute top-1/4 right-0 w-full h-4 bg-white dark:bg-stone-700 transform rotate-45 shadow-sm"></div>
                             
                             {/* Buildings/Blocks */}
                             <div className="absolute top-10 left-10 w-20 h-20 bg-stone-300 dark:bg-stone-700/50 rounded-xl"></div>
                             <div className="absolute bottom-10 right-20 w-32 h-16 bg-stone-300 dark:bg-stone-700/50 rounded-xl"></div>
                             <div className="absolute top-1/2 right-10 w-16 h-24 bg-stone-300 dark:bg-stone-700/50 rounded-xl"></div>
                        </div>
                        
                        <motion.div 
                            animate={{ 
                                x: displayOrder.status === OrderStatus.PICKED_UP ? [0, 40, 80, 120, 160] : 0,
                                y: displayOrder.status === OrderStatus.PICKED_UP ? [0, -20, -10, -30, -15] : 0
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                        >
                            <div className="relative">
                                <div className="absolute -inset-6 bg-brand-500/30 rounded-full animate-ping" />
                                <div className="absolute -inset-10 bg-brand-500/10 rounded-full animate-pulse" />
                                <div className="w-14 h-14 bg-brand-500 rounded-[1.5rem] border-4 border-white dark:border-stone-800 shadow-2xl flex items-center justify-center z-10 relative">
                                    <Bike size={28} className="text-brand-950" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-stone-900 px-4 py-2 rounded-2xl text-xs font-black shadow-2xl mt-4 text-stone-900 dark:text-white border border-stone-100 dark:border-stone-800 whitespace-nowrap">
                                {displayOrder.driverName || 'Repartidor'} en camino
                            </div>
                        </motion.div>

                        {/* Destination Marker */}
                        <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-pulse" />
                                <div className="w-12 h-12 bg-stone-900 dark:bg-white rounded-[1.2rem] border-4 border-white dark:border-stone-800 shadow-2xl flex items-center justify-center relative z-10">
                                    <MapPin size={24} className="text-white dark:text-stone-900" />
                                </div>
                            </div>
                            <div className="bg-stone-900 dark:bg-white px-3 py-1 rounded-xl text-[10px] font-black text-white dark:text-stone-900 mt-2 shadow-xl uppercase tracking-widest">Tu Casa</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Driver Info Card */}
                {(displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-stone-800 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center">
                                <User className="text-stone-400" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-900 dark:text-white">{displayOrder.driverName || 'Repartidor'}</h4>
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star size={12} fill="currentColor" />
                                    <span className="text-xs font-bold">4.9</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-3 bg-stone-100 dark:bg-stone-700 rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors">
                                <MessageSquare size={20} />
                            </button>
                            <button className="p-3 bg-brand-500 rounded-2xl text-brand-950 hover:bg-brand-600 transition-colors">
                                <Phone size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                 <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-3 uppercase tracking-wider">Detalle del Pedido</h3>
                    {displayOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-stone-100 dark:border-stone-700 last:border-0">
                            <div>
                                <div className="flex gap-2">
                                    <span className="font-bold text-stone-900 dark:text-white">{item.quantity}x</span> 
                                    <span className="text-stone-700 dark:text-stone-300">{item.product.name}</span>
                                </div>
                            </div>
                            <span className="text-stone-600 dark:text-stone-400 font-medium">{formatCurrency(item.totalPrice * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm py-2 border-b border-stone-100 dark:border-stone-700">
                        <span className="text-stone-600 dark:text-stone-400">Envío</span>
                        <span className="text-stone-900 dark:text-white font-medium">
                            {(displayOrder.type === OrderType.DELIVERY ? (displayOrder.deliveryFee ?? 45) : 0) > 0 
                                ? formatCurrency(displayOrder.type === OrderType.DELIVERY ? (displayOrder.deliveryFee ?? 45) : 0) 
                                : 'Gratis'}
                        </span>
                    </div>
                    <div className="border-t border-stone-100 dark:border-stone-700 mt-3 pt-3 flex justify-between font-bold text-stone-900 dark:text-white">
                        <span>Total</span>
                        <span>{formatCurrency(displayOrder.total)}</span>
                    </div>
                 </div>
            </div>
        </div>
    );
  };
  
  const CheckoutView = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
    const addresses = user.addresses || ['Mi Ubicación Actual'];
    const [deliveryAddr, setDeliveryAddr] = useState(addresses[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
    const [orderType, setOrderType] = useState<OrderType>(OrderType.DELIVERY);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountPct: number} | null>(null);

    const [tip, setTip] = useState<number>(0);
    const [requestCutlery, setRequestCutlery] = useState<boolean>(false);

    // FIXED FEE LOGIC
    const deliveryFee = orderType === OrderType.DELIVERY ? (selectedStore?.deliveryFee ?? 45) : 0;

    const handleApplyCoupon = () => {
        const found = coupons.find(c => c.code === couponCode.toUpperCase() && c.active);
        if (found) { setAppliedCoupon({ code: found.code, discountPct: found.discountPct }); showToast('¡Cupón aplicado!', 'success'); } else { showToast('Cupón inválido.', 'error'); setAppliedCoupon(null); }
    };
    const discountAmount = appliedCoupon ? (subtotal + deliveryFee) * appliedCoupon.discountPct : 0;
    const total = subtotal + deliveryFee + tip - discountAmount;

    const handlePlaceOrder = async () => {
        if (!selectedStore) return;
        setIsProcessing(true);
        
        if (paymentMethod === PaymentMethod.MERCADO_PAGO) {
            showToast('Conectando con Mercado Pago...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1500));
            showToast('Pago procesado con éxito', 'success');
        } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        placeOrder(selectedStore.id, selectedStore.name, deliveryAddr, paymentMethod, notes, orderType, discountAmount);
        setIsProcessing(false); 
        // Note: Layout will handle navigation reset, but placeOrder clears selectedStore via context
        setClientViewState('TRACKING'); 
        showToast('Pedido enviado', 'success');
    };

    return (
      <div className="h-full flex flex-col animate-fade-in bg-stone-50 dark:bg-stone-900 overflow-hidden">
        <div className="flex items-center gap-4 bg-white dark:bg-stone-800 px-4 py-3 border-b border-stone-100 dark:border-stone-700 sticky top-0 z-10 shrink-0">
          <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-600 dark:text-stone-300" disabled={isProcessing}><ArrowLeft size={24} /></button>
          <h2 className="text-xl font-bold dark:text-white">Confirmar Pedido</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex gap-2">
             <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === OrderType.DELIVERY ? 'bg-stone-900 dark:bg-brand-500 text-white dark:text-brand-950 shadow-md' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}><Bike size={18} /> Envío</button>
             <button onClick={() => setOrderType(OrderType.PICKUP)} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === OrderType.PICKUP ? 'bg-stone-900 dark:bg-brand-500 text-white dark:text-brand-950 shadow-md' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}><StoreIcon size={18} /> Retiro</button>
          </div>
          {orderType === OrderType.DELIVERY && (
            <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm animate-slide-up">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <MapPin size={18} className="text-brand-500" /> Dirección de Entrega
                    </h3>
                    <button 
                        onClick={() => setShowLocationSelector(true)} 
                        className="text-brand-800 dark:text-brand-400 text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
                    >
                        Cambiar
                    </button>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-700">
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{deliveryAddr}</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold mt-1">Tu ubicación seleccionada</p>
                </div>
            </div>
          )}
          <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-stone-900 dark:text-white mb-3">Método de Pago</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentMethod(PaymentMethod.MERCADO_PAGO)} 
                disabled={isProcessing} 
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.MERCADO_PAGO ? 'border-brand-500 bg-brand-500 text-brand-950 shadow-md' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'} ${isProcessing ? 'opacity-50' : ''}`}
              >
                <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-[8px] text-white font-black">MP</div>
                <span className="text-[10px] font-bold">Mercado Pago</span>
              </button>
              <button 
                onClick={() => setPaymentMethod(PaymentMethod.CARD)} 
                disabled={isProcessing} 
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CARD ? 'border-brand-500 bg-brand-500 text-brand-950 shadow-md' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'} ${isProcessing ? 'opacity-50' : ''}`}
              >
                <CreditCard size={24} />
                <span className="text-[10px] font-bold">Tarjeta</span>
              </button>
              <button 
                onClick={() => setPaymentMethod(PaymentMethod.CASH)} 
                disabled={isProcessing} 
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-brand-500 bg-brand-500 text-brand-950 shadow-md' : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'} ${isProcessing ? 'opacity-50' : ''}`}
              >
                <Banknote size={24} />
                <span className="text-[10px] font-bold">Efectivo</span>
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm">
              <h3 className="font-bold text-stone-900 dark:text-white mb-3">Opciones Adicionales</h3>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Utensils size={18} className="text-stone-400" />
                          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">¿Necesitas cubiertos?</span>
                      </div>
                      <button 
                        onClick={() => setRequestCutlery(!requestCutlery)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${requestCutlery ? 'bg-brand-500' : 'bg-stone-200 dark:bg-stone-700'}`}
                      >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${requestCutlery ? 'right-1' : 'left-1'}`} />
                      </button>
                  </div>
                  
                  <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                          <DollarSign size={16} className="text-brand-500" /> Propina para el repartidor
                      </p>
                      <div className="flex gap-2">
                          {[0, 20, 50, 100].map(amount => (
                              <button 
                                key={amount}
                                onClick={() => setTip(amount)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${tip === amount ? 'bg-brand-500 border-brand-500 text-brand-950' : 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'}`}
                              >
                                  {amount === 0 ? 'No' : formatCurrency(amount)}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

           <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm">
              <h3 className="font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-2"><Ticket size={16} className="text-brand-800 dark:text-brand-400" /> Cupón</h3>
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">{appliedCoupon.code}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{(appliedCoupon.discountPct * 100)}% descuento</p>
                    </div>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-full text-amber-700 dark:text-amber-400"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Ej: BENVENUTO20" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={isProcessing} className="flex-1 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-stone-900 dark:text-white" />
                  <Button size="sm" onClick={handleApplyCoupon} disabled={!couponCode || isProcessing} className="px-4">Aplicar</Button>
                </div>
              )}
          </div>
          <div id="order-summary" className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm">
             <h3 className="font-bold text-stone-900 dark:text-white mb-3">Resumen</h3>
             <div className="space-y-2 mb-3">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between text-sm">
                   <span className="text-stone-600 dark:text-stone-400">{item.quantity}x {item.product.name}</span>
                   <span className="text-stone-900 dark:text-white font-medium">{formatCurrency(item.totalPrice * item.quantity)}</span>
                 </div>
               ))}
             </div>
             {orderType === OrderType.DELIVERY && (
                 <div className="flex justify-between text-sm py-2 border-t border-dashed border-stone-200 dark:border-stone-700">
                     <span className="text-stone-600 dark:text-stone-400">Costo de Envío</span>
                     <span className="text-stone-900 dark:text-white font-medium">{formatCurrency(deliveryFee)}</span>
                 </div>
             )}
             {tip > 0 && (
                 <div className="flex justify-between text-sm py-2 border-t border-dashed border-stone-200 dark:border-stone-700">
                     <span className="text-stone-600 dark:text-stone-400">Propina</span>
                     <span className="text-stone-900 dark:text-white font-medium">{formatCurrency(tip)}</span>
                 </div>
             )}
             {appliedCoupon && (
               <div className="flex justify-between items-center py-2 border-t border-dashed border-stone-200 dark:border-stone-700 text-green-600 dark:text-green-400">
                 <span className="text-sm font-medium">Descuento</span>
                 <span className="font-bold">- {formatCurrency(discountAmount)}</span>
               </div>
             )}
             <div className="border-t border-stone-100 dark:border-stone-700 pt-3 flex justify-between items-center">
               <span className="font-bold text-stone-900 dark:text-white text-lg">Total</span>
               <span className="font-bold text-brand-800 dark:text-brand-400 text-lg">{formatCurrency(total)}</span>
             </div>
          </div>
          <div className="h-20"></div>
        </div>
        <div className="p-4 bg-white dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700 pb-safe shrink-0 absolute bottom-0 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-none z-20">
          <Button fullWidth size="lg" disabled={cart.length === 0 || isProcessing} isLoading={isProcessing} onClick={handlePlaceOrder}>{isProcessing ? 'Procesando...' : `Confirmar - ${formatCurrency(total)}`}</Button>
        </div>
      </div>
    );
  };

  const HistoryView = () => (
      <div className="h-full bg-stone-50 dark:bg-stone-900 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white dark:bg-stone-800 px-4 py-3 border-b border-stone-100 dark:border-stone-700 sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-600 dark:text-stone-300"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold dark:text-white">Mis Pedidos</h2>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {pastOrders.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                      <History size={48} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                      <p className="text-stone-500 dark:text-stone-400">No tienes historial aún.</p>
                  </div>
              ) : (
                  pastOrders.map(order => (
                      <div key={order.id} className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-stone-900 dark:text-white">{order.storeName}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  order.status === OrderStatus.DELIVERED ? 'bg-brand-500 text-brand-950' : 
                                  order.status === OrderStatus.DISPUTED ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                                  {order.status === OrderStatus.DELIVERED ? 'ENTREGADO' : 
                                   order.status === OrderStatus.DISPUTED ? 'EN RECLAMO' : 'CANCELADO'}
                              </span>
                          </div>
                          <p className="text-xs text-stone-500 mb-3">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} productos</p>
                          
                          {/* Audit Info */}
                          {order.status === OrderStatus.CANCELLED && order.cancelledReason && (
                              <p className="text-xs text-red-500 mb-3 bg-red-50 p-2 rounded">Motivo: {order.cancelledReason}</p>
                          )}
                          {order.status === OrderStatus.DISPUTED && order.claimReason && (
                              <div className="text-xs text-amber-600 mb-3 bg-amber-50 p-2 rounded">
                                  <p className="font-bold">Reclamo ({order.claimStatus}):</p>
                                  <p>{order.claimReason}</p>
                              </div>
                          )}

                          <div className="flex justify-between items-center border-t border-stone-100 dark:border-stone-700 pt-3">
                              <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(order.total)}</span>
                              
                              <div className="flex gap-2">
                                  {order.status === OrderStatus.DELIVERED && !order.isReviewed && (
                                      <button
                                          onClick={() => setReviewOrder(order)}
                                          className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-100 transition-colors"
                                      >
                                          <Star size={12} fill="currentColor" /> Calificar
                                      </button>
                                  )}
                                  {order.status === OrderStatus.DELIVERED && (
                                      <button
                                          onClick={() => setClaimOrder(order)}
                                          className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-100 transition-colors"
                                      >
                                          Reclamar
                                      </button>
                                  )}
                                  <button 
                                    onClick={() => handleViewReceipt(order)}
                                    className="text-xs font-bold text-brand-800 flex items-center gap-1 active:opacity-60 transition-opacity"
                                  >
                                      Ver Recibo <ChevronRight size={12} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  const FavoritesView = () => {
    const favoriteStores = stores.filter(s => favorites.includes(s.id));

    return (
      <div className="h-full bg-stone-50 dark:bg-stone-900 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white dark:bg-stone-800 px-4 py-3 border-b border-stone-100 dark:border-stone-700 sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-600 dark:text-stone-300"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold dark:text-white">Mis Favoritos</h2>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
              {favoriteStores.length === 0 ? (
                  <div className="text-center py-20 opacity-50">
                      <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart size={40} className="text-stone-300 dark:text-stone-600" />
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-white text-lg">Aún no tienes favoritos</h3>
                      <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 max-w-[200px] mx-auto">Toca el corazón en tus restaurantes preferidos para verlos aquí.</p>
                      <Button onClick={() => setClientViewState('BROWSE')} className="mt-6">Explorar Restaurantes</Button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteStores.map((store, idx) => (
                          <StoreCard 
                              key={store.id} 
                              store={store} 
                              onClick={setSelectedStore} 
                              index={idx}
                              isFavorite={true}
                              onToggleFavorite={handleToggleFavorite}
                          />
                      ))}
                  </div>
              )}
          </div>
      </div>
    );
  };

  const ProfileView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);

    const handleSave = () => {
        updateUser({ name, email });
        setIsEditing(false);
        showToast('Perfil actualizado', 'success');
    };

    return (
      <div className="h-full bg-white dark:bg-[#050505] animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl px-6 py-4 border-b border-black/5 dark:border-white/5 sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Mi Perfil</h2>
          </div>
          
          <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {/* Profile Header */}
              <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-28 h-28 bg-brand-500 rounded-[2rem] flex items-center justify-center text-black text-4xl font-bold shadow-2xl shadow-brand-500/20 border-4 border-white dark:border-[#050505]">
                        {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-black dark:bg-white p-3 rounded-2xl shadow-xl text-white dark:text-black hover:scale-105 active:scale-95 transition-transform">
                        <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                  <h3 className="mt-6 font-bold text-2xl text-stone-900 dark:text-white tracking-tight">{user.name}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">{user.email}</p>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="bg-stone-50 dark:bg-[#0A0A0A] p-5 rounded-[2rem] text-center shadow-inner border border-black/5 dark:border-white/5">
                      <p className="text-3xl font-bold text-stone-900 dark:text-white">{pastOrders.length}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest mt-1">Pedidos</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-[#0A0A0A] p-5 rounded-[2rem] text-center shadow-inner border border-black/5 dark:border-white/5">
                      <p className="text-3xl font-bold text-stone-900 dark:text-white">{favorites.length}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest mt-1">Favoritos</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-[#0A0A0A] p-5 rounded-[2rem] text-center shadow-inner border border-black/5 dark:border-white/5">
                      <p className="text-3xl font-bold text-stone-900 dark:text-white">{coupons.length}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest mt-1">Cupones</p>
                  </div>
              </div>

              {/* Edit Form */}
              <div className="bg-stone-50 dark:bg-[#0A0A0A] p-6 rounded-[2rem] shadow-inner border border-black/5 dark:border-white/5 space-y-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg text-stone-900 dark:text-white tracking-tight">Información Personal</h4>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-brand-500 text-sm font-bold hover:opacity-80 transition-opacity">Editar</button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Nombre Completo</label>
                          <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            className={`w-full bg-white dark:bg-[#141414] border rounded-2xl px-4 py-3.5 text-sm outline-none transition-all ${isEditing ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-black/5 dark:border-white/5'} text-stone-900 dark:text-white font-medium`}
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Email</label>
                          <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditing}
                            className={`w-full bg-white dark:bg-[#141414] border rounded-2xl px-4 py-3.5 text-sm outline-none transition-all ${isEditing ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-black/5 dark:border-white/5'} text-stone-900 dark:text-white font-medium`}
                          />
                      </div>
                  </div>

                  {isEditing && (
                      <div className="flex gap-3 pt-4">
                          <Button variant="outline" fullWidth onClick={() => { setIsEditing(false); setName(user.name); setEmail(user.email); }} className="border-black/10 dark:border-white/10">Cancelar</Button>
                          <Button fullWidth onClick={handleSave} className="bg-black text-white dark:bg-white dark:text-black">Guardar</Button>
                      </div>
                  )}
              </div>

              {/* Address Manager */}
              <div className="bg-stone-50 dark:bg-[#0A0A0A] p-6 rounded-[2rem] shadow-inner border border-black/5 dark:border-white/5 space-y-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg text-stone-900 dark:text-white tracking-tight">Mis Direcciones</h4>
                    <button onClick={() => setShowLocationSelector(true)} className="text-brand-500 text-sm font-bold hover:opacity-80 transition-opacity flex items-center gap-1">
                        <Plus size={14} /> Agregar
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                      {user.addresses.map((addr, idx) => (
                          <div key={idx} className="bg-white dark:bg-[#141414] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex justify-between items-center group">
                              <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
                                      <MapPin size={18} />
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{addr}</p>
                                      {idx === 0 && <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Principal</span>}
                                  </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {idx !== 0 && (
                                      <button 
                                        onClick={() => {
                                            const otherAddresses = user.addresses.filter(a => a !== addr);
                                            updateUser({ addresses: [addr, ...otherAddresses] });
                                            showToast('Dirección principal actualizada', 'success');
                                        }}
                                        className="p-2 text-stone-400 hover:text-brand-600 transition-colors"
                                      >
                                          <CheckCircle2 size={18} />
                                      </button>
                                  )}
                                  <button 
                                    onClick={() => {
                                        if (user.addresses.length <= 1) {
                                            showToast('Debes tener al menos una dirección', 'error');
                                            return;
                                        }
                                        const newAddresses = user.addresses.filter(a => a !== addr);
                                        updateUser({ addresses: newAddresses });
                                        showToast('Dirección eliminada', 'success');
                                    }}
                                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                  <button onClick={() => setClientViewState('HISTORY')} className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-[#0A0A0A] rounded-[2rem] shadow-inner border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-[#141414] rounded-2xl flex items-center justify-center text-stone-900 dark:text-white shadow-sm group-hover:scale-110 transition-transform">
                              <History size={20} />
                          </div>
                          <span className="font-bold text-stone-900 dark:text-white">Historial de Pedidos</span>
                      </div>
                      <ChevronRight size={20} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setClientViewState('FAVORITES')} className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-[#0A0A0A] rounded-[2rem] shadow-inner border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400">
                              <Heart size={20} />
                          </div>
                          <span className="font-bold text-stone-900 dark:text-white">Mis Favoritos</span>
                      </div>
                      <ChevronRight size={20} className="text-stone-300" />
                  </button>
                  <button onClick={toggleSettings} className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center text-stone-500 dark:text-stone-400">
                              <Settings size={20} />
                          </div>
                          <span className="font-bold text-stone-900 dark:text-white">Ajustes de la App</span>
                      </div>
                      <ChevronRight size={20} className="text-stone-300" />
                  </button>
              </div>

              <div className="pt-4">
                  <Button fullWidth variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => signOut()}>Cerrar Sesión</Button>
              </div>
          </div>
      </div>
    );
  };

  const ReceiptView = () => {
      if(!selectedReceiptOrder) return null;
      const order = selectedReceiptOrder;

      const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;
        
        showToast('Generando PDF...', 'info');

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`recibo-${order.id}.pdf`);
            showToast('PDF descargado', 'success');
        } catch (error) {
            console.error('PDF Error:', error);
            showToast('Error al generar PDF', 'error');
        }
      };
      
      return (
          <div className="h-full bg-stone-50 dark:bg-stone-900 animate-slide-up flex flex-col z-50">
              <div className="flex items-center gap-4 bg-white dark:bg-stone-800 px-4 py-3 border-b border-stone-100 dark:border-stone-700 sticky top-0 z-10 print:hidden">
                  <button onClick={() => setClientViewState('HISTORY')} className="p-2 -ml-2 text-stone-600 dark:text-stone-300"><ArrowLeft size={24} /></button>
                  <h2 className="text-xl font-bold dark:text-white">Recibo</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  <div id="receipt-content" className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 relative overflow-hidden">
                      {/* Paper Top Jagged Edge Simulation (Optional/CSS) */}
                      
                      <div className="text-center border-b border-stone-100 dark:border-stone-700 pb-4 mb-4">
                          <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-3">
                               <CheckCircle2 size={24} className="text-green-500" />
                          </div>
                          <h3 className="font-bold text-lg text-stone-900 dark:text-white">Pago Exitoso</h3>
                          <p className="text-stone-500 dark:text-stone-400 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-stone-600 dark:text-stone-400"><span className="font-bold text-stone-900 dark:text-white">{item.quantity}x</span> {item.product.name}</span>
                                  <span className="font-medium text-stone-900 dark:text-white">{formatCurrency(item.totalPrice * item.quantity)}</span>
                              </div>
                          ))}
                      </div>

                      <div className="border-t border-dashed border-stone-200 dark:border-stone-700 py-4 space-y-2 text-sm">
                          <div className="flex justify-between text-stone-600 dark:text-stone-400">
                              <span>Subtotal</span>
                              <span>{formatCurrency(order.total - (order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0))}</span>
                          </div>
                          <div className="flex justify-between text-stone-600 dark:text-stone-400">
                              <span>Envío</span>
                              <span>{formatCurrency(order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0)}</span>
                          </div>
                          <div className="flex justify-between text-stone-900 dark:text-white font-bold text-lg pt-2">
                              <span>Total</span>
                              <span>{formatCurrency(order.total)}</span>
                          </div>
                      </div>
                      
                      <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg text-xs text-stone-500 dark:text-stone-400 font-mono break-all text-center">
                          ID: {order.id}
                      </div>
                  </div>

                  <div className="mt-6 print:hidden">
                      <Button fullWidth variant="outline" onClick={handleDownloadPDF}>
                          <Download size={18} className="mr-2" /> Descargar PDF
                      </Button>
                  </div>
              </div>
          </div>
      )
  };

  const StoreDetail = () => {
    const storeStyle = {
      fontFamily: selectedStore?.customFont || 'inherit',
    };
    const accentColor = selectedStore?.customColor || '#FACC15';

    return (
      <div className="animate-fade-in relative pb-32 bg-white dark:bg-stone-900 min-h-screen" style={storeStyle}>
      <div className="relative h-56 w-full bg-stone-800 lg:h-80 lg:rounded-b-3xl overflow-hidden lg:max-w-7xl lg:mx-auto lg:mt-4 lg:rounded-t-3xl">
         <LazyImage src={selectedStore?.image} alt={selectedStore?.name} className="w-full h-full lg:object-cover" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
         <div className="absolute top-4 w-full px-4 flex justify-between z-10">
             <button onClick={() => setSelectedStore(null)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"><ArrowLeft size={20} /></button>
            <button onClick={(e) => selectedStore && toggleFavorite(selectedStore.id)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"><Heart size={20} className={selectedStore && favorites.includes(selectedStore.id) ? "fill-red-500 text-red-500" : "text-white"} /></button>
         </div>
      </div>
      <div className="px-4 -mt-10 relative z-10 lg:max-w-4xl lg:mx-auto lg:-mt-16">
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-lg border border-stone-100 dark:border-stone-700">
            <div className="flex justify-between items-start">
                <h2 className="font-bold text-2xl text-stone-900 dark:text-white lg:text-4xl" style={{ color: accentColor }}>{selectedStore?.name}</h2>
                <div className="bg-stone-100 dark:bg-stone-700 px-3 py-1 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300">
                    {selectedStore?.category}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-stone-500 dark:text-stone-400 text-sm lg:text-base"><Clock size={14} /> <span>{selectedStore?.deliveryTimeMin}-{selectedStore?.deliveryTimeMax} min</span><span>•</span><Star size={14} className="text-amber-400 fill-amber-400" /> <span>{selectedStore?.rating}</span> <span className="text-xs text-stone-400 dark:text-stone-500">({selectedStore?.reviewsCount} reviews)</span></div>
        </div>
      </div>
      <div className="p-4 space-y-8 lg:max-w-4xl lg:mx-auto lg:p-8">
        {/* Categories / Sections */}
        {['Más vendidos', 'Entradas', 'Platos Principales', 'Bebidas'].map((categoryName) => {
            const products = selectedStore?.products || [];
            // For demo, we just show all products in "Más vendidos" and filter others if we had categories
            if (categoryName !== 'Más vendidos') return null; 

            return (
                <div key={categoryName}>
                    <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                        {categoryName === 'Más vendidos' && <Flame size={18} className="text-orange-500" />}
                        {categoryName}
                    </h3>
                    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                        {products.map(product => (
                            <ProductRow 
                                key={product.id} 
                                product={product} 
                                onAdd={() => { 
                                    if(selectedStore) { 
                                        if (selectedStore.isOpen === false) {
                                            showToast('Este comercio está cerrado por el momento', 'error');
                                            return;
                                        }
                                        addToCart(product, 1, [], selectedStore.id); 
                                        showToast('Agregado al carrito', 'success'); 
                                    } 
                                }} 
                                onCustomize={() => {
                                    if (selectedStore?.isOpen === false) {
                                        showToast('Este comercio está cerrado por el momento', 'error');
                                        return;
                                    }
                                    setProductToCustomize(product);
                                }} 
                                accentColor={accentColor}
                            />
                        ))}
                    </div>
                </div>
            );
        })}
        
        {selectedStore && reviews.filter(r => r.storeId === selectedStore.id).length > 0 && (
            <div>
                <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-3">Reseñas</h3>
                <div className="space-y-3">
                    {reviews.filter(r => r.storeId === selectedStore.id).map(review => (
                        <div key={review.id} className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-stone-900 dark:text-white">{review.userName}</span>
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{review.rating}</span>
                                </div>
                            </div>
                            {review.comment && <p className="text-sm text-stone-600 dark:text-stone-400">{review.comment}</p>}
                            <p className="text-[10px] text-stone-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-4 flex justify-center z-50 pointer-events-none"><div className="w-full max-w-md animate-slide-up pointer-events-auto"><Button fullWidth size="lg" onClick={() => setClientViewState('CHECKOUT')} className="flex justify-between items-center px-6 shadow-xl shadow-brand-500/30 border border-white/20 dark:border-stone-700"><div className="flex items-center gap-3"><span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-sm font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span><span>Ver pedido</span></div><span className="font-bold text-lg">{formatCurrency(cart.reduce((a, b) => a + (b.totalPrice * b.quantity), 0))}</span></Button></div></div>
      )}
    </div>
    );
  };

  return (
      <div className="bg-white dark:bg-[#050505] h-full transition-colors duration-300 flex flex-col">
        {showLocationSelector && <LocationModal />}
        {productToCustomize && <ProductModal />}
        {reviewOrder && <ReviewModal />}
        {claimOrder && <ClaimModal />}
        
        {activeOrder && clientViewState !== 'TRACKING' && !productToCustomize && clientViewState !== 'HISTORY' && clientViewState !== 'RECEIPT' && (
            <div 
                onClick={() => setClientViewState('TRACKING')}
                className="w-full bg-brand-500 text-black p-3 flex justify-between items-center cursor-pointer shrink-0 z-50 shadow-xl animate-slide-down border-b border-black/10"
            >
                <div className="flex items-center gap-3">
                     {activeOrder.isOfflinePending ? (
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                     ) : (
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                     )}
                     <div>
                        <p className="text-[10px] text-black/70 font-bold uppercase tracking-widest">Pedido en curso</p>
                        <p className="font-bold text-sm tracking-tight">{activeOrder.storeName}</p>
                     </div>
                </div>
                {activeOrder.isOfflinePending ? (
                    <span className="text-xs font-bold bg-black/10 px-2 py-1 rounded-xl text-black flex items-center gap-1">
                        <WifiOff size={10} /> Esperando red
                    </span>
                ) : (
                    <BadgeStatus status={activeOrder.status} />
                )}
            </div>
        )}

        <div className="flex-1 overflow-hidden relative">
        {clientViewState === 'RECEIPT' ? <ReceiptView /> :
         clientViewState === 'TRACKING' ? <TrackingView /> : 
         clientViewState === 'CHECKOUT' ? <CheckoutView /> : 
         clientViewState === 'HISTORY' ? <HistoryView /> :
         clientViewState === 'FAVORITES' ? <FavoritesView /> :
         clientViewState === 'PROFILE' ? <ProfileView /> :
         selectedStore ? <StoreDetail /> : (
            <div className="h-full flex flex-col lg:max-w-7xl lg:mx-auto lg:w-full">
                <StoreList />
                <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                    <BannerCarousel />
                    <CategoryPills />
                    <HorizontalSection title="Cerca de ti" icon={<MapPin size={18} className="text-brand-800" />} data={recommendedStores} />
                    <HorizontalSection title="Nuevos" icon={<Sparkles size={18} className="text-amber-500" />} data={stores.filter(s => isNewStore(s.createdAt))} />
                    <HorizontalSection title="Más Rápidos" icon={<Zap size={18} className="text-amber-500" />} data={fastestStores} />
                    
                    {/* Main Feed with "History" Link */}
                    <div className="px-4 space-y-4 mt-2 lg:px-8 lg:mt-8">
                        <div className="flex justify-between items-end">
                            <h3 className="font-bold text-stone-900 dark:text-white text-lg lg:text-2xl">
                                {selectedCategory !== 'ALL' ? selectedCategory : 'Todos los Restaurantes'}
                            </h3>
                        </div>

                        {filteredStores.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-stone-800 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 mx-4 lg:mx-0">
                                <div className="mx-auto w-12 h-12 bg-stone-50 dark:bg-stone-700/50 rounded-full flex items-center justify-center mb-3">
                                    <Search size={20} className="text-stone-300 dark:text-stone-500" />
                                </div>
                                <p className="text-stone-600 dark:text-stone-400 font-bold">No encontramos resultados</p>
                                <button 
                                    onClick={() => {setSearchQuery(''); setSelectedCategory('ALL');}}
                                    className="text-brand-800 dark:text-brand-400 font-bold text-sm bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-lg mt-2"
                                >
                                    Ver todo
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {filteredStores.map((store, idx) => (
                                    <StoreCard 
                                        key={store.id} 
                                        store={store} 
                                        onClick={setSelectedStore} 
                                        index={idx}
                                        isFavorite={favorites.includes(store.id)}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
         )}
        </div>
      </div>
  );
};

const BadgeStatus: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const labels: Record<string, string> = {
        [OrderStatus.PENDING]: 'Enviando...',
        [OrderStatus.ACCEPTED]: 'Aceptado',
        [OrderStatus.PREPARING]: 'Preparando',
        [OrderStatus.READY]: 'Buscando Driver',
        [OrderStatus.DRIVER_ASSIGNED]: 'Driver Asignado',
        [OrderStatus.PICKED_UP]: 'En camino',
        [OrderStatus.DELIVERED]: 'Entregado'
    };
    return <span className="text-xs font-bold bg-black/10 px-3 py-1.5 rounded-xl text-black shadow-sm border border-black/5">{labels[status]}</span>;
}

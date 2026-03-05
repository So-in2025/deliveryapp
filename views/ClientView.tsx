
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Store, OrderStatus, Product, Modifier, PaymentMethod, OrderType, Order } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LazyImage } from '../components/ui/LazyImage';
import { Clock, Star, Plus, ShoppingBag, ArrowLeft, Bike, CheckCircle2, ChefHat, Package, MapPin, X, Minus, ChevronDown, CreditCard, Banknote, Edit3, WifiOff, Store as StoreIcon, Heart, Ticket, Tag, Flame, Utensils, Coffee, Pizza, Search, Sparkles, Zap, Calendar, History, ChevronRight, FileText, Download, AlertTriangle } from 'lucide-react';
import { APP_CONFIG, formatCurrency } from '../constants';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
            className={`group bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer animate-slide-up relative ${compact ? 'min-w-[200px] w-[200px]' : 'w-full h-full flex flex-col'}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`relative w-full rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-700 ${compact ? 'h-28' : 'h-40 shrink-0'}`}>
                <LazyImage 
                    src={store.image} 
                    alt={store.name} 
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500" 
                />
                {/* Badges Overlay */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm text-slate-900 dark:text-white">
                        <Clock size={12} /> {store.deliveryTimeMin} min
                    </div>
                    {isNew && (
                        <div className="bg-brand-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm animate-pulse-soft">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Favorite Button Overlay */}
                <button 
                    onClick={(e) => onToggleFavorite(e, store.id)}
                    className="absolute top-2 left-2 p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 active:scale-90 transition-all z-10"
                >
                    <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : "text-white"} />
                </button>
            </div>
            <div className="px-1 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-slate-900 dark:text-white leading-tight ${compact ? 'text-sm' : 'text-lg'}`}>{store.name}</h3>
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                        <Star size={12} fill="currentColor" className="text-amber-400" />
                        <span className="text-xs font-bold">{displayRating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({store.reviewsCount})</span>
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-auto pt-1">{store.category} • Envío {formatCurrency(store.deliveryFee ?? 45)}</p>
            </div>
        </div>
    );
});

const ProductRow = React.memo(({ product, onAdd, onCustomize }: { product: Product; onAdd: () => void; onCustomize: () => void }) => (
    <div className="flex gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
        <div className="flex-1 space-y-1 relative z-10">
            <h4 className="font-bold text-slate-900 dark:text-white">{product.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{product.description}</p>
            <p className="font-bold text-brand-600 dark:text-brand-400 mt-2">{formatCurrency(product.price)}</p>
        </div>
        <div className="flex flex-col justify-between items-end gap-2 relative z-10">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm">
                <LazyImage src={product.image} alt={product.name} className="w-full h-full" />
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
                className="absolute bottom-0 right-0 bg-slate-900 dark:bg-brand-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform hover:bg-slate-800 dark:hover:bg-brand-500"
                aria-label="Agregar"
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
));

export const ClientView: React.FC = () => {
  // Consume Global State for navigation
  const { stores, addToCart, cart, placeOrder, orders, favorites, toggleFavorite, coupons, toggleSettings, user, updateUser, clientViewState, setClientViewState, selectedStore, setSelectedStore, addReview, reviews, addCoupon, cancelOrder, submitClaim } = useApp();
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
      return [...stores]
        .sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin)
        .slice(0, 5);
  }, [stores]);

  const filteredStores = useMemo(() => {
    const sorted = [...stores].sort((a, b) => {
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slide-up z-10">
                <button onClick={() => setClaimOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
                    <AlertTriangle size={24} />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Iniciar Reclamo</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Cuéntanos qué pasó con tu pedido de {claimOrder.storeName}. Te ayudaremos a resolverlo.</p>

                <textarea 
                    placeholder="Describe el problema (ej: pedido incompleto, comida fría...)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 outline-none focus:border-brand-500 text-sm h-32 resize-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-slide-up z-10 text-center">
                <button onClick={() => setReviewOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Califica tu pedido</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{reviewOrder.storeName}</p>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-90"
                        >
                            <Star 
                                size={32} 
                                className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                            />
                        </button>
                    ))}
                </div>

                <textarea 
                    placeholder="¿Qué te pareció la comida?"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 outline-none focus:border-brand-500 text-sm h-24 resize-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up overflow-hidden">
                 <div className="relative h-56 shrink-0 bg-slate-100 dark:bg-slate-800">
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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{productToCustomize.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{productToCustomize.description}</p>
                    </div>
                    {productToCustomize.modifierGroups?.map(group => (
                        <div key={group.id} className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{group.name}</h3>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
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
                                            className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <span className={`${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{option.name}</span>
                                            </div>
                                            {option.price > 0 && (
                                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">+{formatCurrency(option.price)}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 safe-pb">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all"><Minus size={18} /></button>
                            <span className="font-bold w-6 text-center text-lg dark:text-white">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-3 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all"><Plus size={18} /></button>
                        </div>
                        <div className="flex-1 text-right">
                             <span className="text-xs text-slate-400 font-bold uppercase block">Total</span>
                             <span className="text-2xl font-bold text-brand-600">{formatCurrency(total)}</span>
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
      return (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowLocationSelector(false)}></div>
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 relative animate-slide-up z-10">
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Selecciona tu ubicación</h3>
                  
                  <div className="space-y-2">
                      {user.addresses.map((addr, idx) => (
                          <button 
                              key={idx}
                              onClick={() => {
                                  showToast(`Ubicación actualizada: ${addr.split('(')[0]}`, 'success');
                                  setShowLocationSelector(false);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                          >
                              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                  <MapPin size={16} />
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{addr}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Disponible para entrega</p>
                              </div>
                              {idx === 0 && <CheckCircle2 size={16} className="ml-auto text-brand-600 dark:text-brand-400" />}
                          </button>
                      ))}
                      
                      <button 
                          onClick={() => {
                              const newAddress = window.prompt("Ingresa tu nueva dirección:");
                              if (newAddress && newAddress.trim()) {
                                  const updatedAddresses = [...user.addresses, newAddress.trim()];
                                  updateUser({ addresses: updatedAddresses });
                                  showToast('Dirección agregada', 'success');
                              }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-brand-600 dark:text-brand-400 font-bold text-sm mt-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      >
                          <Plus size={18} /> Agregar nueva dirección
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const BannerCarousel = () => (
      <div className="overflow-x-auto scrollbar-hide flex gap-4 px-4 pb-4 snap-x">
            <div 
                onClick={() => {
                    addCoupon({ id: `promo-${Date.now()}`, code: 'BENVENUTO20', discountPct: 0.2, active: true, description: 'Promo Bienvenida' });
                    showToast('¡Cupón BENVENUTO20 copiado y aplicado!', 'success');
                }}
                className="snap-center shrink-0 w-[85%] relative h-40 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            >
             <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-6">
                 <div>
                     <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 inline-block">PROMO</span>
                     <h3 className="text-white text-xl font-bold leading-tight">20% OFF en<br/>Tu Primera Orden</h3>
                     <p className="text-slate-200 text-xs mt-1">Toca para aplicar</p>
                 </div>
             </div>
          </div>
          <div 
            onClick={() => {
                setSelectedCategory('Pizza & Pasta');
                showToast('Filtrando: Pizza Artesanal', 'info');
            }}
            className="snap-center shrink-0 w-[85%] relative h-40 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
          >
             <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-orange-900/70 to-transparent flex items-center p-6">
                 <div>
                     <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 inline-block">NUEVO</span>
                     <h3 className="text-white text-xl font-bold leading-tight">Festival de<br/>Pizza Artesanal</h3>
                     <p className="text-slate-200 text-xs mt-1">Ver restaurantes</p>
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
                        ? 'bg-slate-900 dark:bg-brand-600 text-white border-slate-900 dark:border-brand-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                    }`}
                >
                    {cat !== 'Todos' && <Icon size={14} className={isSelected ? "text-brand-400 dark:text-white" : "text-slate-400 dark:text-slate-500"} />}
                    {cat}
                </button>
              )
          })}
      </div>
  );

  const HorizontalSection = ({ title, icon, data }: { title: string, icon: React.ReactNode, data: Store[] }) => (
      <div className="mt-2">
         <div className="px-4 flex justify-between items-end mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{icon} {title}</h3>
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
    <div className="space-y-4 animate-fade-in pt-2 bg-slate-50 dark:bg-slate-900 lg:bg-transparent">
      <div className="px-4 py-2 flex justify-between items-center bg-white dark:bg-slate-800 lg:bg-transparent lg:border-none sticky top-0 z-20 shadow-sm lg:shadow-none border-b border-slate-100 dark:border-slate-700">
          <div onClick={() => setShowLocationSelector(true)} className="cursor-pointer active:opacity-70 transition-opacity lg:bg-white lg:dark:bg-slate-800 lg:px-4 lg:py-2 lg:rounded-xl lg:shadow-sm lg:border lg:border-slate-100 lg:dark:border-slate-700">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Ubicación</p>
              <div className="flex items-center gap-1 text-slate-900 dark:text-white font-bold text-sm">
                  <MapPin size={14} className="text-brand-600 dark:text-brand-400" />
                  {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : 'Sin dirección'}
                  <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
              </div>
          </div>
          <div className="flex items-center gap-2">
              <button 
                onClick={() => setClientViewState('HISTORY')}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 lg:bg-white lg:dark:bg-slate-800 px-3 py-1.5 lg:py-2 lg:px-4 rounded-full lg:rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 lg:shadow-sm lg:border lg:border-slate-100 lg:dark:border-slate-700 transition-colors"
              >
                  <History size={14} className="text-brand-600 dark:text-brand-400" />
                  <span className="font-bold text-xs lg:text-sm text-slate-700 dark:text-slate-300">Pedidos</span>
              </button>
              <button 
                onClick={toggleSettings}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-100 dark:bg-slate-700 lg:bg-white lg:dark:bg-slate-800 rounded-full lg:rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 lg:shadow-sm lg:border lg:border-slate-100 lg:dark:border-slate-700 transition-colors lg:hidden"
              >
                  <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                      {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </span>
              </button>
          </div>
      </div>
      <div className="px-4 mt-2 lg:max-w-2xl lg:mx-auto">
         <div className="bg-white dark:bg-slate-800 p-2 lg:p-3 rounded-xl lg:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
             <Search size={18} className="text-slate-400 dark:text-slate-500 ml-2" />
             <input 
                placeholder="¿Qué vas a comer hoy?"
                className="flex-1 outline-none text-sm lg:text-base p-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
         </div>
      </div>
    </div>
  );

    const TrackingView = () => {
    // Logic to show the just-finished order
    let displayOrder = activeOrder;
    
    // If no active order, check if we just finished one or cancelled one
    if (!displayOrder) {
        // If we are in tracking view but order is gone from active (delivered/cancelled), show the last one
        // But only if it was recent (e.g. top of the list)
        displayOrder = pastOrders[0];
    }

    if (!displayOrder) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-6">
                    <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay pedido activo</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">Explora los restaurantes y realiza tu primer pedido.</p>
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
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 animate-fade-in">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full shadow-sm mb-6 border border-red-100 dark:border-red-900/30">
                    <X size={48} className="text-red-500 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pedido Cancelado</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">El pedido ha sido cancelado.</p>
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
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 animate-slide-up">
            <div className="bg-white dark:bg-slate-800 p-6 pb-8 rounded-b-[2.5rem] shadow-sm z-10">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Tiempo estimado</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {displayOrder.status === OrderStatus.DELIVERED ? 'Entregado' : estimatedTime}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-8">
                     <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 animate-pulse'}`}>
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
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-all">
                        {displayOrder.isOfflinePending ? "Esperando conexión..." : 
                        (displayOrder.status === OrderStatus.DELIVERED ? "¡Disfruta tu comida!" : 
                         steps[safeIndex]?.label || "Procesando")}
                     </h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{displayOrder.storeName}</p>
                     
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
                         <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
                             <StoreIcon size={12} /> Retiro en Local
                         </div>
                     )}
                </div>

                <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-green-500' : displayOrder.isOfflinePending ? 'bg-slate-300 dark:bg-slate-500' : 'bg-brand-600'}`} style={{ width: getProgressWidth() }}></div>
                </div>
            </div>

             {displayOrder.type === OrderType.DELIVERY && (displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP) && (
                <div className="px-6 mt-6 mb-2">
                    <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-inner border border-slate-200 dark:border-slate-700">
                        {/* Simulated Town Map */}
                        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 opacity-60">
                             <div className="w-full h-full" style={{backgroundImage: 'radial-gradient(var(--tw-colors-slate-400) 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                             <div className="absolute top-1/2 left-0 w-full h-2 bg-white dark:bg-slate-700 transform -rotate-12"></div>
                             <div className="absolute top-0 left-1/3 w-2 h-full bg-white dark:bg-slate-700 transform"></div>
                        </div>
                        
                        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                            <div className="w-8 h-8 bg-brand-600 rounded-full border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center"><Bike size={16} className="text-white" /></div>
                            <div className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm mt-1 text-slate-900 dark:text-white">{displayOrder.driverName || 'Repartidor'}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Detalle del Pedido</h3>
                    {displayOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div>
                                <div className="flex gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> 
                                    <span className="text-slate-700 dark:text-slate-300">{item.product.name}</span>
                                </div>
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">{formatCurrency(item.totalPrice * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Envío</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {(displayOrder.type === OrderType.DELIVERY ? (displayOrder.deliveryFee ?? 45) : 0) > 0 
                                ? formatCurrency(displayOrder.type === OrderType.DELIVERY ? (displayOrder.deliveryFee ?? 45) : 0) 
                                : 'Gratis'}
                        </span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 mt-3 pt-3 flex justify-between font-bold text-slate-900 dark:text-white">
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

    // FIXED FEE LOGIC
    const deliveryFee = orderType === OrderType.DELIVERY ? (selectedStore?.deliveryFee ?? 45) : 0;

    const handleApplyCoupon = () => {
        const found = coupons.find(c => c.code === couponCode.toUpperCase() && c.active);
        if (found) { setAppliedCoupon({ code: found.code, discountPct: found.discountPct }); showToast('¡Cupón aplicado!', 'success'); } else { showToast('Cupón inválido.', 'error'); setAppliedCoupon(null); }
    };
    const discountAmount = appliedCoupon ? (subtotal + deliveryFee) * appliedCoupon.discountPct : 0;
    const total = subtotal + deliveryFee - discountAmount;

    const handlePlaceOrder = async () => {
        if (!selectedStore) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        placeOrder(selectedStore.id, selectedStore.name, deliveryAddr, paymentMethod, notes, orderType, discountAmount);
        setIsProcessing(false); 
        // Note: Layout will handle navigation reset, but placeOrder clears selectedStore via context
        setClientViewState('TRACKING'); 
        showToast('Pedido enviado', 'success');
    };

    return (
      <div className="h-full flex flex-col animate-fade-in bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 shrink-0">
          <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-slate-600 dark:text-slate-300" disabled={isProcessing}><ArrowLeft size={24} /></button>
          <h2 className="text-xl font-bold dark:text-white">Confirmar Pedido</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-2">
             <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === OrderType.DELIVERY ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}><Bike size={18} /> Envío</button>
             <button onClick={() => setOrderType(OrderType.PICKUP)} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${orderType === OrderType.PICKUP ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}><StoreIcon size={18} /> Retiro</button>
          </div>
          {orderType === OrderType.DELIVERY && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm animate-slide-up">
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-900 dark:text-white">Dirección</h3><button className="text-brand-600 dark:text-brand-400 text-sm font-bold">Editar</button></div>
                <div className="space-y-2">{addresses.map(addr => (<div key={addr} onClick={() => !isProcessing && setDeliveryAddr(addr)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${deliveryAddr === addr ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-100 dark:border-slate-700'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryAddr === addr ? 'border-brand-600' : 'border-slate-300 dark:border-slate-600'}`}>{deliveryAddr === addr && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full"></div>}</div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{addr}</span></div>))}</div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-slate-900 dark:text-white mb-3">Método de Pago</h3><div className="flex gap-3"><button onClick={() => setPaymentMethod(PaymentMethod.CARD)} disabled={isProcessing} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CARD ? 'border-brand-600 bg-brand-600 text-white shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isProcessing ? 'opacity-50' : ''}`}><CreditCard size={24} /><span className="text-xs font-bold">Tarjeta</span></button><button onClick={() => setPaymentMethod(PaymentMethod.CASH)} disabled={isProcessing} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-brand-600 bg-brand-600 text-white shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isProcessing ? 'opacity-50' : ''}`}><Banknote size={24} /><span className="text-xs font-bold">Efectivo</span></button></div></div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Ticket size={16} className="text-brand-600 dark:text-brand-400" /> Cupón</h3>
              {appliedCoupon ? (<div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 p-3 rounded-xl"><div className="flex items-center gap-2"><Tag size={16} className="text-green-600 dark:text-green-400" /><div><p className="font-bold text-green-800 dark:text-green-300 text-sm">{appliedCoupon.code}</p><p className="text-xs text-green-600 dark:text-green-400">{(appliedCoupon.discountPct * 100)}% descuento</p></div></div><button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-full text-green-700 dark:text-green-400"><X size={16} /></button></div>) : (<div className="flex gap-2"><input type="text" placeholder="Ej: BENVENUTO20" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={isProcessing} className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white" /><Button size="sm" onClick={handleApplyCoupon} disabled={!couponCode || isProcessing} className="px-4">Aplicar</Button></div>)}
          </div>
          <div id="order-summary" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
             <h3 className="font-bold text-slate-900 dark:text-white mb-3">Resumen</h3>
             <div className="space-y-2 mb-3">{cart.map((item, idx) => (<div key={idx} className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">{item.quantity}x {item.product.name}</span><span className="text-slate-900 dark:text-white font-medium">{formatCurrency(item.totalPrice * item.quantity)}</span></div>))}</div>
             {orderType === OrderType.DELIVERY && (
                 <div className="flex justify-between text-sm py-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                     <span className="text-slate-600 dark:text-slate-400">Costo de Envío</span>
                     <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(deliveryFee)}</span>
                 </div>
             )}
             {appliedCoupon && (<div className="flex justify-between items-center py-2 border-t border-dashed border-slate-200 dark:border-slate-700 text-green-600 dark:text-green-400"><span className="text-sm font-medium">Descuento</span><span className="font-bold">- {formatCurrency(discountAmount)}</span></div>)}
             <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center"><span className="font-bold text-slate-900 dark:text-white text-lg">Total</span><span className="font-bold text-brand-600 dark:text-brand-400 text-lg">{formatCurrency(total)}</span></div>
          </div>
          <div className="h-20"></div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 pb-safe shrink-0 absolute bottom-0 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-none z-20">
          <Button fullWidth size="lg" disabled={cart.length === 0 || isProcessing} isLoading={isProcessing} onClick={handlePlaceOrder}>{isProcessing ? 'Procesando...' : `Confirmar - ${formatCurrency(total)}`}</Button>
        </div>
      </div>
    );
  };

  const HistoryView = () => (
      <div className="h-full bg-slate-50 dark:bg-slate-900 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2 -ml-2 text-slate-600 dark:text-slate-300"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold dark:text-white">Mis Pedidos</h2>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {pastOrders.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                      <History size={48} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-slate-500 dark:text-slate-400">No tienes historial aún.</p>
                  </div>
              ) : (
                  pastOrders.map(order => (
                      <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-slate-900 dark:text-white">{order.storeName}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 
                                  order.status === OrderStatus.DISPUTED ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                                  {order.status === OrderStatus.DELIVERED ? 'ENTREGADO' : 
                                   order.status === OrderStatus.DISPUTED ? 'EN RECLAMO' : 'CANCELADO'}
                              </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} productos</p>
                          
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

                          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
                              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
                              
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
                                    className="text-xs font-bold text-brand-600 flex items-center gap-1 active:opacity-60 transition-opacity"
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
          <div className="h-full bg-slate-50 dark:bg-slate-900 animate-slide-up flex flex-col z-50">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 print:hidden">
                  <button onClick={() => setClientViewState('HISTORY')} className="p-2 -ml-2 text-slate-600 dark:text-slate-300"><ArrowLeft size={24} /></button>
                  <h2 className="text-xl font-bold dark:text-white">Recibo</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  <div id="receipt-content" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                      {/* Paper Top Jagged Edge Simulation (Optional/CSS) */}
                      
                      <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                               <CheckCircle2 size={24} className="text-green-500" />
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pago Exitoso</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> {item.product.name}</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(item.totalPrice * item.quantity)}</span>
                              </div>
                          ))}
                      </div>

                      <div className="border-t border-dashed border-slate-200 dark:border-slate-700 py-4 space-y-2 text-sm">
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                              <span>Subtotal</span>
                              <span>{formatCurrency(order.total - (order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0))}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                              <span>Envío</span>
                              <span>{formatCurrency(order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0)}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg pt-2">
                              <span>Total</span>
                              <span>{formatCurrency(order.total)}</span>
                          </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-xs text-slate-500 dark:text-slate-400 font-mono break-all text-center">
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

  const StoreDetail = () => (
      <div className="animate-fade-in relative pb-32 bg-white dark:bg-slate-900 min-h-screen">
      <div className="relative h-56 w-full bg-slate-800">
         <LazyImage src={selectedStore?.image} alt={selectedStore?.name} className="w-full h-full" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
         <div className="absolute top-4 w-full px-4 flex justify-between z-10">
             <button onClick={() => setSelectedStore(null)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"><ArrowLeft size={20} /></button>
            <button onClick={(e) => selectedStore && toggleFavorite(selectedStore.id)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"><Heart size={20} className={selectedStore && favorites.includes(selectedStore.id) ? "fill-red-500 text-red-500" : "text-white"} /></button>
         </div>
      </div>
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-2xl text-slate-900 dark:text-white">{selectedStore?.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-sm"><Clock size={14} /> <span>{selectedStore?.deliveryTimeMin}-{selectedStore?.deliveryTimeMax} min</span><span>•</span><Star size={14} className="text-amber-400 fill-amber-400" /> <span>{selectedStore?.rating}</span> <span className="text-xs text-slate-400 dark:text-slate-500">({selectedStore?.reviewsCount} reviews)</span></div>
        </div>
      </div>
      <div className="p-4 space-y-6 lg:max-w-4xl lg:mx-auto lg:p-8">
        <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Más vendidos</h3>
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {selectedStore?.products.map(product => (<ProductRow key={product.id} product={product} onAdd={() => { if(selectedStore) { addToCart(product, 1, [], selectedStore.id); showToast('Agregado al carrito', 'success'); } }} onCustomize={() => setProductToCustomize(product)} />))}
            </div>
        </div>
        
        {selectedStore && reviews.filter(r => r.storeId === selectedStore.id).length > 0 && (
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Reseñas</h3>
                <div className="space-y-3">
                    {reviews.filter(r => r.storeId === selectedStore.id).map(review => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{review.userName}</span>
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{review.rating}</span>
                                </div>
                            </div>
                            {review.comment && <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>}
                            <p className="text-[10px] text-slate-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-4 flex justify-center z-50 pointer-events-none"><div className="w-full max-w-md animate-slide-up pointer-events-auto"><Button fullWidth size="lg" onClick={() => setClientViewState('CHECKOUT')} className="flex justify-between items-center px-6 shadow-xl shadow-brand-500/30 border border-white/20 dark:border-slate-700"><div className="flex items-center gap-3"><span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-sm font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span><span>Ver pedido</span></div><span className="font-bold text-lg">{formatCurrency(cart.reduce((a, b) => a + (b.totalPrice * b.quantity), 0))}</span></Button></div></div>
      )}
    </div>
  );

  return (
      <div className="bg-slate-50 dark:bg-slate-900 h-full transition-colors duration-300 flex flex-col">
        {showLocationSelector && <LocationModal />}
        {productToCustomize && <ProductModal />}
        {reviewOrder && <ReviewModal />}
        {claimOrder && <ClaimModal />}
        
        {activeOrder && clientViewState !== 'TRACKING' && !productToCustomize && clientViewState !== 'HISTORY' && clientViewState !== 'RECEIPT' && (
            <div 
                onClick={() => setClientViewState('TRACKING')}
                className="w-full bg-slate-900 text-white p-3 flex justify-between items-center cursor-pointer shrink-0 z-50 shadow-md animate-slide-down"
            >
                <div className="flex items-center gap-3">
                     {activeOrder.isOfflinePending ? (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                     ) : (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                     )}
                     <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Pedido en curso</p>
                        <p className="font-bold text-sm">{activeOrder.storeName}</p>
                     </div>
                </div>
                {activeOrder.isOfflinePending ? (
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white flex items-center gap-1">
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
         selectedStore ? <StoreDetail /> : (
            <div className="h-full flex flex-col">
                <StoreList />
                <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                    <BannerCarousel />
                    <CategoryPills />
                    <HorizontalSection title="Cerca de ti" icon={<MapPin size={18} className="text-brand-600" />} data={recommendedStores} />
                    <HorizontalSection title="Nuevos" icon={<Sparkles size={18} className="text-amber-500" />} data={stores.filter(s => isNewStore(s.createdAt))} />
                    <HorizontalSection title="Más Rápidos" icon={<Zap size={18} className="text-amber-500" />} data={fastestStores} />
                    
                    {/* Main Feed with "History" Link */}
                    <div className="px-4 space-y-4 mt-2 lg:px-8 lg:mt-8">
                        <div className="flex justify-between items-end">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg lg:text-2xl">
                                {selectedCategory !== 'ALL' ? selectedCategory : 'Todos los Restaurantes'}
                            </h3>
                        </div>

                        {filteredStores.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mx-4 lg:mx-0">
                                <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                    <Search size={20} className="text-slate-300 dark:text-slate-500" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-bold">No encontramos resultados</p>
                                <button 
                                    onClick={() => {setSearchQuery(''); setSelectedCategory('ALL');}}
                                    className="text-brand-600 dark:text-brand-400 font-bold text-sm bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-lg mt-2"
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
    return <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white">{labels[status]}</span>;
}

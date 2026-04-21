
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp, calculateDynamicDeliveryDetails } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MapSelector } from '../components/ui/MapSelector';
import { Store, OrderStatus, Product, Modifier, PaymentMethod, OrderType, Order, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { LazyImage } from '../components/ui/LazyImage';
import { ChatOverlay } from '../components/ui/ChatOverlay';
import { Clock, Star, Plus, ShoppingBag, ArrowLeft, Bike, CheckCircle2, ChefHat, Package, MapPin, X, Minus, ChevronDown, CreditCard, Banknote, WifiOff, Store as StoreIcon, Heart, Ticket, Tag, Flame, Utensils, Search, Sparkles, Zap, History, ChevronRight, Download, AlertTriangle, User, Phone, MessageSquare, Settings, Trash2, FileText, DollarSign, Camera, Share, Mail, HelpCircle } from 'lucide-react';
import { formatCurrency, APP_CONFIG } from '../constants';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- HELPER LOGIC ---

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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapUpdater center={center} />
            
            {driverLat && driverLng && (
                <Marker position={[driverLat, driverLng]} icon={driverIcon}>
                    <Popup>Repartidor en camino</Popup>
                </Marker>
            )}

            {storeLat && storeLng && (
                <Marker position={[storeLat, storeLng]} icon={storeIcon}>
                    <Popup>Tienda</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

// Heuristic: Is the store considered "New"? (Less than 7 days old)
const isNewStore = (dateString: string): boolean => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
};

  // --- MEMOIZED COMPONENTS ---

  const StoreCard = React.memo(({ store, onClick, index, isFavorite, onToggleFavorite, onShare, compact = false }: { store: Store; onClick: (s: Store) => void; index: number; isFavorite: boolean; onToggleFavorite: (e: React.MouseEvent, id: string) => void; onShare: (e: React.MouseEvent, store: Store) => void; compact?: boolean }) => {
    const isNew = isNewStore(store.createdAt);
    const displayRating = (isNew && store.reviewsCount === 0) ? 5.0 : store.rating;
    
    return (
        <div 
            onClick={() => onClick(store)}
            className={`group bg-white dark:bg-stone-900/40 rounded-[2.5rem] p-3 shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm active:scale-[0.98] transition-all duration-500 cursor-pointer animate-slide-up relative overflow-hidden hover:shadow-brand-500/5 hover:border-brand-500/20 ${compact ? 'min-w-[260px] w-[260px]' : 'w-full h-full flex flex-col'}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`relative w-full rounded-[2rem] overflow-hidden mb-4 bg-stone-100 dark:bg-stone-800 ${compact ? 'h-36' : 'h-52 shrink-0'}`}>
                <LazyImage 
                    src={store.image} 
                    alt={store.name} 
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out ${store.isOpen === false ? 'grayscale opacity-40' : ''}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                {store.isOpen === false && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-black/40 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 shadow-2xl transform -rotate-6 scale-110">
                            <span className="text-white font-black text-xl tracking-[0.2em] uppercase">CERRADO</span>
                        </div>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl px-4 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-2xl text-white border border-white/20">
                        <Clock size={14} className="text-brand-500" /> {store.deliveryTimeMin} MIN
                    </div>
                    {isNew && (
                        <div className="bg-brand-500 text-brand-950 px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl animate-pulse-soft tracking-[0.15em]">
                            NUEVO
                        </div>
                    )}
                </div>

                {/* Favorite Button Overlay */}
                <button 
                    onClick={(e) => onToggleFavorite(e, store.id)}
                    className="absolute top-4 left-4 p-3 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl hover:bg-brand-500/20 active:scale-90 transition-all z-10 border border-white/10 group/fav"
                >
                    <Heart size={20} className={`${isFavorite ? "fill-red-500 text-red-500" : "text-white"} transition-colors duration-300 group-hover/fav:scale-110`} />
                </button>

                {/* Share Button Overlay */}
                <button 
                    onClick={(e) => onShare(e, store)}
                    className="absolute top-16 left-4 p-3 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl hover:bg-brand-500/20 active:scale-90 transition-all z-10 border border-white/10 group/share"
                >
                    <Share size={20} className="text-white transition-colors duration-300 group-hover/share:scale-110" />
                </button>
            </div>
            <div className="px-3 flex-1 flex flex-col pb-2">
                <div className="flex justify-between items-start gap-3">
                    <h3 className={`font-black text-stone-900 dark:text-white leading-tight tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors ${compact ? 'text-lg' : 'text-2xl'}`}>{store.name}</h3>
                    <div className="flex items-center gap-1.5 text-stone-900 dark:text-white bg-stone-100 dark:bg-white/5 px-3 py-1.5 rounded-xl shrink-0 border border-black/5 dark:border-white/5">
                        <Star size={14} fill="currentColor" className="text-brand-500" />
                        <span className="text-sm font-black">{displayRating.toFixed(1)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-3">
                    <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest">{store.category}</p>
                    <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-700"></span>
                    <p className="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest">Envío {formatCurrency(store.deliveryFee ?? 45)}</p>
                </div>
            </div>
        </div>
    );
});

const ProductRow = React.memo(({ product, onAdd, onCustomize, accentColor }: { product: Product; onAdd: () => void; onCustomize: () => void; accentColor?: string }) => {
    const isAvailable = product.isAvailable !== false;
    
    return (
        <div className={`flex gap-5 p-5 rounded-[2.5rem] bg-white dark:bg-stone-900/40 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm relative overflow-hidden shadow-2xl shadow-black/5 group hover:border-brand-500/20 transition-all duration-500 ${!isAvailable ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            <div className="flex-1 space-y-3 relative z-10 py-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-black text-xl text-stone-900 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{product.name}</h4>
                    {!isAvailable && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Agotado</span>
                    )}
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                <p className="font-black text-xl mt-4" style={accentColor ? { color: accentColor } : { color: '#FACC15' }}>{formatCurrency(product.price)}</p>
            </div>
            <div className="flex flex-col justify-between items-end gap-4 relative z-10">
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-inner border border-black/5 dark:border-white/5">
                    <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                </div>
                <button 
                    disabled={!isAvailable}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAvailable) return;
                        if (product.modifierGroups && product.modifierGroups.length > 0) {
                            onCustomize();
                        } else {
                            onAdd();
                        }
                    }}
                    className={`absolute -bottom-1 -right-1 p-4 rounded-2xl shadow-2xl active:scale-90 transition-all ${isAvailable ? 'bg-stone-950 dark:bg-white text-white dark:text-stone-950 hover:scale-110 hover:rotate-3' : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'}`}
                    style={isAvailable && accentColor ? { backgroundColor: accentColor, color: '#000' } : {}}
                    aria-label="Agregar"
                >
                    <Plus size={24} strokeWidth={4} />
                </button>
            </div>
        </div>
    );
});

export const ClientView: React.FC = () => {
  // Consume Global State for navigation
  const { stores, addToCart, cart, placeOrder, orders, favorites, toggleFavorite, coupons, toggleSettings, user, updateUser, clientViewState, setClientViewState, selectedStore, setSelectedStore, addReview, reviews, addCoupon, submitClaim, clearCart, updateCartItemQuantity, removeFromCart, users, completeTour, config, applyReferralCode, setRole, setPendingAction, getRouteDistance, socket, banners } = useApp();
  const { showToast } = useToast();
  const { signOut, user: authUser, login } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  
  // Real-time tracking state
  const [liveDriverLocation, setLiveDriverLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (clientViewState === 'TRACKING' && socket) {
      const activeOrder = orders.find(o => o.customerId === user.uid && (o.status === OrderStatus.DRIVER_ASSIGNED || o.status === OrderStatus.PICKED_UP));
      
      if (activeOrder && activeOrder.driverId) {
        socket.emit('join_tracking', activeOrder.driverId);
        
        const handleLocationUpdate = (data: { driverId: string, lat: number, lng: number }) => {
          if (data.driverId === activeOrder.driverId) {
            setLiveDriverLocation({ lat: data.lat, lng: data.lng });
          }
        };

        socket.on('driver_location', handleLocationUpdate);

        return () => {
          socket.off('driver_location', handleLocationUpdate);
        };
      }
    }
  }, [clientViewState, socket, orders, user.uid]);

  const isMobile = window.innerWidth < 1024;

  const clientTourSteps: TourStep[] = [
    {
        targetId: 'location-selector',
        title: 'Tu Ubicación',
        description: 'Asegúrate de configurar tu dirección correctamente para que los pedidos lleguen a tu puerta sin demoras.',
        position: 'bottom'
    },
    {
        targetId: 'search-bar',
        title: 'Buscador Inteligente',
        description: 'Busca platos específicos, categorías o tus comercios favoritos en segundos. ¡Encuentra lo que se te antoja!',
        position: 'bottom'
    },
    {
        targetId: 'category-pills',
        title: 'Explora por Categoría',
        description: 'Filtra rápidamente los restaurantes por el tipo de comida que más te guste.',
        position: 'bottom'
    },
    {
        targetId: isMobile ? 'history-tab-mobile' : 'history-tab',
        title: 'Tus Pedidos',
        description: 'Accede rápidamente a tu historial y repite tus pedidos favoritos con un solo toque.',
        position: isMobile ? 'top' : 'right'
    },
    {
        targetId: isMobile ? 'profile-tab-mobile' : 'profile-tab',
        title: 'Tu Perfil y Ajustes',
        description: 'Gestiona tus datos, métodos de pago, direcciones y preferencias desde aquí.',
        position: isMobile ? 'top' : 'right'
    }
  ];

  const showTour = !user.completedTours?.includes('client-onboarding') && clientViewState === 'BROWSE';

  const handleShareStore = useCallback(async (e: React.MouseEvent, store: Store) => {
    e.stopPropagation();
    const shareData = {
      title: store.name,
      text: `¡Mira esta tienda en ${APP_CONFIG.appName}!`,
      url: `${window.location.origin}?store=${store.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Enlace copiado al portapapeles", "success");
      }
    } catch {
      showToast("Error al compartir", "error");
    }
  }, [showToast]);

  // Handle Store Sharing Link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    if (storeId && stores.length > 0) {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setSelectedStore(store);
        // Clean up URL
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]store=[^&]*/, '').replace(/^&/, '?').replace(/\?$/, '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [stores, setSelectedStore]);
  
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
  const [showMapSelector, setShowMapSelector] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');

  // --- ALGORITHMIC LISTS (HEURISTICS) ---

  const recommendedStores = useMemo(() => {
      return stores
        .filter(s => s.isActive === true)
        .map(s => ({
            ...s,
            score: (s.rating * 20) - (s.deliveryTimeMin) // Simple efficient algo
        }))
        .sort((a, b) => b.score - a.score) // Descending
        .slice(0, 5); // Top 5
  }, [stores]);

  const fastestStores = useMemo(() => {
      return stores
        .filter(s => s.isActive === true)
        .sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin)
        .slice(0, 5);
  }, [stores]);

  const filteredStores = useMemo(() => {
    const sorted = stores
        .filter(s => s.isActive === true)
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

  // Handle Mercado Pago Return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = window.location.pathname.split('/').pop();
    const orderId = urlParams.get('id');

    if (orderId && (status === 'order-success' || status === 'order-failure' || status === 'order-pending')) {
        if (status === 'order-success') {
            showToast('¡Pago exitoso! Tu pedido está en camino.', 'success');
            clearCart();
            setClientViewState('TRACKING');
        } else if (status === 'order-failure') {
            showToast('El pago fue rechazado. Intenta nuevamente.', 'error');
            setClientViewState('CHECKOUT');
        } else if (status === 'order-pending') {
            showToast('El pago está pendiente de aprobación.', 'info');
            clearCart();
            setClientViewState('TRACKING');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname.split('/').slice(0, -1).join('/') || '/');
    }
  }, [clearCart, setClientViewState, showToast]);

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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" onClick={() => setProductToCustomize(null)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] border border-black/[0.03] dark:border-white/[0.03]">
                 <div className="relative h-64 shrink-0">
                    <LazyImage src={productToCustomize.image} alt={productToCustomize.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent"></div>
                    <button onClick={() => setProductToCustomize(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/20 backdrop-blur-xl rounded-2xl text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/10 shadow-2xl"><X size={24} /></button>
                            <div className="p-8 space-y-8 overflow-y-auto flex-1">
                    <div>
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{productToCustomize.name}</h3>
                            <span className="text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">{formatCurrency(productToCustomize.price)}</span>
                        </div>
                        <p className="text-stone-500 dark:text-stone-400 mt-3 font-medium leading-relaxed">{productToCustomize.description}</p>
                    </div>

                    {productToCustomize.modifierGroups?.map(group => (
                        <div key={group.id} className="space-y-6">
                            <div className="flex justify-between items-center bg-stone-100 dark:bg-white/5 p-4 rounded-2xl border border-black/[0.03] dark:border-white/[0.03]">
                                <h4 className="font-black text-xl text-stone-950 dark:text-white tracking-tight">{group.name}</h4>
                                <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-black/[0.03] dark:border-white/[0.03] uppercase tracking-widest">
                                    {group.min > 0 ? 'Obligatorio' : 'Opcional'} • {group.max > 1 ? `Máx ${group.max}` : 'Elige 1'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {group.options?.map(option => {
                                    const isSelected = selectedModifiers[group.id]?.some(m => m.id === option.id);
                                    return (
                                        <button 
                                            key={option.id}
                                            onClick={() => handleModifierChange(group.id, option, group.max > 1)}
                                            className={`flex justify-between items-center p-5 rounded-2xl border-2 transition-all duration-300 ${isSelected ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/5' : 'border-black/[0.03] dark:border-white/[0.03] bg-stone-50 dark:bg-white/5 hover:bg-white dark:hover:bg-stone-800'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-500 border-brand-500 text-brand-950' : 'border-stone-300 dark:border-stone-600'}`}>
                                                    {isSelected && <Check size={16} strokeWidth={4} />}
                                                </div>
                                                <span className={`font-black tracking-tight ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-stone-600 dark:text-stone-400'}`}>{option.name}</span>
                                            </div>
                                            {option.price > 0 && (
                                                <span className="text-sm font-black text-stone-500 dark:text-stone-400">+{formatCurrency(option.price)}</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
       </div>
                    <div className="flex items-center justify-between bg-stone-100 dark:bg-white/5 p-6 rounded-[2rem] border border-black/[0.03] dark:border-white/[0.03]">
                        <span className="font-black text-stone-950 dark:text-white tracking-tight">Cantidad</span>
                        <div className="flex items-center gap-6">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-950 dark:text-white shadow-xl hover:scale-110 active:scale-95 transition-all border border-black/[0.03] dark:border-white/[0.03]"><Minus size={20} strokeWidth={3} /></button>
                            <span className="text-2xl font-black text-stone-950 dark:text-white w-8 text-center tabular-nums">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-stone-950 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-stone-950 shadow-xl hover:scale-110 active:scale-95 transition-all"><Plus size={20} strokeWidth={3} /></button>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border-t border-black/[0.03] dark:border-white/[0.03]">
                    <Button 
                        fullWidth 
                        size="lg" 
                        disabled={!isValid}
                        onClick={() => {
                            if (selectedStore) {
                                addToCart(productToCustomize, quantity, allModifiers.map(m => m.name), selectedStore.id);
                                setProductToCustomize(null);
                                showToast('Agregado al carrito', 'success');
                            }
                        }} 
                        className="py-8 !rounded-[2rem] flex justify-between items-center px-8 shadow-2xl shadow-brand-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <span className="font-black text-xl tracking-widest uppercase">{isValid ? 'AGREGAR AL CARRITO' : 'COMPLETAR SELECCIÓN'}</span>
                        <span className="font-black text-2xl tracking-tighter">{formatCurrency(total)}</span>
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

      const handleAddAddress = (address: string) => {
          const currentAddresses = user.addresses || [];
          const updatedAddresses = [address.trim(), ...currentAddresses];
          updateUser({ addresses: updatedAddresses });
          showToast('Dirección agregada y establecida como principal', 'success');
          setShowMapSelector(false);
      };

      return (
          <>
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md animate-fade-in" onClick={() => setShowLocationSelector(false)}></div>
              <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-10 relative animate-slide-up z-10 border border-black/[0.03] dark:border-white/[0.03]">
                  <div className="w-16 h-2 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto mb-8 sm:hidden"></div>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">¿A dónde enviamos?</h3>
                    <button onClick={() => setShowLocationSelector(false)} className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-500 hover:text-stone-950 dark:hover:text-white transition-all flex items-center justify-center border border-black/[0.03] dark:border-white/[0.03]">
                        <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                      {user.addresses?.map((addr, idx) => (
                          <button 
                              key={idx}
                              onClick={() => handleSelectAddress(addr)}
                              className={`w-full flex items-center gap-5 p-6 rounded-[2.5rem] transition-all text-left border-2 ${
                                  idx === 0 
                                  ? 'border-brand-500 bg-brand-500/5 shadow-2xl shadow-brand-500/5' 
                                  : 'border-black/[0.03] dark:border-white/[0.03] bg-stone-50 dark:bg-white/5 hover:bg-white dark:hover:bg-stone-800'
                              }`}
                          >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                  idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-white dark:bg-stone-700 text-stone-400'
                              }`}>
                                  <MapPin size={28} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className={`font-black text-lg truncate tracking-tight ${idx === 0 ? 'text-brand-600 dark:text-brand-400' : 'text-stone-950 dark:text-white'}`}>{addr}</p>
                                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em] mt-1">{idx === 0 ? 'Dirección Principal' : 'Dirección Guardada'}</p>
                              </div>
                              {idx === 0 && (
                                <div className="bg-brand-500/20 p-2 rounded-full">
                                    <CheckCircle2 size={20} className="text-brand-600 dark:text-brand-400" />
                                </div>
                              )}
                          </button>
                      ))}
                      
                      <button 
                          onClick={() => setShowMapSelector(true)}
                          className="w-full flex items-center justify-center gap-4 p-6 rounded-[2.5rem] border-2 border-dashed border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 font-black text-sm mt-6 hover:bg-stone-50 dark:hover:bg-stone-800/30 hover:border-brand-500 transition-all group"
                      >
                          <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-brand-950 transition-colors">
                            <Plus size={24} />
                          </div>
                          AGREGAR NUEVA DIRECCIÓN
                      </button>
                  </div>
              </div>
          </div>
          {showMapSelector && (
              <MapSelector 
                onClose={() => setShowMapSelector(false)}
                onSelect={(address) => handleAddAddress(address)}
              />
          )}
          </>
      );
  };

  const BannerCarousel = () => {
    const activeBanners = banners.filter(b => b.isActive);
    
    if (activeBanners.length === 0) return null;

    return (
        <div className="overflow-x-auto scrollbar-hide flex gap-4 px-4 pb-4 snap-x lg:grid lg:grid-cols-2 lg:gap-6 lg:px-8 lg:overflow-visible">
            {activeBanners.map(banner => (
                <div 
                    key={banner.id}
                    className="snap-center shrink-0 w-[85%] relative h-40 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform lg:w-full lg:h-56 group"
                >
                    <img src={banner.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-stone-900/10 flex items-center p-6 lg:p-10">
                        <div className="max-w-[80%]">
                            {banner.badge && (
                                <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-3 inline-block">
                                    {banner.badge}
                                </span>
                            )}
                            <h3 className="text-white text-xl font-black leading-tight lg:text-4xl lg:tracking-tighter">
                                {banner.title}
                            </h3>
                            <p className="text-stone-300 text-xs mt-2 lg:text-base font-medium opacity-90">
                                {banner.subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const CategoryPills = () => {
    const displayCategories = ['Todos', ...config.categories];
    return (
      <div id="category-pills" className="flex gap-4 px-6 pb-4 overflow-x-auto scrollbar-hide">
           {displayCategories.map((cat) => {
              let Icon = Utensils;
              if(cat === 'Comida') Icon = ChefHat;
              if(cat === 'Supermercado') Icon = ShoppingBag;
              if(cat === 'Farmacia') Icon = Zap;
              if(cat === 'Mascotas') Icon = Heart;
              if(cat === 'Servicios Profesionales') Icon = User;
              
              const isSelected = (selectedCategory === cat || (selectedCategory === 'ALL' && cat === 'Todos'));

              return (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Todos' ? 'ALL' : cat)}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black transition-all shrink-0 border-2 ${
                        isSelected
                        ? 'bg-stone-950 dark:bg-brand-500 text-white dark:text-brand-950 border-stone-950 dark:border-brand-500 shadow-xl shadow-brand-500/10 scale-105' 
                        : 'bg-white dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 border-black/[0.03] dark:border-white/[0.03] hover:border-brand-500/30 backdrop-blur-sm'
                    }`}
                >
                    {cat !== 'Todos' && <Icon size={16} className={isSelected ? "text-brand-500 dark:text-brand-950" : "text-stone-400 dark:text-stone-600"} />}
                    <span className="tracking-tight">{cat.toUpperCase()}</span>
                </button>
              )
          })}
      </div>
    );
  };

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
                        onShare={handleShareStore}
                        compact={true}
                     />
                 </div>
             ))}
         </div>
      </div>
  );

  const StoreList = () => (
    <div className="space-y-6 animate-fade-in pt-2 bg-transparent">
      <div className="px-6 py-6 flex flex-col gap-6 sticky top-0 z-20 bg-white/70 dark:bg-stone-950/70 backdrop-blur-2xl border-b border-black/[0.03] dark:border-white/[0.03]">
          <div className="flex justify-between items-center">
              <div id="location-selector" onClick={() => setShowLocationSelector(true)} className="cursor-pointer group">
                  <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">Entregar en</p>
                  <div className="flex items-center gap-2 text-stone-950 dark:text-white font-black text-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
                      <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                        <MapPin size={18} className="text-brand-500" />
                      </div>
                      {user.addresses && user.addresses.length > 0 ? user.addresses[0].split('(')[0] : 'Sin dirección'}
                      <ChevronDown size={18} className="text-stone-300 dark:text-stone-600 group-hover:translate-y-0.5 transition-transform" />
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-help'));
                        toggleSettings();
                    }}
                    className="w-12 h-12 bg-stone-100 dark:bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent hover:border-brand-500/20"
                    title="Ayuda"
                  >
                      <HelpCircle size={20} className="text-stone-900 dark:text-white" />
                  </button>
                  <button 
                    id="history-button"
                    onClick={() => setClientViewState('HISTORY')}
                    className="flex items-center gap-2 bg-stone-100 dark:bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl hover:bg-brand-500/10 hover:text-brand-600 transition-all border border-transparent hover:border-brand-500/20"
                  >
                      <History size={18} className="text-stone-900 dark:text-white" />
                      <span className="font-black text-xs text-stone-900 dark:text-white hidden sm:block uppercase tracking-widest">Pedidos</span>
                  </button>
                  <button 
                    id="profile-button"
                    onClick={toggleSettings}
                    className="w-12 h-12 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl lg:hidden"
                  >
                      <span className="font-black text-sm uppercase tracking-tighter">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </span>
                  </button>
              </div>
          </div>

          <div className="w-full">
             <div id="search-bar" className="bg-stone-100 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-[2rem] flex items-center gap-3 transition-all focus-within:bg-white dark:focus-within:bg-stone-900 focus-within:ring-4 focus-within:ring-brand-500/10 border border-transparent focus-within:border-brand-500/20 shadow-inner group/search">
                 <div className="p-3.5 bg-white dark:bg-stone-800 rounded-[1.5rem] shadow-xl shadow-black/5 group-focus-within/search:bg-brand-500 group-focus-within/search:text-brand-950 transition-colors">
                     <Search size={20} className="text-stone-900 dark:text-white group-focus-within/search:text-inherit" />
                 </div>
                 <input 
                    placeholder="¿Qué vas a comer hoy?"
                    className="flex-1 outline-none text-lg p-2 bg-transparent text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 font-bold tracking-tight"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>
          </div>
      </div>
    </div>
  );

    const TrackingView = () => {
        const { orders, cancelOrder, setClientViewState, stores } = useApp();
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-stone-950 animate-fade-in">
                <div className="w-24 h-24 bg-stone-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                    <ShoppingBag size={48} strokeWidth={1.5} className="text-stone-300 dark:text-stone-700" />
                </div>
                <h2 className="text-3xl font-black text-stone-950 dark:text-white mb-3 tracking-tight">No hay pedido activo</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-10 max-w-[250px] mx-auto font-medium">Explora los mejores restaurantes y realiza tu primer pedido hoy mismo.</p>
                <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-2xl px-10 py-4 font-black tracking-widest bg-stone-950 dark:bg-white text-white dark:text-stone-950">IR AL INICIO</Button>
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-stone-950 animate-fade-in">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/200/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-red-500/20">
                    <X size={48} strokeWidth={1.5} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-stone-950 dark:text-white mb-3 tracking-tight">Pedido Cancelado</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-10 max-w-[250px] mx-auto font-medium">Lamentamos que tu pedido haya sido cancelado. Puedes intentar de nuevo.</p>
                <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-2xl px-10 py-4 font-black tracking-widest bg-stone-950 dark:bg-white text-white dark:text-stone-950">VOLVER AL INICIO</Button>
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
        <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950 animate-slide-up">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl p-8 pb-10 rounded-b-[3rem] shadow-2xl shadow-black/5 z-10 border-b border-black/[0.03] dark:border-white/[0.03]">
                <div className="flex justify-between items-start mb-8">
                    <button onClick={() => setClientViewState('BROWSE')} className="p-3 -ml-3 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors">
                        <ArrowLeft size={28} />
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.2em] mb-1">Tiempo estimado</p>
                        <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">
                            {displayOrder.status === OrderStatus.DELIVERED ? 'Entregado' : estimatedTime}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-10">
                     <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-brand-500 text-brand-950' : 'bg-stone-100 dark:bg-white/5 text-brand-600 dark:text-brand-400 animate-pulse-soft border border-black/[0.03] dark:border-white/[0.03]'}`}>
                            {(() => {
                                if (displayOrder.status === OrderStatus.DELIVERED) return <CheckCircle2 size={48} strokeWidth={1.5} />;
                                const Icon = steps[Math.min(safeIndex, steps.length-1)]?.icon || Bike;
                                return <Icon size={48} strokeWidth={1.5} />;
                            })()}
                        </div>
                        {displayOrder.isOfflinePending && (
                            <div className="absolute -top-2 -right-2 bg-red-50 dark:bg-red-900/200 rounded-2xl p-2 border-4 border-white dark:border-stone-900 shadow-xl">
                                <WifiOff size={16} className="text-white" />
                            </div>
                        )}
                     </div>
                     <h2 className="text-2xl font-black text-stone-950 dark:text-white transition-all tracking-tight">
                        {displayOrder.isOfflinePending ? "Esperando conexión..." : 
                        (displayOrder.status === OrderStatus.DELIVERED ? "¡Disfruta tu comida!" : 
                         steps[safeIndex]?.label || "Procesando")}
                     </h2>
                     <p className="text-stone-500 dark:text-stone-400 font-bold mt-2 uppercase tracking-widest text-xs">{displayOrder.storeName}</p>
                     
                     {/* Emergency Cancel Button for Demo */}
                     {(displayOrder.status === OrderStatus.PENDING || displayOrder.status === OrderStatus.ACCEPTED) && (
                         <div className="mt-6">
                             <button 
                                onClick={() => {
                                    cancelOrder(displayOrder.id, 'Cancelado por el cliente');
                                    setClientViewState('BROWSE');
                                }}
                                className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
                             >
                                 Cancelar Pedido
                             </button>
                         </div>
                     )}
                     
                     {displayOrder.status === OrderStatus.DELIVERED && (
                         <div className="mt-6 flex gap-3 justify-center">
                             <button 
                                onClick={() => setClaimOrder(displayOrder)}
                                className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/200/10 px-6 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-50 dark:bg-red-900/200/20 transition-all"
                             >
                                 Reclamar
                             </button>
                         </div>
                     )}
                     
                     {displayOrder.type === OrderType.PICKUP && (
                         <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-white/5 rounded-2xl text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest border border-black/[0.03] dark:border-white/[0.03]">
                             <StoreIcon size={14} /> Retiro en Local
                         </div>
                     )}
                </div>

                <div className="relative h-3 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden mb-2 border border-black/[0.03] dark:border-white/[0.03]">
                    <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${displayOrder.status === OrderStatus.DELIVERED ? 'bg-brand-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : displayOrder.isOfflinePending ? 'bg-stone-300 dark:bg-stone-700' : 'bg-brand-500 shadow-[0_0_20px_rgba(250,204,21,0.3)]'}`} style={{ width: getProgressWidth() }}></div>
                </div>
            </div>

            {displayOrder.type === OrderType.DELIVERY && (displayOrder.status === OrderStatus.DRIVER_ASSIGNED || displayOrder.status === OrderStatus.PICKED_UP) && (
                <div className="px-6 mt-6 mb-2">
                    <div className="h-64 rounded-[2.5rem] bg-stone-200 dark:bg-stone-800 overflow-hidden relative shadow-inner border border-stone-200 dark:border-stone-700">
                        {(() => {
                            const driver = users.find(u => u.uid === displayOrder.driverId);
                            const store = stores.find(s => s.id === displayOrder.storeId);
                            
                            return (
                                <TrackingMap 
                                    driverLat={liveDriverLocation?.lat || driver?.lat} 
                                    driverLng={liveDriverLocation?.lng || driver?.lng}
                                    storeLat={store?.lat || -34.6037} // Fallback to center
                                    storeLng={store?.lng || -58.3816}
                                />
                            );
                        })()}
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
                            <button 
                                onClick={() => setShowChat(true)}
                                className="p-3 bg-stone-100 dark:bg-stone-700 rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors"
                            >
                                <MessageSquare size={20} />
                            </button>
                            <button className="p-3 bg-brand-500 rounded-2xl text-brand-950 hover:bg-brand-600 transition-colors">
                                <Phone size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                <ChatOverlay 
                    orderId={displayOrder.id} 
                    isOpen={showChat} 
                    onClose={() => setShowChat(false)} 
                    title={`Chat con ${displayOrder.storeName}`} 
                />

                 <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-3 uppercase tracking-wider">Detalle del Pedido</h3>
                    {displayOrder.items?.map((item, idx) => (
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
    const [deliveryAddr] = useState(addresses[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
    const [orderType, setOrderType] = useState<OrderType>(OrderType.DELIVERY);
    const [notes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountPct: number} | null>(null);

    const [tip, setTip] = useState<number>(0);
    const [requestCutlery, setRequestCutlery] = useState<boolean>(false);

    const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(orderType === OrderType.DELIVERY ? (selectedStore?.deliveryFee ?? config.baseDeliveryFee) : 0);

    useEffect(() => {
        const calculateFee = async () => {
            if (orderType === OrderType.PICKUP || !selectedStore || !selectedStore.lat || !selectedStore.lng) {
                setDynamicDeliveryFee(0);
                return;
            }

            // Try to get user coordinates from primary address or browser
            // Heuristic: If address has (lat, lng) format, use it.
            let userCoords = { lat: -34.6037, lng: -58.3816 }; // Default fallback
            const match = deliveryAddr.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
            if (match) {
                userCoords = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
            } else if (navigator.geolocation) {
                // Fallback to browser geolocation if available
                navigator.geolocation.getCurrentPosition((pos) => {
                    userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                });
            }

            const distance = await getRouteDistance({ lat: selectedStore.lat, lng: selectedStore.lng }, userCoords);
            if (distance > 0) {
                setDistanceKm(distance);
                const details = calculateDynamicDeliveryDetails(distance, selectedStore.deliveryFee || config.baseDeliveryFee, config.driverCommissionPct, config.deliveryRates);
                setDynamicDeliveryFee(details.deliveryFee);
            } else {
                setDynamicDeliveryFee(selectedStore.deliveryFee || config.baseDeliveryFee);
            }
        };

        calculateFee();
    }, [orderType, selectedStore, deliveryAddr, config.baseDeliveryFee, config.feePerKm, getRouteDistance]);

    const handleApplyCoupon = () => {
        const found = coupons.find(c => c.code === couponCode.toUpperCase() && c.active);
        if (found) { setAppliedCoupon({ code: found.code, discountPct: found.discountPct }); showToast('¡Cupón aplicado!', 'success'); } else { showToast('Cupón inválido.', 'error'); setAppliedCoupon(null); }
    };
    const discountAmount = appliedCoupon ? (subtotal + dynamicDeliveryFee) * appliedCoupon.discountPct : 0;
    const firstPurchaseDiscount = !user.isFirstPurchaseDone ? subtotal * config.firstPurchaseDiscountPct : 0;
    const referralDiscount = (user.referredBy && !user.isFirstPurchaseDone) ? subtotal * config.referralDiscountPct : 0;
    const total = subtotal + dynamicDeliveryFee + tip - discountAmount - firstPurchaseDiscount - referralDiscount;

    const handlePlaceOrder = async () => {
        if (!selectedStore) return;

        // If user is not logged in, we must prompt for login and save the action
        if (!authUser) {
            showToast('Por favor, inicia sesión para finalizar tu pedido', 'info');
            
            // Extract coordinates for the order
            let orderCoords = undefined;
            const match = deliveryAddr.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
            if (match) {
                orderCoords = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
            }

            setPendingAction({
                type: 'PLACE_ORDER',
                data: {
                    storeId: selectedStore.id,
                    storeName: selectedStore.name,
                    address: deliveryAddr,
                    paymentMethod,
                    notes,
                    type: orderType,
                    discount: discountAmount,
                    coordinates: orderCoords
                }
            });

            setRole(UserRole.NONE); // Redirect to AuthView
            login();
            return;
        }

        setIsProcessing(true);
        
        try {
            // Extract coordinates for the order
            let orderCoords = undefined;
            const match = deliveryAddr.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
            if (match) {
                orderCoords = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
            }

            await placeOrder(selectedStore.id, selectedStore.name, deliveryAddr, paymentMethod, notes, orderType, discountAmount, orderCoords);
            // If it's not Mercado Pago, we handle the UI change here. 
            // If it IS Mercado Pago, placeOrder will redirect the window.
            if (paymentMethod !== PaymentMethod.MERCADO_PAGO) {
                setIsProcessing(false); 
                setClientViewState('TRACKING'); 
                showToast('Pedido enviado', 'success');
            }
        } catch (error) {
            console.error('Error in handlePlaceOrder:', error);
            setIsProcessing(false);
            showToast('Error al procesar el pedido', 'error');
        }
    };

    return (
      <div className="h-full flex flex-col animate-fade-in bg-stone-50 dark:bg-stone-950 overflow-hidden">
        <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10 shrink-0">
          <button onClick={() => setClientViewState('BROWSE')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors" disabled={isProcessing}><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">Confirmar Pedido</h2>
        </div>
        
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={48} className="text-stone-400 dark:text-stone-600" />
            </div>
            <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight mb-2">Tu carrito está vacío</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-8">Agrega algunos productos para continuar con tu pedido.</p>
            <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-2xl px-8 py-4 font-black tracking-widest">EXPLORAR TIENDAS</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40">
              <div className="bg-white dark:bg-stone-900/40 p-2 rounded-[2rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] flex gap-2 backdrop-blur-sm">
                 <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-2 transition-all ${orderType === OrderType.DELIVERY ? 'bg-stone-950 dark:bg-brand-500 text-white dark:text-brand-950 shadow-xl' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'}`}><Bike size={20} /> ENVÍO</button>
                 <button onClick={() => setOrderType(OrderType.PICKUP)} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-2 transition-all ${orderType === OrderType.PICKUP ? 'bg-stone-950 dark:bg-brand-500 text-white dark:text-brand-950 shadow-xl' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'}`}><StoreIcon size={20} /> RETIRO</button>
              </div>

          {orderType === OrderType.DELIVERY && (
            <div className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm animate-slide-up">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-stone-950 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                            <MapPin size={20} className="text-brand-500" />
                        </div>
                        Dirección de Entrega
                    </h3>
                    <button 
                        onClick={() => setShowLocationSelector(true)} 
                        className="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-[0.15em] hover:opacity-70 transition-opacity"
                    >
                        Cambiar
                    </button>
                </div>
                <div className="p-5 bg-stone-100 dark:bg-white/5 rounded-[1.5rem] border border-black/[0.03] dark:border-white/[0.03]">
                    <p className="text-base font-black text-stone-950 dark:text-white tracking-tight">{deliveryAddr}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-black tracking-widest">Ubicación seleccionada</p>
                    </div>
                </div>
            </div>
          )}

          <div className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm">
            <h3 className="font-black text-stone-950 dark:text-white mb-5 tracking-tight">Método de Pago</h3>
            <div className="flex gap-3">
              {[
                { id: PaymentMethod.MERCADO_PAGO, label: 'Mercado Pago', icon: <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-sky-500/20">MP</div> },
                { id: PaymentMethod.CARD, label: 'Tarjeta', icon: <CreditCard size={24} /> },
                { id: PaymentMethod.CASH, label: 'Efectivo', icon: <Banknote size={24} /> }
              ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)} 
                  disabled={isProcessing} 
                  className={`flex-1 p-5 rounded-[1.5rem] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === method.id ? 'border-brand-500 bg-brand-500/10 text-brand-950 dark:text-brand-400 shadow-xl shadow-brand-500/5' : 'border-black/[0.03] dark:border-white/[0.03] text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'} ${isProcessing ? 'opacity-50' : ''}`}
                >
                  <div className={paymentMethod === method.id ? 'text-brand-500' : 'text-stone-400'}>
                    {method.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm">
              <h3 className="font-black text-stone-950 dark:text-white mb-5 tracking-tight">Opciones Adicionales</h3>
              <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center shadow-sm">
                            <Utensils size={20} className="text-stone-400" />
                          </div>
                          <span className="text-sm font-black text-stone-950 dark:text-white tracking-tight">¿Necesitas cubiertos?</span>
                      </div>
                      <button 
                        onClick={() => setRequestCutlery(!requestCutlery)}
                        className={`w-14 h-8 rounded-full transition-all relative p-1 ${requestCutlery ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                      >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all transform ${requestCutlery ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <p className="text-sm font-black text-stone-950 dark:text-white flex items-center gap-3 tracking-tight">
                          <DollarSign size={18} className="text-brand-500" /> Propina para el repartidor
                      </p>
                      <div className="flex gap-3">
                          {[0, 20, 50, 100].map(amount => (
                              <button 
                                key={amount}
                                onClick={() => setTip(amount)}
                                className={`flex-1 py-4 rounded-2xl text-xs font-black border-2 transition-all ${tip === amount ? 'bg-brand-500 border-brand-500 text-brand-950 shadow-xl shadow-brand-500/10' : 'bg-stone-100 dark:bg-white/5 border-transparent text-stone-500 dark:text-stone-400'}`}
                              >
                                  {amount === 0 ? 'NO' : formatCurrency(amount)}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

           <div className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm">
              <h3 className="font-black text-stone-950 dark:text-white mb-4 flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <Ticket size={20} className="text-brand-500" />
                </div>
                Cupón de Descuento
              </h3>
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-brand-500/10 border border-brand-500/20 p-5 rounded-2xl animate-pulse-soft">
                  <div className="flex items-center gap-3">
                    <Tag size={20} className="text-brand-600 dark:text-brand-400" />
                    <div>
                      <p className="font-black text-brand-950 dark:text-brand-400 text-sm tracking-tight">{appliedCoupon.code}</p>
                      <p className="text-[10px] text-brand-600 dark:text-brand-500 font-black uppercase tracking-widest">{(appliedCoupon.discountPct * 100)}% DESCUENTO APLICADO</p>
                    </div>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="p-2 hover:bg-brand-500/20 rounded-xl text-brand-700 dark:text-brand-400 transition-colors"><X size={20} /></button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="EJ: BENVENUTO20" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                    disabled={isProcessing} 
                    className="flex-1 bg-stone-100 dark:bg-white/5 border border-transparent focus:border-brand-500/30 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 text-stone-950 dark:text-white font-black tracking-tight transition-all" 
                  />
                  <Button size="lg" onClick={handleApplyCoupon} disabled={!couponCode || isProcessing} className="px-8 !rounded-2xl">APLICAR</Button>
                </div>
              )}
          </div>

          {!user.referredBy && (
            <div className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm">
                <h3 className="font-black text-stone-950 dark:text-white mb-4 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/200/10 rounded-xl flex items-center justify-center">
                      <User size={20} className="text-blue-500" />
                  </div>
                  Código de Referido
                </h3>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="CÓDIGO DE TU AMIGO" 
                    value={referralInput} 
                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())} 
                    disabled={isProcessing || isApplyingReferral} 
                    className="flex-1 bg-stone-100 dark:bg-white/5 border border-transparent focus:border-brand-500/30 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 text-stone-950 dark:text-white font-black tracking-tight transition-all" 
                  />
                  <Button 
                    size="lg" 
                    onClick={async () => {
                      setIsApplyingReferral(true);
                      await applyReferralCode(referralInput);
                      setIsApplyingReferral(false);
                      setReferralInput('');
                    }} 
                    disabled={!referralInput || isProcessing || isApplyingReferral} 
                    isLoading={isApplyingReferral}
                    className="px-8 !rounded-2xl bg-blue-600 hover:bg-blue-700"
                  >
                    APLICAR
                  </Button>
                </div>
                <p className="text-[10px] text-stone-400 font-bold mt-3 px-2">Si tienes un código de un amigo, aplícalo para obtener un descuento extra en tu primera compra.</p>
            </div>
          )}

          <div id="order-summary" className="bg-stone-950 dark:bg-white p-8 rounded-[3rem] shadow-2xl shadow-black/20 text-white dark:text-stone-950">
             <h3 className="font-black text-xl mb-6 tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-brand-500 rounded-full"></div>
                Resumen de Compra
             </h3>
             <div className="space-y-4 mb-8">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex flex-col gap-2">
                   <div className="flex justify-between text-sm items-center">
                     <span className="text-white/60 dark:text-stone-500 font-bold flex-1 truncate pr-4">
                        <span className="text-brand-500">{item.quantity}x</span> {item.product.name}
                     </span>
                     <span className="font-black">{formatCurrency(item.totalPrice * item.quantity)}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="flex items-center bg-white/10 dark:bg-black/5 rounded-xl p-1">
                       <button 
                         onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                         className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
                       >
                         <Minus size={16} />
                       </button>
                       <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                       <button 
                         onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                         className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
                       >
                         <Plus size={16} />
                       </button>
                     </div>
                     <button 
                       onClick={() => removeFromCart(idx)}
                       className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="space-y-3 pt-6 border-t border-white/10 dark:border-stone-200">
                {orderType === OrderType.DELIVERY && (
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60 dark:text-stone-500 font-bold">Costo de Envío</span>
                        <span className="font-black">{formatCurrency(dynamicDeliveryFee)}</span>
                    </div>
                )}
                {tip > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60 dark:text-stone-500 font-bold">Propina</span>
                        <span className="font-black">{formatCurrency(tip)}</span>
                    </div>
                )}
                {appliedCoupon && (
                    <div className="flex justify-between items-center text-brand-400 dark:text-brand-600">
                        <span className="text-sm font-black uppercase tracking-widest">Descuento Cupón</span>
                        <span className="font-black text-lg">- {formatCurrency(discountAmount)}</span>
                    </div>
                )}
                {!user.isFirstPurchaseDone && (
                    <div className="flex justify-between items-center text-brand-400 dark:text-brand-600">
                        <span className="text-sm font-black uppercase tracking-widest">Descuento 1ra Compra</span>
                        <span className="font-black text-lg">- {formatCurrency(firstPurchaseDiscount)}</span>
                    </div>
                )}
                {user.referredBy && !user.isFirstPurchaseDone && (
                    <div className="flex justify-between items-center text-blue-400 dark:text-blue-600">
                        <span className="text-sm font-black uppercase tracking-widest">Descuento Referido</span>
                        <span className="font-black text-lg">- {formatCurrency(referralDiscount)}</span>
                    </div>
                )}
             </div>

             {/* Dynamic Pricing Disclaimer */}
             {orderType === OrderType.DELIVERY && (
                 <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2 text-xs">
                     <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                     <p className="text-amber-700 dark:text-amber-400">
                         <strong>Tarifa Dinámica y Clima:</strong> La tarifa se calcula según distancia y hora. En lluvias o condiciones extremas, el repartidor puede reservarse el derecho de aceptar el viaje.
                     </p>
                 </div>
             )}

             <div className="mt-8 pt-8 border-t-4 border-white/10 dark:border-stone-100 flex justify-between items-center">
               <span className="font-black text-2xl tracking-tighter uppercase">Total</span>
               <div className="text-right">
                    <span className="font-black text-4xl text-brand-500 tracking-tighter">{formatCurrency(total)}</span>
                    <p className="text-[10px] text-white/40 dark:text-stone-400 font-black uppercase tracking-[0.2em] mt-1">IVA Incluido</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border-t border-black/[0.03] dark:border-white/[0.03] pb-safe shrink-0 absolute bottom-0 w-full z-30">
          <Button 
            fullWidth 
            size="lg" 
            disabled={cart.length === 0 || isProcessing} 
            isLoading={isProcessing} 
            onClick={handlePlaceOrder}
            className="!rounded-[2rem] py-8 text-xl font-black tracking-tighter shadow-2xl shadow-brand-500/20"
          >
            {isProcessing ? 'PROCESANDO...' : `CONFIRMAR PEDIDO`}
          </Button>
        </div>
        </>
        )}
      </div>
    );
  };

  const HistoryView = () => (
      <div className="h-full bg-stone-50 dark:bg-stone-950 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Mis Pedidos</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-24 lg:max-w-4xl lg:mx-auto lg:w-full">
              {pastOrders.length === 0 ? (
                  <div className="text-center py-20">
                      <div className="w-24 h-24 bg-stone-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <History size={48} className="text-stone-300 dark:text-stone-700" />
                      </div>
                      <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tight">Sin historial aún</h3>
                      <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 max-w-[200px] mx-auto font-medium">Tus pedidos aparecerán aquí una vez que realices tu primera compra.</p>
                      <Button onClick={() => setClientViewState('BROWSE')} className="mt-8 px-8">EXPLORAR MENÚ</Button>
                  </div>
              ) : (
                  pastOrders.map((order, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={order.id} 
                        className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm group hover:border-brand-500/20 transition-all duration-500"
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-black text-xl text-stone-950 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{order.storeName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar size={12} className="text-stone-400" />
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className={`text-[10px] font-black px-4 py-2 rounded-2xl tracking-[0.1em] shadow-sm ${
                                  order.status === OrderStatus.DELIVERED ? 'bg-brand-500 text-brand-950' : 
                                  order.status === OrderStatus.DISPUTED ? 'bg-amber-50 dark:bg-amber-900/200 text-amber-950' :
                                  'bg-red-50 dark:bg-red-900/200 text-white'
                              }`}>
                                  {(order.status === OrderStatus.DELIVERED ? 'ENTREGADO' : 
                                   order.status === OrderStatus.DISPUTED ? 'EN RECLAMO' : 'CANCELADO').toUpperCase()}
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-6">
                            <div className="flex -space-x-2">
                                {order.items?.slice(0, 3).map((item, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-sm">
                                        <img src={item.product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 bg-stone-950 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                                        +{order.items.length - 3}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">{order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</p>
                          </div>
                          
                          {order.status === OrderStatus.CANCELLED && order.cancelledReason && (
                              <div className="mb-6 bg-red-50 dark:bg-red-900/200/10 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-xs text-red-600 dark:text-red-400 font-bold"><span className="uppercase tracking-widest mr-2">Motivo:</span> {order.cancelledReason}</p>
                              </div>
                          )}
                          {order.status === OrderStatus.DISPUTED && order.claimReason && (
                              <div className="mb-6 bg-amber-50 dark:bg-amber-900/200/10 p-4 rounded-2xl border border-amber-500/20">
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest mb-1">Reclamo ({order.claimStatus})</p>
                                  <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">{order.claimReason}</p>
                              </div>
                          )}

                          <div className="flex justify-between items-center pt-6 border-t border-black/[0.03] dark:border-white/[0.03]">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Total Pagado</span>
                                <span className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter">{formatCurrency(order.total)}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                  {order.status === OrderStatus.DELIVERED && !order.isReviewed && (
                                      <button
                                          onClick={() => setReviewOrder(order)}
                                          className="p-3 bg-amber-50 dark:bg-amber-900/200/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center gap-2 hover:bg-amber-50 dark:bg-amber-900/200/20 transition-all border border-amber-500/20"
                                      >
                                          <Star size={18} fill="currentColor" />
                                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Calificar</span>
                                      </button>
                                  )}
                                  {order.status === OrderStatus.DELIVERED && (
                                      <button
                                          onClick={() => setClaimOrder(order)}
                                          className="p-3 bg-red-50 dark:bg-red-900/200/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 hover:bg-red-50 dark:bg-red-900/200/20 transition-all border border-red-500/20"
                                      >
                                          <AlertCircle size={18} />
                                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Reclamar</span>
                                      </button>
                                  )}
                                  <button 
                                    onClick={() => handleViewReceipt(order)}
                                    className="p-3 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                  >
                                      <FileText size={18} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Recibo</span>
                                  </button>
                              </div>
                          </div>
                      </motion.div>
                  ))
              )}
          </div>
      </div>
  );

  const FavoritesView = () => {
    const favoriteStores = stores.filter(s => favorites.includes(s.id));

    return (
      <div className="h-full bg-stone-50 dark:bg-stone-950 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Mis Favoritos</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-24 lg:max-w-5xl lg:mx-auto lg:w-full">
              {favoriteStores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/200/10 rounded-[2.5rem] flex items-center justify-center text-red-500 shadow-inner">
                          <Heart size={48} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight">Sin favoritos aún</h3>
                        <p className="text-stone-500 dark:text-stone-400 font-medium mt-2 max-w-[250px] mx-auto">Guarda tus tiendas preferidas para encontrarlas más rápido.</p>
                      </div>
                      <Button onClick={() => setClientViewState('BROWSE')} className="!rounded-2xl px-8 py-4 font-black tracking-widest bg-stone-950 dark:bg-white text-white dark:text-stone-950">EXPLORAR TIENDAS</Button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteStores.map((store, idx) => (
                          <StoreCard 
                              key={store.id} 
                              store={store} 
                              onClick={setSelectedStore} 
                              index={idx}
                              isFavorite={true}
                              onToggleFavorite={handleToggleFavorite}
                              onShare={handleShareStore}
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
      <div className="h-full bg-stone-50 dark:bg-stone-950 animate-fade-in flex flex-col">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10">
              <button onClick={() => setClientViewState('BROWSE')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Mi Perfil</h2>
          </div>
          
          <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-24 lg:max-w-4xl lg:mx-auto lg:w-full">
              {/* Profile Header */}
              <div className="flex flex-col items-center py-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-brand-500 rounded-[3rem] flex items-center justify-center text-brand-950 text-4xl font-black shadow-2xl shadow-brand-500/20 border-4 border-white dark:border-stone-900 group-hover:scale-105 transition-transform duration-500">
                        {user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-stone-950 dark:bg-white p-3.5 rounded-2xl shadow-2xl text-white dark:text-stone-950 hover:scale-110 active:scale-95 transition-all border-2 border-white dark:border-stone-900">
                        <Camera size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <h3 className="mt-6 font-black text-3xl text-stone-950 dark:text-white tracking-tighter">{user.name}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm font-black uppercase tracking-[0.2em]">{user.email}</p>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8">
                  {[
                    { label: 'Pedidos', value: pastOrders.length, icon: <History size={16} /> },
                    { label: 'Favoritos', value: favorites.length, icon: <Heart size={16} /> },
                    { label: 'Cupones', value: coupons.length, icon: <Ticket size={16} /> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] text-center shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                        <div className="flex justify-center mb-3 text-brand-500">
                            {stat.icon}
                        </div>
                        <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{stat.value}</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
              </div>

              {/* Referral System Card */}
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-8 rounded-[3rem] shadow-2xl shadow-brand-500/20 text-brand-950 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles size={120} />
                  </div>
                  <div className="relative z-10">
                      <h4 className="font-black text-2xl tracking-tighter mb-2">Gana Dinero Invitando</h4>
                      <p className="text-brand-900/70 font-bold text-sm mb-6 leading-tight">Comparte tu código con amigos. Cuando hagan su primera compra, ¡tú ganas {formatCurrency(config.referralRewardAmount)}!</p>
                      
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/30 mb-6">
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tu Código</p>
                              <p className="text-2xl font-black tracking-tighter">{user.referralCode || 'GENERANDO...'}</p>
                          </div>
                          <button 
                            onClick={() => {
                                navigator.clipboard.writeText(user.referralCode || '');
                                showToast('Código copiado', 'success');
                            }}
                            className="p-3 bg-brand-950 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                          >
                              <Download size={20} className="rotate-[-90deg]" />
                          </button>
                      </div>

                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ganancias Acumuladas</p>
                              <p className="text-3xl font-black tracking-tighter">{formatCurrency(user.referralEarnings || 0)}</p>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-brand-950 text-white !rounded-xl px-6"
                            onClick={() => {
                                const text = `¡Usa mi código ${user.referralCode} en ${APP_CONFIG.appName} y obtén un descuento en tu primera compra! Descarga la app aquí: ${window.location.origin}`;
                                if (navigator.share) {
                                    navigator.share({ title: APP_CONFIG.appName, text, url: window.location.origin });
                                } else {
                                    navigator.clipboard.writeText(text);
                                    showToast('Mensaje copiado para compartir', 'success');
                                }
                            }}
                          >
                              COMPARTIR
                          </Button>
                      </div>
                  </div>
              </div>

              {/* Edit Form */}
              <div className="bg-white dark:bg-stone-900/40 p-8 rounded-[3rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-xl text-stone-950 dark:text-white tracking-tight">Información Personal</h4>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity">Editar</button>
                    )}
                  </div>
                  
                  <div className="space-y-5">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] ml-2">Nombre Completo</label>
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-brand-500 transition-colors">
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full bg-stone-100 dark:bg-white/5 border rounded-2xl pl-12 pr-4 py-4 text-base outline-none transition-all font-black tracking-tight ${isEditing ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-transparent'} text-stone-950 dark:text-white`}
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] ml-2">Email de Contacto</label>
                          <div className="relative group/input">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-brand-500 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full bg-stone-100 dark:bg-white/5 border rounded-2xl pl-12 pr-4 py-4 text-base outline-none transition-all font-black tracking-tight ${isEditing ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-transparent'} text-stone-950 dark:text-white`}
                            />
                          </div>
                      </div>
                  </div>

                  {isEditing && (
                      <div className="flex gap-3 pt-4">
                          <Button variant="outline" fullWidth onClick={() => { setIsEditing(false); setName(user.name); setEmail(user.email); }} className="!rounded-2xl py-4 border-black/10 dark:border-white/10">CANCELAR</Button>
                          <Button fullWidth onClick={handleSave} className="!rounded-2xl py-4 bg-stone-950 dark:bg-white text-white dark:text-stone-950">GUARDAR CAMBIOS</Button>
                      </div>
                  )}
              </div>

              {/* Address Manager */}
              <div className="bg-white dark:bg-stone-900/40 p-8 rounded-[3rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-xl text-stone-950 dark:text-white tracking-tight">Mis Direcciones</h4>
                    <button onClick={() => setShowLocationSelector(true)} className="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-2">
                        <Plus size={16} /> AGREGAR
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                      {user.addresses?.map((addr, idx) => (
                          <div key={idx} className="bg-stone-100 dark:bg-white/5 p-5 rounded-[1.5rem] border border-black/[0.03] dark:border-white/[0.03] flex justify-between items-center group/addr hover:bg-white dark:hover:bg-stone-800 transition-all duration-300">
                              <div className="flex items-center gap-4 min-w-0">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${idx === 0 ? 'bg-brand-500 text-brand-950' : 'bg-white dark:bg-stone-700 text-stone-400'}`}>
                                      <MapPin size={20} />
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-base font-black text-stone-950 dark:text-white truncate tracking-tight">{addr}</p>
                                      {idx === 0 && <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">Dirección Principal</span>}
                                  </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover/addr:opacity-100 transition-opacity">
                                  {idx !== 0 && (
                                      <button 
                                        onClick={() => {
                                            const otherAddresses = user.addresses.filter(a => a !== addr);
                                            updateUser({ addresses: [addr, ...otherAddresses] });
                                            showToast('Dirección principal actualizada', 'success');
                                        }}
                                        className="p-3 bg-white dark:bg-stone-700 rounded-xl text-stone-400 hover:text-brand-600 transition-colors shadow-sm"
                                      >
                                          <CheckCircle2 size={20} />
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
                                    className="p-3 bg-white dark:bg-stone-700 rounded-xl text-stone-400 hover:text-red-500 transition-colors shadow-sm"
                                  >
                                      <Trash2 size={20} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                  <button onClick={() => setClientViewState('HISTORY')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-stone-900/40 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-stone-950 dark:text-white shadow-inner group-hover:bg-brand-500 group-hover:text-brand-950 transition-colors">
                              <History size={24} />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-lg text-stone-950 dark:text-white tracking-tight block">Historial de Pedidos</span>
                            <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Ver tus compras pasadas</span>
                          </div>
                      </div>
                      <ChevronRight size={24} className="text-stone-300 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={() => setClientViewState('FAVORITES')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-stone-900/40 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/200/10 rounded-2xl flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 dark:bg-red-900/200 group-hover:text-white transition-colors">
                              <Heart size={24} />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-lg text-stone-950 dark:text-white tracking-tight block">Mis Favoritos</span>
                            <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Tus tiendas preferidas</span>
                          </div>
                      </div>
                      <ChevronRight size={24} className="text-stone-300 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={toggleSettings} className="w-full flex items-center justify-between p-6 bg-white dark:bg-stone-900/40 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-stone-400 shadow-inner group-hover:bg-stone-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-stone-950 transition-colors">
                              <Settings size={24} />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-lg text-stone-950 dark:text-white tracking-tight block">Ajustes de la App</span>
                            <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Configuración y PWA</span>
                          </div>
                      </div>
                      <ChevronRight size={24} className="text-stone-300 group-hover:translate-x-2 transition-transform" />
                  </button>
              </div>

              <div className="pt-6">
                  <Button fullWidth variant="outline" className="!rounded-[2rem] py-6 text-red-500 border-red-500/20 hover:bg-red-50 dark:bg-red-900/200/10 font-black tracking-widest" onClick={() => signOut()}>CERRAR SESIÓN</Button>
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
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0c0a09' : '#ffffff',
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
          <div className="h-full bg-stone-50 dark:bg-stone-950 animate-slide-up flex flex-col z-50">
              <div className="flex items-center gap-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] sticky top-0 z-10 print:hidden">
                  <button onClick={() => setClientViewState('HISTORY')} className="p-2.5 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
                  <h2 className="text-2xl font-black dark:text-white tracking-tight">Recibo Digital</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 pb-24">
                  <div id="receipt-content" className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-2xl shadow-black/10 border border-black/[0.03] dark:border-white/[0.03] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
                      
                      <div className="text-center border-b border-black/[0.03] dark:border-white/[0.03] pb-8 mb-8">
                          <div className="w-16 h-16 bg-brand-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
                               <CheckCircle2 size={32} className="text-brand-500" />
                          </div>
                          <h3 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter">¡Pago Exitoso!</h3>
                          <p className="text-stone-400 dark:text-stone-500 text-xs font-black uppercase tracking-[0.2em] mt-2">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                      </div>

                      <div className="space-y-5 mb-8">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Productos</p>
                          {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-stone-600 dark:text-stone-400 font-bold"><span className="font-black text-stone-950 dark:text-white mr-2">{item.quantity}x</span> {item.product.name}</span>
                                  <span className="font-black text-stone-950 dark:text-white">{formatCurrency(item.totalPrice * item.quantity)}</span>
                              </div>
                          ))}
                      </div>

                      <div className="border-t-2 border-dashed border-stone-100 dark:border-stone-800 py-6 space-y-3">
                          <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400 font-bold">
                              <span>Subtotal</span>
                              <span>{formatCurrency(order.total - (order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0))}</span>
                          </div>
                          <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400 font-bold">
                              <span>Costo de Envío</span>
                              <span>{formatCurrency(order.type === OrderType.DELIVERY ? (order.deliveryFee ?? 45) : 0)}</span>
                          </div>
                          <div className="flex justify-between text-stone-950 dark:text-white font-black text-2xl pt-4 tracking-tighter">
                              <span className="uppercase">Total</span>
                              <span className="text-brand-600 dark:text-brand-400">{formatCurrency(order.total)}</span>
                          </div>
                      </div>
                      
                      <div className="mt-8 p-4 bg-stone-100 dark:bg-white/5 rounded-2xl text-[10px] text-stone-400 dark:text-stone-500 font-mono break-all text-center border border-black/[0.03] dark:border-white/[0.03]">
                          TRANSACCIÓN ID: {order.id.toUpperCase()}
                      </div>
                  </div>

                  <div className="mt-8 print:hidden">
                      <Button fullWidth size="lg" variant="outline" onClick={handleDownloadPDF} className="!rounded-[2rem] py-6 font-black tracking-widest border-black/10 dark:border-white/10">
                          <Download size={20} className="mr-3" /> DESCARGAR PDF
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
      <div className="animate-fade-in relative pb-40 bg-stone-50 dark:bg-stone-950 min-h-screen" style={storeStyle}>
        <div className="relative h-72 w-full bg-stone-900 lg:h-[30rem] lg:rounded-b-[4rem] overflow-hidden lg:max-w-[90rem] lg:mx-auto lg:mt-6 lg:shadow-2xl">
            <LazyImage src={selectedStore?.image} alt={selectedStore?.name} className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-2000 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
            
            <div className="absolute top-6 w-full px-6 flex justify-between z-20">
                <button onClick={() => setSelectedStore(null)} className="w-12 h-12 bg-white/10 backdrop-blur-2xl rounded-2xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-2xl"><ArrowLeft size={24} /></button>
                <div className="flex gap-2">
                    <button onClick={(e) => selectedStore && handleShareStore(e, selectedStore)} className="w-12 h-12 bg-white/10 backdrop-blur-2xl rounded-2xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-2xl">
                        <Share size={24} />
                    </button>
                    <button onClick={() => selectedStore && toggleFavorite(selectedStore.id)} className="w-12 h-12 bg-white/10 backdrop-blur-2xl rounded-2xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-2xl">
                        <Heart size={24} className={selectedStore && favorites.includes(selectedStore.id) ? "fill-red-500 text-red-500" : "text-white"} />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-12 left-0 w-full px-8 z-20">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="bg-brand-500 text-brand-950 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">{selectedStore?.category}</span>
                        {selectedStore?.isOpen === false && <span className="bg-red-50 dark:bg-red-900/200 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Cerrado</span>}
                    </div>
                    <h2 className="font-black text-4xl text-white lg:text-7xl tracking-tighter drop-shadow-2xl">{selectedStore?.name}</h2>
                </div>
            </div>
        </div>

        <div className="px-6 -mt-8 relative z-30 lg:max-w-5xl lg:mx-auto lg:-mt-12">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl shadow-black/10 border border-black/[0.03] dark:border-white/[0.03] flex flex-wrap items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Rating</span>
                        <div className="flex items-center gap-2">
                            <Star size={20} className="text-brand-500 fill-brand-500" />
                            <span className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter">{selectedStore?.rating}</span>
                            <span className="text-xs text-stone-400 font-bold">({selectedStore?.reviewsCount})</span>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-black/[0.05] dark:bg-white/[0.05]"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Tiempo</span>
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-brand-500" />
                            <span className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter">{selectedStore?.deliveryTimeMin}-{selectedStore?.deliveryTimeMax}</span>
                            <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Min</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Costo de Envío</span>
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">{formatCurrency(selectedStore?.deliveryFee ?? 45)}</span>
                </div>
            </div>
        </div>

        <div className="p-6 space-y-12 lg:max-w-5xl lg:mx-auto lg:p-12">
            {['Más vendidos', 'Entradas', 'Platos Principales', 'Bebidas'].map((categoryName) => {
                const products = selectedStore?.products || [];
                if (categoryName !== 'Más vendidos') return null; 

                return (
                    <div key={categoryName} className="animate-slide-up">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                <Flame size={24} className="text-brand-500" />
                            </div>
                            <h3 className="font-black text-3xl text-stone-950 dark:text-white tracking-tighter">{categoryName}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="animate-slide-up">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-inner">
                            <Star size={24} className="text-brand-500" />
                        </div>
                        <h3 className="font-black text-3xl text-stone-950 dark:text-white tracking-tighter">Reseñas de Clientes</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.filter(r => r.storeId === selectedStore.id).map(review => (
                            <div key={review.id} className="bg-white dark:bg-stone-900/40 p-6 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center font-black text-stone-500">
                                            {review.userName[0].toUpperCase()}
                                        </div>
                                        <span className="font-black text-stone-950 dark:text-white tracking-tight">{review.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20">
                                        <Star size={14} className="text-brand-500 fill-brand-500" />
                                        <span className="text-sm font-black text-brand-600 dark:text-brand-400">{review.rating}</span>
                                    </div>
                                </div>
                                {review.comment && <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">{review.comment}</p>}
                                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-4">{new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {cart.length > 0 && (
            <div className="fixed bottom-24 left-0 w-full px-6 flex justify-center z-50 pointer-events-none">
                <div className="w-full max-w-2xl animate-slide-up pointer-events-auto">
                    <Button 
                        fullWidth 
                        size="lg" 
                        onClick={() => setClientViewState('CHECKOUT')} 
                        className="flex justify-between items-center px-8 py-8 !rounded-[2.5rem] shadow-2xl shadow-brand-500/30 border border-white/20 dark:border-white/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl text-sm font-black tracking-widest">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </div>
                            <span className="font-black text-xl tracking-tighter uppercase">Ver Carrito</span>
                        </div>
                        <span className="font-black text-2xl tracking-tighter">{formatCurrency(cart.reduce((a, b) => a + (b.totalPrice * b.quantity), 0))}</span>
                    </Button>
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
      <div className="bg-white dark:bg-[#050505] h-full transition-colors duration-300 flex flex-col">
        {showLocationSelector && LocationModal()}
        {productToCustomize && ProductModal()}
        {reviewOrder && ReviewModal()}
        {claimOrder && ClaimModal()}
        
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
                    <BadgeStatus status={activeOrder.status} type={activeOrder.type} />
                )}
            </div>
        )}

        <div className="flex-1 overflow-hidden relative">
        {clientViewState === 'RECEIPT' ? ReceiptView() :
         clientViewState === 'TRACKING' ? TrackingView() : 
         clientViewState === 'CHECKOUT' ? CheckoutView() : 
         clientViewState === 'HISTORY' ? HistoryView() :
         clientViewState === 'FAVORITES' ? FavoritesView() :
         clientViewState === 'PROFILE' ? ProfileView() :
         selectedStore ? StoreDetail() : (
            <div className="h-full flex flex-col lg:max-w-7xl lg:mx-auto lg:w-full">
                {StoreList()}
                <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                    {BannerCarousel()}
                    {CategoryPills()}
                    <HorizontalSection title="Cerca de ti" icon={<MapPin size={18} className="text-brand-800" />} data={recommendedStores} />
                    <HorizontalSection title="Servicios Profesionales" icon={<User size={18} className="text-blue-500" />} data={stores.filter(s => s.isActive === true && s.category === 'Servicios Profesionales')} />
                    <HorizontalSection title="Nuevos" icon={<Sparkles size={18} className="text-amber-500" />} data={stores.filter(s => s.isActive === true && isNewStore(s.createdAt))} />
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
                                        onShare={handleShareStore}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
         )}
        </div>
        {showTour && (
            <OnboardingTour 
                tourId="client-onboarding" 
                steps={clientTourSteps} 
                onComplete={() => completeTour('client-onboarding')} 
            />
        )}
      </div>
  );
};

const BadgeStatus: React.FC<{ status: OrderStatus, type?: OrderType }> = ({ status, type }) => {
    const labels: Record<string, string> = {
        [OrderStatus.PENDING]: 'Enviando...',
        [OrderStatus.ACCEPTED]: 'Aceptado',
        [OrderStatus.PREPARING]: 'Preparando',
        [OrderStatus.READY]: type === OrderType.PICKUP ? '¡Listo para recoger!' : 'Buscando Repartidor',
        [OrderStatus.DRIVER_ASSIGNED]: 'Repartidor Asignado',
        [OrderStatus.PICKED_UP]: 'En camino',
        [OrderStatus.DELIVERED]: 'Entregado'
    };
    return <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm border ${status === OrderStatus.READY && type === OrderType.PICKUP ? 'bg-brand-500 text-brand-950 border-brand-400' : 'bg-black/10 text-black border-black/5 dark:bg-white/10 dark:text-white dark:border-white/5'}`}>{labels[status]}</span>;
}

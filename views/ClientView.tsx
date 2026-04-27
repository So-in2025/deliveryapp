
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, Product, Store } from '../types';
import { Button } from '../components/ui/Button';
import { LazyImage } from '../components/ui/LazyImage';
import { ShoppingBag, Star, Plus, Minus, X, ArrowLeft, Heart, Trash2, Search, HelpCircle, History, MapPin, ChevronDown, Check, Tag, Map as MapIcon, Navigation, Share2, Award } from 'lucide-react';
import { formatCurrency, APP_CONFIG } from '../constants';
import { useToast } from '../context/ToastContext';
import { OnboardingTour, TourStep } from '../components/ui/OnboardingTour';
import { motion, AnimatePresence } from 'motion/react';
import { MapSelector } from '../components/ui/MapSelector';

// Extracted Components
import { StoreCard } from '../components/ui/StoreCard';
import { TrackingView } from '../components/client/TrackingView';
import { CheckoutView } from '../components/client/CheckoutView';
import { HistoryView } from '../components/client/HistoryView';
import { ReceiptView } from '../components/client/ReceiptView';
import { StoreDetail } from '../components/client/StoreDetail';
import { StoreList } from '../components/client/StoreList';
import { ProfileView } from '../components/client/ProfileView';
import { FavoritesView } from '../components/client/FavoritesView';
import { ItemDetailOverlay } from '../components/client/ItemDetailOverlay';

export const ClientView: React.FC = () => {
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const { 
        stores, cart, addToCart, removeFromCart, updateCartItemQuantity, 
        orders, favorites, toggleFavorite, toggleSettings, user, 
        updateUser, clientViewState, setClientViewState, 
        selectedStore, setSelectedStore, banners, config, completeTour, socket,
        searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
        showLocationSelector, setShowLocationSelector,
        productToView, setProductToView, productToCustomize, setProductToCustomize
    } = useApp();
    const { showToast } = useToast();
    
    // UI Local State
    const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
    const [claimOrder, setClaimOrder] = useState<Order | null>(null);

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    // --- ALGORITHMIC LISTS ---
    const recommendedStores = useMemo(() => {
        return stores
            .filter(s => s.isActive === true)
            .map(s => ({ ...s, score: (s.rating * 20) - (s.deliveryTimeMin) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }, [stores]);

    const favoriteStores = useMemo(() => {
        return stores.filter(s => favorites.includes(s.id) && s.isActive);
    }, [stores, favorites]);

    const newStores = useMemo(() => {
        return stores
            .filter(s => s.isActive)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
    }, [stores]);

    const freeDeliveryStores = useMemo(() => {
        return stores.filter(s => s.isActive && (s.deliveryFee === 0 || s.deliveryFee === null)).slice(0, 8);
    }, [stores]);

    const popularStores = useMemo(() => {
        return stores
            .filter(s => s.isActive)
            .sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
            .slice(0, 8);
    }, [stores]);

    const filteredStores = useMemo(() => {
        return stores
            .filter(store => {
                const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'ALL' || selectedCategory === 'Todos' || store.category === selectedCategory;
                return store.isActive === true && matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                const aFav = favorites.includes(a.id) ? 1 : 0;
                const bFav = favorites.includes(b.id) ? 1 : 0;
                return bFav - aFav;
            });
    }, [stores, searchQuery, selectedCategory, favorites]);

    const activeOrder = useMemo(() => {
        return orders
            .filter(o => o.customerId === user.uid && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DISPUTED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [orders, user.uid]);

    const handleToggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toggleFavorite(id);
    }, [toggleFavorite]);

    const handleShareStore = useCallback(async (e: React.MouseEvent, store: Store) => {
        e.stopPropagation();
        const shareData = {
          title: store.name,
          text: `¡Mira esta tienda en ${APP_CONFIG.appName}!`,
          url: `${window.location.origin}?store=${store.id}`,
        };
        try {
          if (navigator.share) await navigator.share(shareData);
          else {
            await navigator.clipboard.writeText(shareData.url);
            showToast("Enlace copiado", "success");
          }
        } catch { showToast("Error al compartir", "error"); }
    }, [showToast]);

    const clientTourSteps: TourStep[] = [
        { targetId: 'location-selector', title: 'Tu Ubicación', description: 'Configura tu dirección correctamente.', position: 'bottom' },
        { targetId: 'search-bar', title: 'Buscador Inteligente', description: 'Busca platos o comercios en segundos.', position: 'bottom' },
        { targetId: 'category-pills', title: 'Categorías', description: 'Filtra rápidamente por tipo de comida.', position: 'bottom' }
    ];

    const showTour = !user.completedTours?.includes('client-onboarding') && clientViewState === 'BROWSE';

    return (
        <div className="bg-white dark:bg-[#050505] h-full transition-colors duration-300 flex flex-col overflow-hidden">
            <AnimatePresence>
                {showLocationSelector && (
                    <LocationModal key="location-modal" onClose={() => setShowLocationSelector(false)} />
                )}
            </AnimatePresence>

            {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}
            {claimOrder && <ClaimModal order={claimOrder} onClose={() => setClaimOrder(null)} />}
            
            <AnimatePresence>
                {productToView && (
                    <ItemDetailOverlay key="item-overlay" />
                )}
                {productToCustomize && (
                    <ModifierModal 
                        key="modifier-modal"
                        product={productToCustomize} 
                        onClose={() => setProductToCustomize(null)} 
                    />
                )}
            </AnimatePresence>

            {activeOrder && clientViewState !== 'TRACKING' && clientViewState === 'BROWSE' && (
                <div onClick={() => setClientViewState('TRACKING')} className="w-full bg-brand-500 text-black p-3 flex justify-between items-center cursor-pointer shrink-0 z-50 shadow-xl animate-slide-down border-b border-black/10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                        <div>
                            <p className="text-[10px] text-black/70 font-black uppercase tracking-widest leading-none mb-1">Pedido en curso</p>
                            <p className="font-black text-sm tracking-tight">{activeOrder.storeName}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black bg-black/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">Ver Seguimiento</span>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {clientViewState === 'RECEIPT' ? <ReceiptView key="receipt" /> :
                     clientViewState === 'TRACKING' ? <TrackingView key="tracking" /> : 
                     clientViewState === 'CHECKOUT' ? <CheckoutView key="checkout" /> : 
                     clientViewState === 'HISTORY' ? <HistoryView key="history" /> :
                     clientViewState === 'FAVORITES' ? <FavoritesView key="favorites" /> :
                     clientViewState === 'PROFILE' ? <ProfileView key="profile" /> :
                     selectedStore ? <StoreDetail key="store-detail" /> : (
                        <div key="browse" className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                                <StoreList />
                                <BannerCarousel banners={banners} />
                                <div className="mt-8">
                                    <CategoryPills categories={config.categories} selected={selectedCategory} onSelect={setSelectedCategory} />
                                </div>
                                
                                <div className="space-y-16 mt-8">
                                    {/* SECCIÓN: FAVORITOS */}
                                    {favoriteStores.length > 0 && selectedCategory === 'ALL' && searchQuery === '' && (
                                        <HorizontalSection 
                                            title="Tus Favoritos" 
                                            icon={<Heart size={18} className="text-red-500" fill="currentColor" />} 
                                            data={favoriteStores} 
                                            onStoreClick={setSelectedStore} 
                                            favorites={favorites} 
                                            onToggleFavorite={handleToggleFavorite} 
                                            onShare={handleShareStore} 
                                        />
                                    )}
                                    
                                    {selectedCategory === 'ALL' && searchQuery === '' && (
                                        <>
                                            <HorizontalSection 
                                                title="Seleccionados" 
                                                icon={<Award size={18} className="text-amber-500" />} 
                                                data={recommendedStores} 
                                                onStoreClick={setSelectedStore} 
                                                favorites={favorites} 
                                                onToggleFavorite={handleToggleFavorite} 
                                                onShare={handleShareStore} 
                                            />

                                            <HorizontalSection 
                                                title="Los más pedidos" 
                                                icon={<Star size={18} className="text-brand-500" fill="currentColor" />} 
                                                data={popularStores} 
                                                onStoreClick={setSelectedStore} 
                                                favorites={favorites} 
                                                onToggleFavorite={handleToggleFavorite} 
                                                onShare={handleShareStore} 
                                            />

                                            {freeDeliveryStores.length > 0 && (
                                                <HorizontalSection 
                                                    title="Envío Sin Cargo" 
                                                    icon={<Tag size={18} className="text-emerald-500" />} 
                                                    data={freeDeliveryStores} 
                                                    onStoreClick={setSelectedStore} 
                                                    favorites={favorites} 
                                                    onToggleFavorite={handleToggleFavorite} 
                                                    onShare={handleShareStore} 
                                                />
                                            )}

                                            <HorizontalSection 
                                                title="Novedades" 
                                                icon={<Plus size={18} className="text-blue-500" />} 
                                                data={newStores} 
                                                onStoreClick={setSelectedStore} 
                                                favorites={favorites} 
                                                onToggleFavorite={handleToggleFavorite} 
                                                onShare={handleShareStore} 
                                            />
                                        </>
                                    )}
                                    
                                    <div className="px-6 lg:px-12 space-y-10 pb-12">
                                        <div className="flex items-center justify-between border-b-2 border-stone-100 dark:border-white/5 pb-6">
                                            <h3 className="font-black text-4xl text-stone-950 dark:text-white tracking-tighter uppercase italic">
                                                {selectedCategory !== 'ALL' ? selectedCategory : 'Explora Todo'}
                                            </h3>
                                            <span className="text-xs font-black text-stone-500 bg-stone-100 dark:bg-white/5 px-4 py-2 rounded-2xl border-2 border-stone-200 dark:border-white/10 shadow-sm">
                                                {filteredStores.length} Comercios
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
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
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}
                </AnimatePresence>

                {/* Floating Animated Cart Button */}
                {cart.length > 0 && clientViewState !== 'CHECKOUT' && (
                    <div className="absolute bottom-6 right-4 lg:right-10 z-[100] flex items-center justify-end pointer-events-none">
                        <motion.div layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="pointer-events-auto">
                            <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                            <motion.button 
                                onClick={() => {
                                    if (isMobile && !isCartExpanded) setIsCartExpanded(true);
                                    else setClientViewState('CHECKOUT');
                                }}
                                onMouseEnter={() => !isMobile && setIsCartExpanded(true)}
                                onMouseLeave={() => !isMobile && setIsCartExpanded(false)}
                                layout
                                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                className={`relative flex items-center bg-stone-950 dark:bg-brand-500 rounded-full border border-white/10 dark:border-brand-400 shadow-2xl h-16 group transition-all duration-300 ${isCartExpanded ? 'px-0 pr-2' : 'aspect-square w-16 justify-center'}`}
                            >
                                <div className={`flex items-center justify-center shrink-0 h-full transition-all duration-500 ${isCartExpanded ? 'px-5' : 'w-full'}`}>
                                    <div className="relative">
                                        <ShoppingBag size={24} className="text-white dark:text-stone-950" />
                                        <span className="absolute -top-3 -right-3 bg-brand-500 dark:bg-stone-950 text-brand-950 dark:text-white w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black border-2 border-stone-950 dark:border-brand-500 shadow-lg">
                                            {cart.reduce((a, b) => a + b.quantity, 0)}
                                        </span>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isCartExpanded && (
                                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex items-center gap-4 pr-6 overflow-hidden">
                                            <div className="shrink-0">
                                                <p className="text-white dark:text-stone-950 font-black text-[8px] tracking-[0.2em] uppercase opacity-40 leading-none">Checkout</p>
                                                <p className="text-white dark:text-stone-950 font-black text-base tracking-tighter leading-none mt-1">TOTAL</p>
                                            </div>
                                            <div className="bg-white/10 dark:bg-black/5 px-4 py-2 rounded-xl text-white dark:text-stone-950 font-black text-xl tracking-tighter leading-none">
                                                {formatCurrency(cart.reduce((a, b) => a + (b.totalPrice * b.quantity), 0))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </motion.div>
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

const ModifierModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
    const { addToCart, selectedStore } = useApp();
    const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
    const [quantity, setQuantity] = useState(1);

    const isGroupValid = (group: any) => {
        const count = selectedModifiers.filter(m => group.options.some((o: any) => o.id === m.id)).length;
        return count >= group.min && count <= group.max;
    };

    const allGroupsValid = product.modifierGroups?.every(isGroupValid) ?? true;

    const toggleModifier = (group: any, modifier: Modifier) => {
        const isSelected = selectedModifiers.some(m => m.id === modifier.id);
        const groupSelected = selectedModifiers.filter(m => group.options.some((o: any) => o.id === m.id));

        if (isSelected) {
            setSelectedModifiers(prev => prev.filter(m => m.id !== modifier.id));
        } else {
            if (group.max === 1) {
                setSelectedModifiers(prev => [
                    ...prev.filter(m => !group.options.some((o: any) => o.id === m.id)),
                    modifier
                ]);
            } else if (groupSelected.length < group.max) {
                setSelectedModifiers(prev => [...prev, modifier]);
            }
        }
    };

    const totalPrice = (product.price + selectedModifiers.reduce((acc, m) => acc + m.price, 0)) * quantity;

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl" onClick={onClose}></motion.div>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0A] rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <div className="relative h-64 lg:h-72 w-full shrink-0">
                        <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0A0A] via-transparent to-transparent"></div>
                        <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-2xl rounded-2xl text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 z-20 shadow-xl active:scale-90">
                            <X size={24}/>
                        </button>
                    </div>

                    <div className="p-8 lg:p-12 -mt-12 relative z-10">
                        <div className="mb-10">
                            <p className="text-brand-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Personalización</p>
                            <h2 className="text-4xl lg:text-5xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">{product.name}</h2>
                            <p className="text-stone-400 dark:text-stone-500 font-bold text-sm mt-2">{product.description}</p>
                        </div>

                        <div className="space-y-12">
                        {product.modifierGroups?.map(group => {
                            const selectedCount = selectedModifiers.filter(m => group.options.some(o => o.id === m.id)).length;
                            const isValid = isGroupValid(group);

                            return (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">{group.name}</h3>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">
                                                {group.min === 1 && group.max === 1 ? 'Selecciona una opción (Requerido)' : 
                                                 group.min === 0 ? `Selecciona hasta ${group.max} (Opcional)` : 
                                                 `Mínimo ${group.min}, máximo ${group.max}`}
                                            </p>
                                        </div>
                                        {isValid ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                                <Check size={12} strokeWidth={3} />
                                                <span className="text-[9px] font-black tracking-widest uppercase">Listo</span>
                                            </div>
                                        ) : (
                                            <div className="text-[9px] font-black tracking-widest uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg animate-pulse">
                                                Faltan {group.min - selectedCount}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {group.options.map(option => {
                                            const isSelected = selectedModifiers.some(m => m.id === option.id);
                                            return (
                                                <button 
                                                    key={option.id}
                                                    onClick={() => toggleModifier(group, option)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/5' : 'border-black/[0.03] dark:border-white/5 bg-stone-50 dark:bg-white/5 hover:border-brand-500/30'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-stone-300 dark:border-stone-700'}`}>
                                                            {isSelected && <Check size={14} className="text-brand-950" strokeWidth={4} />}
                                                        </div>
                                                        <span className={`text-xs font-black uppercase tracking-tight transition-colors ${isSelected ? 'text-stone-950 dark:text-white' : 'text-stone-600 dark:text-stone-400'}`}>{option.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-stone-500 tracking-tighter">+{formatCurrency(option.price)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-8 bg-stone-50 dark:bg-stone-800/30 border-t border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-2 rounded-2xl border border-black/[0.03] dark:border-white/10 shadow-inner">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-brand-500 transition-colors active:scale-95"><Minus size={18}/></button>
                            <span className="text-xl font-black w-8 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-brand-500 transition-colors active:scale-95"><Plus size={18}/></button>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total del item</p>
                            <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter">{formatCurrency(totalPrice)}</p>
                        </div>
                    </div>
                    <Button 
                        fullWidth 
                        size="lg" 
                        disabled={!allGroupsValid}
                        onClick={() => {
                            if (selectedStore) {
                                addToCart(product, quantity, selectedModifiers, selectedStore.id);
                                onClose();
                            }
                        }}
                        className="!rounded-[2rem] shadow-2xl shadow-brand-500/20"
                    >
                        AGREGAR AL CARRITO
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

// --- SUPPORTING SUB-COMPONENTS ---

const CategoryPills = ({ categories, selected, onSelect }: { categories: string[], selected: string, onSelect: (c: string) => void }) => {
    const list = ['Todos', ...categories];
    return (
        <div className="flex gap-4 px-6 lg:px-12 pb-8 overflow-x-auto scrollbar-hide pt-2">
            {list.map(cat => {
                const isSelected = (selected === cat || (selected === 'ALL' && cat === 'Todos'));
                return (
                    <button 
                        key={cat} 
                        onClick={() => onSelect(cat === 'Todos' ? 'ALL' : cat)}
                        className={`px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 border-2 ${isSelected ? 'bg-stone-950 dark:bg-brand-500 text-white dark:text-stone-950 border-stone-950 dark:border-brand-500 shadow-2xl shadow-brand-500/30 scale-105' : 'bg-white dark:bg-stone-900/40 text-stone-500 border-stone-200 dark:border-white/5 hover:border-brand-500/40 hover:text-brand-600 shadow-sm'}`}
                    >
                        {cat}
                    </button>
                )
            })}
        </div>
    );
};

const BannerCarousel = ({ banners }: { banners: any[] }) => {
    const activeBanners = banners.filter(b => b.isActive);
    if (activeBanners.length === 0) return (
        <div className="px-6 lg:px-12 py-6">
            <div className="w-full h-56 rounded-[3rem] bg-stone-950 border border-black/5 dark:border-white/5 relative overflow-hidden group shadow-2xl">
                <img 
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920" 
                    alt="Premium Food" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-stone-950/90 via-stone-950/60 to-brand-950/30" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-500 text-[10px] font-bold uppercase tracking-widest mb-3 w-fit backdrop-blur-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%]">
                        <Heart size={12} className="shrink-0" />
                        <span className="truncate">Lo mejor de tu comunidad</span>
                    </div>
                    <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-[1.1] max-w-[85%] break-words">
                        LO MEJOR DE <br /> <span className="text-brand-500">LA CIUDAD.</span>
                    </h2>
                </div>
            </div>
        </div>
    );
    return (
        <div className="flex gap-6 px-6 lg:px-12 py-8 overflow-x-auto scrollbar-hide snap-x">
            {activeBanners.map(banner => (
                <div key={banner.id} className="snap-center shrink-0 w-[85vw] lg:w-[600px] h-64 lg:h-72 rounded-[3.5rem] overflow-hidden relative shadow-2xl group cursor-pointer border border-white/5">
                    <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent p-6 sm:p-8 lg:p-14 flex flex-col justify-end">
                        <div className="bg-brand-500 text-brand-950 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit mb-4 shadow-xl">Promoción</div>
                        <h3 className="text-white text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight group-hover:text-brand-500 transition-colors uppercase leading-[1.1]">{banner.title}</h3>
                        <p className="text-stone-300 text-sm font-bold mt-3 opacity-80 max-w-md line-clamp-2">{banner.subtitle}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const HorizontalSection = ({ title, icon, data, onStoreClick, favorites, onToggleFavorite, onShare }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (data.length === 0) return null;

    // Desktop limit: 4 (one row in xl)
    const desktopLimit = 4;
    const hasMore = data.length > desktopLimit;
    const displayData = isExpanded ? data : data.slice(0, desktopLimit);

    return (
        <div className="space-y-8">
            <div className="px-6 lg:px-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-white/10 rounded-2xl shadow-md transition-transform hover:rotate-3">
                        {icon}
                    </div>
                    <h3 className="font-black text-3xl lg:text-4xl text-stone-950 dark:text-white tracking-tighter uppercase italic">{title}</h3>
                </div>
                {hasMore && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="hidden lg:flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 group-hover:text-brand-500 transition-colors">
                            {isExpanded ? 'Ver Menos' : 'Ver Todos'}
                        </span>
                        <div className={`w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-brand-950 transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={14} strokeWidth={3} />
                        </div>
                    </button>
                )}
            </div>
            
            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden flex gap-6 overflow-x-auto px-6 pb-10 scrollbar-hide snap-x pt-2">
                {data.map((store: any, idx: number) => (
                    <div key={store.id} className="snap-center shrink-0">
                        <StoreCard 
                            store={store} 
                            onClick={onStoreClick} 
                            index={idx} 
                            isFavorite={favorites.includes(store.id)} 
                            onToggleFavorite={onToggleFavorite} 
                            onShare={onShare} 
                            compact={true} 
                        />
                    </div>
                ))}
            </div>

            {/* Desktop: Grid Stack */}
            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-10 px-12 pb-10">
                {displayData.map((store: any, idx: number) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        key={store.id}
                    >
                        <StoreCard 
                            store={store} 
                            onClick={onStoreClick} 
                            index={idx} 
                            isFavorite={favorites.includes(store.id)} 
                            onToggleFavorite={onToggleFavorite} 
                            onShare={onShare} 
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const LocationModal = ({ onClose }: { onClose: () => void }) => {
    const { user, updateUser } = useApp();
    const [newAddr, setNewAddr] = useState('');
    const [showMapPicker, setShowMapPicker] = useState(false);

    const handleSelectAddress = (addr: string) => {
        const filtered = (user.addresses || []).filter(a => a !== addr);
        updateUser({ addresses: [addr, ...filtered] });
        onClose();
    };

    const handleMapSelect = (address: string, location: { lat: number, lng: number }) => {
        const existing = user.addresses || [];
        if (!existing.includes(address)) {
            updateUser({ addresses: [address, ...existing], lat: location.lat, lng: location.lng });
        } else {
            const filtered = existing.filter(a => a !== address);
            updateUser({ addresses: [address, ...filtered], lat: location.lat, lng: location.lng });
        }
        setShowMapPicker(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl" onClick={onClose}></motion.div>
            
            <AnimatePresence>
                {showMapPicker && (
                    <MapSelector 
                        onClose={() => setShowMapPicker(false)}
                        onSelect={handleMapSelect}
                    />
                )}
            </AnimatePresence>

            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-[3rem] p-10 shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <button onClick={onClose} className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all hover:rotate-90">
                        <X size={20}/>
                    </button>
                </div>

                <div className="mb-10">
                    <p className="text-brand-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Configuración</p>
                    <h2 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter">Tu Ubicación</h2>
                    <p className="text-stone-400 text-sm font-bold mt-2">Gestiona tus direcciones de entrega</p>
                </div>

                <div className="space-y-4 mb-10 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                    <button 
                        onClick={() => setShowMapPicker(true)}
                        className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 border-brand-500 bg-brand-500/5 hover:bg-brand-500/10 transition-all text-left mb-4 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-brand-950 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                            <MapIcon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tight">Usar Mapa Interactivo</p>
                            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-0.5">Seleccionar con precisión</p>
                        </div>
                    </button>

                    {user.addresses?.map((addr, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleSelectAddress(addr)}
                            className={`group flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer ${i === 0 ? 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10' : 'bg-transparent border-transparent hover:border-brand-500/30'}`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i === 0 ? 'bg-brand-500 text-brand-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}>
                                    <MapPin size={18} />
                                </div>
                                <div className="truncate">
                                    <p className={`text-sm font-black tracking-tight ${i === 0 ? 'text-stone-950 dark:text-white' : 'text-stone-500'}`}>{addr}</p>
                                    {i === 0 && <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5">Principal</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {i === 0 ? (
                                    <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-brand-950">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); updateUser({ addresses: user.addresses?.filter(a => a !== addr) }); }} 
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!user.addresses || user.addresses.length === 0) && (
                        <div className="py-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[2rem]">
                            <HelpCircle size={48} className="mx-auto text-stone-200 dark:text-stone-800 mb-4" />
                            <p className="text-stone-400 font-bold text-sm">No tienes direcciones guardadas</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            placeholder="Escribir dirección manual..." 
                            className="w-full bg-stone-100 dark:bg-stone-800/50 pl-14 pr-6 py-5 rounded-[1.5rem] text-sm font-black outline-none border-2 border-transparent focus:border-brand-500 transition-all text-stone-950 dark:text-white placeholder-stone-400" 
                            value={newAddr} 
                            onChange={e => setNewAddr(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newAddr) {
                                    updateUser({ addresses: [...(user.addresses || []), newAddr] });
                                    setNewAddr('');
                                }
                            }}
                        />
                    </div>
                    <Button 
                        fullWidth 
                        size="lg"
                        disabled={!newAddr}
                        onClick={() => { if(newAddr) { updateUser({ addresses: [...(user.addresses || []), newAddr] }); setNewAddr(''); } }}
                    >
                        GUARDAR DIRECCIÓN
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

const ReviewModal = ({ order, onClose }: any) => {
    const { addReview, user } = useApp();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in text-center">
                <h2 className="text-2xl font-black tracking-tighter mb-1">Danos tu opinión</h2>
                <p className="text-stone-400 text-xs font-bold uppercase mb-8">{order.storeName}</p>
                <div className="flex justify-center gap-3 mb-8">
                    {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                            <Star size={32} className={`${s <= rating ? 'fill-brand-500 text-brand-500' : 'text-stone-200 dark:text-stone-800'}`} />
                        </button>
                    ))}
                </div>
                <textarea placeholder="¿Qué tal estuvo todo?" value={comment} onChange={e => setComment(e.target.value)} className="w-full bg-stone-50 dark:bg-white/5 rounded-2xl p-4 text-xs font-bold outline-none border border-black/[0.03] h-24 mb-6 resize-none" />
                <Button fullWidth onClick={() => { addReview({ id: `r-${Date.now()}`, storeId: order.storeId, orderId: order.id, rating, comment, createdAt: new Date().toISOString(), userName: user.name }); showToast('¡Gracias por tu opinión!', 'success'); onClose(); }}>ENVIAR COMENTARIO</Button>
            </div>
        </div>
    );
};

const ClaimModal = ({ order, onClose }: any) => {
    const { submitClaim, setClientViewState } = useApp();
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-black tracking-tighter mb-2">Ayuda con pedido</h2>
                <p className="text-stone-400 text-xs font-bold mb-8">Cuéntanos que pasó con tu pedido de {order.storeName}</p>
                <textarea placeholder="Describe el inconveniente..." value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-stone-50 dark:bg-white/5 rounded-2xl p-4 text-xs font-bold outline-none border border-black/[0.03] h-32 mb-6" />
                <div className="flex gap-3">
                    <Button fullWidth variant="outline" onClick={onClose}>CANCELAR</Button>
                    <Button fullWidth className="!bg-red-600 !text-white" onClick={() => { submitClaim(order.id, reason); onClose(); setClientViewState('HISTORY'); }}>REPORTAR PROBLEMA</Button>
                </div>
            </div>
        </div>
    );
};


import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../constants';
import { ArrowLeft, Star, Clock, Heart, Share2, Search, Bike, Info, Plus, MapPin } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { motion } from 'motion/react';

export const StoreDetail: React.FC = () => {
    const { selectedStore, setSelectedStore, favorites, toggleFavorite, handleShareStore, setProductToView } = useApp();
    
    if (!selectedStore) return null;

    const isFavorite = favorites.includes(selectedStore.id);
    const accentColor = selectedStore.aesthetic?.accentColor || '#FACC15';

    // Heuristics for ratings
    const isNew = (dateString: string): boolean => {
        const created = new Date(dateString);
        const now = new Date();
        return (now.getTime() - created.getTime()) < (7 * 24 * 60 * 60 * 1000);
    };

    const displayRating = (isNew(selectedStore.createdAt || '') && (selectedStore.reviewsCount === 0 || !selectedStore.reviewsCount)) ? 5.0 : (selectedStore.rating || 0);

    return (
            <div className="w-full h-full overflow-y-auto bg-stone-50 dark:bg-stone-950 animate-fade-in relative pb-32 lg:pb-16 scroll-smooth">
                {/* Header / Banner - Immersive Élite */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative min-h-[50vh] md:min-h-[26rem] lg:min-h-[40vh] w-full shrink-0 flex flex-col justify-between pb-6 md:pb-8 lg:pb-14 overflow-hidden"
                >
                    <div className="absolute inset-0 z-0">
                        <motion.div
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="w-full h-full"
                        >
                            <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-stone-950/20 backdrop-brightness-75"></div>
                    </div>
                                        <div className="relative w-full px-6 pb-6 md:p-8 lg:p-14 z-10 mt-auto">
                        <motion.div 
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center flex-wrap gap-2 mb-4">
                                <span className="bg-brand-500 text-brand-950 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-brand-500/20">
                                    {selectedStore.category}
                                </span>
                                {isNew(selectedStore.createdAt || '') && (
                                    <span className="bg-white/10 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">Nuevo</span>
                                )}
                            </div>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-6 italic uppercase">
                                {selectedStore.name}
                            </h1>
                            
                            <div className="flex items-center flex-wrap gap-y-3 gap-x-6 bg-stone-950/50 backdrop-blur-3xl w-fit p-4 md:p-5 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="flex items-center gap-2 font-black text-white">
                                    <Star size={20} fill={accentColor} color={accentColor} />
                                    <span className="text-xl md:text-2xl tracking-tighter leading-none">{displayRating.toFixed(1)}</span>
                                    <span className="text-xs text-white/50 font-bold ml-1 uppercase">{selectedStore.reviewsCount || 0} reseñas</span>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-white/10" />
                                <div className="flex items-center gap-2 font-black text-white">
                                    <Clock size={20} className="text-white/50" />
                                    <span className="text-xl md:text-2xl tracking-tighter leading-none">{selectedStore.deliveryTimeMin}-{selectedStore.deliveryTimeMax} min</span>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-white/10" />
                                <div className="flex items-center gap-2 font-black text-white">
                                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                                        <Bike size={16} className="text-brand-500" />
                                    </div>
                                    <span className="text-xl md:text-2xl tracking-tighter leading-none">{formatCurrency(selectedStore.deliveryFee || 0)}</span>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-white/10" />
                                <div className="flex items-center gap-2 font-black text-white">
                                    <MapPin size={20} className="text-white/50" />
                                    <span className="text-xs md:text-sm tracking-tight leading-tight max-w-[150px] line-clamp-1">{selectedStore.address || 'Ubicación no disponible'}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Search & Actions Bar - Refined Élite Sticky */}
                <div className="sticky top-0 lg:top-0 z-40 px-6 py-4 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl border-b border-stone-200 dark:border-white/5 shadow-sm space-y-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedStore(null)}
                            className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 lg:py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-950 dark:text-white font-black uppercase text-[10px] lg:text-xs tracking-widest shadow-sm"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                            <span>Volver</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-3">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedStore.id); }}
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${isFavorite ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-white/10 text-stone-950 dark:text-white shadow-sm'}`}
                            >
                                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={3} />
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleShareStore(e, selectedStore)}
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-950 dark:text-white shadow-sm transition-all"
                            >
                                <Share2 size={20} strokeWidth={3} />
                            </motion.button>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto flex gap-4 items-center">
                        <div className="flex-1 relative group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" />
                            <input 
                                placeholder="Buscar en el catálogo..." 
                                className="w-full bg-white dark:bg-stone-900 pl-16 pr-8 py-4 rounded-2xl text-base font-bold outline-none border-2 border-transparent focus:border-brand-500/50 dark:focus:border-brand-500/20 shadow-inner transition-all text-stone-950 dark:text-white placeholder-stone-400"
                            />
                        </div>
                        <button className="hidden sm:flex w-14 h-14 items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl shadow-sm text-stone-950 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all">
                            <Info size={24} />
                        </button>
                    </div>
                </div>

                {/* Menu List - Elite Grid */}
                <div className="w-full p-6 lg:p-14">
                    <div className="max-w-7xl mx-auto space-y-20">
                        {selectedStore.products && selectedStore.products.length > 0 ? (
                            [...new Set((selectedStore.products || []).map(p => p.category || 'Destacados'))].map((category, catIndex) => (
                                <motion.div 
                                    key={category} 
                                    className="space-y-10"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: catIndex * 0.1 }}
                                >
                                    <div className="flex items-end justify-between border-b border-stone-200 dark:border-white/10 pb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-3 h-12 bg-gradient-to-b from-brand-500 to-brand-700 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                                            <h2 className="text-4xl md:text-5xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic leading-none">
                                                {category}
                                            </h2>
                                        </div>
                                        <span className="text-sm font-black text-stone-400 uppercase tracking-widest hidden sm:block">{(selectedStore.products || []).filter(p => (p.category || 'Destacados') === category).length} items</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                        {(selectedStore.products || [])
                                            .filter(p => (p.category || 'Destacados') === category)
                                            .map((product) => (
                                                <motion.div 
                                                    key={product.id}
                                                    whileHover={{ y: -8 }}
                                                    transition={{ duration: 0.4, ease: "circOut" }}
                                                    onClick={() => setProductToView(product)}
                                                    className="group flex flex-col bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-white/5 hover:border-brand-500/40 transition-all duration-500 shadow-xl shadow-black/[0.03] hover:shadow-2xl hover:shadow-brand-500/10 cursor-pointer overflow-hidden p-3"
                                                >
                                                    <div className="relative h-64 w-full rounded-[2rem] overflow-hidden mb-6">
                                                        <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                        <div className="absolute inset-x-4 bottom-4 flex justify-between items-end">
                                                            <div className="bg-stone-950/80 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10">
                                                                <span className="text-xl font-black text-white tracking-tighter">{formatCurrency(product.price)}</span>
                                                            </div>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                className="w-14 h-14 bg-brand-500 text-brand-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 border border-brand-400 transition-all"
                                                            >
                                                                <Plus size={28} strokeWidth={3} />
                                                            </motion.button>
                                                        </div>
                                                        {product.isAvailable === false && (
                                                            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                                                                <span className="text-white font-black uppercase tracking-tighter text-2xl rotate-[-10deg] border-4 border-white px-6 py-2">No Disponible</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="px-5 pb-5">
                                                        <h4 className="font-black text-2xl text-stone-950 dark:text-white tracking-tight uppercase italic leading-tight mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-stone-500 dark:text-stone-400 text-xs font-bold leading-relaxed line-clamp-2 italic">
                                                            {product.description}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-32 h-32 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-dashed border-stone-300 dark:border-white/10">
                                    <ShoppingBag size={48} className="text-stone-300 dark:text-white/20" />
                                </div>
                                <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase italic tracking-tighter">No hay productos disponibles</h3>
                                <p className="text-stone-500 dark:text-stone-400 font-bold mt-2">Esta tienda aún no ha cargado su menú.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
};


import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../constants';
import { ArrowLeft, Star, Clock, Heart, Share, Search, Bike, Info } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { motion } from 'motion/react';
import { Product, Store } from '../../types';

export const StoreDetail: React.FC = () => {
    const { selectedStore, setSelectedStore, favorites, toggleFavorite, handleShareStore, setProductToCustomize, setProductToView } = useApp();
    
    if (!selectedStore) return null;

    const isFavorite = favorites.includes(selectedStore.id);
    const accentColor = selectedStore.aesthetic?.accentColor || '#FACC15';

    // Heuristics for ratings
    const isNew = (dateString: string): boolean => {
        const created = new Date(dateString);
        const now = new Date();
        return (now.getTime() - created.getTime()) < (7 * 24 * 60 * 60 * 1000);
    };

    const displayRating = (isNew(selectedStore.createdAt) && selectedStore.reviewsCount === 0) ? 5.0 : selectedStore.rating;

    return (
        <div className="w-full h-full overflow-y-auto bg-stone-50 dark:bg-[#050505] animate-fade-in relative pb-32">
            {/* Header / Banner */}
            <div className="relative h-64 lg:h-80 w-full overflow-hidden shrink-0">
                <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-50 dark:from-[#050505] via-stone-900/40 to-stone-900/20"></div>
                
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                    <button 
                        onClick={() => setSelectedStore(null)}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedStore.id); }}
                            className={`w-12 h-12 backdrop-blur-xl border rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isFavorite ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white/20 border-white/20 text-white'}`}
                        >
                            <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                            onClick={(e) => handleShareStore(e, selectedStore)}
                            className="w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90"
                        >
                            <Share size={20} />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12">
                    <div className="animate-slide-up">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                                {selectedStore.category}
                            </span>
                            {isNew(selectedStore.createdAt) && (
                                <span className="bg-white text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">Nuevo</span>
                            )}
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-stone-950 dark:text-white tracking-tighter leading-none mb-4">
                            {selectedStore.name}
                        </h1>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 font-black text-stone-900 dark:text-white">
                                <Star size={20} fill={accentColor} color={accentColor} />
                                <span className="text-xl tracking-tighter">{displayRating.toFixed(1)}</span>
                                <span className="text-xs text-stone-400 dark:text-stone-500 font-bold ml-1">({selectedStore.reviewsCount || 0})</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-black text-stone-900 dark:text-white">
                                <Clock size={20} className="text-stone-400" />
                                <span className="text-xl tracking-tighter">{selectedStore.deliveryTimeMin}-{selectedStore.deliveryTimeMax} min</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-black text-stone-900 dark:text-white">
                                <Bike size={20} className="text-brand-500" />
                                <span className="text-xl tracking-tighter">{formatCurrency(selectedStore.deliveryFee || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Info Bar */}
            <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-30 shrink-0 sticky top-0 border-b border-black/[0.03] dark:border-white/[0.03]">
                <div className="flex-1 max-w-md relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        placeholder="Busca en el menú..." 
                        className="w-full bg-stone-50 dark:bg-white/5 pl-12 pr-4 py-3 rounded-2xl text-xs font-black outline-none border border-transparent focus:border-brand-500 transition-all text-stone-950 dark:text-white"
                    />
                </div>
                <div className="ml-4 flex gap-2">
                    <button className="p-3 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-400 hover:text-brand-500 transition-colors">
                        <Info size={18} />
                    </button>
                </div>
            </div>

            {/* Menu List */}
            <div className="w-full p-6 lg:p-12 mb-32">
                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Heuristic: Simple category groups */}
                    {[...new Set(selectedStore.products.map(p => p.category || 'Destacados'))].map(category => (
                        <div key={category} className="space-y-6">
                            <h2 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter flex items-center gap-3">
                                <span className="w-2 h-6 bg-brand-500 rounded-full" />
                                {category}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedStore.products
                                    .filter(p => (p.category || 'Destacados') === category)
                                    .map(product => (
                                        <div 
                                            key={product.id}
                                            onClick={() => setProductToView(product)}
                                            className="group bg-white dark:bg-stone-900/40 p-5 rounded-[2.5rem] border border-black/[0.03] dark:border-white/[0.03] flex gap-5 hover:border-brand-500/20 transition-all duration-500 shadow-2xl shadow-black/5 cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h4 className="font-black text-xl text-stone-900 dark:text-white tracking-tight group-hover:text-brand-600 transition-colors truncate">{product.name}</h4>
                                                    <p className="text-stone-400 text-xs mt-2 line-clamp-2 font-medium leading-relaxed">{product.description}</p>
                                                </div>
                                                <div className="mt-4 flex items-center gap-3">
                                                    <span className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">{formatCurrency(product.price)}</span>
                                                    {product.modifierGroups && product.modifierGroups.length > 0 && (
                                                        <span className="text-[10px] font-black text-brand-600 bg-brand-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">Personalizable</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[2rem] overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700">
                                                <LazyImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

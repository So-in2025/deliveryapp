
import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../constants';
import { ArrowLeft, Star, Clock, Heart, Share2, Search, Bike, Info, Plus } from 'lucide-react';
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
        <div className="w-full h-full overflow-y-auto bg-stone-50 dark:bg-stone-950 animate-fade-in relative pb-16">
            {/* Header / Banner */}
            <div className="relative h-72 lg:h-96 w-full overflow-hidden shrink-0">
                <LazyImage src={selectedStore.image} alt={selectedStore.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-50 dark:from-stone-950 via-stone-900/40 to-stone-900/20"></div>
                
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                    <button 
                        onClick={() => setSelectedStore(null)}
                        className="w-14 h-14 bg-white/90 dark:bg-stone-950/80 backdrop-blur-2xl border-2 border-white dark:border-white/10 rounded-[1.5rem] flex items-center justify-center text-stone-950 dark:text-white shadow-2xl hover:scale-110 transition-all active:scale-90"
                    >
                        <ArrowLeft size={28} />
                    </button>
                    <div className="flex gap-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedStore.id); }}
                            className={`w-14 h-14 backdrop-blur-2xl border-2 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 ${isFavorite ? 'bg-red-500 border-red-400 text-white shadow-xl shadow-red-500/30' : 'bg-white/90 dark:bg-stone-950/80 border-white dark:border-white/10 text-stone-950 dark:text-white'}`}
                        >
                            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                            onClick={(e) => handleShareStore(e, selectedStore)}
                            className="w-14 h-14 bg-white/90 dark:bg-stone-950/80 backdrop-blur-2xl border-2 border-white dark:border-white/10 rounded-[1.5rem] flex items-center justify-center text-stone-950 dark:text-white hover:scale-110 transition-all active:scale-90"
                        >
                            <Share2 size={24} />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 lg:p-14">
                    <div className="animate-slide-up">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl border border-brand-400">
                                {selectedStore.category}
                            </span>
                            {isNew(selectedStore.createdAt) && (
                                <span className="bg-white/90 text-stone-950 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest border border-stone-200">Nuevo</span>
                            )}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-stone-950 dark:text-white tracking-tighter leading-none mb-6 italic uppercase">
                            {selectedStore.name}
                        </h1>
                        <div className="flex items-center gap-8 bg-white/10 dark:bg-black/10 backdrop-blur-md w-fit p-4 rounded-3xl border border-white/20">
                            <div className="flex items-center gap-2 font-black text-stone-950 dark:text-white">
                                <Star size={24} fill={accentColor} color={accentColor} />
                                <span className="text-2xl tracking-tighter">{displayRating.toFixed(1)}</span>
                                <span className="text-sm text-stone-950/60 dark:text-stone-500 font-bold ml-1">({selectedStore.reviewsCount || 0})</span>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div className="flex items-center gap-2 font-black text-stone-950 dark:text-white">
                                <Clock size={24} className="text-stone-950 dark:text-white" />
                                <span className="text-2xl tracking-tighter">{selectedStore.deliveryTimeMin}-{selectedStore.deliveryTimeMax} min</span>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div className="flex items-center gap-2 font-black text-stone-950 dark:text-white">
                                <Bike size={24} className="text-brand-500" />
                                <span className="text-2xl tracking-tighter">{formatCurrency(selectedStore.deliveryFee || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Info Bar / Búsqueda */}
            <div className="bg-white dark:bg-stone-900 border-y border-stone-200 dark:border-white/5 px-6 py-4 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-lg shadow-black/[0.02]">
                <div className="flex-1 max-w-2xl mx-auto relative group">
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        placeholder="Buscar platos o sabores..." 
                        className="w-full bg-stone-50 dark:bg-white/5 pl-14 pr-6 py-4 rounded-[1.5rem] text-sm font-black outline-none border-2 border-stone-100 dark:border-transparent focus:border-brand-500 transition-all text-stone-950 dark:text-white placeholder-stone-400"
                    />
                </div>
            </div>

            {/* Menu List */}
            <div className="w-full p-6 lg:p-14">
                <div className="max-w-7xl mx-auto space-y-16">
                    {[...new Set(selectedStore.products.map(p => p.category || 'Destacados'))].map(category => (
                        <div key={category} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-10 bg-brand-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                <h2 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic">
                                    {category}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {selectedStore.products
                                    .filter(p => (p.category || 'Destacados') === category)
                                    .map(product => (
                                        <div 
                                            key={product.id}
                                            onClick={() => setProductToView(product)}
                                            className="group bg-white dark:bg-stone-900 p-6 rounded-[3rem] border-2 border-stone-200/60 dark:border-white/5 flex gap-6 hover:border-brand-500/40 transition-all duration-500 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-2">
                                                <div>
                                                    <h4 className="font-black text-2xl text-stone-950 dark:text-white tracking-tight group-hover:text-brand-600 transition-colors truncate uppercase italic">{product.name}</h4>
                                                    <p className="text-stone-400 dark:text-stone-500 text-[11px] mt-3 line-clamp-2 font-bold leading-relaxed tracking-tight">{product.description}</p>
                                                </div>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <span className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">{formatCurrency(product.price)}</span>
                                                    <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-brand-500 group-hover:text-brand-950 transition-all border border-stone-100 dark:border-white/5">
                                                        <Plus size={24} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[2.5rem] overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 shadow-inner border border-stone-100 dark:border-white/5 group-hover:scale-105 transition-all duration-700">
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

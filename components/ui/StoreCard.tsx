
import React from 'react';
import { Store } from '../../types';
import { Star, Share, Heart, Clock } from 'lucide-react';
import { LazyImage } from './LazyImage';
import { formatCurrency, isStoreOpen } from '../../constants';

// Heuristic: Is the store considered "New"? (Less than 7 days old)
const isNewStore = (dateString: string): boolean => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
};

export const StoreCard = React.memo(({ store, onClick, index, isFavorite, onToggleFavorite, onShare, compact = false }: { store: Store; onClick: (s: Store) => void; index: number; isFavorite: boolean; onToggleFavorite: (e: React.MouseEvent, id: string) => void; onShare: (e: React.MouseEvent, store: Store) => void; compact?: boolean }) => {
    const isNew = isNewStore(store.createdAt);
    const displayRating = (isNew && store.reviewsCount === 0) ? 5.0 : store.rating;
    const storeOpen = isStoreOpen(store);
    
    return (
        <div 
            onClick={() => onClick(store)}
            className={`group bg-white dark:bg-stone-900/40 rounded-[2.5rem] p-3 shadow-2xl shadow-black/[0.05] border border-black/[0.05] dark:border-white/[0.05] backdrop-blur-sm active:scale-[0.98] transition-all duration-500 cursor-pointer animate-slide-up relative overflow-hidden hover:shadow-brand-500/10 hover:border-brand-500/30 ${compact ? 'min-w-[280px] w-[280px]' : 'w-full h-full flex flex-col'} ${!storeOpen ? 'opacity-70 grayscale-[0.5]' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`relative overflow-hidden rounded-[2.2rem] bg-stone-100 dark:bg-stone-800 shrink-0 shadow-inner ${compact ? 'h-36' : 'h-48 sm:h-56'}`}>
                <LazyImage src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
                
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {!storeOpen && (
                        <span className="bg-stone-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl backdrop-blur-md border border-stone-600 flex items-center gap-1">
                            <Clock size={12} /> Cerrado
                        </span>
                    )}
                    {isNew && storeOpen && (
                        <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl backdrop-blur-md border border-brand-400">Nuevo</span>
                    )}
                    {store.deliveryFee === 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl backdrop-blur-md border border-emerald-400">Envío Gratis</span>
                    )}
                </div>

                {/* Favorite Toggle */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, store.id); }}
                  className={`absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md border ${isFavorite ? 'bg-red-500 border-red-400 text-white shadow-xl scale-110' : 'bg-black/20 border-white/20 text-white hover:bg-white/30 hover:scale-105'}`}
                >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2.5} />
                </button>

                {/* Delivery Time Overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{store.deliveryTimeMin}-{store.deliveryTimeMax} MIN</span>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-xl text-stone-900 dark:text-white tracking-tighter leading-none truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors uppercase">{store.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-stone-400 font-black text-[10px] uppercase tracking-widest">{store.category}</span>
                            <span className="w-1 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
                            <span className="text-stone-500 dark:text-brand-500/80 font-black text-[10px] uppercase tracking-widest">
                                {store.deliveryFee === 0 ? 'Sin cargo' : formatCurrency(store.deliveryFee ?? 0)}
                            </span>
                        </div>
                    </div>
                    <div className="bg-brand-500/10 dark:bg-brand-500/5 px-3 py-2 rounded-2xl flex items-center gap-1.5 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-brand-950 transition-all duration-500 shadow-lg shadow-brand-500/0 group-hover:shadow-brand-500/20">
                        <Star size={14} fill="currentColor" className="text-brand-500 group-hover:text-brand-950" />
                        <span className="text-sm font-black dark:text-white group-hover:text-brand-950">{displayRating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 flex items-center justify-between border-t border-black/[0.03] dark:border-white/[0.03]">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-lg border-2 border-white dark:border-stone-900 bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
                                <span className="text-[6px] font-black opacity-40">U{i}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={(e) => onShare(e, store)} 
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-300 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
                    >
                        <Share size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
});

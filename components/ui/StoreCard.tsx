
import React from 'react';
import { Store } from '../../types';
import { Star, Share2, Heart, Clock } from 'lucide-react';
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
            className={`group bg-white dark:bg-stone-900/40 rounded-[3rem] p-4 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] dark:shadow-2xl dark:shadow-black/[0.1] border-2 border-stone-200 dark:border-white/[0.08] backdrop-blur-sm active:scale-[0.98] transition-all duration-500 cursor-pointer animate-slide-up relative overflow-hidden hover:shadow-brand-500/20 hover:border-brand-500 ${compact ? 'min-w-[320px] w-[320px]' : 'w-full h-full flex flex-col'} ${!storeOpen ? 'opacity-70 grayscale-[0.5]' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`relative overflow-hidden rounded-[2.5rem] bg-stone-100 dark:bg-stone-800 shrink-0 shadow-inner border-2 border-stone-100 dark:border-transparent ${compact ? 'h-40' : 'h-52 sm:h-64'}`}>
                <LazyImage src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
                
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {!storeOpen && (
                        <span className="bg-stone-900 dark:bg-stone-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-1">
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
                        <h3 className="font-black text-2xl text-stone-950 dark:text-white tracking-tighter leading-[1] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors uppercase italic break-words">{store.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-stone-400 dark:text-stone-500 font-black text-[9px] uppercase tracking-[0.2em]">{store.category}</span>
                            <span className="w-1 h-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
                            <span className="text-brand-600 dark:text-brand-500 font-black text-[9px] uppercase tracking-widest bg-brand-500/10 dark:bg-brand-500/5 px-2.5 py-1 rounded-lg border-2 border-brand-500/20 whitespace-nowrap">
                                {store.deliveryFee === 0 ? 'Envío Gratis' : `Envío ${formatCurrency(store.deliveryFee ?? 0)}`}
                            </span>
                        </div>
                    </div>
                    <div className="bg-brand-500 text-brand-950 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 border-2 border-brand-400 shadow-[0_10px_25px_-5px_rgba(250,204,21,0.4)] shrink-0 transition-transform group-hover:scale-110">
                        <Star size={16} fill="currentColor" className="text-brand-950" />
                        <span className="text-base font-black tracking-tighter">{displayRating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div className="mt-6 pt-5 flex items-center justify-between border-t-2 border-stone-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-stone-400 dark:text-stone-500 text-xs font-black uppercase tracking-tight">{store.reviewsCount > 0 ? `${store.reviewsCount} reseñas` : 'Nuevo comercio'}</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(e, store); }} 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl text-stone-500 dark:text-stone-400 hover:text-brand-600 bg-stone-100 dark:bg-stone-800 hover:bg-brand-500/10 transition-all active:scale-95 border-2 border-stone-200/50 dark:border-white/5 hover:border-brand-500/30 shadow-sm"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
});


import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../constants';
import { X, Plus, Clock, Star, Share2, Award } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { motion, AnimatePresence } from 'motion/react';

export const ItemDetailOverlay: React.FC = () => {
    const { productToView, setProductToView, setProductToCustomize, addToCart, selectedStore } = useApp();
    const { showToast } = (window as any).toastContext || { showToast: () => {} }; // Fallback

    if (!productToView) return null;

    const accentColor = selectedStore?.aesthetic?.accentColor || '#FACC15';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" 
                onClick={() => setProductToView(null)}
            ></motion.div>
            
            <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10"
            >
                <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
                    {/* Image side */}
                    <div className="relative w-full lg:w-3/5 h-80 lg:h-full group">
                        <LazyImage src={productToView.image} alt={productToView.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent lg:hidden"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/20 via-transparent to-transparent hidden lg:block"></div>
                        
                        <button 
                            onClick={() => setProductToView(null)} 
                            className="absolute top-6 left-6 w-12 h-12 bg-black/20 backdrop-blur-xl rounded-2xl text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/10 z-20"
                        >
                            <X size={24} />
                        </button>

                        <div className="absolute bottom-6 left-6 z-20">
                           <div className="flex items-center gap-2 bg-brand-500 text-brand-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                               <Award size={14} fill="currentColor" />
                               Recomendado
                           </div>
                        </div>
                    </div>

                    {/* Content side */}
                    <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
                        <div className="flex-1">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <h3 className="text-4xl lg:text-5xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">{productToView.name}</h3>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="text-3xl font-black text-brand-600 dark:text-brand-400 tracking-tighter leading-none">
                                    {formatCurrency(productToView.price)}
                                </div>
                                <div className="h-4 w-px bg-stone-200 dark:bg-stone-800"></div>
                                <div className="flex items-center gap-1.5 text-stone-500 font-bold text-sm">
                                    <Clock size={16} /> 15 min
                                </div>
                            </div>

                            <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed font-medium mb-12">
                                {productToView.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-12">
                                <div className="bg-stone-50 dark:bg-white/5 p-4 rounded-2xl border border-black/[0.03]">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Información</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                        <span className="text-xs font-black text-stone-900 dark:text-white">Ingredientes frescos</span>
                                    </div>
                                </div>
                                <div className="bg-stone-50 dark:bg-white/5 p-4 rounded-2xl border border-black/[0.03]">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Popularidad</p>
                                    <div className="flex items-center gap-1.5">
                                        <Star size={14} className="text-brand-500 fill-brand-500" />
                                        <span className="text-xs font-black text-stone-900 dark:text-white">Lo más pedido</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-black/[0.03] dark:border-white/5 flex gap-4">
                            <button className="p-5 bg-stone-100 dark:bg-stone-800 rounded-3xl text-stone-500 hover:text-stone-900 transition-colors shadow-sm">
                                <Share2 size={24} />
                            </button>
                            <Button 
                                fullWidth 
                                size="lg" 
                                className="!h-auto py-6 !rounded-3xl shadow-2xl shadow-brand-500/20"
                                onClick={() => {
                                    if (productToView.modifierGroups && productToView.modifierGroups.length > 0) {
                                        setProductToCustomize(productToView);
                                        setProductToView(null);
                                    } else {
                                        if (selectedStore) {
                                            addToCart(productToView, 1, [], selectedStore.id);
                                            setProductToView(null);
                                        }
                                    }
                                }}
                            >
                                <div className="flex justify-between items-center w-full px-4">
                                    <span className="font-black tracking-widest text-base uppercase">
                                        {productToView.modifierGroups && productToView.modifierGroups.length > 0 ? 'PERSONALIZAR' : 'PEDIR AHORA'}
                                    </span>
                                    <Plus size={24} strokeWidth={4} />
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

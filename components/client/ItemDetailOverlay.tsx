
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../constants';
import { X, Plus } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { motion, AnimatePresence } from 'motion/react';

export const ItemDetailOverlay: React.FC = () => {
    const { productToView, setProductToView, setProductToCustomize, addToCart, selectedStore } = useApp();
    const { showToast } = useToast();

    if (!productToView) return null;

    return (
        <AnimatePresence>
            {productToView && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-8">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" 
                        onClick={() => setProductToView(null)}
                    />
                    
                    <motion.div 
                        initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-sm bg-white dark:bg-[#0A0A0A] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-black/5 dark:border-white/10"
                    >
                        <div className="relative w-full h-36 shrink-0 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                            <LazyImage 
                                src={productToView.image} 
                                alt={productToView.name} 
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent"></div>
                            
                            <button 
                                onClick={() => setProductToView(null)} 
                                className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/60 transition-all z-20 shadow-md"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col relative z-10 bg-white dark:bg-[#0A0A0A]">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <h3 className="text-xl font-black text-stone-900 dark:text-white leading-tight line-clamp-2">
                                    {productToView.name}
                                </h3>
                                <div className="text-lg font-black text-brand-500 shrink-0">
                                    {formatCurrency(productToView.price)}
                                </div>
                            </div>

                            <p className="text-stone-500 dark:text-stone-400 text-sm leading-snug mb-5 line-clamp-3">
                                {productToView.description}
                            </p>

                            <Button 
                                fullWidth 
                                className="!h-12 !rounded-xl shadow-lg flex items-center justify-between px-5 bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:opacity-90 active:scale-95"
                                onClick={() => {
                                    if (productToView.modifierGroups && productToView.modifierGroups.length > 0) {
                                        setProductToCustomize(productToView);
                                        setProductToView(null);
                                    } else {
                                        if (selectedStore) {
                                            addToCart(productToView, 1, [], selectedStore.id);
                                            setProductToView(null);
                                            showToast('Agregado al pedido', 'success');
                                        }
                                    }
                                }}
                            >
                                <span className="font-bold text-[13px] uppercase tracking-wider">
                                    {productToView.modifierGroups && productToView.modifierGroups.length > 0 ? 'Personalizar' : 'Agregar al Pedido'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Plus size={18} strokeWidth={3} />
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

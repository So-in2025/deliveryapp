
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
                        className="relative w-full max-w-lg bg-white dark:bg-[#0A0A0A] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-black/5 dark:border-white/10"
                    >
                        <div className="relative w-full h-56 sm:h-64 bg-stone-100 dark:bg-stone-900 shrink-0">
                            <LazyImage 
                                src={productToView.image} 
                                alt={productToView.name} 
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            
                            <button 
                                onClick={() => setProductToView(null)} 
                                className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full text-white flex items-center justify-center hover:bg-white/20 transition-all z-20 shadow-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 flex flex-col relative z-10 bg-white dark:bg-[#0A0A0A]">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white leading-tight">
                                    {productToView.name}
                                </h3>
                                <div className="text-xl font-bold text-stone-900 dark:text-white shrink-0">
                                    {formatCurrency(productToView.price)}
                                </div>
                            </div>

                            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-8 max-h-[25vh] overflow-y-auto custom-scrollbar">
                                {productToView.description}
                            </p>

                            <Button 
                                fullWidth 
                                size="lg" 
                                className="!h-14 !rounded-xl shadow-lg flex items-center justify-between px-6 bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:opacity-90"
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
                                <span className="font-semibold text-sm">
                                    {productToView.modifierGroups && productToView.modifierGroups.length > 0 ? 'Personalizar' : 'Agregar al Pedido'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Plus size={18} strokeWidth={2.5} />
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

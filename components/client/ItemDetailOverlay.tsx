
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
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-8 shrink-0">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" 
                        onClick={() => setProductToView(null)}
                    />
                    
                    <motion.div 
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-[3.5rem] sm:rounded-[4rem] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-black/5 dark:border-white/10"
                    >
                        <div className="relative w-full h-[30vh] sm:h-72 shrink-0 bg-stone-100 dark:bg-stone-800">
                            <LazyImage 
                                src={productToView.image} 
                                alt={productToView.name} 
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent"></div>
                            
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setProductToView(null)} 
                                className="absolute top-6 right-6 w-12 h-12 bg-stone-900/60 backdrop-blur-3xl rounded-2xl text-white flex items-center justify-center border border-white/10 z-20 shadow-2xl"
                            >
                                <X size={24} strokeWidth={3} />
                            </motion.button>
                        </div>

                        <div className="p-8 sm:p-12 flex flex-col relative z-10 bg-white dark:bg-stone-900">
                            <div className="flex flex-col gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-10 bg-brand-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                    <h3 className="text-4xl sm:text-5xl font-black text-stone-950 dark:text-white tracking-tighter uppercase italic leading-[0.8]">
                                        {productToView.name}
                                    </h3>
                                </div>
                                <div className="text-3xl font-black text-brand-600 dark:text-brand-500 tracking-tighter italic">
                                    {formatCurrency(productToView.price)}
                                </div>
                            </div>

                            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base font-bold leading-relaxed mb-10 italic border-l-4 border-stone-100 dark:border-white/5 pl-6">
                                {productToView.description}
                            </p>

                            <Button 
                                fullWidth 
                                variant="primary"
                                size="lg"
                                className="!h-20 !rounded-[2rem] shadow-2xl flex items-center justify-between px-10 transition-all hover:scale-[1.02]"
                                onClick={() => {
                                    if (productToView.modifierGroups && productToView.modifierGroups.length > 0) {
                                        setProductToCustomize(productToView);
                                        setProductToView(null);
                                    } else {
                                        if (selectedStore) {
                                            addToCart(productToView, 1, [], selectedStore.id);
                                            setProductToView(null);
                                            showToast('Agregado con Éxito', 'success');
                                        }
                                    }
                                }}
                            >
                                <span className="text-xl italic font-black">
                                    {productToView.modifierGroups && productToView.modifierGroups.length > 0 ? 'Personalizar Élite' : 'Agregar Ahora'}
                                </span>
                                <Plus size={32} strokeWidth={4} />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

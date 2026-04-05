
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    tourId: string;
    steps: TourStep[];
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const updateTargetRect = useCallback(() => {
        const element = document.getElementById(steps[currentStep].targetId);
        if (element) {
            setTargetRect(element.getBoundingClientRect());
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [currentStep, steps]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);
        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [updateTargetRect]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isVisible || !targetRect) return null;

    const step = steps[currentStep];
    
    // Calculate tooltip position
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 1000,
        pointerEvents: 'auto',
    };

    const margin = 12;
    if (step.position === 'bottom' || !step.position) {
        tooltipStyle.top = targetRect.bottom + margin;
        tooltipStyle.left = Math.max(margin, Math.min(window.innerWidth - 320 - margin, targetRect.left + targetRect.width / 2 - 160));
    } else if (step.position === 'top') {
        tooltipStyle.bottom = window.innerHeight - targetRect.top + margin;
        tooltipStyle.left = Math.max(margin, Math.min(window.innerWidth - 320 - margin, targetRect.left + targetRect.width / 2 - 160));
    } else if (step.position === 'left') {
        tooltipStyle.top = targetRect.top;
        tooltipStyle.right = window.innerWidth - targetRect.left + margin;
    } else if (step.position === 'right') {
        tooltipStyle.top = targetRect.top;
        tooltipStyle.left = targetRect.right + margin;
    }

    return (
        <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden">
            {/* Backdrop with cutout */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500" style={{
                clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${targetRect.left}px 100%, 
                    ${targetRect.left}px ${targetRect.top}px, 
                    ${targetRect.right}px ${targetRect.top}px, 
                    ${targetRect.right}px ${targetRect.bottom}px, 
                    ${targetRect.left}px ${targetRect.bottom}px, 
                    ${targetRect.left}px 100%, 
                    100% 100%, 
                    100% 0%
                )`
            }} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={tooltipStyle}
                    className="w-[320px] bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl border border-brand-500/20 p-6 pointer-events-auto"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                            <Sparkles size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Guía Elite</span>
                        </div>
                        <button onClick={onComplete} className="text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2 leading-tight">
                        {step.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-brand-500' : 'w-1 bg-stone-200 dark:bg-stone-800'}`} 
                                />
                            ))}
                        </div>
                        
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-brand-500 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <Button 
                                onClick={handleNext}
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

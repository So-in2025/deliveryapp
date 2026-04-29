
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Zap } from 'lucide-react';
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
        const step = steps[currentStep];
        if (!step) {
            setIsVisible(false);
            return;
        }

        const element = document.getElementById(step.targetId);
        console.log('OnboardingTour tour check:', { targetId: step.targetId, found: !!element });
        if (element) {
            setTargetRect(element.getBoundingClientRect());
            setIsVisible(true);
        } else {
            // If not found, try again in a bit, in case it's rendering
            setIsVisible(false);
        }
    }, [currentStep, steps]);

    useEffect(() => {
        // Disable on mobile
        if (window.innerWidth < 768) {
            setIsVisible(false);
            return;
        }

        console.log('OnboardingTour mounted with steps:', steps);
        updateTargetRect();
        
        // Retry mechanism
        const interval = setInterval(updateTargetRect, 500); 
        
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [updateTargetRect]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsVisible(false);
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isVisible || !targetRect || !steps[currentStep]) return null;

    const step = steps[currentStep];
    
    // Calculate tooltip position
    const margin = 16;
    const cardWidth = Math.min(window.innerWidth - 32, 340);
    
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 1000,
        pointerEvents: 'auto',
        width: window.innerWidth < 768 ? 'calc(100% - 32px)' : `${cardWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
    };

    const stepPosition = step.position || 'bottom';

    // Simplified robust placement
    if (window.innerWidth < 768) {
        // Mobile: Fixed bottom or top based on target
        if (targetRect.top > window.innerHeight / 2) {
            tooltipStyle.top = margin;
        } else {
            tooltipStyle.bottom = margin + 80; // Above tab bar if any
        }
        tooltipStyle.left = margin;
        tooltipStyle.right = margin;
    } else {
        // Desktop: Relative to target
        if (stepPosition === 'bottom') {
            tooltipStyle.top = targetRect.bottom + margin;
            tooltipStyle.left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left + targetRect.width / 2 - cardWidth / 2));
        } else if (stepPosition === 'top') {
            tooltipStyle.bottom = window.innerHeight - targetRect.top + margin;
            tooltipStyle.left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left + targetRect.width / 2 - cardWidth / 2));
        } else if (stepPosition === 'left') {
            tooltipStyle.top = Math.max(margin, Math.min(window.innerHeight - 400, targetRect.top));
            tooltipStyle.right = window.innerWidth - targetRect.left + margin;
        } else if (stepPosition === 'right') {
            tooltipStyle.top = Math.max(margin, Math.min(window.innerHeight - 400, targetRect.top));
            tooltipStyle.left = targetRect.right + margin;
        }
    }

    const content = (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
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
                    className="max-h-[80vh] flex flex-col bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl border border-brand-500/20 p-6 pointer-events-auto"
                >
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                            <Zap size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Guía Práctica</span>
                        </div>
                        <button onClick={onComplete} className="text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                        <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2 leading-tight">
                            {step.title}
                        </h3>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-stone-100 dark:border-white/5 shrink-0">
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
                                    className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-brand-500 transition-colors dark:bg-stone-800"
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

    return createPortal(content, document.body);
};

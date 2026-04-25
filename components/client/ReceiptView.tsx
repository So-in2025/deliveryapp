
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { formatCurrency, APP_CONFIG } from '../../constants';
import { ArrowLeft, Download, FileText, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ReceiptView: React.FC = () => {
    const { selectedReceiptOrder, setClientViewState } = useApp();

    const downloadPDF = async () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`recibo-${selectedReceiptOrder?.id}.pdf`);
    };

    if (!selectedReceiptOrder) return null;

    return (
        <div className="h-full bg-stone-50 dark:bg-stone-950 flex flex-col animate-fade-in">
            <div className="w-full bg-white dark:bg-stone-900 px-6 py-4 border-b border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setClientViewState('HISTORY')} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"><ArrowLeft size={24} /></button>
                    <h2 className="text-xl font-black dark:text-white tracking-tighter">Recibo Digital</h2>
                </div>
                <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-brand-950 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"><Download size={16} /> PDF</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-md mx-auto">
                    <div id="receipt-content" className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-2xl border border-black/[0.03] dark:border-white/5 relative overflow-hidden">
                        {/* Decorative background logo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none rotate-12">
                            <ShoppingBag size={300} />
                        </div>
                        
                        <div className="text-center mb-8 border-b-2 border-dashed border-stone-100 dark:border-stone-800 pb-8 relative z-10">
                            <h1 className="text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tighter uppercase">{APP_CONFIG.appName}</h1>
                            <p className="text-[10px] font-black text-stone-400 tracking-widest mt-1">RECIBO DE TRANSACCIÓN</p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Comercio</p>
                                    <p className="font-black text-xl text-stone-900 dark:text-white tracking-tight leading-none">{selectedReceiptOrder.storeName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Fecha</p>
                                    <p className="font-black text-sm text-stone-950 dark:text-white">{new Date(selectedReceiptOrder.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 py-6 border-b border-stone-100 dark:border-stone-800">
                                {selectedReceiptOrder.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-black text-sm text-stone-950 dark:text-white tracking-tight">{item.quantity}x {item.product.name}</p>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase truncate max-w-[150px]">{item.modifiers?.join(', ')}</p>
                                        </div>
                                        <span className="font-black text-sm text-stone-900 dark:text-white">{formatCurrency(item.totalPrice * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-400 font-bold">Subtotal</span>
                                    <span className="font-black text-stone-900 dark:text-white">{formatCurrency(selectedReceiptOrder.total - (selectedReceiptOrder.deliveryFee || 0) + (selectedReceiptOrder.discount || 0))}</span>
                                </div>
                                {selectedReceiptOrder.deliveryFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-400 font-bold">Envío</span>
                                        <span className="font-black text-stone-900 dark:text-white">{formatCurrency(selectedReceiptOrder.deliveryFee)}</span>
                                    </div>
                                )}
                                {selectedReceiptOrder.discount > 0 && (
                                    <div className="flex justify-between text-sm text-brand-600">
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Descuento</span>
                                        <span className="font-black">-{formatCurrency(selectedReceiptOrder.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-stone-950">
                                    <span className="font-black text-stone-950 dark:text-white text-xl tracking-tighter">TOTAL</span>
                                    <span className="font-black text-2xl text-stone-950 dark:text-white tabular-nums tracking-tighter">{formatCurrency(selectedReceiptOrder.total)}</span>
                                </div>
                            </div>

                            <div className="mt-8 text-center bg-stone-50 dark:bg-black/20 p-4 rounded-xl border border-black/[0.03]">
                                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2">ID de Pedido</p>
                                <p className="font-mono text-xs text-stone-950 dark:text-white tracking-widest truncate">{selectedReceiptOrder.id}</p>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 tracking-widest uppercase">¡Gracias por tu compra!</p>
                            <p className="text-[8px] text-stone-400 font-bold tracking-widest mt-1 italic opacity-50">Documento no fiscal • Recibo digital</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Clock, Truck, Store, LogOut, MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface StatusBarrierProps {
    type: 'MERCHANT' | 'DRIVER' | 'VERIFICATION';
}

export const StatusBarrier: React.FC<StatusBarrierProps> = ({ type }) => {
    const { setRole, user: appUser } = useApp();
    const { signOut, resendVerification, reloadUser, user: fireUser } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isMerchant = type === 'MERCHANT';
    const isVerification = type === 'VERIFICATION';
    
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await reloadUser();
        // Firebase Auth state in component will update through AuthContext
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full space-y-8"
            >
                <div className="relative flex justify-center">
                    <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="w-32 h-32 bg-stone-900 border-4 border-white/10 rounded-[3rem] shadow-2xl flex items-center justify-center relative">
                        {isVerification ? (
                            <Mail size={48} className="text-brand-500 animate-float" />
                        ) : isMerchant ? (
                            <Store size={48} className="text-brand-500 animate-float" />
                        ) : (
                            <Truck size={48} className="text-brand-500 animate-float" />
                        )}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shadow-lg border-2 border-stone-950">
                            {isVerification ? (
                                <Shield size={20} className="text-brand-950" />
                            ) : (
                                <Clock size={20} className="text-brand-950 animate-spin-slow" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tighter">
                        {isVerification ? 'Verifica tu Correo' : isMerchant ? 'Comercio en Revisión' : 'Perfil en Revisión'}
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                        {isVerification 
                            ? `Hemos enviado un enlace de seguridad a ${fireUser?.email}. Haz clic en el enlace para activar tu cuenta y empezar a pedir.`
                            : isMerchant 
                            ? 'Estamos validando la información de tu establecimiento. Recibirás una notificación en cuanto el administrador autorice tu ingreso.' 
                            : 'Estamos revisando tu documentación y vehículo. Te notificaremos por WhatsApp y aquí mismo cuando estés listo para rodar.'}
                    </p>
                </div>

                {isVerification ? (
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] border border-black/[0.03] dark:border-white/[0.03] shadow-xl space-y-6">
                        <div className="space-y-2">
                            <Button 
                                variant="primary" 
                                fullWidth 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-2xl h-14 text-sm font-black uppercase tracking-widest bg-brand-500 text-brand-950 shadow-brand-500/20"
                            >
                                <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Ya lo verifiqué
                            </Button>
                            
                            <button 
                                onClick={() => resendVerification()}
                                className="text-[10px] font-black text-stone-400 uppercase hover:text-brand-500 transition-all tracking-widest py-2"
                            >
                                Reenviar enlace de verificación
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] border border-black/[0.03] dark:border-white/[0.03] shadow-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-lg">
                                <Shield size={20} className="text-brand-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Estado de Validación</p>
                                <p className="text-sm font-bold text-stone-900 dark:text-white">Validación Técnica en curso</p>
                            </div>
                        </div>
                        
                        <div className="h-2 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: '0%' }}
                                animate={{ width: '65%' }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-brand-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-stone-400 uppercase">
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                            Espera Estimada: 2-4 Horas
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant="secondary" 
                        fullWidth 
                        onClick={() => {
                            setRole(UserRole.CLIENT);
                        }}
                        className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest"
                    >
                        Volver al Inicio
                    </Button>
                    <Button 
                        variant="primary" 
                        fullWidth 
                        onClick={() => window.open(`https://wa.me/${appUser?.phone || '521234567890'}`, '_blank')}
                        className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white shadow-stone-900/10"
                    >
                        <MessageSquare size={16} className="mr-2" /> Soporte
                    </Button>
                </div>

                <button 
                    onClick={() => signOut()}
                    className="flex items-center gap-2 mx-auto text-[10px] font-black text-stone-400 uppercase hover:text-red-500 transition-colors pt-4"
                >
                    <LogOut size={14} /> Cerrar Sesión
                </button>
            </motion.div>
        </div>
    );
};

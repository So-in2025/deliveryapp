import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ShoppingBag, Info, Tag, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ isOpen, onClose }) => {
    const { notifications, markNotificationAsRead, clearNotifications } = useApp();

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-[70] flex flex-col dark:bg-stone-900"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bell className="w-6 h-6 text-zinc-900 dark:text-white" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 dark:border-stone-800">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Notificaciones</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button 
                                        onClick={clearNotifications}
                                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        title="Limpiar todo"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Todo al día</h3>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        No tienes notificaciones nuevas en este momento.
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            notification.read 
                                                ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 opacity-70' 
                                                : 'bg-white dark:bg-zinc-800 border-orange-100 dark:border-orange-900/30 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                notification.type === 'ORDER' ? 'bg-orange-100 text-orange-600' :
                                                notification.type === 'PROMO' ? 'bg-purple-100 text-purple-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notification.type === 'ORDER' && <ShoppingBag className="w-5 h-5" />}
                                                {notification.type === 'PROMO' && <Tag className="w-5 h-5" />}
                                                {notification.type === 'SYSTEM' && <Info className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                                        {format(notification.timestamp, 'HH:mm', { locale: es })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                        Nuevo
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button 
                                    onClick={onClose}
                                    className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

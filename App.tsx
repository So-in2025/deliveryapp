
import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { AuthProvider } from './context/AuthContext';
import { ClientView } from './views/ClientView';
import { MerchantView } from './views/MerchantView';
import { DriverView } from './views/DriverView';
import { AdminView } from './views/AdminView';
import { AuthView } from './views/AuthView';
import { UserRole } from './types';
import { useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ClientLayout } from './components/layouts/ClientLayout';
import { MerchantLayout } from './components/layouts/MerchantLayout';
import { DriverLayout } from './components/layouts/DriverLayout';
import { AdminLayout } from './components/layouts/AdminLayout';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { NotificationOverlay } from './components/ui/NotificationOverlay';

import { APP_CONFIG } from './constants';

// Modern Splash Screen Component
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-brand-500 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2
        }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-64 h-64 flex items-center justify-center relative overflow-hidden rounded-[3rem] border-8 border-white/20 shadow-2xl p-2">
            <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appName} className="w-full h-full object-contain" />
        </div>
        
        <div className="text-center">
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.7 }}
              className="text-brand-900 font-bold text-xs sm:text-sm uppercase tracking-widest mt-2"
            >
              Abarrotes • Farmacia • Comida • Vinos, Licores y Más...
            </motion.p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
        className="absolute bottom-12 w-48 h-1.5 bg-brand-950/10 rounded-full overflow-hidden"
      >
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-brand-950"
          />
      </motion.div>
    </motion.div>
  );
};

// Component to handle View Switching based on Role
const ViewRouter = () => {
  const { role, isNotificationsOpen, setIsNotificationsOpen } = useApp();

  return (
    <>
      <PWAInstallPrompt />
      <NotificationOverlay isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      {(() => {
        switch (role) {
          case UserRole.NONE:
            return <AuthView />;
          case UserRole.CLIENT:
            return (
              <ClientLayout>
                <ClientView />
              </ClientLayout>
            );
          case UserRole.MERCHANT:
            return (
              <MerchantLayout>
                <MerchantView />
              </MerchantLayout>
            );
          case UserRole.DRIVER:
            return (
              <DriverLayout>
                <DriverView />
              </DriverLayout>
            );
          case UserRole.ADMIN:
            return (
              <AdminLayout>
                <AdminView />
              </AdminLayout>
            );
          default:
            return <AuthView />;
        }
      })()}
    </>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ConnectivityProvider>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AnimatePresence>
              {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} />}
            </AnimatePresence>
            <ViewRouter />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ConnectivityProvider>
  );
};

export default App;

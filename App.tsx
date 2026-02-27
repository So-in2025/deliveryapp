
import React from 'react';
import { Layout } from './components/Layout';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { ClientView } from './views/ClientView';
import { MerchantView } from './views/MerchantView';
import { DriverView } from './views/DriverView';
import { AdminView } from './views/AdminView';
import { DevDashboard } from './views/DevDashboard';
import { AuthView } from './views/AuthView';
import { UserRole } from './types';
import { useApp } from './context/AppContext';

// Component to handle View Switching based on Role
const ViewRouter = () => {
  const { role } = useApp();

  switch (role) {
    case UserRole.NONE:
      return <AuthView />;
    case UserRole.DEV:
      return <DevDashboard />;
    case UserRole.CLIENT:
      return <ClientView />;
    case UserRole.MERCHANT:
      return <MerchantView />;
    case UserRole.DRIVER:
      return <DriverView />;
    case UserRole.ADMIN:
      return <AdminView />;
    default:
      return <AuthView />;
  }
};

const App: React.FC = () => {
  return (
    <ConnectivityProvider>
      <ToastProvider>
        <AppProvider>
          <Layout>
            <ViewRouter />
          </Layout>
        </AppProvider>
      </ToastProvider>
    </ConnectivityProvider>
  );
};

export default App;

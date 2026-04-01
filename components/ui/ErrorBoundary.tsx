import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Algo salió mal</h1>
          <p className="text-stone-500 mb-6 max-w-xs mx-auto">
            La aplicación ha encontrado un error inesperado. Hemos registrado el incidente.
          </p>
          
          <div className="bg-stone-100 p-3 rounded-lg text-xs font-mono text-stone-600 mb-6 text-left w-full max-w-sm overflow-auto max-h-32">
            {this.state.error?.message}
          </div>

          <Button 
            onClick={() => window.location.reload()} 
            className="bg-stone-900 hover:bg-stone-800"
          >
            <RefreshCw size={16} className="mr-2" />
            Reiniciar Aplicación
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
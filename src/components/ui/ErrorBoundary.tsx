import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Try to parse the error message if it's our custom JSON string
    let parsedInfo = null;
    try {
      parsedInfo = JSON.parse(error.message);
    } catch (e) {
      // Not a JSON string, ignore
    }

    this.setState({
      error,
      errorInfo: parsedInfo ? JSON.stringify(parsedInfo, null, 2) : error.message
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-neutral-600 mb-8">
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </p>

              {this.state.errorInfo && (
                <div className="mb-8 text-left">
                  <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Detalles técnicos</p>
                  <div className="bg-neutral-900 rounded-xl p-4 overflow-auto max-h-48">
                    <pre className="text-[10px] font-mono text-green-400 leading-relaxed">
                      {this.state.errorInfo}
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-neutral-900 border border-neutral-200 rounded-2xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Inicio
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-50 px-8 py-4 border-t border-neutral-100 text-center">
              <p className="text-xs text-neutral-400">
                Si el problema persiste, por favor contacta a soporte.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-page-background">
          <Card className="max-w-lg w-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="error-card-header">
              <div className="text-6xl mb-4">
                <AlertTriangle className="w-16 h-16 mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Oops! Qualcosa è andato storto
              </CardTitle>
              <p className="text-red-100 mt-2">
                Si è verificato un errore imprevisto
              </p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="text-gray-600">
                  <p className="mb-4">
                    Non preoccuparti, possiamo provare a risolvere il problema.
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                      <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                        Dettagli tecnici (sviluppo)
                      </summary>
                      <pre className="text-xs text-red-600 overflow-auto max-h-32">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={this.handleReset}
                    className="error-action-button"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Riprova
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    Ricarica Pagina
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
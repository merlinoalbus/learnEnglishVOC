import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
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
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-8">
              <div className="text-6xl mb-4">
                <AlertTriangle className="w-16 h-16 mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Oops! Qualcosa è andato storto
              </CardTitle>
              <p className="text-red-100 mt-2">
                Si è verificato un errore imprevisto nell'applicazione
              </p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <p className="text-gray-600">
                  Non preoccuparti, i tuoi dati sono al sicuro. 
                  Prova a ricaricare la pagina o contatta il supporto se il problema persiste.
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={this.handleReset}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Riprova
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="px-6 py-3 rounded-xl"
                  >
                    Ricarica Pagina
                  </Button>
                </div>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-red-600 font-medium">
                      Dettagli Errore (Dev Mode)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
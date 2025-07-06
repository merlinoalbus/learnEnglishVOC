// =====================================================
// 📁 src/components/ErrorBoundaries.js - Unified Error Boundaries
// =====================================================

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Database, Brain, FileX } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// =====================================================
// 🔧 BASE ERROR BOUNDARY CLASS
// =====================================================
class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    console.error(`❌ ${this.props.boundaryName || 'App'} Error:`, {
      error,
      errorInfo,
      retryCount: this.state.retryCount
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.boundaryName);
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1
        }));
      }, this.props.retryDelay || 1000);
    } else {
      this.handleReset();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? 
        this.props.fallback(this.state.error, this.handleRetry, this.handleReset, this.state.retryCount) :
        this.renderDefaultError();
    }

    return this.props.children;
  }

  renderDefaultError() {
    const { error, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Errore in {this.props.boundaryName || 'Applicazione'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600 text-sm">
            {error?.message || 'Si è verificato un errore imprevisto'}
          </p>
          
          {retryCount > 0 && (
            <p className="text-orange-600 text-xs">
              Tentativo {retryCount}/{maxRetries}
            </p>
          )}

          <div className="flex gap-2">
            {canRetry ? (
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Riprova
              </Button>
            ) : (
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Completo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
}

// =====================================================
// 🤖 AI SERVICE ERROR BOUNDARY
// =====================================================
export const AIServiceErrorBoundary = ({ children, onAIError }) => (
  <BaseErrorBoundary
    boundaryName="AI Service"
    maxRetries={2}
    retryDelay={2000}
    onError={onAIError}
    fallback={(error, retry, reset, retryCount) => (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="w-5 h-5" />
            Errore AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-purple-600 text-sm">
            {error?.message?.includes('timeout') ? 
              '⏱️ Il servizio AI non risponde' :
              error?.message?.includes('API') ?
              '🔑 Problema con l\'API key' :
              '🤖 AI temporaneamente non disponibile'
            }
          </p>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm font-medium mb-2">
              💡 Modalità Manuale Disponibile
            </p>
            <p className="text-blue-600 text-xs">
              Puoi continuare a inserire parole manualmente.
            </p>
          </div>

          <Button 
            onClick={retryCount < 2 ? retry : reset}
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryCount < 2 ? 'Riprova AI' : 'Reset AI Service'}
          </Button>
        </CardContent>
      </Card>
    )}
  >
    {children}
  </BaseErrorBoundary>
);

// =====================================================
// 💾 STORAGE ERROR BOUNDARY  
// =====================================================
export const StorageErrorBoundary = ({ children, onStorageError }) => (
  <BaseErrorBoundary
    boundaryName="Storage"
    maxRetries={1}
    retryDelay={500}
    onError={onStorageError}
    fallback={(error, retry, reset) => (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Database className="w-5 h-5" />
            Errore Salvataggio Dati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-600 text-sm">
            {error?.message?.includes('quota') ? 
              '💽 Spazio esaurito. Elimina dati vecchi.' :
              '💾 Problema nel salvataggio dei dati.'
            }
          </p>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium mb-2">
              ⚠️ Rischio Perdita Dati
            </p>
            <p className="text-red-600 text-xs">
              Esporta backup preventivo.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={retry}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
            
            <Button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('forceExport'));
                reset();
              }}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <FileX className="w-4 h-4 mr-2" />
              Backup
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
  >
    {children}
  </BaseErrorBoundary>
);

// =====================================================
// 🌐 NETWORK ERROR BOUNDARY
// =====================================================
export const NetworkErrorBoundary = ({ children, onNetworkError }) => (
  <BaseErrorBoundary
    boundaryName="Network"
    maxRetries={3}
    retryDelay={3000}
    onError={onNetworkError}
    fallback={(error, retry, reset, retryCount) => (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Wifi className="w-5 h-5" />
            Errore di Connessione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-600 text-sm">
            {error?.message?.includes('fetch') ? 
              '📡 Nessuna connessione internet' :
              '🌐 Problema di connessione'
            }
          </p>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm font-medium mb-2">
              🔄 Modalità Offline
            </p>
            <p className="text-green-600 text-xs">
              L'app continua a funzionare offline.
            </p>
          </div>

          <Button 
            onClick={retryCount < 3 ? retry : reset}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryCount < 3 ? 'Riprova' : 'Reset Rete'}
          </Button>
        </CardContent>
      </Card>
    )}
  >
    {children}
  </BaseErrorBoundary>
);

// =====================================================
// 🎯 MAIN APP ERROR BOUNDARY
// =====================================================
export const MainAppErrorBoundary = ({ children, onAppError }) => (
  <BaseErrorBoundary
    boundaryName="Main App"
    maxRetries={1}
    retryDelay={1000}
    onError={onAppError}
    fallback={(error, retry, reset) => (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 text-center">
              <AlertTriangle className="w-6 h-6" />
              Errore Applicazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-red-600">
              Errore critico. Tutti i dati sono al sicuro.
            </p>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm font-medium mb-2">
                🔄 Soluzioni
              </p>
              <ul className="text-blue-600 text-xs space-y-1 text-left">
                <li>• Ricaricare la pagina (F5)</li>
                <li>• Svuotare cache browser</li>
                <li>• Esportare backup</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ricarica App
              </Button>
              
              <Button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('emergencyExport'));
                }}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <FileX className="w-4 h-4 mr-2" />
                Export Emergenza
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  >
    {children}
  </BaseErrorBoundary>
);

// =====================================================
// 🎨 FORM ERROR BOUNDARY
// =====================================================
export const FormErrorBoundary = ({ children, formName, onFormError }) => (
  <BaseErrorBoundary
    boundaryName={`${formName} Form`}
    maxRetries={2}
    retryDelay={500}
    onError={onFormError}
    fallback={(error, retry, reset) => (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Errore nel Form</span>
          </div>
          
          <p className="text-yellow-600 text-sm mb-4">
            {error?.message?.includes('validation') ? 
              'Errore di validazione dati' :
              'Errore elaborazione form'
            }
          </p>

          <div className="flex gap-2">
            <Button 
              onClick={retry}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
            
            <Button 
              onClick={reset}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
  >
    {children}
  </BaseErrorBoundary>
);

// =====================================================
// 📊 ERROR TRACKER UTILITY
// =====================================================
export const ErrorTracker = {
  errors: [],
  
  logError(error, boundary, context = {}) {
    const errorLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      boundary,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errors.push(errorLog);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error in ${boundary}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.groupEnd();
    }
  },
  
  exportErrors() {
    const blob = new Blob([JSON.stringify(this.errors, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  clearErrors() {
    this.errors = [];
  },
  
  getErrorStats() {
    const errorsByBoundary = {};
    this.errors.forEach(error => {
      errorsByBoundary[error.boundary] = (errorsByBoundary[error.boundary] || 0) + 1;
    });
    
    return {
      total: this.errors.length,
      byBoundary: errorsByBoundary,
      lastError: this.errors[this.errors.length - 1]
    };
  }
};
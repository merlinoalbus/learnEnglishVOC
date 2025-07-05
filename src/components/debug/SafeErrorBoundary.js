
// =====================================================
// 📁 src/components/debug/SafeErrorBoundary.js - Enhanced Error Boundary
// =====================================================

import React from 'react';

export class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught error:', error);
    console.error('🚨 Error Info:', errorInfo);
    console.error('🚨 Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Try to identify the source of length error
    if (error.message.includes('length')) {
      console.error('🔍 LENGTH ERROR DETECTED:');
      console.error('- Check if arrays are properly initialized');
      console.error('- Look for undefined variables being treated as arrays');
      console.error('- Verify hook return values');
      
      // Log current state
      console.error('🔍 Current window globals:', {
        localStorage: typeof localStorage,
        firebase: typeof window.firebase,
        auth: typeof window.auth
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🚨</span>
              <div>
                <h2 className="text-xl font-bold text-red-800">
                  Runtime Error Detected
                </h2>
                <p className="text-red-600">
                  Error #{this.state.errorCount} - Debug Information Below
                </p>
              </div>
            </div>

            <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
              <h3 className="font-semibold text-red-800">Error Message:</h3>
              <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
                {this.state.error?.message}
              </pre>
            </div>

            {this.state.error?.message.includes('length') && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-4 mb-4">
                <h3 className="font-semibold text-yellow-800">💡 Length Error Fix:</h3>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Check if Firebase hooks are properly initialized</li>
                  <li>• Verify array states have default empty array values</li>
                  <li>• Look for undefined variables in component props</li>
                  <li>• Ensure useFirebaseWords returns valid arrays</li>
                </ul>
              </div>
            )}

            <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
              <h3 className="font-semibold text-gray-800">Component Stack:</h3>
              <pre className="text-xs text-gray-700 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
              <h3 className="font-semibold text-gray-800">Error Stack:</h3>
              <pre className="text-xs text-gray-700 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔄 Reload App
              </button>
              
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ↺ Reset Error
              </button>
              
              <button
                onClick={() => {
                  const errorReport = {
                    message: this.state.error?.message,
                    stack: this.state.error?.stack,
                    componentStack: this.state.errorInfo?.componentStack,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                  };
                  
                  navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
                  alert('Error report copied to clipboard');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                📋 Copy Error Report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
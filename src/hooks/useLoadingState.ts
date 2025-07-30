import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

// =====================================================
// 🎯 TYPE DEFINITIONS
// =====================================================

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  startTime: number | null;
  operation: string | null;
}

interface LoadingOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  showTimeoutWarning?: boolean;
  showRetryNotifications?: boolean;
}

interface LoadingStateHook extends LoadingState {
  startLoading: (operationName?: string) => void;
  stopLoading: (successMessage?: string) => void;
  setError: (error: Error, canRetry?: boolean) => void;
  retry: (operation: () => Promise<any>) => Promise<any>;
  canRetry: boolean;
  duration: number;
}

// =====================================================
// 🎯 MAIN LOADING STATE HOOK
// =====================================================
export const useLoadingState = (options: LoadingOptions = {}): LoadingStateHook => {
  const {
    timeout = 30000,
    retryAttempts = 3,
    retryDelay = 1000,
    showTimeoutWarning = true,
    showRetryNotifications = true
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    startTime: null,
    operation: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showWarning, showError, showSuccess } = useNotification();

  const startLoading = useCallback((operationName = 'Operation') => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      startTime: Date.now(),
      operation: operationName
    }));

    if (showTimeoutWarning && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        showWarning(`⏱️ ${operationName} sta impiegando più tempo...`);
      }, timeout / 2);
    }
  }, [timeout, showTimeoutWarning, showWarning]);

  const stopLoading = useCallback((successMessage?: string) => {
    setState(prev => {
      const duration = prev.startTime ? Date.now() - prev.startTime : 0;
      
      if (successMessage && duration > 2000) {
        showSuccess(`${successMessage} (${Math.round(duration / 1000)}s)`);
      }
      
      return {
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0,
        startTime: null,
        operation: null
      };
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [showSuccess]);

  const setError = useCallback((error: Error, canRetry = true) => {
    setState(prev => {
      const newRetryCount = prev.retryCount + 1;
      const shouldRetry = canRetry && newRetryCount <= retryAttempts;

      if (shouldRetry && showRetryNotifications) {
        showWarning(`❌ ${error.message || error} - Tentativo ${newRetryCount}/${retryAttempts}`);
      } else if (!shouldRetry) {
        showError(error, prev.operation || 'Operation');
      }

      return {
        ...prev,
        isLoading: false,
        error: error,
        retryCount: shouldRetry ? newRetryCount : prev.retryCount
      };
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [retryAttempts, showRetryNotifications, showWarning, showError]);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (state.retryCount >= retryAttempts) {
      showError(new Error('Numero massimo tentativi raggiunto'), 'Retry');
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, retryDelay * state.retryCount));
    
    try {
      startLoading(state.operation || 'Operation');
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'), true);
      return false;
    }
  }, [state.retryCount, state.operation, retryAttempts, retryDelay, startLoading, stopLoading, setError, showError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    retry,
    canRetry: state.retryCount < retryAttempts,
    duration: state.startTime ? Date.now() - state.startTime : 0
  };
};

// =====================================================
// 🤖 AI LOADING HOOK
// =====================================================
export const useAILoading = () => {
  const loadingState = useLoadingState({
    timeout: 45000,
    retryAttempts: 2,
    retryDelay: 2000,
    showTimeoutWarning: true
  });

  const executeAIOperation = useCallback(async (operation: () => Promise<any>, operationName = 'AI Analysis') => {
    try {
      loadingState.startLoading(operationName);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI service timeout')), 45000);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      
      loadingState.stopLoading(`✨ ${operationName} completata`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        loadingState.setError(new Error('🤖 AI timeout. Riprova o usa modalità manuale.'), true);
      } else if (errorMessage.includes('API')) {
        loadingState.setError(new Error('🔑 Problema API key.'), false);
      } else if (errorMessage.includes('quota')) {
        loadingState.setError(new Error('🚫 Limite API raggiunto.'), false);
      } else {
        loadingState.setError(error instanceof Error ? error : new Error(errorMessage), true);
      }
      throw error;
    }
  }, [loadingState]);

  return {
    ...loadingState,
    executeAIOperation
  };
};

// =====================================================
// 💾 STORAGE LOADING HOOK
// =====================================================
export const useStorageLoading = () => {
  const loadingState = useLoadingState({
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 500,
    showTimeoutWarning: false
  });

  const executeStorageOperation = useCallback(async (operation: () => Promise<any>, operationName = 'Storage Operation') => {
    try {
      loadingState.startLoading(operationName);
      const result = await operation();
      loadingState.stopLoading();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
        loadingState.setError(new Error('💽 Spazio esaurito. Elimina dati vecchi.'), false);
      } else if (errorMessage.includes('localStorage')) {
        loadingState.setError(new Error('🔒 Accesso negato storage.'), true);
      } else {
        loadingState.setError(error instanceof Error ? error : new Error(errorMessage), true);
      }
      throw error;
    }
  }, [loadingState]);

  return {
    ...loadingState,
    executeStorageOperation
  };
};

// =====================================================
// 🌐 NETWORK LOADING HOOK
// =====================================================
export const useNetworkLoading = () => {
  const loadingState = useLoadingState({
    timeout: 20000,
    retryAttempts: 3,
    retryDelay: 1500,
    showTimeoutWarning: true
  });

  const executeNetworkOperation = useCallback(async (operation: () => Promise<any>, operationName = 'Network Request') => {
    try {
      loadingState.startLoading(operationName);
      const result = await operation();
      loadingState.stopLoading();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        loadingState.setError(new Error('📡 Nessuna connessione.'), true);
      } else if (errorMessage.includes('timeout')) {
        loadingState.setError(new Error('⏱️ Timeout rete.'), true);
      } else if (errorMessage.includes('404')) {
        loadingState.setError(new Error('🔍 Risorsa non trovata.'), false);
      } else if (errorMessage.includes('500')) {
        loadingState.setError(new Error('🔧 Errore server.'), true);
      } else {
        loadingState.setError(error instanceof Error ? error : new Error(errorMessage), true);
      }
      throw error;
    }
  }, [loadingState]);

  return {
    ...loadingState,
    executeNetworkOperation
  };
};
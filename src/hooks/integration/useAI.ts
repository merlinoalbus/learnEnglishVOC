import { useState, useCallback, useRef } from 'react';
import { enhancedAIService } from '../../services/enhancedAIService';

type AIServiceStatus = ReturnType<typeof enhancedAIService.getServiceStatus>;

interface AIAnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

interface AIHookState {
  isProcessing: boolean;
  status: AIServiceStatus | null;
  error: string | null;
  lastResult: AIAnalysisResult | null;
}

interface AIHookReturn {
  isProcessing: boolean;
  status: AIServiceStatus | null;
  error: string | null;
  lastResult: AIAnalysisResult | null;
  analyzeWord: (word: string, context?: string) => Promise<AIAnalysisResult>;
  checkStatus: () => Promise<AIServiceStatus>;
  clearError: () => void;
  clearResult: () => void;
}

export const useAI = (): AIHookReturn => {
  const [state, setState] = useState<AIHookState>({
    isProcessing: false,
    status: null,
    error: null,
    lastResult: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setProcessing = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setStatus = useCallback((status: AIServiceStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setResult = useCallback((result: AIAnalysisResult) => {
    setState(prev => ({ ...prev, lastResult: result }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearResult = useCallback(() => {
    setResult({ success: false });
  }, [setResult]);

  const checkStatus = useCallback(async (): Promise<AIServiceStatus> => {
    try {
      const status = enhancedAIService.getServiceStatus();
      setStatus(status);
      return status;
    } catch (error) {
      const failedStatus: AIServiceStatus = {
        health: 'down',
        configured: false,
        consecutiveFailures: 999,
        lastSuccessTime: null,
        lastHealthCheck: null,
        circuitBreaker: null,
        apiUrl: '',
        timeout: 0,
        canUseAI: false,
        degradedMode: true,
        recommendations: []
      };
      setStatus(failedStatus);
      return failedStatus;
    }
  }, [setStatus]);

  const analyzeWord = useCallback(async (
    word: string,
    context?: string
  ): Promise<AIAnalysisResult> => {
    if (!word.trim()) {
      const result: AIAnalysisResult = {
        success: false,
        error: 'Word is required for analysis',
      };
      setResult(result);
      return result;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      // This would integrate with your AI service
      const analysisResult = await enhancedAIService.analyzeWord(word);

      const duration = Date.now() - startTime;
      
      const result: AIAnalysisResult = {
        success: true,
        data: analysisResult,
        duration,
      };

      setResult(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        const result: AIAnalysisResult = {
          success: false,
          error: 'Analysis cancelled',
          duration,
        };
        setResult(result);
        return result;
      }

      const errorMessage = error.message || 'Failed to analyze word';
      setError(errorMessage);
      
      const result: AIAnalysisResult = {
        success: false,
        error: errorMessage,
        duration,
      };
      
      setResult(result);
      return result;
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }, [setProcessing, setError, setResult]);

  const generateSentence = useCallback(async (
    word: string,
    italian: string
  ): Promise<AIAnalysisResult> => {
    if (!word.trim() || !italian.trim()) {
      const result: AIAnalysisResult = {
        success: false,
        error: 'Both English and Italian words are required',
      };
      setResult(result);
      return result;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      // This would integrate with your AI service
      // Fallback: use basic sentence generation
      const sentence = `Example sentence with "${word}" (${italian}).`;

      const duration = Date.now() - startTime;
      
      const result: AIAnalysisResult = {
        success: true,
        data: { sentence },
        duration,
      };

      setResult(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        const result: AIAnalysisResult = {
          success: false,
          error: 'Sentence generation cancelled',
          duration,
        };
        setResult(result);
        return result;
      }

      const errorMessage = error.message || 'Failed to generate sentence';
      setError(errorMessage);
      
      const result: AIAnalysisResult = {
        success: false,
        error: errorMessage,
        duration,
      };
      
      setResult(result);
      return result;
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }, [setProcessing, setError, setResult]);

  return {
    isProcessing: state.isProcessing,
    status: state.status,
    error: state.error,
    lastResult: state.lastResult,
    analyzeWord,
    checkStatus,
    clearError,
    clearResult,
  };
};

export default useAI;
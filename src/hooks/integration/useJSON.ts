import { useState, useCallback, useRef } from 'react';
import type { Word } from '../../types/entities/Word.types';

interface JSONValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface JSONParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationResult?: JSONValidationResult;
}

interface JSONStringifyResult {
  success: boolean;
  json?: string;
  error?: string;
  size?: number;
}

interface JSONProcessingOptions {
  validate?: boolean;
  prettyPrint?: boolean;
  maxSize?: number;
  replacer?: (key: string, value: any) => any;
  reviver?: (key: string, value: any) => any;
}

interface JSONHookState {
  isProcessing: boolean;
  error: string | null;
  lastOperation: string | null;
  validationResult: JSONValidationResult | null;
}

interface JSONHookReturn {
  isProcessing: boolean;
  error: string | null;
  lastOperation: string | null;
  validationResult: JSONValidationResult | null;
  parseJSON: <T = any>(jsonString: string, options?: JSONProcessingOptions) => Promise<JSONParseResult<T>>;
  stringifyJSON: (data: any, options?: JSONProcessingOptions) => Promise<JSONStringifyResult>;
  validateJSON: (jsonString: string) => JSONValidationResult;
  parseWordsJSON: (jsonString: string) => Promise<JSONParseResult<Word[]>>;
  stringifyWords: (words: Word[], options?: JSONProcessingOptions) => Promise<JSONStringifyResult>;
  formatJSON: (jsonString: string, indent?: number) => JSONStringifyResult;
  minifyJSON: (jsonString: string) => JSONStringifyResult;
  clearError: () => void;
}

const MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB default limit

export const useJSON = (): JSONHookReturn => {
  const [state, setState] = useState<JSONHookState>({
    isProcessing: false,
    error: null,
    lastOperation: null,
    validationResult: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setProcessing = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLastOperation = useCallback((operation: string | null) => {
    setState(prev => ({ ...prev, lastOperation: operation }));
  }, []);

  const setValidationResult = useCallback((result: JSONValidationResult | null) => {
    setState(prev => ({ ...prev, validationResult: result }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const validateJSON = useCallback((jsonString: string): JSONValidationResult => {
    const result: JSONValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (!jsonString || typeof jsonString !== 'string') {
      result.valid = false;
      result.errors.push('JSON string is required');
      return result;
    }

    if (jsonString.length > MAX_JSON_SIZE) {
      result.valid = false;
      result.errors.push(`JSON string exceeds maximum size of ${MAX_JSON_SIZE} bytes`);
      return result;
    }

    try {
      JSON.parse(jsonString);
    } catch (error: any) {
      result.valid = false;
      result.errors.push(`Invalid JSON: ${error.message}`);
      return result;
    }

    // Additional validation warnings
    if (jsonString.length > 1024 * 1024) {
      result.warnings.push('Large JSON file detected (>1MB)');
    }

    if (jsonString.includes('undefined')) {
      result.warnings.push('JSON contains undefined values which may cause issues');
    }

    return result;
  }, []);

  const parseJSON = useCallback(async <T = any>(
    jsonString: string,
    options: JSONProcessingOptions = {}
  ): Promise<JSONParseResult<T>> => {
    setProcessing(true);
    setError(null);
    setLastOperation('parse');

    try {
      // Validate if requested
      let validationResult: JSONValidationResult | undefined;
      if (options.validate !== false) {
        validationResult = validateJSON(jsonString);
        setValidationResult(validationResult);

        if (!validationResult.valid) {
          return {
            success: false,
            error: validationResult.errors.join('; '),
            validationResult,
          };
        }
      }

      // Check size limit
      const maxSize = options.maxSize || MAX_JSON_SIZE;
      if (jsonString.length > maxSize) {
        return {
          success: false,
          error: `JSON string exceeds maximum size of ${maxSize} bytes`,
        };
      }

      // Parse JSON
      const data = JSON.parse(jsonString, options.reviver) as T;

      return {
        success: true,
        data,
        validationResult,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to parse JSON';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setProcessing(false);
    }
  }, [setProcessing, setError, setLastOperation, validateJSON, setValidationResult]);

  const stringifyJSON = useCallback(async (
    data: any,
    options: JSONProcessingOptions = {}
  ): Promise<JSONStringifyResult> => {
    setProcessing(true);
    setError(null);
    setLastOperation('stringify');

    try {
      const space = options.prettyPrint ? 2 : undefined;
      const json = JSON.stringify(data, options.replacer, space);
      
      if (!json) {
        return {
          success: false,
          error: 'Failed to stringify data',
        };
      }

      const size = new Blob([json]).size;
      const maxSize = options.maxSize || MAX_JSON_SIZE;
      
      if (size > maxSize) {
        return {
          success: false,
          error: `Resulting JSON exceeds maximum size of ${maxSize} bytes`,
        };
      }

      return {
        success: true,
        json,
        size,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to stringify JSON';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setProcessing(false);
    }
  }, [setProcessing, setError, setLastOperation]);

  const parseWordsJSON = useCallback(async (
    jsonString: string
  ): Promise<JSONParseResult<Word[]>> => {
    const result = await parseJSON<{ words?: Word[] } | Word[]>(jsonString, { validate: true });
    
    if (!result.success) {
      return result as JSONParseResult<Word[]>;
    }

    try {
      let words: Word[];
      
      // Handle different JSON structures
      if (Array.isArray(result.data)) {
        words = result.data;
      } else if (result.data && typeof result.data === 'object' && 'words' in result.data) {
        words = result.data.words || [];
      } else {
        return {
          success: false,
          error: 'Invalid words JSON structure. Expected array or object with "words" property',
        };
      }

      // Validate word objects
      const invalidWords = words.filter((word, index) => {
        if (!word || typeof word !== 'object') {
          return true;
        }
        if (!word.english || !word.italian) {
          return true;
        }
        return false;
      });

      if (invalidWords.length > 0) {
        return {
          success: false,
          error: `Invalid word objects found. Each word must have 'english' and 'italian' properties`,
        };
      }

      return {
        success: true,
        data: words,
        validationResult: result.validationResult,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to parse words JSON',
      };
    }
  }, [parseJSON]);

  const stringifyWords = useCallback(async (
    words: Word[],
    options: JSONProcessingOptions = {}
  ): Promise<JSONStringifyResult> => {
    if (!Array.isArray(words)) {
      return {
        success: false,
        error: 'Words must be an array',
      };
    }

    const wordsData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalWords: words.length,
        version: '1.0',
      },
      words,
    };

    return stringifyJSON(wordsData, {
      ...options,
      prettyPrint: options.prettyPrint !== false,
    });
  }, [stringifyJSON]);

  const formatJSON = useCallback((jsonString: string, indent = 2): JSONStringifyResult => {
    try {
      const data = JSON.parse(jsonString);
      const formatted = JSON.stringify(data, null, indent);
      
      return {
        success: true,
        json: formatted,
        size: new Blob([formatted]).size,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to format JSON',
      };
    }
  }, []);

  const minifyJSON = useCallback((jsonString: string): JSONStringifyResult => {
    try {
      const data = JSON.parse(jsonString);
      const minified = JSON.stringify(data);
      
      return {
        success: true,
        json: minified,
        size: new Blob([minified]).size,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to minify JSON',
      };
    }
  }, []);

  return {
    isProcessing: state.isProcessing,
    error: state.error,
    lastOperation: state.lastOperation,
    validationResult: state.validationResult,
    parseJSON,
    stringifyJSON,
    validateJSON,
    parseWordsJSON,
    stringifyWords,
    formatJSON,
    minifyJSON,
    clearError,
  };
};

export default useJSON;
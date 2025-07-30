import { useState, useCallback, useRef } from 'react';
import type { Word } from '../../types/entities/Word.types';

type FileType = 'json' | 'csv' | 'txt' | 'xml' | 'yaml';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface FileReadResult {
  success: boolean;
  content?: string;
  fileInfo?: FileInfo;
  error?: string;
}

interface FileParseResult<T = any> {
  success: boolean;
  data?: T;
  fileInfo?: FileInfo;
  error?: string;
  parsedCount?: number;
}

interface FileOperationProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'reading' | 'parsing' | 'validating' | 'complete';
}

interface FileHookState {
  isProcessing: boolean;
  progress: FileOperationProgress | null;
  error: string | null;
  lastOperation: string | null;
  supportedTypes: FileType[];
}

interface FileHookReturn {
  isProcessing: boolean;
  progress: FileOperationProgress | null;
  error: string | null;
  lastOperation: string | null;
  supportedTypes: FileType[];
  readFile: (file: File) => Promise<FileReadResult>;
  parseFile: <T = any>(file: File, expectedType?: FileType) => Promise<FileParseResult<T>>;
  readTextFile: (file: File) => Promise<FileReadResult>;
  readJSONFile: (file: File) => Promise<FileParseResult>;
  readCSVFile: (file: File) => Promise<FileParseResult<Record<string, string>[]>>;
  parseWordsFile: (file: File) => Promise<FileParseResult<Word[]>>;
  validateFile: (file: File, expectedType?: FileType) => Promise<{ valid: boolean; errors: string[] }>;
  clearError: () => void;
  clearProgress: () => void;
}

const SUPPORTED_TYPES: FileType[] = ['json', 'csv', 'txt', 'xml', 'yaml'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const useFileOperations = (): FileHookReturn => {
  const [state, setState] = useState<FileHookState>({
    isProcessing: false,
    progress: null,
    error: null,
    lastOperation: null,
    supportedTypes: SUPPORTED_TYPES,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setProcessing = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const setProgress = useCallback((progress: FileOperationProgress | null) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLastOperation = useCallback((operation: string | null) => {
    setState(prev => ({ ...prev, lastOperation: operation }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearProgress = useCallback(() => {
    setProgress(null);
  }, [setProgress]);

  const getFileInfo = useCallback((file: File): FileInfo => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }, []);

  const validateFile = useCallback(async (
    file: File,
    expectedType?: FileType
  ): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (expectedType) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== expectedType) {
        errors.push(`Expected ${expectedType} file, but got ${extension || 'unknown'}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }, []);

  const readFile = useCallback(async (file: File): Promise<FileReadResult> => {
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setProcessing(true);
    setError(null);
    setLastOperation('read');

    try {
      const validation = await validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; '),
        };
      }

      const fileInfo = getFileInfo(file);
      
      setProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        stage: 'reading',
      });

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadstart = () => {
          setProgress({
            loaded: 0,
            total: file.size,
            percentage: 0,
            stage: 'reading',
          });
        };

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
              stage: 'reading',
            });
          }
        };

        reader.onload = () => {
          const content = reader.result as string;
          
          setProgress({
            loaded: file.size,
            total: file.size,
            percentage: 100,
            stage: 'complete',
          });

          resolve({
            success: true,
            content,
            fileInfo,
          });
        };

        reader.onerror = () => {
          const error = reader.error?.message || 'Failed to read file';
          setError(error);
          reject({
            success: false,
            error,
          });
        };

        reader.onabort = () => {
          reject({
            success: false,
            error: 'File reading cancelled',
          });
        };

        reader.readAsText(file);
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to read file';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  }, [setProcessing, setError, setLastOperation, setProgress, validateFile, getFileInfo]);

  const parseFile = useCallback(async <T = any>(
    file: File,
    expectedType?: FileType
  ): Promise<FileParseResult<T>> => {
    setLastOperation('parse');
    
    const readResult = await readFile(file);
    if (!readResult.success) {
      return {
        success: false,
        error: readResult.error,
      };
    }

    setProgress({
      loaded: 0,
      total: 100,
      percentage: 0,
      stage: 'parsing',
    });

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() as FileType;
      const fileType = expectedType || extension;

      let data: T;

      switch (fileType) {
        case 'json':
          data = JSON.parse(readResult.content!);
          break;
        case 'csv':
          data = parseCSV(readResult.content!) as T;
          break;
        case 'txt':
          data = readResult.content as T;
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      setProgress({
        loaded: 100,
        total: 100,
        percentage: 100,
        stage: 'complete',
      });

      return {
        success: true,
        data,
        fileInfo: readResult.fileInfo,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to parse file';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        fileInfo: readResult.fileInfo,
      };
    }
  }, [readFile, setLastOperation, setProgress, setError]);

  const readTextFile = useCallback(async (file: File): Promise<FileReadResult> => {
    return readFile(file);
  }, [readFile]);

  const readJSONFile = useCallback(async (file: File): Promise<FileParseResult> => {
    return parseFile(file, 'json');
  }, [parseFile]);

  const readCSVFile = useCallback(async (file: File): Promise<FileParseResult<Record<string, string>[]>> => {
    return parseFile(file, 'csv');
  }, [parseFile]);

  const parseWordsFile = useCallback(async (file: File): Promise<FileParseResult<Word[]>> => {
    const parseResult = await parseFile(file);
    if (!parseResult.success) {
      return parseResult as FileParseResult<Word[]>;
    }

    try {
      let words: Word[];
      const extension = file.name.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'json':
          if (Array.isArray(parseResult.data)) {
            words = parseResult.data;
          } else if (parseResult.data && typeof parseResult.data === 'object' && 'words' in parseResult.data) {
            words = (parseResult.data as any).words || [];
          } else {
            throw new Error('Invalid JSON structure for words file');
          }
          break;

        case 'csv':
          if (Array.isArray(parseResult.data)) {
            words = (parseResult.data as any[]).map((row: any, index: number) => ({
              id: `imported-${index}`,
              english: row.English || row.english || '',
              italian: row.Italian || row.italian || '',
              group: row.Group || row.group || '',
              sentences: row.Sentence ? [row.Sentence] : (row.sentence ? [row.sentence] : []),
              notes: row.Notes || row.notes || '',
              chapter: row.Chapter || row.chapter || '',
              learned: row.Learned === 'Yes' || row.learned === 'true',
              difficult: row.Difficult === 'Yes' || row.difficult === 'true',
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
          } else {
            throw new Error('Invalid CSV structure for words file');
          }
          break;

        default:
          throw new Error(`Unsupported file type for words: ${extension}`);
      }

      // Validate words
      const validWords = words.filter(word => word.english && word.italian);
      const invalidCount = words.length - validWords.length;

      if (validWords.length === 0) {
        throw new Error('No valid words found in file');
      }

      return {
        success: true,
        data: validWords,
        fileInfo: parseResult.fileInfo,
        parsedCount: validWords.length,
        error: invalidCount > 0 ? `${invalidCount} invalid words were skipped` : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to parse words file',
        fileInfo: parseResult.fileInfo,
      };
    }
  }, [parseFile]);

  return {
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
    lastOperation: state.lastOperation,
    supportedTypes: state.supportedTypes,
    readFile,
    parseFile,
    readTextFile,
    readJSONFile,
    readCSVFile,
    parseWordsFile,
    validateFile,
    clearError,
    clearProgress,
  };
};

// Helper function to parse CSV
const parseCSV = (csvContent: string): Record<string, string>[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
};

export default useFileOperations;
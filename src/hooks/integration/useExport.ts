import { useState, useCallback, useRef } from 'react';
import type { Word } from '../../types/entities/Word.types';

type ExportFormat = 'json' | 'csv' | 'txt' | 'pdf' | 'excel';

interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  includeStats?: boolean;
  filterByGroup?: string;
  filterByLearned?: boolean;
  filterByDifficult?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  exportedCount?: number;
  duration?: number;
}

interface ExportHookState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  lastExport: ExportResult | null;
  supportedFormats: ExportFormat[];
}

interface ExportHookReturn {
  isExporting: boolean;
  progress: number;
  error: string | null;
  lastExport: ExportResult | null;
  supportedFormats: ExportFormat[];
  exportWords: (words: Word[], options: ExportOptions) => Promise<ExportResult>;
  exportToJSON: (words: Word[], filename?: string) => Promise<ExportResult>;
  exportToCSV: (words: Word[], filename?: string) => Promise<ExportResult>;
  exportToTXT: (words: Word[], filename?: string) => Promise<ExportResult>;
  clearError: () => void;
  clearResult: () => void;
}

const SUPPORTED_FORMATS: ExportFormat[] = ['json', 'csv', 'txt', 'pdf', 'excel'];

export const useExport = (): ExportHookReturn => {
  const [state, setState] = useState<ExportHookState>({
    isExporting: false,
    progress: 0,
    error: null,
    lastExport: null,
    supportedFormats: SUPPORTED_FORMATS,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setExporting = useCallback((exporting: boolean) => {
    setState(prev => ({ ...prev, isExporting: exporting }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setResult = useCallback((result: ExportResult) => {
    setState(prev => ({ ...prev, lastExport: result }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearResult = useCallback(() => {
    setResult({ success: false });
  }, [setResult]);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const filterWords = useCallback((words: Word[], options: ExportOptions): Word[] => {
    let filtered = [...words];

    if (options.filterByGroup) {
      filtered = filtered.filter(word => word.group === options.filterByGroup);
    }

    if (options.filterByLearned !== undefined) {
      filtered = filtered.filter(word => word.learned === options.filterByLearned);
    }

    if (options.filterByDifficult !== undefined) {
      filtered = filtered.filter(word => word.difficult === options.filterByDifficult);
    }

    if (options.dateRange) {
      filtered = filtered.filter(word => {
        const createdAt = new Date(word.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }, []);

  const exportToJSON = useCallback(async (
    words: Word[],
    filename?: string
  ): Promise<ExportResult> => {
    const options: ExportOptions = {
      format: 'json',
      filename: filename || `vocabulary-${new Date().toISOString().split('T')[0]}.json`,
      includeMetadata: true,
    };

    return exportWords(words, options);
  }, []);

  const exportToCSV = useCallback(async (
    words: Word[],
    filename?: string
  ): Promise<ExportResult> => {
    const options: ExportOptions = {
      format: 'csv',
      filename: filename || `vocabulary-${new Date().toISOString().split('T')[0]}.csv`,
    };

    return exportWords(words, options);
  }, []);

  const exportToTXT = useCallback(async (
    words: Word[],
    filename?: string
  ): Promise<ExportResult> => {
    const options: ExportOptions = {
      format: 'txt',
      filename: filename || `vocabulary-${new Date().toISOString().split('T')[0]}.txt`,
    };

    return exportWords(words, options);
  }, []);

  const generateJSONContent = useCallback((words: Word[], options: ExportOptions): string => {
    const exportData = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        totalWords: words.length,
        format: 'json',
        version: '1.0',
      } : undefined,
      words: words.map(word => ({
        id: word.id,
        english: word.english,
        italian: word.italian,
        group: word.group,
        sentence: word.sentences?.[0] || '',
        notes: word.notes,
        chapter: word.chapter,
        learned: word.learned,
        difficult: word.difficult,
        createdAt: word.createdAt,
        updatedAt: word.updatedAt,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, []);

  const generateCSVContent = useCallback((words: Word[]): string => {
    const headers = ['English', 'Italian', 'Group', 'Sentence', 'Notes', 'Chapter', 'Learned', 'Difficult', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...words.map(word => [
        `"${word.english || ''}"`,
        `"${word.italian || ''}"`,
        `"${word.group || ''}"`,
        `"${word.sentences?.[0] || ''}"`,
        `"${word.notes || ''}"`,
        `"${word.chapter || ''}"`,
        word.learned ? 'Yes' : 'No',
        word.difficult ? 'Yes' : 'No',
        word.createdAt ? new Date(word.createdAt).toLocaleString() : '',
      ].join(','))
    ].join('\n');

    return csvContent;
  }, []);

  const generateTXTContent = useCallback((words: Word[]): string => {
    const txtContent = words.map(word => {
      const parts = [
        `English: ${word.english || 'N/A'}`,
        `Italian: ${word.italian || 'N/A'}`,
        word.group && `Group: ${word.group}`,
        word.sentences?.[0] && `Sentence: ${word.sentences[0]}`,
        word.notes && `Notes: ${word.notes}`,
        word.chapter && `Chapter: ${word.chapter}`,
        `Learned: ${word.learned ? 'Yes' : 'No'}`,
        `Difficult: ${word.difficult ? 'Yes' : 'No'}`,
        word.createdAt && `Created: ${new Date(word.createdAt).toLocaleString()}`,
      ].filter(Boolean);

      return parts.join('\n');
    }).join('\n\n---\n\n');

    return txtContent;
  }, []);

  const exportWords = useCallback(async (
    words: Word[],
    options: ExportOptions
  ): Promise<ExportResult> => {
    if (!words || words.length === 0) {
      const result: ExportResult = {
        success: false,
        error: 'No words to export',
      };
      setResult(result);
      return result;
    }

    // Cancel any existing export
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setExporting(true);
    setError(null);
    setProgress(0);

    const startTime = Date.now();

    try {
      // Filter words based on options
      setProgress(10);
      const filteredWords = filterWords(words, options);

      if (filteredWords.length === 0) {
        const result: ExportResult = {
          success: false,
          error: 'No words match the specified filters',
        };
        setResult(result);
        return result;
      }

      setProgress(30);

      let content: string;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          content = generateJSONContent(filteredWords, options);
          mimeType = 'application/json';
          break;
        case 'csv':
          content = generateCSVContent(filteredWords);
          mimeType = 'text/csv';
          break;
        case 'txt':
          content = generateTXTContent(filteredWords);
          mimeType = 'text/plain';
          break;
        case 'pdf':
          throw new Error('PDF export not yet implemented');
        case 'excel':
          throw new Error('Excel export not yet implemented');
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      setProgress(70);

      const filename = options.filename || `vocabulary-${new Date().toISOString().split('T')[0]}.${options.format}`;
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(90);

      downloadFile(content, filename, mimeType);
      
      setProgress(100);

      const duration = Date.now() - startTime;
      const result: ExportResult = {
        success: true,
        filename,
        exportedCount: filteredWords.length,
        duration,
      };

      setResult(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        const result: ExportResult = {
          success: false,
          error: 'Export cancelled',
          duration,
        };
        setResult(result);
        return result;
      }

      const errorMessage = error.message || 'Failed to export words';
      setError(errorMessage);
      
      const result: ExportResult = {
        success: false,
        error: errorMessage,
        duration,
      };
      
      setResult(result);
      return result;
    } finally {
      setExporting(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  }, [setExporting, setError, setProgress, setResult, filterWords, generateJSONContent, generateCSVContent, generateTXTContent, downloadFile]);

  return {
    isExporting: state.isExporting,
    progress: state.progress,
    error: state.error,
    lastExport: state.lastExport,
    supportedFormats: state.supportedFormats,
    exportWords,
    exportToJSON,
    exportToCSV,
    exportToTXT,
    clearError,
    clearResult,
  };
};

export default useExport;
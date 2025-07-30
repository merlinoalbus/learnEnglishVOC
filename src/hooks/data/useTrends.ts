// =====================================================
// 📈 src/hooks/data/useTrends.ts - Trends Data Hook
// =====================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendsAnalyticsService } from '../../services/TrendsAnalyticsService';
import { useStats } from './useStats';
import type {
  ComprehensiveTrendsAnalysis,
  TrendsCalculationInput,
  ProjectionTimeframe
} from '../../types/entities/Trends.types';
import type { FirestoreError } from '../../types/infrastructure/Firestore.types';

interface TrendsState {
  trendsAnalysis: ComprehensiveTrendsAnalysis | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: FirestoreError | null;
  lastCalculated: Date | null;
}

interface TrendsOperations {
  calculateTrends: (timeframe?: ProjectionTimeframe) => Promise<void>;
  refreshTrends: () => void;
  clearCache: () => void;
}

interface TrendsResult extends TrendsState, TrendsOperations {}

const CACHE_TTL = 10 * 60 * 1000; // 10 minuti cache

export const useTrends = (): TrendsResult => {
  const {
    testHistory,
    getAllWordsPerformance,
    detailedSessions,
    isLoading: statsLoading,
    error: statsError
  } = useStats();

  const [trendsAnalysis, setTrendsAnalysis] = useState<ComprehensiveTrendsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);

  const trendsService = useMemo(() => new TrendsAnalyticsService(), []);

  /**
   * Calcola analisi tendenze completa
   */
  const calculateTrends = useCallback(async (timeframe: ProjectionTimeframe = '60_days') => {
    if (isProcessing || statsLoading) return;

    // Verifica dati sufficienti
    if (testHistory.length < 5) {
      setError({
        message: 'Dati insufficienti per analisi tendenze. Minimo 5 test richiesti.',
        code: 'failed-precondition',
        operation: 'read',
        recoverable: false,
        timestamp: new Date()
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const wordPerformances = getAllWordsPerformance();
      
      const input: TrendsCalculationInput = {
        testHistory,
        wordPerformances,
        detailedSessions,
        analysisTimeframe: timeframe
      };

      const analysis = trendsService.calculateComprehensiveTrends(input);
      
      setTrendsAnalysis(analysis);
      setLastCalculated(new Date());
      
    } catch (err) {
      console.error('❌ Errore nel calcolo delle tendenze:', err);
      setError({
        message: err instanceof Error ? err.message : 'Errore sconosciuto nel calcolo tendenze',
        code: 'internal',
        operation: 'read',
        recoverable: true,
        timestamp: new Date()
      });
    } finally {
      setIsProcessing(false);
    }
  }, [testHistory, getAllWordsPerformance, detailedSessions, trendsService, isProcessing, statsLoading]);

  /**
   * Aggiorna analisi tendenze se necessario
   */
  const refreshTrends = useCallback(() => {
    if (lastCalculated) {
      const now = Date.now();
      const cacheAge = now - lastCalculated.getTime();
      
      if (cacheAge > CACHE_TTL) {
        calculateTrends();
      }
    } else {
      calculateTrends();
    }
  }, [lastCalculated, calculateTrends]);

  /**
   * Pulisce cache
   */
  const clearCache = useCallback(() => {
    setTrendsAnalysis(null);
    setLastCalculated(null);
    setError(null);
  }, []);

  // Auto-calcolo quando i dati sono pronti
  useEffect(() => {
    if (!statsLoading && !isProcessing && testHistory.length >= 5 && !trendsAnalysis) {
      calculateTrends();
    }
  }, [statsLoading, isProcessing, testHistory.length, trendsAnalysis, calculateTrends]);

  // Propaga errori stats
  useEffect(() => {
    if (statsError) {
      setError(statsError);
    }
  }, [statsError]);

  return {
    trendsAnalysis,
    isLoading: statsLoading || isLoading,
    isProcessing,
    error,
    lastCalculated,
    calculateTrends,
    refreshTrends,
    clearCache
  };
};

export default useTrends;
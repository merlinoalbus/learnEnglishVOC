// =====================================================
// 📊 src/services/TimelineReconstructionService.ts
// =====================================================

import type { Word } from '../types/entities/Word.types';
import type { TestHistoryItem } from '../types/entities/Test.types';
import type { WordPerformanceAnalysis } from '../types/entities/Performance.types';

/**
 * Service dedicato per ricostruzione timeline e analisi performance per singole parole
 * Estrae tutte le logiche business da WordDetailSection per rispettare l'architettura
 * DB => types => hooks/services => components
 */

interface AttemptData {
  timestamp: string;
  correct: boolean;
  usedHint: boolean;
  timeSpent: number;
  testId?: string;
}

interface ChartDataPoint {
  attempt: string;
  attemptNumber: number;
  success: number;
  globalPrecision: number;
  hint: number;
  time: number;
  fullDate: string;
  isCorrect: boolean;
  usedHint: boolean;
  timestamp: string;
}

interface ReconstructedStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  hintsUsed: number;
  hintsPercentage: number;
  avgTime: number;
  currentStreak: number;
}

interface RecentStats {
  totalAttempts: number;
  recentAttempts: number;
  currentAccuracy: number;
  trend: number;
  recentHints: number;
  avgRecentTime: number;
}

export class TimelineReconstructionService {
  
  /**
   * Ricostruisce la timeline dei tentativi per una parola specifica dalla cronologia test
   * @param wordId - ID della parola da analizzare
   * @param testHistory - Cronologia completa dei test
   * @param wordInfo - Informazioni base della parola
   * @returns Array ordinato cronologicamente dei tentativi
   */
  buildTimelineFromHistory(
    wordId: string,
    testHistory: TestHistoryItem[],
    wordInfo: { english: string; italian: string; chapter?: string | null }
  ): AttemptData[] {
    const attempts: AttemptData[] = [];
     
    if (!testHistory || testHistory.length === 0) {
      return attempts;
    }
     
    // Ordina dalla cronologia più vecchia alla più recente
    const sortedTests = [...testHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
     
    sortedTests.forEach((test, testIndex) => {
      let wasInTest = false;
      let wasCorrect = false;
      let usedHint = false;
      let timeSpent = 0;
       
      // ⭐ PRIORITY 1: Check wrongWords first (most reliable)
      if (test.wrongWords && Array.isArray(test.wrongWords)) {
        const wrongWord = test.wrongWords.find(w => w.id === wordId);
        if (wrongWord) {
          wasInTest = true;
          wasCorrect = false; // Was wrong
          // Stima hint usage per parole sbagliate (alta probabilità se hint erano usati nel test)
          usedHint = (test.hintsUsed > 0) && Math.random() > 0.7; // 30% chance if hints were used in test
          timeSpent = test.totalTime && test.totalWords ? Math.floor((test.totalTime * 1000) / test.totalWords) : 0;
        }
      }
       
      // ⭐ PRIORITY 2: Check wordTimes for specific data (preferred but often empty)
      if (!wasInTest && test.wordTimes && Array.isArray(test.wordTimes)) {
        const wordTime = test.wordTimes.find(wt => wt.wordId === wordId);
        if (wordTime) {
          wasInTest = true;
          wasCorrect = wordTime.isCorrect;
          usedHint = wordTime.usedHint || false;
          timeSpent = wordTime.timeSpent || 0;
        }
      }
       
      // ⭐ PRIORITY 3: Infer from chapter inclusion (if word wasn't in wrongWords, it was correct)
      if (!wasInTest && test.testParameters?.selectedChapters && wordInfo.chapter) {
        if (test.testParameters.selectedChapters.includes(wordInfo.chapter)) {
          // Se il test includeva il capitolo ma la parola non è in wrongWords, era corretta
          wasInTest = true;
          wasCorrect = true; // Non era sbagliata, quindi doveva essere corretta
           
          // Stima dati per risposte corrette dai totali del test
          const totalWordsInTest = test.totalWords || 1;
          const avgTimePerWord = test.totalTime ? (test.totalTime * 1000) / totalWordsInTest : 0;
          timeSpent = avgTimePerWord + (Math.random() * 2000 - 1000); // Add some variation ±1s
           
          // Distribuisci hint proporzionalmente tra le parole corrette
          if (test.hintsUsed > 0) {
            const correctWordsInTest = test.correctWords || 1;
            const hintProbability = Math.min(test.hintsUsed / correctWordsInTest, 1);
            usedHint = Math.random() < hintProbability;
          }
        }
      }
       
      // Aggiungi tentativo se la parola era nel test
      if (wasInTest) {
        attempts.push({
          timestamp: new Date(test.timestamp).toISOString(),
          correct: wasCorrect,
          usedHint: usedHint,
          timeSpent: Math.max(timeSpent, 0), // Ensure non-negative
          testId: test.id
        });
      }
    });
     
    return attempts;
  }

  /**
   * Converte i tentativi in dati per il grafico timeline
   * @param attempts - Array di tentativi ricostruiti
   * @returns Array di punti dati per il grafico
   */
  convertToChartData(attempts: AttemptData[]): ChartDataPoint[] {
    if (attempts.length === 0) {
      return [];
    }

    // ⭐ CALCOLA IL TOTALE DEGLI AIUTI USATI PER QUESTA PAROLA
    const totalHintsForWord = attempts.reduce((sum, a) => sum + ((a as any).hintsCount || 0), 0);

    const timelineData: ChartDataPoint[] = attempts.map((attempt, index) => {
      // Calcola precisione cumulativa fino a questo tentativo
      const attemptsUpToHere = attempts.slice(0, index + 1);
      const correctUpToHere = attemptsUpToHere.filter(a => a.correct).length;
      const cumulativePrecision = Math.round((correctUpToHere / attemptsUpToHere.length) * 100);
       
      // Usa data reale per asse X invece di numeri tentativo
      const attemptDate = new Date(attempt.timestamp);
      const shortDate = attemptDate.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit'
      });

      // ⭐ CALCOLA PERCENTUALE AIUTI: aiuti in questo test / totale aiuti per questa parola * 100
      const hintsInThisTest = (attempt as any).hintsCount || 0;
      const hintPercentage = totalHintsForWord > 0 ? Math.round((hintsInThisTest / totalHintsForWord) * 100) : 0;
       
      return {
        // Usa data effettiva invece di numero tentativo
        attempt: shortDate,
        attemptNumber: index + 1,
        // Risultato singolo tentativo (0 o 100 per visualizzazione)
        success: attempt.correct ? 100 : 0,
        // Precisione globale (cumulativa)
        globalPrecision: cumulativePrecision,
        // ⭐ HINT PERCENTUALE: percentuale aiuti usati in questo test rispetto al totale aiuti per questa parola
        hint: hintPercentage,
        // Time in seconds
        time: Math.round((attempt.timeSpent || 0) / 1000),
        // Full date for tooltip
        fullDate: attemptDate.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        // Raw data for analysis
        isCorrect: attempt.correct,
        usedHint: attempt.usedHint,
        timestamp: attempt.timestamp,
        // ⭐ AGGIUNGI dati per tooltip
        hintsInThisTest: hintsInThisTest,
        totalHintsForWord: totalHintsForWord
      };
    });

    return timelineData;
  }

  /**
   * Prende solo gli ultimi N tentativi per il grafico con precisione ricalcolata
   * @param chartData - Dati completi del grafico
   * @param limit - Numero massimo di punti da mostrare (default: 10)
   * @returns Array limitato con precisione ricalcolata per i punti visibili
   */
  limitChartData(chartData: ChartDataPoint[], limit: number = 10): ChartDataPoint[] {
    const limitedData = chartData.slice(-limit);
    
    // Ricalcola la precisione cumulativa solo per i tentativi visibili
    return limitedData.map((data, index, array) => ({
      ...data,
      globalPrecision: (() => {
        const visibleAttempts = array.slice(0, index + 1);
        const correctInVisible = visibleAttempts.filter(a => a.isCorrect).length;
        return Math.round((correctInVisible / visibleAttempts.length) * 100);
      })()
    }));
  }

  /**
   * Ricalcola statistiche dai tentativi effettivi (indipendente da wordAnalysis)
   * @param attempts - Array di tentativi ricostruiti
   * @returns Statistiche calcolate
   */
  calculateReconstructedStats(attempts: AttemptData[]): ReconstructedStats {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        hintsUsed: 0,
        hintsPercentage: 0,
        avgTime: 0,
        currentStreak: 0
      };
    }

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const accuracy = Math.round((correctAttempts / totalAttempts) * 100);
    
    // ⭐ CALCOLO HINTS CORRETTO - coerente con WordPerformanceService
    const hintsUsed = attempts.reduce((sum, a) => sum + ((a as any).hintsCount || 0), 0); // hints totali
    const testsWithHints = attempts.filter(a => a.usedHint || ((a as any).hintsCount && (a as any).hintsCount > 0)).length;
    const hintsPercentage = Math.round((testsWithHints / totalAttempts) * 100); // % test con hints
    const avgTime = Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAttempts / 1000);
    
    // Calcola streak corrente
    let currentStreak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalAttempts,
      correctAttempts,
      accuracy,
      hintsUsed,
      hintsPercentage,
      avgTime,
      currentStreak
    };
  }

  /**
   * Calcola statistiche per i tentativi recenti con trend
   * @param chartData - Dati del grafico
   * @param reconstructedStats - Statistiche ricostruite
   * @param totalAttempts - Numero totale tentativi
   * @returns Statistiche recenti con trend
   */
  calculateRecentStats(
    chartData: ChartDataPoint[], 
    reconstructedStats: ReconstructedStats,
    totalAttempts: number
  ): RecentStats {
    const recentAttempts = chartData.length;
    const currentAccuracy = reconstructedStats.accuracy;
    
    // Calcola trend (differenza tra primo e ultimo punto della precisione globale)
    const trend = chartData.length >= 2 
      ? chartData[chartData.length - 1].globalPrecision - chartData[0].globalPrecision
      : 0;
    
    const recentHints = chartData.filter(d => d.usedHint).length;
    const avgRecentTime = chartData.length > 0 
      ? Math.round(chartData.reduce((sum, d) => sum + d.time, 0) / chartData.length)
      : 0;

    return {
      totalAttempts,
      recentAttempts,
      currentAccuracy,
      trend,
      recentHints,
      avgRecentTime
    };
  }

  /**
   * Genera raccomandazioni basate sui dati ricostruiti
   * @param reconstructedStats - Statistiche ricostruite
   * @param recentStats - Statistiche recenti
   * @returns Array di raccomandazioni
   */
  generateRecommendations(
    reconstructedStats: ReconstructedStats,
    recentStats: RecentStats
  ): string[] {
    const recommendations: string[] = [];

    if (reconstructedStats.totalAttempts === 0) {
      recommendations.push('🎯 Inizia a praticare questa parola per vedere l\'andamento!');
      return recommendations;
    }

    if (reconstructedStats.accuracy < 60) {
      recommendations.push('📚 Rivedi questa parola più spesso - precisione sotto il 60%');
    }
    
    if (reconstructedStats.hintsPercentage > 50) {
      recommendations.push('💭 Cerca di rispondere senza aiuti - uso eccessivo di suggerimenti');
    }
    
    if (reconstructedStats.avgTime > 20) {
      recommendations.push('⚡ Pratica per migliorare i tempi di risposta');
    }
    
    if (reconstructedStats.currentStreak >= 5) {
      recommendations.push('🏆 Ottimo! Continua così - streak impressionante');
    }
    
    if (recentStats.trend > 20) {
      recommendations.push('📈 Tendenza molto positiva - stai migliorando rapidamente!');
    }
    
    if (reconstructedStats.accuracy >= 80 && reconstructedStats.currentStreak >= 3) {
      recommendations.push('✨ Parola ben consolidata - potresti concentrarti su altre parole difficili');
    }
    
    if (reconstructedStats.accuracy === 0) {
      recommendations.push('🔥 Parola molto difficile - continua a praticare, migliorerai!');
    }

    if (recommendations.length === 0) {
      recommendations.push('📊 Continua a praticare per ricevere suggerimenti personalizzati');
    }

    return recommendations;
  }

  /**
   * Determina lo status della parola basato sui dati ricostruiti
   * @param reconstructedStats - Statistiche ricostruite
   * @returns Status classificazione
   */
  determineWordStatus(reconstructedStats: ReconstructedStats): string {
    const { accuracy, totalAttempts, currentStreak } = reconstructedStats;

    if (totalAttempts === 0) return 'Nuova';
    if (accuracy === 0) return 'Critica';
    if (accuracy < 40) return 'Difficile';
    if (accuracy < 60) return 'In miglioramento';
    if (accuracy < 80) return 'Buona';
    if (currentStreak >= 3) return 'Consolidata';
    return 'Ottima';
  }

  /**
   * ⭐ NUOVO: Strategia ottimale - usa collezione performance se disponibile, altrimenti testHistory
   * @param wordId - ID della parola
   * @param testHistory - Cronologia test (fallback)
   * @param wordInfo - Info parola
   * @param wordPerformance - Dati dalla collezione performance (prioritari)
   * @returns Oggetto completo con tutti i dati processati
   */
  getOptimalTimelineData(
    wordId: string,
    testHistory: TestHistoryItem[],
    wordInfo: { english: string; italian: string; chapter?: string | null },
    wordPerformance?: Record<string, any>
  ) {
    
    // ⭐ PRIORITÀ 1: Usa dati dalla collezione performance se disponibili
    const performanceData = wordPerformance?.[wordId];
    if (performanceData && performanceData.attempts && performanceData.attempts.length > 0) {
      return this.createTimelineFromPerformanceData(wordId, performanceData, wordInfo);
    }
    
    // ⭐ FALLBACK: Usa ricostruzione da testHistory (metodo originale)
    return this.reconstructWordTimeline(wordId, testHistory, wordInfo);
  }

  /**
   * ⭐ NUOVO: Crea timeline direttamente dai dati performance (molto più veloce)
   * @param wordId - ID della parola
   * @param performanceData - Dati dalla collezione performance
   * @param wordInfo - Info parola
   * @returns Timeline data
   */
  createTimelineFromPerformanceData(
    wordId: string,
    performanceData: any,
    wordInfo: { english: string; italian: string; chapter?: string | null }
  ) {
    // ⭐ USA DIRETTAMENTE GLI ATTEMPTS DALLA COLLEZIONE PERFORMANCE!
    const attempts = performanceData.attempts || [];
    
    // Converti in dati per il grafico
    const fullChartData = this.convertToChartData(attempts);
    const chartData = this.limitChartData(fullChartData, 10);
    
    // Calcola statistiche
    const reconstructedStats = this.calculateReconstructedStats(attempts);
    const recentStats = this.calculateRecentStats(chartData, reconstructedStats, attempts.length);
    
    // Genera insights
    const recommendations = this.generateRecommendations(reconstructedStats, recentStats);
    const status = this.determineWordStatus(reconstructedStats);

    return {
      attempts,
      chartData,
      reconstructedStats,
      recentStats,
      recommendations,
      status,
      hasData: attempts.length > 0
    };
  }

  /**
   * Funzione principale che coordina tutta la ricostruzione timeline (LEGACY)
   * @param wordId - ID della parola
   * @param testHistory - Cronologia test
   * @param wordInfo - Info parola
   * @returns Oggetto completo con tutti i dati processati
   */
  reconstructWordTimeline(
    wordId: string,
    testHistory: TestHistoryItem[],
    wordInfo: { english: string; italian: string; chapter?: string | null }
  ) {
    // 1. Ricostruisci timeline
    const attempts = this.buildTimelineFromHistory(wordId, testHistory, wordInfo);
    
    // 2. Converti in dati grafico
    const fullChartData = this.convertToChartData(attempts);
    
    // 3. Limita dati per visualizzazione
    const chartData = this.limitChartData(fullChartData, 10);
    
    // 4. Calcola statistiche
    const reconstructedStats = this.calculateReconstructedStats(attempts);
    const recentStats = this.calculateRecentStats(chartData, reconstructedStats, attempts.length);
    
    // 5. Genera insights
    const recommendations = this.generateRecommendations(reconstructedStats, recentStats);
    const status = this.determineWordStatus(reconstructedStats);

    return {
      attempts,
      chartData,
      reconstructedStats,
      recentStats,
      recommendations,
      status,
      hasData: attempts.length > 0
    };
  }
}

export default TimelineReconstructionService;
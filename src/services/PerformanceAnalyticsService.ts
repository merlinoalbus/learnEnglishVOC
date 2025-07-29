// =====================================================
// 📊 src/services/PerformanceAnalyticsService.ts
// =====================================================

import type { TestHistoryItem } from '../types/entities/Test.types';

/**
 * Service dedicato per calcoli e analisi delle metriche di performance
 * Estrae tutte le logiche business da PerformanceSection per rispettare l'architettura
 * DB => types => hooks/services => components
 */

interface PerformanceTimelineData {
  test: string;
  percentage: number;
  correct: number;
  incorrect: number;
  hints: number;
  avgTime: number;
  date: string;
  time: string;
  chapters: number;
  difficulty: string;
  type: string;
  totalWords: number;
  hasRealTime: boolean;
  isEstimated: boolean;
}

interface PerformanceMetrics {
  accuracy: number;
  consistency: number;
  hintEfficiency: number;
  speedScore: number;
  performanceIndex: number;
  improvementTrend: number;
  learningVelocity: number;
  bestStreak: number;
  difficultyScore: number;
  avgSpeed: number;
  recentPerformance: number;
  overallRating: number;
  realTimePercentage: number;
  calculationBreakdown: {
    precision: { value: number; points: number };
    consistency: { value: number; points: number };
    efficiency: { value: number; points: number };
    speed: { value: number; points: number };
  };
}

interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

interface ImprovementDataPoint {
  period: string;
  accuracy: number;
  efficiency: number;
  speed: number;
}

interface DifficultyAnalysisPoint {
  difficulty: string;
  count: number;
  avgScore: number;
  avgHints: number;
  efficiency: number;
}

export class PerformanceAnalyticsService {
  
  /**
   * Processa i dati di cronologia test per l'analisi performance
   */
  processPerformanceTimelineData(testHistory: TestHistoryItem[]): PerformanceTimelineData[] {
    if (testHistory.length === 0) return [];

    return [...testHistory].reverse().slice(-20).map((test, index) => {
      const totalWords = (test.correctWords || 0) + (test.incorrectWords || 0);
      
      // Calcola tempo medio per parola con stime realistiche
      let avgTimePerWord = 0;
      if (test.totalTime && totalWords > 0) {
        // Usa tempo reale se disponibile
        avgTimePerWord = Math.round((test.totalTime / totalWords) * 10) / 10;
      } else if (totalWords > 0) {
        // Stima basata su difficoltà e performance
        const baseTime = 8; // secondi per parola baseline
        const difficultyMultiplier = test.difficulty === 'hard' ? 1.5 : test.difficulty === 'easy' ? 0.7 : 1.0;
        const performanceMultiplier = test.percentage < 50 ? 1.8 : test.percentage < 70 ? 1.3 : test.percentage < 85 ? 1.0 : 0.8;
        const hintsMultiplier = (test.hintsUsed || 0) > 0 ? 1.2 : 1.0;
        
        avgTimePerWord = Math.round(baseTime * difficultyMultiplier * performanceMultiplier * hintsMultiplier * 10) / 10;
      }

      return {
        test: `Test ${index + 1}`,
        percentage: test.percentage || 0,
        correct: test.correctWords || 0,
        incorrect: test.incorrectWords || 0,
        hints: test.hintsUsed || 0,
        avgTime: avgTimePerWord,
        date: new Date(test.timestamp).toLocaleDateString('it-IT'),
        time: new Date(test.timestamp).toLocaleTimeString('it-IT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        chapters: test.testParameters?.selectedChapters?.length || 0,
        difficulty: test.difficulty || 'medium',
        type: test.testType || 'unknown',
        totalWords: totalWords,
        hasRealTime: !!(test.totalTime),
        isEstimated: !test.totalTime
      };
    });
  }

  /**
   * Calcola la precisione come media dei punteggi di tutti i test
   */
  calculatePrecision(timelineData: PerformanceTimelineData[]): number {
    if (timelineData.length === 0) {
      return 0;
    }
    
    const totalScore = timelineData.reduce((sum, test) => sum + test.percentage, 0);
    return Math.round(totalScore / timelineData.length);
  }

  /**
   * Calcola consistenza (100 - deviazione standard)
   */
  calculateConsistency(timelineData: PerformanceTimelineData[]): number {
    if (timelineData.length < 2) {
      return 100; // Perfect consistency with limited data
    }
    
    const scores = timelineData.map(t => t.percentage);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, Math.round(100 - standardDeviation));
  }

  /**
   * Calcola efficienza (risposte corrette senza aiuti)
   */
  calculateEfficiency(timelineData: PerformanceTimelineData[]): number {
    const totalQuestions = timelineData.reduce((sum, t) => sum + t.totalWords, 0);
    const totalHints = timelineData.reduce((sum, t) => sum + (t.hints || 0), 0);
    
    if (totalQuestions === 0) {
      return 100;
    }
    
    const hintPercentage = (totalHints / totalQuestions) * 100;
    return Math.max(0, Math.round(100 - hintPercentage));
  }

  /**
   * Calcola score velocità basato sul tempo medio di risposta
   */
  calculateSpeed(timelineData: PerformanceTimelineData[]): number {
    if (timelineData.length === 0) {
      return 50;
    }
    
    const avgResponseTime = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / timelineData.length;
    
    // Score mapping basato su tempo medio di risposta
    let speedScore = 30; // Default estremamente lento
    if (avgResponseTime <= 5) speedScore = 100;        // Eccellente
    else if (avgResponseTime <= 8) speedScore = 90;     // Molto buono
    else if (avgResponseTime <= 12) speedScore = 80;    // Buono
    else if (avgResponseTime <= 16) speedScore = 70;    // Medio
    else if (avgResponseTime <= 20) speedScore = 60;    // Sotto la media
    else if (avgResponseTime <= 25) speedScore = 50;    // Lento
    else if (avgResponseTime <= 30) speedScore = 40;    // Molto lento
    
    return speedScore;
  }

  /**
   * Calcola il miglior streak consecutivo
   */
  calculateBestStreak(timelineData: PerformanceTimelineData[]): number {
    let currentStreak = 0;
    let bestStreak = 0;
    const threshold = 75;
    
    timelineData.forEach(test => {
      if (test.percentage >= threshold) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return bestStreak;
  }

  /**
   * Calcola gestione difficoltà
   */
  calculateDifficultyHandling(testHistory: TestHistoryItem[]): number {
    const hardTests = testHistory.filter(test => (test.totalWords || 0) >= 20);
    if (hardTests.length === 0) return 70;
    
    const hardTestsAvg = hardTests.reduce((sum, test) => sum + (test.percentage || 0), 0) / hardTests.length;
    return Math.min(100, hardTestsAvg + 10);
  }

  /**
   * Calcola tutte le metriche performance principali
   */
  calculatePerformanceMetrics(
    timelineData: PerformanceTimelineData[],
    testHistory: TestHistoryItem[]
  ): PerformanceMetrics | null {
    if (testHistory.length === 0) return null;

    // Calcola le quattro metriche principali
    const precisionScore = this.calculatePrecision(timelineData);
    const consistencyScore = this.calculateConsistency(timelineData);
    const efficiencyScore = this.calculateEfficiency(timelineData);
    const speedScore = this.calculateSpeed(timelineData);

    // Performance Index Formula
    // Index = (Precisione × 40%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%)
    const precisionPoints = Math.round(precisionScore * 0.40);
    const consistencyPoints = Math.round(consistencyScore * 0.25);
    const efficiencyPoints = Math.round(efficiencyScore * 0.20);
    const speedPoints = Math.round(speedScore * 0.15);
    const performanceIndex = precisionPoints + consistencyPoints + efficiencyPoints + speedPoints;

    // Calcola metriche aggiuntive
    const recentTests = timelineData.slice(-10);
    const oldTests = timelineData.slice(0, Math.min(10, timelineData.length - 10));
    const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / Math.max(1, recentTests.length);
    const oldAvg = oldTests.length > 0 ? oldTests.reduce((sum, t) => sum + t.percentage, 0) / oldTests.length : recentAvg;
    const improvementTrend = recentAvg - oldAvg;
    
    const bestStreak = this.calculateBestStreak(timelineData);
    const difficultyScore = this.calculateDifficultyHandling(testHistory);
    const avgSpeed = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / Math.max(1, timelineData.length);
    
    const learningVelocity = timelineData.length > 5 ? 
      (timelineData.slice(-5).reduce((sum, t) => sum + t.percentage, 0) / 5) -
      (timelineData.slice(0, 5).reduce((sum, t) => sum + t.percentage, 0) / 5) : 0;

    return {
      accuracy: precisionScore,
      consistency: consistencyScore,
      hintEfficiency: efficiencyScore,
      speedScore: speedScore,
      performanceIndex: performanceIndex,
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      bestStreak,
      difficultyScore: Math.round(difficultyScore),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      recentPerformance: Math.round(recentAvg),
      overallRating: performanceIndex,
      realTimePercentage: Math.round((timelineData.filter(t => t.hasRealTime).length / timelineData.length) * 100),
      calculationBreakdown: {
        precision: { value: precisionScore, points: precisionPoints },
        consistency: { value: consistencyScore, points: consistencyPoints },
        efficiency: { value: efficiencyScore, points: efficiencyPoints },
        speed: { value: speedScore, points: speedPoints }
      }
    };
  }

  /**
   * Prepara dati per grafico radar
   */
  prepareRadarData(metrics: PerformanceMetrics): RadarDataPoint[] {
    return [
      {
        metric: 'Precisione',
        value: metrics.accuracy,
        fullMark: 100
      },
      {
        metric: 'Consistenza',
        value: metrics.consistency,
        fullMark: 100
      },
      {
        metric: 'Efficienza',
        value: metrics.hintEfficiency,
        fullMark: 100
      },
      {
        metric: 'Velocità',
        value: metrics.speedScore,
        fullMark: 100
      },
      {
        metric: 'Gestione Difficoltà',
        value: metrics.difficultyScore,
        fullMark: 100
      }
    ];
  }

  /**
   * Calcola dati per analisi di miglioramento
   */
  calculateImprovementData(timelineData: PerformanceTimelineData[]): ImprovementDataPoint[] {
    const windows = [];
    const windowSize = 5;
    
    for (let i = 0; i <= timelineData.length - windowSize; i += 2) {
      const window = timelineData.slice(i, i + windowSize);
      const avgScore = window.reduce((sum, t) => sum + t.percentage, 0) / windowSize;
      const avgHints = window.reduce((sum, t) => sum + (t.hints || 0), 0) / windowSize;
      const avgSpeed = window.reduce((sum, t) => sum + (t.avgTime || 0), 0) / windowSize;
      
      windows.push({
        period: `Test ${i + 1}-${i + windowSize}`,
        accuracy: Math.round(avgScore),
        efficiency: Math.max(0, Math.round(avgScore - (avgHints / window.reduce((sum, t) => sum + t.totalWords, 0) * 100))),
        speed: avgSpeed > 0 ? Math.round(Math.max(0, 100 - Math.min(100, avgSpeed * 3))) : 50
      });
    }
    
    return windows;
  }

  /**
   * Analizza performance per livello di difficoltà
   */
  analyzeDifficultyPerformance(testHistory: TestHistoryItem[]): DifficultyAnalysisPoint[] {
    const analysis: Record<string, any[]> = { easy: [], medium: [], hard: [] };
    
    testHistory.forEach(test => {
      const totalWords = test.totalWords || 0;
      let category = 'easy';
      
      if (totalWords >= 30) category = 'hard';
      else if (totalWords >= 15) category = 'medium';
      
      analysis[category].push({
        percentage: test.percentage || 0,
        hints: test.hintsUsed || 0,
        words: totalWords
      });
    });

    return Object.entries(analysis).map(([difficulty, tests]: [string, any[]]) => {
      if (tests.length === 0) return null;
      
      const avgPercentage = tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length;
      const avgHints = tests.reduce((sum, t) => sum + t.hints, 0) / tests.length;
      const totalWords = tests.reduce((sum, t) => sum + t.words, 0);
      
      return {
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count: tests.length,
        avgScore: Math.round(avgPercentage),
        avgHints: Math.round(avgHints * 10) / 10,
        efficiency: Math.round(avgPercentage - (avgHints / totalWords * 100 * tests.length))
      };
    }).filter(Boolean) as DifficultyAnalysisPoint[];
  }

  /**
   * Genera insights personalizzati basati sulle metriche
   */
  generateInsights(metrics: PerformanceMetrics): {
    strengths: string[];
    improvements: string[];
    recommendation: string;
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analizza punti di forza
    if (metrics.accuracy >= 80) {
      strengths.push(`✅ Ottima precisione nelle risposte (${metrics.accuracy}%)`);
    }
    if (metrics.consistency >= 75) {
      strengths.push('✅ Performance molto consistenti');
    }
    if (metrics.hintEfficiency >= 80) {
      strengths.push('✅ Uso efficiente degli aiuti');
    }
    if (metrics.speedScore >= 80) {
      strengths.push('✅ Tempi di risposta ottimi');
    }
    if (metrics.bestStreak >= 5) {
      strengths.push(`✅ Streak impressionante di ${metrics.bestStreak} test consecutivi`);
    }
    if (metrics.improvementTrend > 2) {
      strengths.push(`✅ Trend di miglioramento costante (+${metrics.improvementTrend}%)`);
    }

    // Analizza aree di miglioramento
    if (metrics.accuracy < 70) {
      improvements.push(`⚠️ Precisione da migliorare (${metrics.accuracy}%)`);
    }
    if (metrics.consistency < 60) {
      improvements.push('⚠️ Performance troppo variabili - punta alla consistenza');
    }
    if (metrics.hintEfficiency < 70) {
      improvements.push('⚠️ Uso eccessivo degli aiuti - prova a rispondere autonomamente');
    }
    if (metrics.speedScore < 60) {
      improvements.push('⚠️ Tempi di risposta lenti - pratica per migliorare la velocità');
    }
    if (metrics.improvementTrend < -2) {
      improvements.push(`⚠️ Trend in calo (${metrics.improvementTrend}%) - rivedi la strategia di studio`);
    }
    if (metrics.bestStreak < 3) {
      improvements.push('⚠️ Mancanza di consistenza - concentrati sui fondamentali');
    }

    // Genera raccomandazione personalizzata
    let recommendation = '';
    if (metrics.overallRating >= 85) {
      recommendation = '🏆 Performance eccezionali! Considera di aumentare la difficoltà o di aiutare altri studenti. Il tuo approccio allo studio è molto efficace.';
    } else if (metrics.overallRating >= 75) {
      const focusArea = metrics.consistency < 75 ? 'consistenza' : metrics.speedScore < 75 ? 'velocità' : 'precisione';
      recommendation = `🌟 Ottime performance! Lavora sulla ${focusArea} per raggiungere l'eccellenza.`;
    } else if (metrics.overallRating >= 65) {
      const focusArea = metrics.accuracy < 70 ? 'migliorare la precisione studiando di più' : 
                       metrics.hintEfficiency < 70 ? 'ridurre la dipendenza dagli aiuti' : 'aumentare la consistenza';
      recommendation = `👍 Buone performance! Concentrati su ${focusArea}.`;
    } else {
      const advice = metrics.accuracy < 60 ? 'dedica più tempo allo studio prima dei test' : 'pratica più regolarmente per sviluppare consistenza';
      recommendation = `📚 C'è spazio per migliorare. Suggerimento: ${advice}.`;
    }

    return {
      strengths,
      improvements,
      recommendation
    };
  }
}

export default PerformanceAnalyticsService;
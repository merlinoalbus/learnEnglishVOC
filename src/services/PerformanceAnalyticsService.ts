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
    difficulty: { value: number; points: number };
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

    // Mantieni ordine cronologico: test più vecchi all'inizio, più recenti alla fine
    return [...testHistory].slice(-20).map((test, index) => {
      const totalWords = (test.correctWords || 0) + (test.incorrectWords || 0);
      
      // Calcola tempo medio per parola con stime realistiche (in secondi)
      let avgTimePerWord = 0;
      if (test.totalTime && totalWords > 0) {
        // Usa tempo reale se disponibile - converte da millisecondi a secondi
        const totalTimeInSeconds = test.totalTime > 1000 ? test.totalTime / 1000 : test.totalTime;
        avgTimePerWord = Math.round((totalTimeInSeconds / totalWords) * 10) / 10;
      } else if (totalWords > 0) {
        // Stima basata su difficoltà e performance (già in secondi)
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
   * Calcola efficienza usando detailedSessions (parole risolte senza aiuti)
   */
  calculateEfficiency(timelineData: PerformanceTimelineData[], detailedSessions?: any[]): number {
    if (!detailedSessions || detailedSessions.length === 0) {
      // Fallback al calcolo semplificato
      const totalQuestions = timelineData.reduce((sum, t) => sum + t.totalWords, 0);
      const totalHints = timelineData.reduce((sum, t) => sum + (t.hints || 0), 0);
      
      if (totalQuestions === 0) return 100;
      
      const hintPercentage = (totalHints / totalQuestions) * 100;
      return Math.max(0, Math.round(100 - hintPercentage));
    }

    let totalWords = 0;
    let wordsWithoutHints = 0;

    detailedSessions.forEach(session => {
      if (session.words && Array.isArray(session.words)) {
        session.words.forEach((word: any) => {
          totalWords++;
          if (!word.totalHintsCount || word.totalHintsCount === 0) {
            wordsWithoutHints++;
          }
        });
      }
    });

    if (totalWords === 0) return 100;
    
    return Math.round((wordsWithoutHints / totalWords) * 100);
  }

  /**
   * Calcola score velocità basato sul tempo medio di risposta (in secondi)
   */
  calculateSpeed(timelineData: PerformanceTimelineData[]): number {
    if (timelineData.length === 0) {
      return 50;
    }
    
    // avgTime è già in secondi grazie al processamento in processPerformanceTimelineData
    const avgResponseTime = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / timelineData.length;
    
    // Score mapping basato su tempo medio di risposta in secondi
    let speedScore = 30; // Default estremamente lento
    if (avgResponseTime <= 3) speedScore = 100;        // Eccellente
    else if (avgResponseTime <= 5) speedScore = 90;     // Molto buono
    else if (avgResponseTime <= 8) speedScore = 80;     // Buono
    else if (avgResponseTime <= 12) speedScore = 70;    // Medio
    else if (avgResponseTime <= 16) speedScore = 60;    // Sotto la media
    else if (avgResponseTime <= 20) speedScore = 50;    // Lento
    else if (avgResponseTime <= 25) speedScore = 40;    // Molto lento
    
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
    testHistory: TestHistoryItem[],
    detailedSessions?: any[]
  ): PerformanceMetrics | null {
    if (testHistory.length === 0) return null;

    // Calcola le cinque metriche principali
    const precisionScore = this.calculatePrecision(timelineData);
    const consistencyScore = this.calculateConsistency(timelineData);
    const efficiencyScore = this.calculateEfficiency(timelineData, detailedSessions);
    const speedScore = this.calculateSpeed(timelineData);
    const difficultyScore = this.calculateDifficultyHandling(testHistory);

    // Performance Index Formula - 5 metriche
    // Index = (Precisione × 30%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%) + (Gestione Difficoltà × 10%)
    const precisionPoints = Math.round(precisionScore * 0.30);
    const consistencyPoints = Math.round(consistencyScore * 0.25);
    const efficiencyPoints = Math.round(efficiencyScore * 0.20);
    const speedPoints = Math.round(speedScore * 0.15);
    const difficultyPoints = Math.round(difficultyScore * 0.10);
    const performanceIndex = precisionPoints + consistencyPoints + efficiencyPoints + speedPoints + difficultyPoints;

    // Calcola metriche aggiuntive - trend di miglioramento
    // I test sono ordinati cronologicamente, quindi i primi sono i più vecchi
    const oldTests = timelineData.slice(0, Math.min(5, Math.floor(timelineData.length / 2)));
    const recentTests = timelineData.slice(-Math.min(5, Math.floor(timelineData.length / 2)));
    const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / Math.max(1, recentTests.length);
    const oldAvg = oldTests.length > 0 ? oldTests.reduce((sum, t) => sum + t.percentage, 0) / oldTests.length : recentAvg;
    const improvementTrend = recentAvg - oldAvg;
    
    console.log(`📈 IMPROVEMENT TREND: old=${oldTests.map(t => t.percentage)} (avg=${oldAvg.toFixed(1)}%) vs recent=${recentTests.map(t => t.percentage)} (avg=${recentAvg.toFixed(1)}%) → trend=${improvementTrend.toFixed(1)}%`);
    
    const bestStreak = this.calculateBestStreak(timelineData);
    const avgSpeed = timelineData.reduce((sum, t) => sum + (t.avgTime || 0), 0) / Math.max(1, timelineData.length);
    
    // Calcola velocità di apprendimento confrontando prima e seconda metà dei test
    // I test sono già ordinati cronologicamente (dal più vecchio al più recente)
    let learningVelocity = 0;
    if (timelineData.length >= 4) {
      const firstHalf = timelineData.slice(0, Math.floor(timelineData.length / 2));
      const secondHalf = timelineData.slice(Math.floor(timelineData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.percentage, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.percentage, 0) / secondHalf.length;
      
      // Seconda metà (più recente) - Prima metà (più vecchia) = miglioramento
      learningVelocity = secondHalfAvg - firstHalfAvg;
      
      console.log(`🚀 LEARNING VELOCITY: first=${firstHalf.map(t => t.percentage)} (avg=${firstHalfAvg.toFixed(1)}%) vs second=${secondHalf.map(t => t.percentage)} (avg=${secondHalfAvg.toFixed(1)}%) → velocity=${learningVelocity.toFixed(1)}%`);
    }

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
        speed: { value: speedScore, points: speedPoints },
        difficulty: { value: difficultyScore, points: difficultyPoints }
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
   * Calcola dati per analisi di miglioramento usando detailedSessions
   */
  calculateImprovementData(timelineData: PerformanceTimelineData[], detailedSessions?: any[]): ImprovementDataPoint[] {
    if (timelineData.length < 3) {
      return []; // Serve almeno 3 test per vedere un trend
    }

    const windows = [];
    const windowSize = Math.max(3, Math.floor(timelineData.length / 3)); // Finestre dinamiche
    
    console.log(`🔍 TREND ANALYSIS - Total tests: ${timelineData.length}`);
    
    // Crea 3 finestre: inizio, metà, fine
    for (let i = 0; i < 3; i++) {
      const startIndex = i * Math.floor(timelineData.length / 3);
      const endIndex = i === 2 ? timelineData.length : (i + 1) * Math.floor(timelineData.length / 3);
      const window = timelineData.slice(startIndex, endIndex);
      
      if (window.length === 0) continue;
      
      // Calcola accuracy come media dei punteggi
      const scores = window.map(t => t.percentage);
      const avgAccuracy = scores.reduce((sum, score) => sum + score, 0) / window.length;
      
      // Calcola efficienza usando detailedSessions se disponibili
      let efficiency = 0;
      if (detailedSessions && detailedSessions.length > 0) {
        let totalWords = 0;
        let wordsWithoutHints = 0;
        
        window.forEach(testData => {
          // Trova la sessione dettagliata corrispondente (approssimazione per ora)
          const sessionIndex = timelineData.indexOf(testData);
          const detailedSession = detailedSessions[sessionIndex];
          
          if (detailedSession && detailedSession.words) {
            detailedSession.words.forEach((word: any) => {
              totalWords++;
              if (!word.totalHintsCount || word.totalHintsCount === 0) {
                wordsWithoutHints++;
              }
            });
          }
        });
        
        efficiency = totalWords > 0 ? (wordsWithoutHints / totalWords) * 100 : 0;
      } else {
        // Fallback al calcolo semplificato
        const totalWords = window.reduce((sum, t) => sum + t.totalWords, 0);
        const totalHints = window.reduce((sum, t) => sum + (t.hints || 0), 0);
        efficiency = totalWords > 0 ? Math.max(0, ((totalWords - totalHints) / totalWords) * 100) : 0;
      }
      
      // Calcola velocità basata sul tempo medio (già in secondi)
      const times = window.map(t => t.avgTime || 0);
      const avgTime = times.reduce((sum, time) => sum + time, 0) / window.length;
      
      // Score mapping consistente con calculateSpeed
      let speed = 30; // Default lento
      if (avgTime <= 3) speed = 100;
      else if (avgTime <= 5) speed = 90;
      else if (avgTime <= 8) speed = 80;
      else if (avgTime <= 12) speed = 70;
      else if (avgTime <= 16) speed = 60;
      else if (avgTime <= 20) speed = 50;
      else if (avgTime <= 25) speed = 40;
      
      const period = i === 0 ? 'Inizio' : i === 1 ? 'Metà' : 'Fine';
      
      console.log(`📊 ${period} (tests ${startIndex+1}-${endIndex}): accuracy=${scores} → ${Math.round(avgAccuracy)}%, time=${times.map(t => t.toFixed(1))} → ${avgTime.toFixed(1)}s → speed=${Math.round(speed)}%, efficiency=${Math.round(efficiency)}%`);
      
      windows.push({
        period,
        accuracy: Math.round(avgAccuracy),
        efficiency: Math.round(efficiency),
        speed: Math.round(speed)
      });
    }
    
    return windows;
  }

  /**
   * Calcola difficoltà del test basandosi su caratteristiche oggettive e performance soggettiva
   */
  calculateTestDifficultyFromSession(detailedSession: any, wordsDatabase?: any[]): 'Facile' | 'Normale' | 'Difficile' {
    if (!detailedSession?.words || !Array.isArray(detailedSession.words)) {
      // Fallback: se configurato solo per difficili
      if (detailedSession?.config?.wordSelection?.difficultOnly === true || 
          detailedSession?.config?.testMode === 'difficult-only') {
        return 'Difficile';
      }
      return 'Normale';
    }

    const words = detailedSession.words;
    const totalWords = words.length;
    
    if (totalWords === 0) return 'Normale';

    // PARTE 1: Analizza caratteristiche OGGETTIVE delle parole
    let objectiveDifficultWords = 0;
    let objectiveLearnedWords = 0;
    let objectiveNormalWords = 0;
    
    // PARTE 2: Analizza performance SOGGETTIVA dell'utente
    let subjectiveDifficultWords = 0;
    let subjectiveLearnedWords = 0;
    let subjectiveNormalWords = 0;
    let totalHints = 0;
    let avgTimePerWord = 0;

    words.forEach((word: any) => {
      // Trova la parola nel database per caratteristiche oggettive
      const wordData = wordsDatabase?.find(w => w.id === word.wordId || w.english === word.english);
      
      // OGGETTIVO: Caratteristiche intrinseche della parola
      if (wordData) {
        if (wordData.difficult === true) {
          objectiveDifficultWords++;
        } else if (wordData.learned === true) {
          objectiveLearnedWords++;
        } else {
          objectiveNormalWords++;
        }
      } else {
        // Se non trovo la parola nel DB, considero normale
        objectiveNormalWords++;
      }
      
      // SOGGETTIVO: Performance dell'utente su questa parola
      const hintsUsed = word.totalHintsCount || 0;
      totalHints += hintsUsed;
      
      const thinkingTime = word.thinkingTime || word.evaluationTime || 0;
      avgTimePerWord += thinkingTime;
      
      if (hintsUsed >= 2 || thinkingTime > 10000 || !word.isCorrect) {
        subjectiveDifficultWords++;
      } else if (hintsUsed === 0 && thinkingTime < 5000 && word.isCorrect) {
        subjectiveLearnedWords++;
      } else {
        subjectiveNormalWords++;
      }
    });

    avgTimePerWord = avgTimePerWord / totalWords;
    const avgHintsPerWord = totalHints / totalWords;

    // Calcola proporzioni OGGETTIVE e SOGGETTIVE
    const objectiveDifficultRatio = objectiveDifficultWords / totalWords;
    const objectiveLearnedRatio = objectiveLearnedWords / totalWords;
    const subjectiveDifficultRatio = subjectiveDifficultWords / totalWords;
    const subjectiveLearnedRatio = subjectiveLearnedWords / totalWords;
    
    // FORMULA INTEGRATA: pesa entrambi gli aspetti
    // Difficoltà oggettiva (50%) + Performance soggettiva (50%)
    const objectiveScore = objectiveDifficultRatio * 0.5;
    const subjectiveScore = subjectiveDifficultRatio * 0.5;
    const totalDifficultyScore = objectiveScore + subjectiveScore;
    
    const objectiveEasyScore = objectiveLearnedRatio * 0.5;
    const subjectiveEasyScore = subjectiveLearnedRatio * 0.5;
    const totalEasyScore = objectiveEasyScore + subjectiveEasyScore;
    
    // Criteri integrati per classificazione finale
    if (totalDifficultyScore >= 0.5 || avgHintsPerWord >= 2 || objectiveDifficultRatio >= 0.7) {
      // Se score integrato alto O troppi aiuti O parole oggettivamente difficili
      return 'Difficile';
    } else if (totalEasyScore >= 0.6 || (avgHintsPerWord < 0.3 && avgTimePerWord < 5000) || objectiveLearnedRatio >= 0.7) {
      // Se score facile alto O performance eccellente O parole già apprese
      return 'Facile';
    } else {
      // Mix bilanciato
      return 'Normale';
    }
  }

  /**
   * Analizza performance per livello di difficoltà usando detailedSessions
   */
  analyzeDifficultyPerformance(testHistory: TestHistoryItem[], detailedSessions?: any[], wordsDatabase?: any[]): DifficultyAnalysisPoint[] {
    const analysis: Record<string, any[]> = { Facile: [], Normale: [], Difficile: [] };
    
    testHistory.forEach(test => {
      // Trova la sessione dettagliata corrispondente
      const detailedSession = detailedSessions?.find(s => 
        s.sessionId === test.id || 
        (s.completedAt && Math.abs(new Date(s.completedAt).getTime() - test.timestamp) < 60000)
      );
      
      const difficulty = this.calculateTestDifficultyFromSession(detailedSession, wordsDatabase);
      
      // Calcola efficienza usando detailedSession se disponibile
      let wordsWithoutHints = 0;
      let totalWords = 0;
      
      if (detailedSession && detailedSession.words && Array.isArray(detailedSession.words)) {
        detailedSession.words.forEach((word: any) => {
          totalWords++;
          if (!word.totalHintsCount || word.totalHintsCount === 0) {
            wordsWithoutHints++;
          }
        });
      } else {
        // Fallback ai dati aggregati del test
        totalWords = test.totalWords || 0;
        const hintsUsed = test.hintsUsed || 0;
        // Stima approssimativa: se hintsUsed < totalWords, assume che alcune parole non hanno avuto aiuti
        wordsWithoutHints = Math.max(0, totalWords - hintsUsed);
      }
      
      const efficiency = totalWords > 0 ? (wordsWithoutHints / totalWords) * 100 : 0;
      
      analysis[difficulty].push({
        percentage: test.percentage || 0,
        hints: test.hintsUsed || 0,
        words: totalWords,
        efficiency: efficiency,
        wordsWithoutHints: wordsWithoutHints
      });
    });

    return Object.entries(analysis).map(([difficulty, tests]: [string, any[]]) => {
      if (tests.length === 0) return null;
      
      const avgPercentage = tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length;
      const totalHints = tests.reduce((sum, t) => sum + t.hints, 0);
      const totalWords = tests.reduce((sum, t) => sum + t.words, 0);
      const totalWordsWithoutHints = tests.reduce((sum, t) => sum + t.wordsWithoutHints, 0);
      const avgHintsPerTest = totalHints / tests.length;
      
      // Calcola efficienza reale: parole totali senza aiuti / parole totali
      const realEfficiency = totalWords > 0 ? (totalWordsWithoutHints / totalWords) * 100 : 0;
      
      return {
        difficulty,
        count: tests.length,
        avgScore: Math.round(avgPercentage),
        avgHints: Math.round(avgHintsPerTest * 10) / 10,
        efficiency: Math.round(Math.max(0, realEfficiency))
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
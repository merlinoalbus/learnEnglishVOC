/**
 * Service per il calcolo corretto delle statistiche e Performance Index
 * Basato sui dati reali da detailedTestSessions e performance
 */

interface StatsCalculationResult {
  testCompletati: number;
  paroleStudiate: number;
  mediaCorretta: number;
  recordScore: number;
  aiutiTotali: number;
  maxHintsPercentage: number;
}

interface PerformanceIndexResult {
  performanceIndex: number;
  precision: { value: number; points: number };
  consistency: { value: number; points: number };
  efficiency: { value: number; points: number };
  speed: { value: number; points: number };
  breakdown: {
    precisione: { value: number; weight: number; contribution: number };
    consistenza: { value: number; weight: number; contribution: number };
    efficienza: { value: number; weight: number; contribution: number };
    velocita: { value: number; weight: number; contribution: number };
  };
}

interface ChartDataPoint {
  test: string;
  date: string;
  fullDate: string;
  timestamp: Date;
  percentage: number;
  efficiency: number;
  speed: number;
  hintsCount: number;
  avgTime: number;
  totalWords: number;
}

export type { StatsCalculationResult, PerformanceIndexResult, ChartDataPoint };

export class StatsCalculationService {
  static calculateStats(
    detailedSessions: any[],
    wordPerformances: any[]
  ): StatsCalculationResult {

    // 1. Test Completati
    const testCompletati = detailedSessions.length;

    // 2. Parole Studiate - parole con almeno 1 attempt nella collection performance
    const paroleStudiate = wordPerformances.filter(wp => 
      wp.attempts && wp.attempts.length > 0
    ).length;

    // 3. Media - media delle accuratezze delle parole con performance (se hanno attempts)
    let totalAccuracy = 0;
    let wordsWithPerformance = 0;
    
    // Calculate accuracy average for words with performance data
    
    wordPerformances.forEach((wp, index) => {
      if (wp.attempts && wp.attempts.length > 0) {
        const correctAttempts = wp.attempts.filter((attempt: any) => attempt.correct).length;
        const accuracy = (correctAttempts / wp.attempts.length) * 100;
        totalAccuracy += accuracy;
        wordsWithPerformance++;
        
        // Add to total accuracy calculation
      }
    });
    
    const mediaCorretta = wordsWithPerformance > 0 
      ? Math.round(totalAccuracy / wordsWithPerformance) 
      : 0;
    
    // Final accuracy average calculation
    
    // ALTERNATIVA: Se non ci sono dati performance, calcola dai test sessions
    let mediaAlternativa = 0;
    if (mediaCorretta === 0 && detailedSessions.length > 0) {
      const totalSessionAccuracy = detailedSessions.reduce((sum, session) => sum + (session.accuracy || 0), 0);
      mediaAlternativa = Math.round(totalSessionAccuracy / detailedSessions.length);
      // Using test sessions as fallback when word performance data not available
    }
    
    // Use alternative if main calculation failed
    const finalMediaCorretta = mediaCorretta > 0 ? mediaCorretta : mediaAlternativa;

    // 4. Record - miglior percentuale singolo test
    const recordScore = detailedSessions.length > 0
      ? Math.max(...detailedSessions.map(s => s.accuracy || 0))
      : 0;
    // 5. Aiuti - totale aiuti utilizzati
    const aiutiTotali = detailedSessions.reduce((sum, session) => 
      sum + (session.totalHintsUsed || 0), 0
    );

    // 6. % Aiuti - MEDIA delle percentuali di aiuti usati nei test
    let totalPercentages = 0;
    let testsWithHints = 0;
    detailedSessions.forEach((session, idx) => {
      const hintsUsed = session.totalHintsUsed || 0;
      const totalWords = session.totalWords || 0;
      
      // Calcolo max hints disponibili per questa sessione
      let maxHintsAvailable = 0;
      
      // Prova diversi percorsi per trovare la configurazione hints
      const config = session.config || session.testConfig;
      const hints = config?.hints;
      
      if (hints?.maxTotal !== undefined && hints.maxTotal !== null && hints.maxTotal > 0) {
        // Se c'è un limite totale configurato, usa quello
        maxHintsAvailable = hints.maxTotal;
      } else if (hints?.maxPerWord && totalWords > 0) {
        // Altrimenti calcola in base al max per parola
        maxHintsAvailable = hints.maxPerWord * totalWords;
      } else {
        // Default: assume 2 hints per parola
        maxHintsAvailable = 2 * totalWords;
      }
      
      if (maxHintsAvailable > 0) {
        const percentage = (hintsUsed / maxHintsAvailable) * 100;
        totalPercentages += percentage;
        testsWithHints++;
      }
    });
    
    const maxHintsPercentage = testsWithHints > 0 
      ? Math.round(totalPercentages / testsWithHints)
      : 0;

    return {
      testCompletati,
      paroleStudiate,
      mediaCorretta: finalMediaCorretta,
      recordScore: Math.round(recordScore),
      aiutiTotali,
      maxHintsPercentage
    };
  }
  
  /**
   * Debug: Log dei calcoli dettagliati
   */
  static logCalculationDetails(
    detailedSessions: any[],
    wordPerformances: any[],
    result: StatsCalculationResult
  ): void {
    // Debug logging removed - calculation is working correctly
  }

  /**
   * Calcola il Performance Index basato sui 4 fattori specificati
   * Formula: Index = (Precisione × 40%) + (Consistenza × 25%) + (Efficienza × 20%) + (Velocità × 15%)
   */
  static calculatePerformanceIndex(testHistory: any[]): PerformanceIndexResult {
    if (!testHistory || testHistory.length === 0) {
      throw new Error('Test history is required for Performance Index calculation');
    }

    // 1. PRECISIONE: Media dei punteggi di tutti i test
    const scores = testHistory.map(test => test.percentage || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const precision = Math.round(avgScore);


    // 2. CONSISTENZA: 100 - deviazione standard
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, Math.round(100 - standardDeviation));


    // 3. EFFICIENZA: Calcolo avanzato basato su utilizzo reale degli aiuti

    let totalHintsUsed = 0;
    let totalHintsAvailable = 0;
    let totalWordsWithHints = 0;

    
    testHistory.forEach((test, idx) => {
      const hintsUsed = test.hintsUsed || 0;
      const totalWords = test.totalWords || 0;
      
      // Calcolo aiuti massimi disponibili per questo test
      let maxHintsForTest = 0;
      const config = test.config?.hints || test.testConfig?.hints;
      
      if (config?.enabled !== false) {
        if (config?.maxTotal !== undefined && config.maxTotal !== null && config.maxTotal > 0) {
          // Limite globale per il test
          maxHintsForTest = config.maxTotal;
        } else if (config?.maxPerWord !== undefined && config.maxPerWord !== null && config.maxPerWord > 0) {
          // Limite per parola × numero parole
          maxHintsForTest = config.maxPerWord * totalWords;
        } else {
          // Default: 2 aiuti per parola se non specificato diversamente
          maxHintsForTest = 2 * totalWords;
        }
      }
      
      totalHintsUsed += hintsUsed;
      totalHintsAvailable += maxHintsForTest;
      
      if (maxHintsForTest > 0) {
        totalWordsWithHints += totalWords;
      }
      
      const testEfficiency = maxHintsForTest > 0 ? ((maxHintsForTest - hintsUsed) / maxHintsForTest) * 100 : 100;
      
    });

    // Calcolo efficienza globale più accurato
    const globalHintUsagePercentage = totalHintsAvailable > 0 ? (totalHintsUsed / totalHintsAvailable) * 100 : 0;
    const efficiency = Math.max(0, Math.round(100 - globalHintUsagePercentage));


    // 4. VELOCITÀ: Score basato sul tempo medio di risposta
    const validTests = testHistory.filter(test => test.totalTime && test.totalWords);
    let avgResponseTime = 15; // Default fallback
    
    if (validTests.length > 0) {
      const totalTime = validTests.reduce((sum, test) => sum + (test.totalTime || 0), 0);
      const totalWords = validTests.reduce((sum, test) => sum + (test.totalWords || 0), 0);
      avgResponseTime = totalWords > 0 ? (totalTime / totalWords) : 15;
    }

    // Speed score mapping
    let speedScore = 30; // Default extremely slow
    if (avgResponseTime <= 5) speedScore = 100;      // Excellent
    else if (avgResponseTime <= 8) speedScore = 90;   // Very good
    else if (avgResponseTime <= 12) speedScore = 80;  // Good
    else if (avgResponseTime <= 16) speedScore = 70;  // Average
    else if (avgResponseTime <= 20) speedScore = 60;  // Below average
    else if (avgResponseTime <= 25) speedScore = 50;  // Slow
    else if (avgResponseTime <= 30) speedScore = 40;  // Very slow

    const speedRating = speedScore >= 90 ? 'Eccellente' :
                       speedScore >= 80 ? 'Buona' :
                       speedScore >= 70 ? 'Media' :
                       speedScore >= 60 ? 'Sotto la media' :
                       speedScore >= 50 ? 'Lenta' :
                       speedScore >= 40 ? 'Molto lenta' : 'Estremamente lenta';


    // CALCOLO PERFORMANCE INDEX con pesi specifici
    const precisionPoints = Math.round(precision * 0.40);
    const consistencyPoints = Math.round(consistency * 0.25);
    const efficiencyPoints = Math.round(efficiency * 0.20);
    const speedPoints = Math.round(speedScore * 0.15);
    const performanceIndex = precisionPoints + consistencyPoints + efficiencyPoints + speedPoints;


    return {
      performanceIndex,
      precision: { value: precision, points: precisionPoints },
      consistency: { value: consistency, points: consistencyPoints },
      efficiency: { value: efficiency, points: efficiencyPoints },
      speed: { value: speedScore, points: speedPoints },
      breakdown: {
        precisione: { value: precision, weight: 40, contribution: precisionPoints },
        consistenza: { value: consistency, weight: 25, contribution: consistencyPoints },
        efficienza: { value: efficiency, weight: 20, contribution: efficiencyPoints },
        velocita: { value: speedScore, weight: 15, contribution: speedPoints }
      }
    };
  }

  /**
   * Processa i dati dalla collection detailedTestSessions per il grafico Multi-Metrica
   * Estrae i dati reali di velocità, precisione, efficienza e aiuti
   */
  static processChartData(detailedSessions: any[], filterDays?: number): ChartDataPoint[] {
    if (!detailedSessions || detailedSessions.length === 0) {
      return [];
    }

    // Filtra per giorni se specificato
    let filteredSessions = detailedSessions;
    if (filterDays && filterDays > 0) {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - filterDays);
      filteredSessions = detailedSessions.filter(session => 
        session.timestamp && new Date(session.timestamp).getTime() >= filterDate.getTime()
      );
    }

    // Ordina cronologicamente (dal più vecchio al più nuovo)
    const sortedSessions = [...filteredSessions]
      .filter(session => session.timestamp) // Solo sessioni con timestamp valido
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Console logs removed

    const chartData = sortedSessions.map((session, index) => {
      const testDate = new Date(session.timestamp);
      
      // 1. PRECISIONE: Direttamente dalla sessione
      const percentage = session.accuracy || 0;
      
      // 2. AIUTI: Dal campo totalHintsUsed
      const hintsCount = session.totalHintsUsed || 0;
      
      // 3. EFFICIENZA: Precisione - (Aiuti × 2)
      const efficiency = Math.max(0, percentage - (hintsCount * 2));
      
      // 4. VELOCITÀ REALE: DEBUG E CORREZIONE
      let avgTime = 0; // in secondi
      let speedScore = 50; // default
      let speedSource = "default";
      
      // Debug logs removed
      // PRIORITÀ 1: Usa averageTimePerWord se disponibile (CONVERTI DA MS A SECONDI!)
      if (session.averageTimePerWord && session.averageTimePerWord > 0) {
        avgTime = session.averageTimePerWord / 1000; // CONVERTI DA MILLISECONDI A SECONDI!
        speedSource = "averageTimePerWord (convertito da ms)";
      }
      // PRIORITÀ 2: Calcola da totalTime/totalWords
      else if (session.totalTime && session.totalWords && session.totalWords > 0) {
        // Se totalTime è in millisecondi, convertilo
        const timeInSeconds = session.totalTime > 1000 ? session.totalTime / 1000 : session.totalTime;
        avgTime = timeInSeconds / session.totalWords;
        speedSource = "totalTime/totalWords";
      }
      // PRIORITÀ 3: Fallback a speedTrend (già in secondi)
      else if (session.speedTrend && session.speedTrend.length > 0) {
        avgTime = session.speedTrend.reduce((sum: number, s: number) => sum + s, 0) / session.speedTrend.length;
        speedSource = "speedTrend";
      }
      
      // Calcola score velocità con scala realistica e distribuita
      if (avgTime <= 2) {
        speedScore = 100; // 0-2s: Eccezionale
      } else if (avgTime <= 4) {
        speedScore = Math.round(100 - ((avgTime - 2) / 2) * 15); // 100% → 85% (2-4s)
      } else if (avgTime <= 8) {
        speedScore = Math.round(85 - ((avgTime - 4) / 4) * 20); // 85% → 65% (4-8s)
      } else if (avgTime <= 15) {
        speedScore = Math.round(65 - ((avgTime - 8) / 7) * 25); // 65% → 40% (8-15s)
      } else if (avgTime <= 25) {
        speedScore = Math.round(40 - ((avgTime - 15) / 10) * 20); // 40% → 20% (15-25s)
      } else if (avgTime <= 45) {
        speedScore = Math.round(20 - ((avgTime - 25) / 20) * 15); // 20% → 5% (25-45s)
      } else {
        // Oltre 45s: molto lenta (1-5%)
        speedScore = Math.max(1, Math.round(5 - Math.min(avgTime - 45, 50) / 10));
      }
      
      // Debug logs removed

      const dataPoint: ChartDataPoint = {
        test: testDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }), // USA LA DATA, non il numero del test
        date: testDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: testDate.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: testDate,
        percentage,
        efficiency,
        speed: speedScore,
        hintsCount,
        avgTime: Math.round(avgTime * 10) / 10,
        totalWords: session.totalWords || 0
      };

      return dataPoint;
    });

    // Validation logs removed

    return chartData;
  }

  /**
   * Processa i dati da testHistory come fallback per il grafico Multi-Metrica
   */
  static processTestHistoryData(testHistory: any[], filterDays?: number): ChartDataPoint[] {
    if (!testHistory || testHistory.length === 0) {
      return [];
    }

    // Filtra per giorni se specificato
    let filteredTestHistory = testHistory;
    if (filterDays && filterDays > 0) {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - filterDays);
      filteredTestHistory = testHistory.filter(test => 
        test.timestamp && new Date(test.timestamp).getTime() >= filterDate.getTime()
      );
    }

    // Ordina cronologicamente (dal più vecchio al più nuovo)
    const sortedTestHistory = [...filteredTestHistory]
      .filter(test => test.timestamp) // Solo test con timestamp valido
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Console logs removed

    const chartData = sortedTestHistory.map((test, index) => {
      const testDate = new Date(test.timestamp);
      
      // Calculate metrics from testHistory data
      const percentage = test.percentage || 0;
      const hintsCount = test.hintsUsed || 0;
      const efficiency = Math.max(0, percentage - (hintsCount * 2));
      
      // Calculate speed score from avgTimePerWord - DEBUG
      let speedScore = 50;
      let avgTime = test.avgTimePerWord || 0;
      let speedSource = "default";
      
      // Debug logs removed
      
      // PRIORITÀ 1: Usa avgTimePerWord se disponibile (CONVERTI DA MS A SECONDI!)
      if (test.avgTimePerWord && test.avgTimePerWord > 0) {
        avgTime = test.avgTimePerWord / 1000; // CONVERTI DA MILLISECONDI A SECONDI!
        speedSource = "avgTimePerWord (convertito da ms)";
      }
      // PRIORITÀ 2: Calcola da totalTime/totalWords  
      else if (test.totalTime && test.totalWords && test.totalWords > 0) {
        // Se totalTime è in millisecondi, convertilo
        const timeInSeconds = test.totalTime > 1000 ? test.totalTime / 1000 : test.totalTime;
        avgTime = timeInSeconds / test.totalWords;
        speedSource = "totalTime/totalWords";
      }
      
      // Calcola score velocità con scala realistica e distribuita
      if (avgTime <= 2) {
        speedScore = 100; // 0-2s: Eccezionale
      } else if (avgTime <= 4) {
        speedScore = Math.round(100 - ((avgTime - 2) / 2) * 15); // 100% → 85% (2-4s)
      } else if (avgTime <= 8) {
        speedScore = Math.round(85 - ((avgTime - 4) / 4) * 20); // 85% → 65% (4-8s)
      } else if (avgTime <= 15) {
        speedScore = Math.round(65 - ((avgTime - 8) / 7) * 25); // 65% → 40% (8-15s)
      } else if (avgTime <= 25) {
        speedScore = Math.round(40 - ((avgTime - 15) / 10) * 20); // 40% → 20% (15-25s)
      } else if (avgTime <= 45) {
        speedScore = Math.round(20 - ((avgTime - 25) / 20) * 15); // 20% → 5% (25-45s)
      } else {
        // Oltre 45s: molto lenta (1-5%)
        speedScore = Math.max(1, Math.round(5 - Math.min(avgTime - 45, 50) / 10));
      }
      
      // Debug logs removed

      return {
        test: testDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }), // USA LA DATA, non il numero del test
        date: testDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: testDate.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: testDate,
        percentage,
        efficiency,
        speed: speedScore,
        hintsCount,
        avgTime,
        totalWords: test.totalWords || 0
      };
    });
    
    // Validation logs removed
    
    return chartData;
  }

  /**
   * Calcola tutte le analisi e statistiche per la panoramica
   */
  static calculateOverviewAnalytics(multiMetricData: ChartDataPoint[], performanceIndexResult: any) {
    if (multiMetricData.length === 0) {
      return {
        performanceDistribution: [],
        weeklyPattern: [],
        hintsAnalysis: {
          totalHints: 0,
          avgHintsPerTest: 0,
          hintsUsagePercentage: 0
        },
        summaryStats: {
          excellentAndGoodPercentage: 0,
          bestDay: 'N/A',
          mostActiveDay: 'N/A',
          weeklyAverage: 0,
          totalWeeklyTests: 0
        }
      };
    }

    // Performance distribution
    const ranges = { excellent: 0, good: 0, average: 0, poor: 0 };
    multiMetricData.forEach((test, index) => {
      if (test.percentage >= 90) {
        ranges.excellent++;
      } else if (test.percentage >= 75) {
        ranges.good++;
      } else if (test.percentage >= 60) {
        ranges.average++;
      } else {
        ranges.poor++;
      }
    });

    const total = multiMetricData.length;
    
    const performanceDistribution = [
      { 
        name: 'Eccellente', 
        fullName: 'Eccellente (90%+)', 
        value: ranges.excellent, 
        percentage: total > 0 ? Math.round((ranges.excellent / total) * 100) : 0,
        color: '#10B981' 
      },
      { 
        name: 'Buono', 
        fullName: 'Buono (75-89%)', 
        value: ranges.good, 
        percentage: total > 0 ? Math.round((ranges.good / total) * 100) : 0,
        color: '#3B82F6' 
      },
      { 
        name: 'Medio', 
        fullName: 'Medio (60-74%)', 
        value: ranges.average, 
        percentage: total > 0 ? Math.round((ranges.average / total) * 100) : 0,
        color: '#F59E0B' 
      },
      { 
        name: 'Da migliorare', 
        fullName: 'Da migliorare (<60%)', 
        value: ranges.poor, 
        percentage: total > 0 ? Math.round((ranges.poor / total) * 100) : 0,
        color: '#EF4444' 
      }
    ];
    
    const filteredDistribution = performanceDistribution.filter(item => item.value > 0);

    // Weekly pattern analysis
    const pattern: Record<string, { tests: number; totalScore: number }> = {};
    multiMetricData.forEach((test, index) => {
      const date = new Date(test.timestamp);
      const dayOfWeek = date.toLocaleDateString('it-IT', { weekday: 'short' });
      
      if (!pattern[dayOfWeek]) {
        pattern[dayOfWeek] = { tests: 0, totalScore: 0 };
      }
      pattern[dayOfWeek].tests++;
      pattern[dayOfWeek].totalScore += test.percentage;
    });

    const weeklyPattern = Object.entries(pattern).map(([day, data]) => {
      const avgScore = Math.round(data.totalScore / data.tests);
      return {
        day,
        tests: data.tests,
        avgScore,
        frequency: data.tests
      };
    }).sort((a, b) => {
      const dayOrder = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });

    // Hints analysis
    const totalHints = multiMetricData.reduce((sum, t) => {
      return sum + t.hintsCount;
    }, 0);
    
    const avgHintsPerTest = multiMetricData.length > 0 ? 
      Math.round(totalHints / multiMetricData.length * 10) / 10 : 0;
    
    const hintsUsagePercentage = performanceIndexResult ? 
      Math.round(100 - performanceIndexResult.hintEfficiency) : 0;

    // Summary stats
    const excellentAndGoodPercentage = Math.round(
      ((ranges.excellent + ranges.good) / total) * 100
    );
    
    const bestDay = weeklyPattern.length > 0 ? 
      weeklyPattern.reduce((max, day) => {
        return day.avgScore > max.avgScore ? day : max;
      }, weeklyPattern[0])?.day || 'N/A' : 'N/A';
    
    const mostActiveDay = weeklyPattern.length > 0 ? 
      weeklyPattern.reduce((max, day) => {
        return day.tests > max.tests ? day : max;
      }, weeklyPattern[0])?.day || 'N/A' : 'N/A';
    
    const weeklyAverage = weeklyPattern.length > 0 ? 
      Math.round(weeklyPattern.reduce((sum, day) => {
        return sum + day.avgScore;
      }, 0) / weeklyPattern.length) : 0;
    
    const totalWeeklyTests = weeklyPattern.reduce((sum, day) => sum + day.tests, 0);

    const result = {
      performanceDistribution: filteredDistribution,
      weeklyPattern,
      hintsAnalysis: {
        totalHints,
        avgHintsPerTest,
        hintsUsagePercentage
      },
      summaryStats: {
        excellentAndGoodPercentage,
        bestDay,
        mostActiveDay,
        weeklyAverage,
        totalWeeklyTests
      }
    };
    
    return result;
  }
}
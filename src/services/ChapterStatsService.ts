// =====================================================
// 📊 src/services/ChapterStatsService.ts
// =====================================================

import type {
  ChapterAnalysisInput,
  ChapterCalculationResult,
  ChapterStats,
  ChapterAnalysis,
  ChapterOverviewStats,
  ChapterTestEntry,
  ChapterTrendData,
  ChapterBreakdown,
  TestHistoryItem
} from '../types/entities/Test.types';
import type { Word } from '../types/entities/Word.types';
import type { WordPerformanceAnalysis } from '../types/entities/Performance.types';

/**
 * Service per calcoli statistici dei capitoli
 * Si integra con StatsAnalyticsService esistente evitando duplicazioni
 */
export class ChapterStatsService {
  
  /**
   * Calcola analisi completa dei capitoli dai dati DB - LOGICA ORIGINALE RECUPERATA
   * Integra dati da: detailedTestSessions.chapterBreakdown, words, performance
   */
  calculateChapterAnalysis(input: ChapterAnalysisInput): ChapterCalculationResult {
    const { testHistory, words, wordPerformances } = input;
    
    const chapterStats: any = {};
    const chapterFirstTestDate: any = {};
    const chapterDetailedHistory: any = {};

    // 1️⃣ STEP 1: Raccolta dati base per capitolo dalle parole
    words.forEach((word: any) => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!chapterStats[chapter]) {
        chapterStats[chapter] = {
          totalWords: 0,
          learnedWords: 0,
          difficultWords: 0,
          // Performance metrics (will be calculated from tests)
          testsPerformed: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          totalTestsAnswers: 0, // Total questions answered in tests
          estimatedHints: 0 // We'll estimate hints proportionally
        };
      }
      chapterStats[chapter].totalWords++;
      if (word.learned) chapterStats[chapter].learnedWords++;
      if (word.difficult) chapterStats[chapter].difficultWords++;
    });

    // 2️⃣ STEP 2: Analisi test history per capitolo con distribuzione aiuti
    testHistory.forEach((test, testIndex) => {
      const testDate = new Date(test.timestamp);
      
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]: [string, any]) => {
          if (!chapterStats[chapter]) {
            // If chapter exists in tests but not in words, create entry
            chapterStats[chapter] = {
              totalWords: 0, learnedWords: 0, difficultWords: 0,
              testsPerformed: 0, totalCorrect: 0, totalIncorrect: 0,
              totalTestsAnswers: 0, estimatedHints: 0
            };
          }
          
          const chapterStat = chapterStats[chapter];
          
          // Track first test date for ordering
          if (!chapterFirstTestDate[chapter] || testDate < chapterFirstTestDate[chapter]) {
            chapterFirstTestDate[chapter] = testDate;
          }
          
          // Update chapter performance
          chapterStat.testsPerformed++;
          chapterStat.totalCorrect += stats.correctWords || 0;
          chapterStat.totalIncorrect += stats.incorrectWords || 0;
          chapterStat.totalTestsAnswers += (stats.correctWords || 0) + (stats.incorrectWords || 0);
          
          // ⭐ CRITICAL: Distribute hints proportionally across chapters in test
          if (test.hintsUsed > 0 && test.chapterStats) {
            const totalWordsInAllChapters = Object.values(test.chapterStats)
              .reduce((sum: number, chStats: any) => sum + (chStats.correctWords || 0) + (chStats.incorrectWords || 0), 0);
            const wordsInThisChapter = (stats.correctWords || 0) + (stats.incorrectWords || 0);
            
            if (totalWordsInAllChapters > 0) {
              const proportionalHints = (test.hintsUsed * wordsInThisChapter) / totalWordsInAllChapters;
              chapterStat.estimatedHints += proportionalHints;
            }
          }
          
          // Store detailed history for trend analysis
          if (!chapterDetailedHistory[chapter]) {
            chapterDetailedHistory[chapter] = [];
          }
          chapterDetailedHistory[chapter].push({
            date: testDate,
            accuracy: stats.percentage || 0,
            correct: stats.correctWords || 0,
            incorrect: stats.incorrectWords || 0,
            hints: test.hintsUsed || 0, // Total hints in test
            estimatedChapterHints: chapterStat.estimatedHints,
            timestamp: test.timestamp,
            testIndex
          });
        });
      }
    });

    // 3️⃣ STEP 3: Calcolo metriche finali CORRETTE
    const processedData = this.calculateProcessedChapterData(chapterStats, chapterFirstTestDate, chapterDetailedHistory);
    const overviewStats = this.calculateOverviewStats(processedData);
    const topChapters = this.getTopPerformingChapters(processedData);
    const strugglingChapters = this.getStrugglingChapters(processedData);

    const analysis: ChapterAnalysis = {
      processedData,
      chapterDetailedHistory
    };

    return {
      analysis,
      overviewStats,
      topChapters,
      strugglingChapters
    };
  }

  /**
   * Calcola trend data per capitolo specifico (integra con visualizzazioni esistenti)
   */
  calculateChapterTrend(
    chapterName: string, 
    chapterDetailedHistory: Record<string, ChapterTestEntry[]>
  ): ChapterTrendData[] {
    if (!chapterDetailedHistory[chapterName]) {
      return [];
    }

    const history = chapterDetailedHistory[chapterName];
    
    // Ordinamento cronologico (usa stesso algoritmo del componente)
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Prendi ultimi 15 test mantenendo ordine cronologico
    const recentHistory = sortedHistory.slice(-15);
        
    return recentHistory.map((entry, index) => ({
      testNumber: `Test ${index + 1}`,
      date: entry.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      accuracy: entry.accuracy,
      correct: entry.correct,
      incorrect: entry.incorrect,
      fullDate: entry.date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: entry.timestamp
    }));
  }

  /**
   * Calcola dati processati per capitoli - LOGICA ORIGINALE RECUPERATA
   */
  private calculateProcessedChapterData(
    chapterStats: Record<string, any>,
    chapterFirstTestDate: Record<string, Date>,
    chapterDetailedHistory: Record<string, any>
  ): ChapterStats[] {
    return Object.entries(chapterStats).map(([chapter, data]: [string, any]) => {
      // ⭐ FIXED: Use correct denominators
      const totalAnswers = data.totalCorrect + data.totalIncorrect;
      const accuracy = totalAnswers > 0 ? Math.round((data.totalCorrect / totalAnswers) * 100) : 0;
      const hintsPercentage = totalAnswers > 0 ? Math.round((data.estimatedHints / totalAnswers) * 100) : 0;
      const efficiency = Math.max(0, accuracy - hintsPercentage);
      const completionRate = data.totalWords > 0 ? Math.round((data.learnedWords / data.totalWords) * 100) : 0;
      const difficultyRate = data.totalWords > 0 ? Math.round((data.difficultWords / data.totalWords) * 100) : 0;
      const studyProgress = Math.min(100, completionRate + (accuracy / 3));
      
      // Get first test date for ordering
      const firstTestDate = chapterFirstTestDate[chapter] || new Date();
      return {
        chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
        fullChapter: chapter,
        totalWords: data.totalWords,
        learnedWords: data.learnedWords,
        difficultWords: data.difficultWords,
        testsPerformed: data.testsPerformed,
        totalAnswers: totalAnswers,
        accuracy,
        hintsPercentage,
        efficiency,
        completionRate,
        difficultyRate,
        studyProgress,
        estimatedHints: Math.round(data.estimatedHints * 100) / 100,
        firstTestDate,
        detailedHistory: chapterDetailedHistory[chapter] || []
      };
    }).sort((a, b) => {
      // ⭐ FIXED: Sort by first test date (chronological order)
      if (a.testsPerformed === 0 && b.testsPerformed === 0) {
        return a.fullChapter.localeCompare(b.fullChapter);
      }
      if (a.testsPerformed === 0) return 1;
      if (b.testsPerformed === 0) return -1;
      return a.firstTestDate.getTime() - b.firstTestDate.getTime();
    });
  }

  /**
   * Calcola statistiche overview (riusa logiche esistenti)
   */
  private calculateOverviewStats(processedData: ChapterStats[]): ChapterOverviewStats {
    const testedChapters = processedData.filter(c => c.testsPerformed > 0);
    
    return {
      totalChapters: processedData.length,
      testedChapters: testedChapters.length,
      bestEfficiency: testedChapters.length > 0 ? Math.max(...testedChapters.map(c => c.efficiency)) : 0,
      averageCompletion: processedData.length > 0 
        ? Math.round(processedData.reduce((sum, c) => sum + c.completionRate, 0) / processedData.length)
        : 0,
      averageAccuracy: testedChapters.length > 0
        ? Math.round(testedChapters.reduce((sum, c) => sum + c.accuracy, 0) / testedChapters.length)
        : 0
    };
  }

  /**
   * Identifica top chapters per performance
   */
  private getTopPerformingChapters(processedData: ChapterStats[]): ChapterStats[] {
    return processedData
      .filter(c => c.testsPerformed > 0)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);
  }

  /**
   * Identifica chapters che necessitano miglioramento
   */
  private getStrugglingChapters(processedData: ChapterStats[]): ChapterStats[] {
    return processedData
      .filter(c => c.testsPerformed > 2) // Almeno 3 test per considerare struggling
      .sort((a, b) => a.efficiency - b.efficiency)
      .slice(0, 3);
  }
}

export default ChapterStatsService;
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
   * Calcola efficienza di una singola parola basata sui suoi tentativi
   * Logica: Risposta corretta senza aiuti = 100%, con aiuti = ridotta, sbagliata = 0%
   */
  private calculateWordEfficiency(attempts: any[]): number {
    if (!attempts || attempts.length === 0) return 0;
    
    let totalEfficiency = 0;
    let validAttempts = 0;
    
    attempts.forEach(attempt => {
      if (attempt.correct) {
        // Risposta corretta
        if (!attempt.usedHint || (attempt.hintsCount || 0) === 0) {
          // Senza aiuti = efficienza massima
          totalEfficiency += 100;
        } else {
          // Efficienza basata sul numero di hint usati
          const hintsCount = attempt.hintsCount || 1; // Fallback a 1 se usedHint=true ma hintsCount mancante
          
          // Penalità progressiva: -15% per ogni hint
          // 1 hint = 85%, 2 hint = 70%, 3+ hint = 55%
          const penalty = Math.min(hintsCount * 15, 45); // Max 45% penalità
          totalEfficiency += Math.max(100 - penalty, 55); // Min 55% efficienza
        }
      } else {
        // Risposta sbagliata = 0 efficienza
        totalEfficiency += 0;
      }
      validAttempts++;
    });
    
    return validAttempts > 0 ? totalEfficiency / validAttempts : 0;
  }
  
  /**
   * 📊 LOGICA CORRETTA: Calcola analisi capitoli basata su PAROLE come unità base
   * 1. Parte dalle parole per definire i capitoli
   * 2. Analizza performance di ogni parola (dalla collection performance)
   * 3. Aggrega le performance delle parole per capitolo
   */
  calculateChapterAnalysis(input: ChapterAnalysisInput): ChapterCalculationResult {
    const { testHistory, words, wordPerformances, detailedSessions } = input;
    
    // STEP 1: Organizzazione parole per capitolo
    const chapterWords: Record<string, any[]> = {};
    
    words.forEach((word: any) => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!chapterWords[chapter]) {
        chapterWords[chapter] = [];
      }
      chapterWords[chapter].push(word);
    });

    // STEP 2: Analisi performance delle singole parole
    const wordPerformanceMap: Record<string, any> = {};
    
    // Creo mappa delle performance per accesso rapido
    if (wordPerformances) {
      wordPerformances.forEach((perf: any) => {
        wordPerformanceMap[perf.wordId || perf.id] = perf;
      });
    }
    
    // STEP 3: Calcolo metriche per ogni capitolo basate sulle parole
    const chapterStats: Record<string, any> = {};
    const chapterDetailedHistory: Record<string, any> = {};
    
    Object.entries(chapterWords).forEach(([chapter, wordsInChapter]) => {
      
      // Inizializza statistiche capitolo
      chapterStats[chapter] = {
        totalWords: wordsInChapter.length,
        learnedWords: wordsInChapter.filter(w => w.learned).length,
        difficultWords: wordsInChapter.filter(w => w.difficult).length,
        testedWords: 0,
        untestedWords: 0,
        totalAttempts: 0,
        totalCorrectAttempts: 0,
        totalHintsUsed: 0,
        wordEfficiencies: []
      };
      
      // Analizza ogni parola del capitolo
      wordsInChapter.forEach(word => {
        const performance = wordPerformanceMap[word.id];
        
        if (performance && performance.attempts && performance.attempts.length > 0) {
          // PAROLA TESTATA
          chapterStats[chapter].testedWords++;
          const attempts = performance.attempts;
          const correctAttempts = attempts.filter((a: any) => a.correct).length;
          const hintsUsed = attempts.filter((a: any) => a.usedHint).length;
          
          // Conta il numero totale di hint (non solo i tentativi che hanno usato hint)
          const totalHintsCount = attempts.reduce((sum: number, a: any) => sum + (a.hintsCount || 0), 0);
          
          // Calcolo efficienza della singola parola
          const wordEfficiency = this.calculateWordEfficiency(attempts);
          chapterStats[chapter].wordEfficiencies.push(wordEfficiency);
          
          chapterStats[chapter].totalAttempts += attempts.length;
          chapterStats[chapter].totalCorrectAttempts += correctAttempts;
          chapterStats[chapter].totalHintsUsed += totalHintsCount;
          
          // Calcolo precisione parola: % risposte corrette su tentativi
          const wordPrecision = attempts.length > 0 ? (correctAttempts / attempts.length) * 100 : 0;
        } else {
          // PAROLA NON TESTATA
          chapterStats[chapter].untestedWords++;
        }
      });
      
      // CALCOLO METRICHE FINALI DEL CAPITOLO
      const stats = chapterStats[chapter];
      stats.hasTests = stats.testedWords > 0;
      
      // PRECISIONE CORRETTA: Media delle precisioni delle parole testate (non dei singoli tentativi)
      if (stats.testedWords > 0) {
        let totalWordPrecisions = 0;
        wordsInChapter.forEach(word => {
          const performance = wordPerformanceMap[word.id];
          if (performance && performance.attempts && performance.attempts.length > 0) {
            const correctAttempts = performance.attempts.filter((a: any) => a.correct).length;
            const wordPrecision = (correctAttempts / performance.attempts.length) * 100;
            totalWordPrecisions += wordPrecision;
          }
        });
        stats.precision = totalWordPrecisions / stats.testedWords;
      } else {
        stats.precision = 0;
      }
      
      // AIUTI CORRETTI: Percentuale di risposte corrette ottenute CON aiuti
      let correctAnswersWithHints = 0;
      wordsInChapter.forEach(word => {
        const performance = wordPerformanceMap[word.id];
        if (performance && performance.attempts && performance.attempts.length > 0) {
          performance.attempts.forEach((attempt: any) => {
            if (attempt.correct && attempt.usedHint && (attempt.hintsCount || 0) > 0) {
              correctAnswersWithHints++;
            }
          });
        }
      });
      
      stats.hintsPercentage = stats.totalCorrectAttempts > 0 ? 
        (correctAnswersWithHints / stats.totalCorrectAttempts) * 100 : 0;
      
      // EFFICIENZA CORRETTA: Media delle efficienze delle parole
      stats.efficiency = stats.wordEfficiencies.length > 0 
        ? stats.wordEfficiencies.reduce((sum: number, eff: number) => sum + eff, 0) / stats.wordEfficiencies.length
        : 0;
        
      stats.completionRate = (stats.learnedWords / stats.totalWords) * 100;
      stats.untestedPercentage = (stats.untestedWords / stats.totalWords) * 100;
    });

    // STEP 4: Calcolo metriche finali e overview
    const processedData = this.calculateProcessedChapterDataCorrect(chapterStats);
    const overviewStats = this.calculateOverviewStatsCorrect(chapterStats);
    const topChapters = this.getTopPerformingChaptersCorrect(processedData);
    const strugglingChapters = this.getStrugglingChaptersCorrect(processedData);

    const analysis: ChapterAnalysis = {
      processedData,
      chapterDetailedHistory
    };

    // Calcola dati per Analytics Dashboard
    const analytics = this.calculateAdvancedAnalytics(chapterStats, detailedSessions || [], words);
    const sessionStats = this.calculateSessionStats(detailedSessions || []);

    return {
      analysis,
      overviewStats,
      topChapters,
      strugglingChapters,
      analytics,
      sessionStats
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
   * Calcola dati processati basati su performance parole
   */
  private calculateProcessedChapterDataCorrect(chapterStats: Record<string, any>): ChapterStats[] {
    return Object.entries(chapterStats).map(([chapter, stats]: [string, any]) => {
      const displayName = chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`;
      
      return {
        chapter: displayName,
        fullChapter: chapter,
        totalWords: stats.totalWords,
        learnedWords: stats.learnedWords,
        difficultWords: stats.difficultWords,
        hasTests: stats.hasTests,
        testedWords: stats.testedWords,
        untestedWords: stats.untestedWords,
        totalAttempts: stats.totalAttempts,
        accuracy: Math.round(stats.precision),
        hintsPercentage: Math.round(stats.hintsPercentage),
        efficiency: Math.round(stats.efficiency),
        completionRate: Math.round(stats.completionRate),
        untestedPercentage: Math.round(stats.untestedPercentage),
        difficultyRate: Math.round((stats.difficultWords / stats.totalWords) * 100),
        firstTestDate: new Date(), // Per compatibilità
        detailedHistory: [],
        // ⭐ PROPRIETÀ RICHIESTE DAL TIPO ChapterStats
        testsPerformed: stats.hasTests ? 1 : 0, // Approssimazione per compatibilità
        totalAnswers: stats.totalAttempts,
        studyProgress: Math.round(stats.completionRate),
        estimatedHints: stats.totalHintsUsed
      };
    }).sort((a, b) => {
      // Ordina: prima i testati per efficienza, poi i non testati per nome
      if (a.hasTests && !b.hasTests) return -1;
      if (!a.hasTests && b.hasTests) return 1;
      if (a.hasTests && b.hasTests) return b.efficiency - a.efficiency;
      return a.fullChapter.localeCompare(b.fullChapter);
    });
  }

  /**
   * Calcola le 4 metriche richieste con logica corretta
   */
  private calculateOverviewStatsCorrect(chapterStats: Record<string, any>): ChapterOverviewStats {
    const allChapters = Object.values(chapterStats);
    const testedChapters = allChapters.filter((stats: any) => stats.hasTests);
    
    // CAPITOLI TOTALI
    const totalChapters = allChapters.length;
    
    // MIGLIOR EFFICIENZA
    const bestEfficiency = testedChapters.length > 0 
      ? Math.max(...testedChapters.map((c: any) => c.efficiency))
      : 0;
    
    // COMPLETAMENTO MEDIO
    const averageCompletion = allChapters.length > 0
      ? allChapters.reduce((sum: number, c: any) => sum + c.completionRate, 0) / allChapters.length
      : 0;
    
    // CAPITOLI TESTATI
    const testedChaptersCount = testedChapters.length;
    
    return {
      totalChapters,
      testedChapters: testedChaptersCount,
      bestEfficiency: Math.round(bestEfficiency), // ⭐ ARROTONDATO
      averageCompletion: Math.round(averageCompletion), // ⭐ ARROTONDATO
      averageAccuracy: testedChapters.length > 0
        ? Math.round(testedChapters.reduce((sum: number, c: any) => sum + c.precision, 0) / testedChapters.length)
        : 0
    };
  }

  /**
   * Top chapters per efficienza
   */
  private getTopPerformingChaptersCorrect(processedData: ChapterStats[]): ChapterStats[] {
    const topChapters = processedData
      .filter(c => c.hasTests)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);
    
    return topChapters;
  }

  /**
   * 📚 CORRETTO: Chapters che necessitano miglioramento
   */
  private getStrugglingChaptersCorrect(processedData: ChapterStats[]): ChapterStats[] {
    const strugglingChapters = processedData
      .filter(c => c.hasTests && c.testedWords >= 3) // Almeno 3 parole testate
      .sort((a, b) => a.efficiency - b.efficiency)
      .slice(0, 3);
      
    console.log('📚 STRUGGLING CHAPTERS:');
    strugglingChapters.forEach((chapter, index) => {
      console.log(`   ${index + 1}. ${chapter.chapter}: ${chapter.efficiency}% efficienza, ${chapter.untestedPercentage}% non testate`);
    });
    
    return strugglingChapters;
  }

  /**
   * ANALYTICS AVANZATE: Calcola dati per Analytics Dashboard
   */
  private calculateAdvancedAnalytics(chapterStats: Record<string, any>, detailedSessions: any[], words: any[]): any {
    
    // Crea dati processati per ogni capitolo con metriche avanzate 
    const processedData = Object.entries(chapterStats).map(([chapter, stats]: [string, any]) => {
      const displayName = chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`;
      
      // Calcola copertura corretta
      const vocabularyWordsInChapter = words.filter(w => (w.chapter || 'Senza Capitolo') === chapter);
      const coverageRate = vocabularyWordsInChapter.length > 0 ? 
        Math.round((stats.testedWords / vocabularyWordsInChapter.length) * 100) : 0;
      
      // Calcola dati reali da detailedSessions per questo capitolo
      let totalTimeForChapter = 0;
      let thinkingTimeForChapter = 0;
      let attemptsForChapter = 0;
      let correctForChapter = 0;
      let hintsUsedForChapter = 0;
      let attemptsWithHintsForChapter = 0;
      
      detailedSessions.forEach(session => {
        session.words?.forEach((word: any) => {
          if (word.chapter === chapter) {
            attemptsForChapter++;
            if (word.isCorrect) correctForChapter++;
            if (word.totalTime) totalTimeForChapter += word.totalTime;
            if (word.thinkingTime) thinkingTimeForChapter += word.thinkingTime;
            if (word.hintsUsed?.length > 0) {
              attemptsWithHintsForChapter++;
              hintsUsedForChapter += word.hintsUsed.length;
            }
          }
        });
      });
      
      const avgTotalTime = attemptsForChapter > 0 ? Math.round(totalTimeForChapter / attemptsForChapter) : 0;
      const avgThinkingTime = attemptsForChapter > 0 ? Math.round(thinkingTimeForChapter / attemptsForChapter) : 0;
      const precisionRate = attemptsForChapter > 0 ? Math.round((correctForChapter / attemptsForChapter) * 100) : 0;
      const hintDependency = attemptsForChapter > 0 ? Math.round((attemptsWithHintsForChapter / attemptsForChapter) * 100) : 0;
      
      
      return {
        chapter: displayName,
        fullChapter: chapter,
        totalVocabularyWords: vocabularyWordsInChapter.length,
        uniqueWordsTested: stats.testedWords,
        totalAttempts: attemptsForChapter,
        correctAttempts: correctForChapter,
        hintsUsed: hintsUsedForChapter,
        attemptsWithHints: attemptsWithHintsForChapter,
        coverageRate,
        precisionRate,
        hintDependency,
        avgThinkingTime,
        avgTotalTime,
        timeoutRate: 0, // Da calcolare se necessario
        testsPerWord: stats.testedWords > 0 ? Math.round((attemptsForChapter / stats.testedWords) * 10) / 10 : 0,
        difficulty: stats.difficultWords / Math.max(stats.testedWords, 1) * 100,
        hasTests: stats.hasTests
      };
    }).filter(c => c.hasTests);

    return { processedData };
  }

  /**
   * STATISTICHE SESSIONI: Calcola pattern temporali e intensità
   */
  private calculateSessionStats(detailedSessions: any[]): any {
    
    const totalSessions = detailedSessions.length;
    const totalWords = detailedSessions.reduce((sum, session) => sum + (session.words?.length || 0), 0);
    const avgWordsPerSession = totalSessions > 0 ? Math.round(totalWords / totalSessions) : 0;
    
    // Calcola tempo medio per parola dai dati reali
    let totalTimeSpent = 0;
    let wordsWithTime = 0;
    detailedSessions.forEach(session => {
      session.words?.forEach((word: any) => {
        if (word.totalTime) {
          totalTimeSpent += word.totalTime;
          wordsWithTime++;
        }
      });
    });
    const avgTimePerWord = wordsWithTime > 0 ? Math.round(totalTimeSpent / wordsWithTime / 1000) : 0;
    
    // Analisi pattern temporali - FIXED: Usa startedAt come campo timestamp
    const timeSlotCounts: Record<string, number> = {};
    detailedSessions.forEach(session => {
      if (!session.startedAt) return; // Skip sessioni senza timestamp
      
      const localDate = new Date(session.startedAt);
      const hour = localDate.getHours(); // Conversione automatica da UTC a locale
      const timeSlot = hour < 9 ? 'Mattina' : hour < 14 ? 'Pranzo' : hour < 18 ? 'Pomeriggio' : 'Sera';
      timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
    });
    
    const preferredTimeSlot = Object.entries(timeSlotCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';
    
    // Intensità sessioni basata su parole per sessione
    let intensive = 0, medium = 0, light = 0;
    detailedSessions.forEach(session => {
      const wordsCount = session.words?.length || 0;
      if (wordsCount >= 15) intensive++;
      else if (wordsCount >= 8) medium++;
      else light++;
    });
    
    
    return {
      totalSessions,
      avgWordsPerSession,
      avgTimePerWord,
      preferredTimeSlot,
      sessionIntensity: { intensive, medium, light }
    };
  }
}

export default ChapterStatsService;
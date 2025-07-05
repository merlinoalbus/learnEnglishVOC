import { useMemo } from 'react';

export const useStatsData = (testHistory) => {
  const advancedStats = useMemo(() => {
    if (testHistory.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalWordsStudied: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalHints: 0,
        hintsPercentage: 0,
        chaptersAnalyzed: 0,
        chapterPerformance: {}
      };
    }

    const totalTests = testHistory.length;
    const totalCorrect = testHistory.reduce((sum, test) => sum + (test.correctWords || 0), 0);
    const totalIncorrect = testHistory.reduce((sum, test) => sum + (test.incorrectWords || 0), 0);
    const totalHints = testHistory.reduce((sum, test) => sum + (test.hintsUsed || 0), 0);
    const totalWordsStudied = totalCorrect + totalIncorrect;
    const hintsPercentage = totalWordsStudied > 0 ? Math.round((totalHints / totalWordsStudied) * 100) : 0;
    const averageScore = Math.round(testHistory.reduce((sum, test) => sum + (test.percentage || 0), 0) / totalTests);
    const bestScore = Math.max(...testHistory.map(test => test.percentage || 0));
    const worstScore = Math.min(...testHistory.map(test => test.percentage || 100));

    // Performance per capitolo
    const chapterPerformance = {};
    testHistory.forEach(test => {
      if (test.chapterStats) {
        Object.entries(test.chapterStats).forEach(([chapter, stats]) => {
          if (!chapterPerformance[chapter]) {
            chapterPerformance[chapter] = {
              totalTests: 0,
              totalWords: 0,
              totalCorrect: 0,
              totalIncorrect: 0,
              totalHints: 0,
              averagePercentage: 0,
              bestPercentage: 0,
              worstPercentage: 100,
              hintsPercentage: 0
            };
          }
          
          const perf = chapterPerformance[chapter];
          perf.totalTests += 1;
          perf.totalWords += stats.totalWords || 0;
          perf.totalCorrect += stats.correctWords || 0;
          perf.totalIncorrect += stats.incorrectWords || 0;
          perf.totalHints += stats.hintsUsed || 0;
          perf.bestPercentage = Math.max(perf.bestPercentage, stats.percentage || 0);
          perf.worstPercentage = Math.min(perf.worstPercentage, stats.percentage || 100);
        });
      }
    });

    // Calcola percentuali medie per capitolo
    Object.keys(chapterPerformance).forEach(chapter => {
      const perf = chapterPerformance[chapter];
      perf.averagePercentage = perf.totalWords > 0 ? Math.round((perf.totalCorrect / perf.totalWords) * 100) : 0;
      perf.hintsPercentage = perf.totalWords > 0 ? Math.round((perf.totalHints / perf.totalWords) * 100) : 0;
    });

    return {
      totalTests,
      averageScore,
      bestScore,
      worstScore,
      totalWordsStudied,
      totalCorrect,
      totalIncorrect,
      totalHints,
      hintsPercentage,
      chaptersAnalyzed: Object.keys(chapterPerformance).length,
      chapterPerformance
    };
  }, [testHistory]);

  const timelineData = useMemo(() => {
    return [...testHistory].reverse().slice(-20).map((test, index) => ({
      test: `Test ${index + 1}`,
      percentage: test.percentage || 0,
      correct: test.correctWords || 0,
      incorrect: test.incorrectWords || 0,
      hints: test.hintsUsed || 0,
      avgTime: test.avgTimePerWord || 0,
      date: new Date(test.timestamp).toLocaleDateString('it-IT'),
      time: new Date(test.timestamp).toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      chapters: test.testParameters?.selectedChapters?.length || 0,
      difficulty: test.difficulty || 'medium',
      type: test.testType || 'unknown'
    }));
  }, [testHistory]);

  const chapterComparisonData = useMemo(() => {
    return Object.entries(advancedStats.chapterPerformance).map(([chapter, perf]) => ({
      chapter: chapter === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${chapter}`,
      fullChapter: chapter,
      accuracy: perf.averagePercentage,
      tests: perf.totalTests,
      words: perf.totalWords,
      hints: perf.hintsPercentage,
      efficiency: Math.max(0, perf.averagePercentage - perf.hintsPercentage),
      trend: perf.bestPercentage - perf.worstPercentage
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [advancedStats]);

  return {
    advancedStats,
    timelineData,
    chapterComparisonData
  };
};

import type {
  Statistics,
  DailyProgressAggregated,
  MonthlyStatsAggregated,
  CategoryProgressAggregated,
  AggregatedCalculatedStatistics,
  LearningTrendsAnalysis,
  TrendAnalysis,
  WeeklyProgressAnalysis,
  ComprehensiveStatisticsExportData,
  DataSource,
  RecommendedAction,
  MonthlyTrendsAnalysis,
  StreakAnalysisData,
  NextSessionPrediction,
  MasteryTimelinePrediction,
} from "../types/entities/Statistics.types";
import type {
  TestResult,
  TestSession,
  TestAnalytics,
  TestExportData,
  TestSummary,
  PerformanceMetrics as TestPerformanceMetrics,
  TestTimeMetrics,
  TestProgress,
  PerformancePatterns,
  AccuracyPatterns,
  HintStatistics,
  CategoryPerformance,
  ScoreCategory,
  SpeedTrend,
  TestConfig,
  WordSelectionConfig,
  TimingConfig,
  UIConfig,
  ScoringConfig,
  TestInsight,
  TestRecommendation,
  TestFeedback,
  FinalScore,
  HintSystemConfig,
} from "../types/entities/Test.types";
import type { Word, WordCategory } from "../types/entities/Word.types";
import type {
  WordPerformance,
  PerformanceAttempt,
  WordPerformanceAnalysis,
  GlobalPerformanceStats,
} from "../types/entities/Performance.types";

export class StatsAnalyticsService {
  calculateSpeedTrend(testHistory: any[]): SpeedTrend {
    if (testHistory.length < 2) {
      return {
        direction: "stable",
        changePercentage: 0,
        dataPoints: [],
      };
    }

    // Fixed: dataPoints structure to match SpeedTrend interface
    const dataPoints = testHistory.map((test, index) => ({
      questionNumber: index + 1,
      time:
        test.avgTimePerWord ||
        test.totalTime / Math.max(test.totalWords || 1, 1),
    }));

    const firstThird = dataPoints.slice(0, Math.ceil(dataPoints.length * 0.3));
    const lastThird = dataPoints.slice(-Math.ceil(dataPoints.length * 0.3));

    const firstAvg =
      firstThird.reduce((sum, point) => sum + point.time, 0) /
      firstThird.length;
    const lastAvg =
      lastThird.reduce((sum, point) => sum + point.time, 0) / lastThird.length;

    const changePercentage = ((firstAvg - lastAvg) / firstAvg) * 100;

    let direction: "improving" | "stable" | "declining";
    if (changePercentage > 5) direction = "improving";
    else if (changePercentage < -5) direction = "declining";
    else direction = "stable";

    return {
      direction,
      changePercentage: Math.round(changePercentage * 100) / 100,
      dataPoints,
    };
  }

  calculateTestPerformanceMetrics(
    correctAnswers: number,
    totalQuestions: number,
    testHistory: any[]
  ): TestPerformanceMetrics {
    const incorrectAnswers = totalQuestions - correctAnswers;
    const currentAccuracy =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = testHistory.length - 1; i >= 0; i--) {
      const test = testHistory[i];
      const accuracy = test.percentage || 0;

      if (accuracy >= 70) {
        tempStreak++;
        if (i === testHistory.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        if (i === testHistory.length - 1) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }

      bestStreak = Math.max(bestStreak, tempStreak);
    }

    const recentTests = testHistory.slice(-5);
    const avgHintUsage =
      recentTests.length > 0
        ? recentTests.reduce((sum, test) => sum + (test.hintsUsed || 0), 0) /
          recentTests.length
        : 0;

    const efficiency = Math.max(0, currentAccuracy - avgHintUsage * 2);
    const currentScore = Math.round(
      currentAccuracy * 0.6 +
        efficiency * 0.3 +
        Math.min(currentStreak * 5, 20) * 0.1
    );

    return {
      correctAnswers,
      currentAccuracy: Math.round(currentAccuracy * 100) / 100,
      incorrectAnswers,
      currentStreak,
      bestStreak,
      efficiency: Math.round(efficiency * 100) / 100,
      currentScore,
    };
  }

  calculateHintStatistics(
    testHistory: any[],
    totalTime: number
  ): HintStatistics {
    if (testHistory.length === 0) {
      return {
        usage: {
          sentence: 0,
          synonym: 0,
        },
        accuracyAfterHint: {
          sentence: 0,
          synonym: 0,
          overall: 0,
        },
        averageTimeWithHint: {
          sentence: 0,
          synonym: 0,
          overall: 0,
        },
        averageTimeWithoutHint: totalTime,
      };
    }

    const totalHints = testHistory.reduce(
      (sum, test) => sum + (test.hintsUsed || 0),
      0
    );
    const totalQuestions = testHistory.reduce(
      (sum, test) => sum + (test.totalWords || 0),
      0
    );

    const sentenceHints = Math.ceil(totalHints * 0.6);
    const synonymHints = totalHints - sentenceHints;

    const testsWithHints = testHistory.filter(
      (test) => (test.hintsUsed || 0) > 0
    );
    const accuracyAfterHint =
      testsWithHints.length > 0
        ? testsWithHints.reduce(
            (sum, test) => sum + (test.percentage || 0),
            0
          ) / testsWithHints.length
        : 0;

    const testsWithoutHints = testHistory.filter(
      (test) => (test.hintsUsed || 0) === 0
    );

    const averageTimeWithoutHint =
      testsWithoutHints.length > 0
        ? testsWithoutHints.reduce(
            (sum, test) => sum + (test.totalTime || 0),
            0
          ) / testsWithoutHints.length
        : totalTime;

    const averageTimeWithHint =
      testsWithHints.length > 0
        ? testsWithHints.reduce((sum, test) => sum + (test.totalTime || 0), 0) /
          testsWithHints.length
        : totalTime;

    return {
      usage: {
        sentence: sentenceHints,
        synonym: synonymHints,
      },
      accuracyAfterHint: {
        sentence: accuracyAfterHint,
        synonym: accuracyAfterHint * 0.8,
        overall: accuracyAfterHint,
      },
      averageTimeWithHint: {
        sentence: averageTimeWithHint,
        synonym: averageTimeWithHint * 1.2,
        overall: averageTimeWithHint,
      },
      averageTimeWithoutHint,
    };
  }

  generateTestConfig(): TestConfig {
    return {
      mode: "normal",
      hints: {
        enabled: true, // Fixed: added missing property
        maxHintsPerQuestion: 2,
        cooldownBetweenHints: 0, // Fixed: added missing property
        availableHintTypes: ["sentence", "synonym"], // Fixed: added missing property
        hintCosts: {
          sentence: 1,
          synonym: 1,
        },
      } as HintSystemConfig, // Fixed: proper typing
      wordSelection: {
        strategy: "random",
        maxWords: 10,
        excludeLearned: false,
        prioritizeDifficult: false,
        categories: [],
        chapters: [],
        unlearnedOnly: false,
        difficultOnly: false,
        randomOrder: true,
        selectionStrategy: "random",
      } as WordSelectionConfig,
      timing: {
        enableTimer: false,
        warningThreshold: 30,
        autoAdvance: false,
        maxTimePerQuestion: null,
        showTimer: false,
        autoAdvanceDelay: 1000,
        showMeaning: false,
        meaningDisplayDuration: 2000,
        wordTimeLimit: 30000,
      } as TimingConfig,
      ui: {
        theme: "light" as const,
        animations: true,
        showDetailedProgress: true,
        sounds: false,
        showRealTimeStats: true,
      } as UIConfig,
      scoring: {
        correctPoints: 10,
        incorrectPenalty: 0,
        hintPenalty: 2,
        timeBonusEnabled: false,
        accuracyWeight: 0.7,
        speedWeight: 0.3,
        streakBonus: 0.1,
        thresholds: {
          excellent: 90,
          good: 80,
          average: 70,
          poor: 0,
        },
      } as ScoringConfig,
    };
  }

  calculateTestTimeMetrics(testHistory: any[]): TestTimeMetrics {
    if (testHistory.length === 0) {
      return {
        totalTestTime: 0,
        averageQuestionTime: 0,
        fastestQuestion: 0,
        slowestQuestion: 0,
        timeDistribution: {
          byCategory: {},
          byDifficulty: {},
          percentiles: {
            p25: 0,
            p50: 0,
            p75: 0,
            p90: 0,
          },
        },
        speedTrend: {
          direction: "stable",
          changePercentage: 0,
          dataPoints: [],
        },
      };
    }

    const totalTime = testHistory.reduce(
      (sum, test) => sum + (test.totalTime || 0),
      0
    );
    const totalQuestions = testHistory.reduce(
      (sum, test) => sum + (test.totalWords || 0),
      0
    );
    const averageQuestionTime =
      totalQuestions > 0 ? totalTime / totalQuestions : 0;

    const allTimes = testHistory.flatMap((test) =>
      Array(test.totalWords || 0).fill(
        (test.totalTime || 0) / Math.max(test.totalWords || 1, 1)
      )
    );

    const fastestQuestion = allTimes.length > 0 ? Math.min(...allTimes) : 0;
    const slowestQuestion = allTimes.length > 0 ? Math.max(...allTimes) : 0;

    allTimes.sort((a, b) => a - b);
    const len = allTimes.length;

    return {
      totalTestTime: totalTime,
      averageQuestionTime,
      fastestQuestion,
      slowestQuestion,
      timeDistribution: {
        byCategory: {},
        byDifficulty: {},
        percentiles: {
          p25: len > 0 ? allTimes[Math.floor(len * 0.25)] : 0,
          p50: len > 0 ? allTimes[Math.floor(len * 0.5)] : 0,
          p75: len > 0 ? allTimes[Math.floor(len * 0.75)] : 0,
          p90: len > 0 ? allTimes[Math.floor(len * 0.9)] : 0,
        },
      },
      speedTrend: this.calculateSpeedTrend(testHistory),
    };
  }

  generateTestProgress(performance: TestPerformanceMetrics): TestProgress {
    return {
      basic: {
        questionsAnswered:
          performance.correctAnswers + performance.incorrectAnswers,
        questionsRemaining: 0,
        currentQuestion:
          performance.correctAnswers + performance.incorrectAnswers,
        totalQuestions:
          performance.correctAnswers + performance.incorrectAnswers,
        completionPercentage: 100,
      },
      performance,
      predictions: {
        predictedFinalAccuracy: performance.currentAccuracy,
        confidence: 0.8,
        estimatedTimeToCompletion: 0,
        predictedFinalScore: performance.currentScore,
      },
      milestones: [],
    };
  }

  generateFinalScore(performance: TestPerformanceMetrics): FinalScore {
    const category: ScoreCategory =
      performance.currentScore >= 90
        ? "excellent"
        : performance.currentScore >= 80
        ? "good"
        : performance.currentScore >= 70
        ? "average"
        : "poor";

    return {
      total: performance.currentScore,
      category,
      breakdown: {
        accuracy: performance.currentAccuracy,
        speed: 50,
        efficiency: performance.efficiency,
        consistency: 50,
        bonus: 0,
        penalties: 0,
      },
    };
  }

  generateTestFeedback(performance: TestPerformanceMetrics): TestFeedback {
    return {
      tone: performance.currentScore >= 80 ? "celebratory" : "encouraging",
      color: performance.currentScore >= 80 ? "#22c55e" : "#3b82f6",
      wordsToReview: [],
      message: "Great job!",
      icon: "check",
      nextGoals: ["Keep practicing", "Review difficult words"],
    };
  }

  private generateRecommendations(
    accuracy: number,
    hints: number
  ): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];

    if (accuracy < 70) {
      recommendations.push({
        type: "practice",
        priority: "high",
        title: "Focus on Vocabulary Review",
        description:
          "Spend more time reviewing missed words and their meanings",
        expectedBenefit: "Improved accuracy in future tests",
        effort: "medium",
      });
    }

    if (hints > 5) {
      recommendations.push({
        type: "practice",
        priority: "medium",
        title: "Practice Without Hints",
        description:
          "Try completing tests without using hints to build confidence",
        expectedBenefit: "Increased self-reliance and faster response times",
        effort: "easy",
      });
    }

    return recommendations;
  }

  private generateStrengths(accuracy: number, hints: number): string[] {
    const strengths: string[] = [];

    if (accuracy >= 80) strengths.push("High accuracy rate");
    if (hints <= 2) strengths.push("Minimal hint usage");
    if (accuracy >= 90 && hints <= 1)
      strengths.push("Excellent independent performance");

    return strengths;
  }

  private generateImprovements(accuracy: number, hints: number): string[] {
    const improvements: string[] = [];

    if (accuracy < 70) improvements.push("Focus on vocabulary retention");
    if (hints > 5) improvements.push("Reduce dependency on hints");
    if (accuracy < 80) improvements.push("Practice more challenging words");

    return improvements;
  }

  private generateNextSteps(accuracy: number, hints: number): string[] {
    const nextSteps: string[] = [];

    if (accuracy < 70) {
      nextSteps.push("Review incorrect words");
      nextSteps.push("Practice with similar difficulty level");
    } else if (accuracy >= 90) {
      nextSteps.push("Try more challenging vocabulary");
      nextSteps.push("Increase test length");
    } else {
      nextSteps.push("Focus on consistency");
      nextSteps.push("Practice speed and accuracy");
    }

    return nextSteps;
  }

  calculateAggregatedStatistics(
    currentStats: Statistics,
    testHistory: any[],
    wordPerformanceAnalyses: WordPerformanceAnalysis[],
    words: Word[] = []
  ): AggregatedCalculatedStatistics {
    // ⭐ Campi aggregati DERIVATI dalle fonti (single source of truth):
    // testHistory + performance + words. Evita doppio conteggio e si
    // ricalcolano sempre coerenti con i dati reali.
    const dailyProgress = this.buildDailyProgress(
      testHistory,
      wordPerformanceAnalyses
    );
    const streakDays = this.calculateStreakDays(dailyProgress);
    const monthlyStats = this.buildMonthlyStats(
      testHistory,
      wordPerformanceAnalyses,
      words,
      dailyProgress
    );
    const categoriesProgress = this.buildCategoriesProgress(
      words,
      wordPerformanceAnalyses
    );

    const baseStats: Statistics = {
      ...currentStats,
      dailyProgress,
      streakDays,
      monthlyStats,
      categoriesProgress,
    };

    const globalPerformanceStats: GlobalPerformanceStats = {
      statusDistribution: {
        new: 0,
        promising: 0,
        struggling: wordPerformanceAnalyses.filter(
          (w) => w.status === "struggling"
        ).length,
        consolidated: wordPerformanceAnalyses.filter(
          (w) => w.status === "consolidated"
        ).length,
        improving: wordPerformanceAnalyses.filter(
          (w) => w.status === "improving"
        ).length,
        critical: 0,
        inconsistent: 0,
      },
      totalWordsTracked: wordPerformanceAnalyses.length,
      averageResponseTime:
        wordPerformanceAnalyses.reduce((sum, w) => sum + w.avgTime * 1000, 0) /
        Math.max(wordPerformanceAnalyses.length, 1),
      averageAccuracy:
        wordPerformanceAnalyses.reduce((sum, w) => sum + w.accuracy, 0) /
        Math.max(wordPerformanceAnalyses.length, 1),
      averageHintUsage:
        wordPerformanceAnalyses.reduce((sum, w) => sum + w.hintsPercentage, 0) /
        Math.max(wordPerformanceAnalyses.length, 1),
      wordsNeedingWork: wordPerformanceAnalyses.filter(
        (w) => w.status === "struggling" || w.status === "critical"
      ).length,
      masteredWords: wordPerformanceAnalyses.filter((w) => w.mastered).length,
    };

    const learningTrends: LearningTrendsAnalysis =
      this.calculateLearningTrends(testHistory);
    const weeklyTrends: WeeklyProgressAnalysis =
      this.calculateWeeklyProgress(dailyProgress);

    // MonthlyTrendsAnalysis derivata dai monthlyStats reali
    const monthlyTrends: MonthlyTrendsAnalysis =
      this.calculateMonthlyTrends(monthlyStats);

    // StreakAnalysisData con streak reale (corrente + più lungo storico)
    const streakAnalysis: StreakAnalysisData = {
      currentStreak: streakDays,
      longestStreak: this.calculateLongestStreak(dailyProgress),
      streakBreakingPatterns: [],
      streakMotivation: [],
    };

    // Fixed: NextSessionPrediction with correct properties
    const nextSessionPredictions: NextSessionPrediction = {
      optimalTime: new Date(),
      suggestedDuration: 10,
      recommendedWords: [],
      predictedAccuracy: 75, // Fixed: correct property name
      challengeLevel: "medium",
      focusAreas: {
        reviewWords: [],
        newWords: [],
        masteryWords: [],
      },
      // Removed non-existing property: recommendedDifficulty
    };

    // Fixed: MasteryTimelinePrediction with correct properties
    const masteryTimeline: MasteryTimelinePrediction = {
      totalWordsToMaster: 100,
      currentMasteryRate: 0.1,
      estimatedTimeToComplete: 30,
      milestones: [],
      accelerationOpportunities: [],
      // Removed non-existing property: estimatedDaysToMastery
      // Removed non-existing property: progressRate
    };

    return {
      baseStats,
      performanceAnalytics: {
        globalPerformanceStats,
        wordLevelInsights: wordPerformanceAnalyses.slice(0, 10),
        learningTrends,
      },
      temporalAnalytics: {
        weeklyProgress: weeklyTrends,
        monthlyTrends,
        streakAnalysis,
      },
      predictiveAnalytics: {
        nextSessionPredictions,
        masteryTimeline,
        recommendedActions: [], // Fixed: correct property name for PredictiveAnalytics
        // Removed non-existing property: learningAcceleration
      },
      aggregationMetadata: {
        lastCalculated: new Date(), // Fixed: removed calculatedAt
        dataSourcesIncluded: [
          {
            type: "test-results",
            recordCount: testHistory.length,
            dateRange: { start: new Date(), end: new Date() },
            completeness: 100,
            lastUpdated: new Date(),
          } as DataSource,
          {
            type: "word-performance",
            recordCount: wordPerformanceAnalyses.length,
            dateRange: { start: new Date(), end: new Date() },
            completeness: 100,
            lastUpdated: new Date(),
          } as DataSource,
          {
            type: "words",
            recordCount: 0,
            dateRange: { start: new Date(), end: new Date() },
            completeness: 100,
            lastUpdated: new Date(),
          } as DataSource,
        ], // Fixed: proper DataSource objects
        calculationDuration: 100,
        isMigrated: currentStats.migrated || false,
        isProcessing: false,
        forceUpdate: 0,
      },
    };
  }

  private createTrend(
    direction: "improving" | "stable" | "declining"
  ): TrendAnalysis {
    return {
      direction,
      rate: 0,
      confidence: 0.8,
      periodAnalyzed: 30,
      significantChanges: [],
    };
  }

  private calculateLearningTrends(testHistory: any[]): LearningTrendsAnalysis {
    if (testHistory.length < 2) {
      return {
        accuracyTrend: this.createTrend("stable"),
        speedTrend: this.createTrend("stable"),
        vocabularyGrowthTrend: this.createTrend("stable"),
        consistencyTrend: this.createTrend("stable"),
        difficultyHandlingTrend: this.createTrend("stable"),
      };
    }

    const recent = testHistory.slice(-5);
    const older = testHistory.slice(0, 5);

    const recentAccuracy =
      recent.reduce((sum, test) => sum + (test.percentage || 0), 0) /
      recent.length;
    const olderAccuracy =
      older.reduce((sum, test) => sum + (test.percentage || 0), 0) /
      older.length;
    const accuracyChange = recentAccuracy - olderAccuracy;

    return {
      accuracyTrend: this.createTrend(
        accuracyChange > 5
          ? "improving"
          : accuracyChange < -5
          ? "declining"
          : "stable"
      ),
      speedTrend: this.createTrend("stable"),
      vocabularyGrowthTrend: this.createTrend(
        testHistory.length > 5 ? "improving" : "stable"
      ),
      consistencyTrend: this.createTrend("stable"),
      difficultyHandlingTrend: this.createTrend("stable"),
    };
  }

  private calculateWeeklyProgress(
    dailyProgress: Record<string, DailyProgressAggregated>
  ): WeeklyProgressAnalysis {
    const today = new Date();
    const currentWeek: DailyProgressAggregated[] = [];
    const previousWeek: DailyProgressAggregated[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayProgress =
        dailyProgress[dateStr] || this.createEmptyDayProgress(dateStr);
      currentWeek.push(dayProgress);

      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - 7);
      const prevDateStr = prevDate.toISOString().split("T")[0];

      const prevDayProgress =
        dailyProgress[prevDateStr] || this.createEmptyDayProgress(prevDateStr);
      previousWeek.push(prevDayProgress);
    }

    const sum = (
      arr: DailyProgressAggregated[],
      sel: (d: DailyProgressAggregated) => number
    ) => arr.reduce((s, d) => s + sel(d), 0);
    const avgActive = (
      arr: DailyProgressAggregated[],
      sel: (d: DailyProgressAggregated) => number
    ) => {
      const vals = arr
        .filter((d) => d.testActivity.testsCompleted > 0)
        .map(sel);
      return vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0;
    };

    const curAcc = avgActive(currentWeek, (d) => d.testActivity.averageAccuracy);
    const prevAcc = avgActive(previousWeek, (d) => d.testActivity.averageAccuracy);
    const activeDays = currentWeek.filter(
      (d) =>
        d.testActivity.testsCompleted > 0 || d.wordActivity.wordsStudied > 0
    ).length;

    return {
      currentWeek,
      previousWeek,
      weekOverWeekChange: {
        testsChange:
          sum(currentWeek, (d) => d.testActivity.testsCompleted) -
          sum(previousWeek, (d) => d.testActivity.testsCompleted),
        accuracyChange: Math.round((curAcc - prevAcc) * 10) / 10,
        timeChange:
          sum(currentWeek, (d) => d.testActivity.totalTime) -
          sum(previousWeek, (d) => d.testActivity.totalTime),
        wordsStudiedChange:
          sum(currentWeek, (d) => d.wordActivity.wordsStudied) -
          sum(previousWeek, (d) => d.wordActivity.wordsStudied),
      },
      weeklyConsistency: Math.round((activeDays / 7) * 100) / 100,
      recommendedSchedule: [],
    };
  }

  // =====================================================
  // 🧮 AGGREGAZIONI DERIVATE (daily / streak / monthly / categorie)
  // =====================================================

  /** Converte robustamente diversi formati (Date, ISO string, number, Firestore Timestamp). */
  private toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value.toDate === "function") {
      try {
        const d = value.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d : null;
      } catch {
        return null;
      }
    }
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
    if (typeof value._seconds === "number")
      return new Date(value._seconds * 1000);
    return null;
  }

  private dayKey(d: Date): string {
    return d.toISOString().split("T")[0];
  }

  private monthKey(d: Date): string {
    return this.dayKey(d).slice(0, 7);
  }

  private isActiveDay(d: DailyProgressAggregated): boolean {
    return d.testActivity.testsCompleted > 0 || d.wordActivity.wordsStudied > 0;
  }

  /** Aggrega l'attività per giorno (YYYY-MM-DD) da testHistory + performance. */
  private buildDailyProgress(
    testHistory: any[],
    wordPerformanceAnalyses: WordPerformanceAnalysis[]
  ): Record<string, DailyProgressAggregated> {
    const result: Record<string, DailyProgressAggregated> = {};
    const ensure = (key: string) =>
      result[key] || (result[key] = this.createEmptyDayProgress(key));

    // 1) Attività test per giorno
    for (const t of testHistory || []) {
      const d = this.toDate(t?.timestamp);
      if (!d) continue;
      const day = ensure(this.dayKey(d)).testActivity;
      const prev = day.testsCompleted;
      day.testsCompleted = prev + 1;
      const pct = Number(t.percentage) || 0;
      day.averageScore = (day.averageScore * prev + pct) / day.testsCompleted;
      day.averageAccuracy = day.averageScore;
      day.totalTime += Number(t.totalTime) || 0;
      day.hintsUsed += Number(t.hintsUsed) || 0;
    }

    // 2) Attività parole per giorno (dagli attempts della performance)
    const dayWords: Record<string, Set<string>> = {};
    const dayNew: Record<string, number> = {};
    const dayMastered: Record<string, number> = {};
    for (const w of wordPerformanceAnalyses || []) {
      const attempts = w.attempts || [];
      attempts.forEach((a: any, idx: number) => {
        const d = this.toDate(a?.timestamp);
        if (!d) return;
        const key = this.dayKey(d);
        ensure(key);
        (dayWords[key] || (dayWords[key] = new Set())).add(w.id);
        if (idx === 0) dayNew[key] = (dayNew[key] || 0) + 1;
      });
      if (w.mastered && attempts.length) {
        const d = this.toDate(attempts[attempts.length - 1]?.timestamp);
        if (d) {
          const key = this.dayKey(d);
          dayMastered[key] = (dayMastered[key] || 0) + 1;
        }
      }
    }

    Object.keys(result).forEach((key) => {
      const day = result[key];
      const wordsStudied = dayWords[key] ? dayWords[key].size : 0;
      day.testActivity.averageScore = Math.round(day.testActivity.averageScore);
      day.testActivity.averageAccuracy = Math.round(
        day.testActivity.averageAccuracy
      );
      day.wordActivity.wordsStudied = wordsStudied;
      day.wordActivity.newWordsEncountered = dayNew[key] || 0;
      day.wordActivity.wordsMastered = dayMastered[key] || 0;
      day.wordActivity.wordsImproved = 0; // non derivabile in modo affidabile
      const acc = day.testActivity.averageAccuracy;
      const hintsRatio =
        wordsStudied > 0 ? day.testActivity.hintsUsed / wordsStudied : 0;
      day.derivedMetrics.studyEfficiency = Math.round(acc / (1 + hintsRatio));
      day.derivedMetrics.learningVelocity =
        wordsStudied > 0
          ? Math.round((day.wordActivity.wordsMastered / wordsStudied) * 100) /
            100
          : 0;
      day.derivedMetrics.consistency = this.isActiveDay(day) ? 1 : 0;
    });

    return result;
  }

  /** Streak corrente: giorni consecutivi attivi fino a oggi (o a ieri se oggi non ancora attivo). */
  private calculateStreakDays(
    dailyProgress: Record<string, DailyProgressAggregated>
  ): number {
    const active = new Set(
      Object.keys(dailyProgress).filter((k) =>
        this.isActiveDay(dailyProgress[k])
      )
    );
    if (active.size === 0) return 0;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let cursor: Date;
    if (active.has(this.dayKey(today))) cursor = today;
    else if (active.has(this.dayKey(yesterday))) cursor = yesterday;
    else return 0;

    let streak = 0;
    while (active.has(this.dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  /** Streak storico più lungo (run massimo di giorni attivi consecutivi). */
  private calculateLongestStreak(
    dailyProgress: Record<string, DailyProgressAggregated>
  ): number {
    const days = Object.keys(dailyProgress)
      .filter((k) => this.isActiveDay(dailyProgress[k]))
      .sort();
    if (days.length === 0) return 0;

    let longest = 1;
    let current = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round(
        (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) /
          86400000
      );
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  }

  private createEmptyMonth(month: string): MonthlyStatsAggregated {
    return {
      month,
      testMetrics: {
        testsCompleted: 0,
        averageScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        bestStreak: 0,
        testDifficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      },
      vocabularyMetrics: {
        wordsAdded: 0,
        wordsLearned: 0,
        categoriesStudied: 0,
      },
      performanceMetrics: {
        wordsImproved: 0,
        wordsMastered: 0,
        averageAttempts: 0,
        consistencyScore: 0,
      },
      insights: [],
    };
  }

  /** Aggrega l'attività per mese (YYYY-MM). */
  private buildMonthlyStats(
    testHistory: any[],
    wordPerformanceAnalyses: WordPerformanceAnalysis[],
    words: Word[],
    dailyProgress: Record<string, DailyProgressAggregated>
  ): Record<string, MonthlyStatsAggregated> {
    const result: Record<string, MonthlyStatsAggregated> = {};
    const ensure = (key: string) =>
      result[key] || (result[key] = this.createEmptyMonth(key));

    // Test metrics
    for (const t of testHistory || []) {
      const d = this.toDate(t?.timestamp);
      if (!d) continue;
      const tm = ensure(this.monthKey(d)).testMetrics;
      const prev = tm.testsCompleted;
      tm.testsCompleted = prev + 1;
      const pct = Number(t.percentage) || 0;
      tm.averageScore = (tm.averageScore * prev + pct) / tm.testsCompleted;
      tm.averageAccuracy = tm.averageScore;
      tm.totalTimeSpent += Number(t.totalTime) || 0;
      const diff: "easy" | "medium" | "hard" =
        t.difficulty === "easy" || t.difficulty === "hard"
          ? t.difficulty
          : "medium";
      tm.testDifficultyDistribution[diff] =
        (tm.testDifficultyDistribution[diff] || 0) + 1;
    }

    // Vocabulary: parole aggiunte per mese (da createdAt) + categorie studiate
    for (const w of words || []) {
      const created = this.toDate(
        (w as any)?.firestoreMetadata?.createdAt || (w as any)?.createdAt
      );
      if (created) ensure(this.monthKey(created)).vocabularyMetrics.wordsAdded++;
    }

    const wordGroup = new Map<string, string>(
      (words || []).map((w) => [w.id, (w.group as string) || "GENERAL"])
    );
    const monthCategories: Record<string, Set<string>> = {};
    const monthAttempts: Record<string, { words: number; attempts: number }> =
      {};

    for (const w of wordPerformanceAnalyses || []) {
      const attempts = w.attempts || [];
      if (!attempts.length) continue;
      const last = this.toDate(attempts[attempts.length - 1]?.timestamp);
      if (!last) continue;
      const key = this.monthKey(last);
      const m = ensure(key);
      if (w.mastered) m.performanceMetrics.wordsMastered++;
      const ma = monthAttempts[key] || (monthAttempts[key] = { words: 0, attempts: 0 });
      ma.words++;
      ma.attempts += w.totalAttempts || attempts.length;
      (monthCategories[key] || (monthCategories[key] = new Set())).add(
        wordGroup.get(w.id) || "GENERAL"
      );
    }

    // Giorni attivi per mese (per consistencyScore + bestStreak mensile)
    const monthActiveDayKeys: Record<string, string[]> = {};
    Object.keys(dailyProgress).forEach((dk) => {
      if (this.isActiveDay(dailyProgress[dk])) {
        const mk = dk.slice(0, 7);
        (monthActiveDayKeys[mk] || (monthActiveDayKeys[mk] = [])).push(dk);
      }
    });

    Object.keys(result).forEach((key) => {
      const m = result[key];
      m.testMetrics.averageScore = Math.round(m.testMetrics.averageScore);
      m.testMetrics.averageAccuracy = Math.round(m.testMetrics.averageAccuracy);
      const ma = monthAttempts[key];
      m.performanceMetrics.averageAttempts =
        ma && ma.words > 0 ? Math.round((ma.attempts / ma.words) * 10) / 10 : 0;
      m.vocabularyMetrics.categoriesStudied = monthCategories[key]
        ? monthCategories[key].size
        : 0;
      const [y, mm] = key.split("-").map(Number);
      const daysInMonth = new Date(y, mm, 0).getDate();
      const activeDays = monthActiveDayKeys[key] || [];
      m.performanceMetrics.consistencyScore =
        Math.round((activeDays.length / daysInMonth) * 100) / 100;
      m.testMetrics.bestStreak = this.longestConsecutiveRun(activeDays);
    });

    return result;
  }

  /** Run massimo di date consecutive (YYYY-MM-DD) in un elenco. */
  private longestConsecutiveRun(dayKeys: string[]): number {
    const days = [...dayKeys].sort();
    if (days.length === 0) return 0;
    let longest = 1;
    let current = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round(
        (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) /
          86400000
      );
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  }

  private calculateMonthlyTrends(
    monthlyStats: Record<string, MonthlyStatsAggregated>
  ): MonthlyTrendsAnalysis {
    const keys = Object.keys(monthlyStats).sort();
    const last3Months = keys.slice(-3).map((k) => monthlyStats[k]);

    let trendDirection: "improving" | "stable" | "declining" = "stable";
    let accuracyChange = 0;
    let vocabularyGrowthChange = 0;
    let consistencyChange = 0;

    if (last3Months.length >= 2) {
      const a = last3Months[last3Months.length - 1];
      const b = last3Months[last3Months.length - 2];
      accuracyChange =
        a.testMetrics.averageAccuracy - b.testMetrics.averageAccuracy;
      vocabularyGrowthChange =
        a.vocabularyMetrics.wordsAdded - b.vocabularyMetrics.wordsAdded;
      consistencyChange =
        a.performanceMetrics.consistencyScore -
        b.performanceMetrics.consistencyScore;
      trendDirection =
        accuracyChange > 3
          ? "improving"
          : accuracyChange < -3
          ? "declining"
          : "stable";
    }

    return {
      last3Months,
      trendDirection,
      keyMetricChanges: {
        accuracyChange: Math.round(accuracyChange * 10) / 10,
        vocabularyGrowthChange,
        consistencyChange: Math.round(consistencyChange * 100) / 100,
      },
      seasonalPatterns: [],
    };
  }

  /** Progresso per categoria (group) componendo Word[] + performance. */
  private buildCategoriesProgress(
    words: Word[],
    wordPerformanceAnalyses: WordPerformanceAnalysis[]
  ): Record<string, CategoryProgressAggregated> {
    const result: Record<string, CategoryProgressAggregated> = {};
    if (!words || words.length === 0) return result;

    const perfMap = new Map(
      (wordPerformanceAnalyses || []).map((p) => [p.id, p])
    );

    const byCat: Record<string, Word[]> = {};
    for (const w of words) {
      const cat = (w.group as string) || "GENERAL";
      (byCat[cat] || (byCat[cat] = [])).push(w);
    }

    Object.keys(byCat).forEach((cat) => {
      const catWords = byCat[cat];
      const totalWords = catWords.length;
      const learnedWords = catWords.filter((w) => w.learned).length;
      const difficultWords = catWords.filter((w) => w.difficult).length;

      let accSum = 0;
      let accCount = 0;
      let totalAttempts = 0;
      let masteredWords = 0;
      let needsWorkWords = 0;
      // NOTA: i test non portano la categoria per-parola, quindi non è possibile
      // contare i "test che includono la categoria". Approssimiamo con il numero
      // di parole della categoria effettivamente testate (campo non mostrato in UI).
      let testedWords = 0;
      let lastTestedAt: Date | null = null;

      for (const w of catWords) {
        const p = perfMap.get(w.id);
        if (p && p.totalAttempts > 0) {
          accSum += p.accuracy;
          accCount++;
          totalAttempts += p.totalAttempts;
          if (p.mastered) masteredWords++;
          if (p.needsWork) needsWorkWords++;
          testedWords++;
          const la = this.toDate((p.lastAttempt as any)?.timestamp);
          if (la && (!lastTestedAt || la > lastTestedAt)) lastTestedAt = la;
        }
      }

      const averageAccuracy = accCount > 0 ? Math.round(accSum / accCount) : 0;
      const completionPercentage =
        totalWords > 0
          ? Math.min(
              100,
              Math.round(((learnedWords + masteredWords) / totalWords) * 100)
            )
          : 0;

      const masteryLevel: CategoryProgressAggregated["overallProgress"]["masteryLevel"] =
        completionPercentage >= 90
          ? "mastered"
          : completionPercentage >= 70
          ? "proficient"
          : completionPercentage >= 50
          ? "competent"
          : completionPercentage >= 25
          ? "learning"
          : "beginner";

      const recommendedAction: CategoryProgressAggregated["overallProgress"]["recommendedAction"] =
        accCount > 0 && averageAccuracy < 60
          ? "practice"
          : completionPercentage >= 90
          ? "advance"
          : completionPercentage < 50
          ? "review"
          : "maintain";

      result[cat] = {
        category: cat as WordCategory,
        wordStats: { totalWords, learnedWords, difficultWords },
        performanceStats: {
          averageAccuracy,
          totalAttempts,
          masteredWords,
          needsWorkWords,
        },
        testStats: {
          testsIncluding: testedWords, // approssimazione: parole testate nella categoria
          averageTestScore: averageAccuracy,
          lastTestedAt: lastTestedAt || undefined,
        },
        overallProgress: {
          completionPercentage,
          masteryLevel,
          recommendedAction,
        },
        lastUpdated: new Date(),
      };
    });

    return result;
  }

  private createEmptyDayProgress(date: string): DailyProgressAggregated {
    return {
      date,
      testActivity: {
        testsCompleted: 0,
        averageScore: 0,
        totalTime: 0,
        averageAccuracy: 0,
        hintsUsed: 0,
      },
      wordActivity: {
        wordsStudied: 0,
        newWordsEncountered: 0,
        wordsImproved: 0,
        wordsMastered: 0,
      },
      derivedMetrics: {
        studyEfficiency: 0,
        learningVelocity: 0,
        consistency: 0,
      },
    };
  }

  createComprehensiveExportData(
    currentStats: Statistics,
    testHistory: any[],
    wordPerformanceAnalyses: WordPerformanceAnalysis[]
  ): ComprehensiveStatisticsExportData {
    return {
      statistics: currentStats,
      sourceData: {
        testResults: testHistory,
        wordPerformances: wordPerformanceAnalyses,
        words: [],
      },
      exportMetadata: {
        exportDate: new Date(),
        appVersion: "1.0.0",
        dataVersion: "1.0.0",
        userId: "current-user",
        exportType: "complete",
      },
      analytics: this.calculateAggregatedStatistics(
        currentStats,
        testHistory,
        wordPerformanceAnalyses
      ),
      insights: {
        summary: "Performance analysis completed",
        keyAchievements: ["Consistent progress", "Improved accuracy"],
        areasForImprovement: ["Speed optimization", "Hint dependency"],
        recommendations: [
          {
            id: "rec_001", // Fixed: added missing property
            type: "review" as const,
            priority: "high",
            title: "Focus on weak areas",
            description: "Review challenging vocabulary",
            estimatedTime: 30, // Fixed: added missing property
            expectedBenefit: "Improved retention", // Fixed: added missing property
            supportingMetrics: [], // Fixed: added missing property
          },
        ],
      }, // Fixed: proper insights structure
    };
  }
}

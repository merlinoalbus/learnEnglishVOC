import type {
  Statistics,
  DailyProgressAggregated,
  MonthlyStatsAggregated,
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
import type { Word } from "../types/entities/Word.types";
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
    wordPerformanceAnalyses: WordPerformanceAnalysis[]
  ): AggregatedCalculatedStatistics {
    const baseStats: Statistics = {
      ...currentStats,
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
    const weeklyTrends: WeeklyProgressAnalysis = this.calculateWeeklyProgress(
      currentStats.dailyProgress || {}
    );

    // Fixed: MonthlyTrendsAnalysis with proper structure
    const monthlyTrends: MonthlyTrendsAnalysis = {
      last3Months: [],
      trendDirection: "stable",
      keyMetricChanges: {
        accuracyChange: 0,
        vocabularyGrowthChange: 0,
        consistencyChange: 0,
      }, // Fixed: proper structure
      seasonalPatterns: [],
    };

    // Fixed: StreakAnalysisData with only existing properties
    const streakAnalysis: StreakAnalysisData = {
      currentStreak: currentStats.streakDays || 0,
      longestStreak: currentStats.streakDays || 0,
      // Removed non-existing properties: streakHistory, averageStreakLength, bestMonth, consistency
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

    return {
      currentWeek,
      previousWeek,
      weekOverWeekChange: {
        testsChange: 0,
        accuracyChange: 0,
        timeChange: 0,
        wordsStudiedChange: 0,
      },
      weeklyConsistency: 0,
      recommendedSchedule: [],
    };
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

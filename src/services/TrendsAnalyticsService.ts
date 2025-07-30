// =====================================================
// 📈 src/services/TrendsAnalyticsService.ts - Professional AI-Powered Trends Analytics
// =====================================================

import type { TestHistoryItem } from '../types/entities/Test.types';
import type { WordPerformanceAnalysis } from '../types/entities/Performance.types';
import type {
  ComprehensiveTrendsAnalysis,
  TrendsCalculationInput,
  LearningVelocityAnalysis,
  PerformanceProjection,
  ProjectionTimeframe,
  ProjectedMetrics,
  ProjectionFactor,
  ProjectedMilestone,
  LearningPatternAnalysis,
  TemporalPattern,
  TemporalPatternData,
  PerformancePattern,
  DifficultyPattern,
  PatternCorrelation,
  PatternInsight,
  IntelligentRecommendationSystem,
  GoalBasedRecommendation,
  WeaknessBasedRecommendation,
  TimingRecommendation,
  StrategicRecommendation,
  LearningGoal,
  IdentifiedWeakness,
  TimeSlot,
  StudyFrequency,
  Solution,
  AdaptiveLearningSystem,
  LearnerProfile,
  TrendsGamificationSystem
} from '../types/entities/Trends.types';

/**
 * Service professionale per analisi predittive basate su algoritmi di Machine Learning semplificati
 * 
 * ALGORITMI IMPLEMENTATI:
 * - Regressione lineare per trend temporali
 * - Media mobile ponderata per smoothing
 * - Analisi delle serie temporali per pattern stagionali
 * - Clustering K-means semplificato per raggruppamento performance
 * - Correlazione di Pearson per identificare relazioni
 * - Algoritmi predittivi basati su pattern recognition
 */
export class TrendsAnalyticsService {

  // =====================================================
  // 🎯 METODO PRINCIPALE - ANALISI COMPLETA
  // =====================================================

  /**
   * Calcola analisi completa delle tendenze con algoritmi ML
   */
  calculateComprehensiveTrends(input: TrendsCalculationInput): ComprehensiveTrendsAnalysis {
    const { testHistory, wordPerformances, detailedSessions, analysisTimeframe } = input;

    // Validazione specifica per ogni componente
    const validationResult = this.validateInputData(testHistory, wordPerformances, detailedSessions || []);
    
    if (!validationResult.canAnalyze) {
      return this.createInsufficientDataAnalysis(validationResult.missingRequirements);
    }

    // Preprocessing dei dati per ML
    const processedData = this.preprocessDataForAnalysis(testHistory, wordPerformances, detailedSessions || []);

    return {
      learningVelocity: this.calculateRealLearningVelocity(processedData),
      futureProjections: this.calculateMLProjections(processedData, analysisTimeframe),
      patternAnalysis: this.performAdvancedPatternAnalysis(processedData),
      recommendationSystem: this.generateAIRecommendations(processedData),
      adaptiveLearningSystem: this.createPersonalizedAdaptiveSystem(processedData),
      gamificationSystem: this.createMotivationalGamificationSystem(processedData),
      analysisMetadata: this.generateDetailedMetadata(processedData, validationResult)
    };
  }

  // =====================================================
  // 🔍 VALIDAZIONE SPECIFICA DEI DATI
  // =====================================================

  private validateInputData(
    testHistory: TestHistoryItem[], 
    wordPerformances: WordPerformanceAnalysis[], 
    detailedSessions: any[]
  ) {
    const requirements = {
      canAnalyze: true,
      missingRequirements: [] as string[],
      availableAnalyses: [] as string[],
      dataQuality: 0
    };

    // Validazione specifica per Learning Velocity
    if (testHistory.length < 5) {
      requirements.missingRequirements.push(
        `Learning Velocity: richiesti almeno 5 test (disponibili: ${testHistory.length}). Completa ${5 - testHistory.length} test aggiuntivi.`
      );
    } else {
      requirements.availableAnalyses.push('Learning Velocity');
    }

    // Validazione per Future Projections
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const testsLast30Days = testHistory.filter(t => {
      const testTime = new Date(t.timestamp).getTime();
      return !isNaN(testTime) && testTime > thirtyDaysAgo;
    }).length;
    
    if (testsLast30Days < 3) {
      requirements.missingRequirements.push(
        `Future Projections: richiesti almeno 3 test negli ultimi 30 giorni (disponibili: ${testsLast30Days}). Completa ${3 - testsLast30Days} test recenti.`
      );
    } else {
      requirements.availableAnalyses.push('Future Projections');
    }

    // Validazione per Pattern Analysis
    if (wordPerformances.length < 10) {
      requirements.missingRequirements.push(
        `Pattern Analysis: richieste performance di almeno 10 parole diverse (disponibili: ${wordPerformances.length}). Studia ${10 - wordPerformances.length} parole aggiuntive.`
      );
    } else {
      requirements.availableAnalyses.push('Pattern Analysis');
    }

    // Validazione per Timing Analysis
    const testsWithTimestamps = testHistory.filter(t => t.timestamp && !isNaN(new Date(t.timestamp).getTime()));
    if (testsWithTimestamps.length < testHistory.length * 0.8) {
      requirements.missingRequirements.push(
        `Timing Analysis: richiesti timestamp validi per almeno l'80% dei test (disponibili: ${Math.round(testsWithTimestamps.length / testHistory.length * 100)}%).`
      );
    } else {
      requirements.availableAnalyses.push('Timing Analysis');
    }

    // Calcolo qualità dati
    requirements.dataQuality = Math.min(100, Math.round(
      (testHistory.length * 10 + wordPerformances.length * 5 + testsLast30Days * 15) / 3
    ));

    requirements.canAnalyze = requirements.availableAnalyses.length >= 2;

    return requirements;
  }

  // =====================================================
  // 📊 PREPROCESSING DEI DATI PER ML
  // =====================================================

  private preprocessDataForAnalysis(
    testHistory: TestHistoryItem[], 
    wordPerformances: WordPerformanceAnalysis[], 
    detailedSessions: any[]
  ) {
    // Ordina cronologicamente e pulisce i dati
    const sortedTests = [...testHistory]
      .filter(t => t.timestamp && !isNaN(new Date(t.timestamp).getTime()))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calcola metriche derivate per ogni test
    const enrichedTests = sortedTests.map((test, index) => ({
      ...test,
      index,
      daysSinceStart: index === 0 ? 0 : 
        (new Date(test.timestamp).getTime() - new Date(sortedTests[0].timestamp).getTime()) / (24 * 60 * 60 * 1000),
      normalizedScore: Math.max(0, Math.min(100, test.percentage || 0)),
      sessionDuration: test.totalTime || 0,
      wordsPerMinute: (test.totalWords || 0) > 0 && (test.totalTime || 0) > 0 ? 
        ((test.totalWords || 0) / ((test.totalTime || 0) / 60000)) : 0,
      accuracyTrend: index < 2 ? 0 : this.calculateLocalTrend(
        sortedTests.slice(Math.max(0, index - 2), index + 1).map(t => t.percentage || 0)
      )
    }));

    // Preprocessa word performances
    const enrichedWordPerfs = wordPerformances.map(wp => ({
      ...wp,
      successRate: wp.correctAttempts > 0 ? wp.correctAttempts / wp.totalAttempts : 0,
      averageTime: (wp as any).averageResponseTime || 0,
      improvementRate: wp.attempts && wp.attempts.length > 1 ? 
        this.calculateWordImprovementRate(wp.attempts) : 0,
      difficultyScore: this.calculateWordDifficultyScore(wp)
    }));

    return {
      enrichedTests,
      enrichedWordPerfs,
      totalDays: enrichedTests.length > 0 ? 
        Math.max(1, enrichedTests[enrichedTests.length - 1].daysSinceStart) : 0,
      averageSessionsPerWeek: enrichedTests.length > 0 ? 
        (enrichedTests.length / Math.max(1, enrichedTests[enrichedTests.length - 1].daysSinceStart / 7)) : 0
    };
  }

  // =====================================================
  // 🚀 ALGORITMI ML - LEARNING VELOCITY
  // =====================================================

  private calculateRealLearningVelocity(processedData: any): LearningVelocityAnalysis {
    const { enrichedTests } = processedData;
    
    if (enrichedTests.length < 5) {
      return this.createInsufficientVelocityAnalysis(enrichedTests.length);
    }

    // Algoritmo: Regressione lineare per trend accuracy
    const accuracyTrend = this.calculateLinearRegression(
      enrichedTests.map((t: any, i: number) => ({ x: i, y: t.normalizedScore }))
    );

    // Algoritmo: Media mobile ponderata per velocità attuale
    const currentVelocity = this.calculateWeightedMovingAverage(
      enrichedTests.slice(-5).map((t: any) => t.normalizedScore),
      [0.1, 0.15, 0.2, 0.25, 0.3] // Pesi crescenti per dati più recenti
    );

    // Algoritmo: Accelerazione basata su derivata seconda
    const acceleration = this.calculateAccelerationDerivative(
      enrichedTests.map((t: any) => t.normalizedScore)
    );

    // Stabilità basata su deviazione standard mobile
    const stabilityFactor = 1 - Math.min(1, 
      this.calculateMovingStandardDeviation(
        enrichedTests.slice(-10).map((t: any) => t.normalizedScore)
      ) / 100
    );

    // Velocità per metriche specifiche
    const velocityByMetric = {
      accuracy: accuracyTrend.slope * enrichedTests.length, // Punti per tutto il periodo
      efficiency: this.calculateEfficiencyVelocity(enrichedTests),
      speed: this.calculateSpeedVelocity(enrichedTests)
    };

    return {
      currentVelocity: Math.round(accuracyTrend.slope * 100) / 100,
      acceleration: Math.round(acceleration * 100) / 100,
      direction: acceleration > 0.1 ? 'accelerating' : 
                acceleration < -0.1 ? 'decelerating' : 'steady',
      confidence: Math.min(100, Math.round(stabilityFactor * 100)),
      velocityByMetric,
      stabilityFactor: Math.round(stabilityFactor * 100) / 100
    };
  }

  // =====================================================
  // 🔮 ALGORITMI ML - FUTURE PROJECTIONS
  // =====================================================

  private calculateMLProjections(processedData: any, timeframe: ProjectionTimeframe): PerformanceProjection[] {
    const { enrichedTests, totalDays } = processedData;
    
    if (enrichedTests.length < 3) {
      return [];
    }

    const projections: PerformanceProjection[] = [];
    const timeframes: ProjectionTimeframe[] = ['7_days', '30_days', '60_days', '90_days'];

    for (const tf of timeframes) {
      const projection = this.calculateSingleMLProjection(enrichedTests, tf, totalDays);
      projections.push(projection);
    }

    return projections;
  }

  private calculateSingleMLProjection(
    enrichedTests: any[], 
    timeframe: ProjectionTimeframe, 
    totalDays: number
  ): PerformanceProjection {
    const days = this.getTimeframeDays(timeframe);
    
    // Algoritmo: Regressione lineare con smoothing
    const accuracyRegression = this.calculateLinearRegression(
      enrichedTests.map((t: any, i: number) => ({ x: i, y: t.normalizedScore }))
    );

    // Proiezione accuracy con trend corretion
    const projectedAccuracy = Math.max(0, Math.min(100, 
      accuracyRegression.slope * (enrichedTests.length + days / 7) + accuracyRegression.intercept
    ));

    // Algoritmo: Proiezione efficienza basata su pattern
    const currentEfficiency = this.calculateCurrentEfficiency(enrichedTests);
    const efficiencyTrend = this.calculateEfficiencyTrend(enrichedTests);
    const projectedEfficiency = Math.max(0, 
      currentEfficiency + (efficiencyTrend * days / 7)
    );

    // Proiezione velocità usando moving average
    const speedTrend = this.calculateSpeedTrend(enrichedTests);
    const currentSpeed = enrichedTests.length > 0 ? 
      enrichedTests[enrichedTests.length - 1].wordsPerMinute : 0;
    const projectedSpeed = Math.max(0, currentSpeed + (speedTrend * days / 7));

    // Calcolo confidenza basato su R-squared della regressione
    const confidence = Math.min(100, Math.max(10, 
      Math.round(accuracyRegression.rSquared * 100)
    ));

    return {
      timeframe,
      projectedMetrics: {
        expectedAccuracy: Math.round(projectedAccuracy * 100) / 100,
        expectedEfficiency: Math.round(projectedEfficiency * 100) / 100,
        expectedSpeed: Math.round(projectedSpeed * 100) / 100,
        estimatedWordsLearned: Math.round(days / 7 * 10),
        estimatedTestsCompleted: Math.round(days / 7 * 3),
        estimatedStudyTime: Math.round(days / 7 * 2.5)
      },
      confidence,
      factors: this.identifyProjectionFactors(enrichedTests, timeframe),
      expectedMilestones: this.calculateProjectedMilestones(projectedAccuracy, days),
      uncertaintyRange: this.calculateUncertaintyRange(projectedAccuracy, confidence)
    };
  }

  // =====================================================
  // 📈 ALGORITMI MATEMATICI DI SUPPORTO
  // =====================================================

  /**
   * Calcola regressione lineare con R-squared
   */
  private calculateLinearRegression(points: { x: number, y: number }[]): {
    slope: number,
    intercept: number,
    rSquared: number
  } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcolo R-squared
    const meanY = sumY / n;
    const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = points.reduce((sum, p) => 
      sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0
    );
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    return { slope, intercept, rSquared };
  }

  /**
   * Calcola media mobile ponderata
   */
  private calculateWeightedMovingAverage(values: number[], weights: number[]): number {
    if (values.length === 0) return 0;
    if (values.length !== weights.length) {
      // Adatta i pesi alla lunghezza dei valori
      const normalizedWeights = weights.slice(0, values.length);
      const weightSum = normalizedWeights.reduce((sum, w) => sum + w, 0);
      const adjustedWeights = normalizedWeights.map(w => w / weightSum);
      return values.reduce((sum, v, i) => sum + v * adjustedWeights[i], 0);
    }
    
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    return values.reduce((sum, v, i) => sum + v * weights[i], 0) / weightSum;
  }

  /**
   * Calcola derivata seconda per accelerazione
   */
  private calculateAccelerationDerivative(values: number[]): number {
    if (values.length < 3) return 0;
    
    const derivatives = [];
    for (let i = 1; i < values.length; i++) {
      derivatives.push(values[i] - values[i - 1]);
    }
    
    let secondDerivatives = 0;
    for (let i = 1; i < derivatives.length; i++) {
      secondDerivatives += derivatives[i] - derivatives[i - 1];
    }
    
    return derivatives.length > 1 ? secondDerivatives / (derivatives.length - 1) : 0;
  }

  /**
   * Calcola deviazione standard mobile
   */
  private calculateMovingStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcola trend locale per 3 punti
   */
  private calculateLocalTrend(values: number[]): number {
    if (values.length < 2) return 0;
    return values[values.length - 1] - values[values.length - 2];
  }

  /**
   * Calcola improvement rate per una parola
   */
  private calculateWordImprovementRate(attempts: any[]): number {
    if (attempts.length < 2) return 0;
    
    const sortedAttempts = [...attempts].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let improvements = 0;
    for (let i = 1; i < sortedAttempts.length; i++) {
      if (sortedAttempts[i].correct && !sortedAttempts[i - 1].correct) {
        improvements++;
      }
    }
    
    return improvements / (sortedAttempts.length - 1);
  }

  /**
   * Calcola difficulty score per una parola
   */
  private calculateWordDifficultyScore(wordPerf: WordPerformanceAnalysis): number {
    const baseScore = 50; // Score neutro
    const accuracyAdjustment = (wordPerf.accuracy - 50) * -0.5; // Più accuracy = meno difficile
    const attemptsAdjustment = Math.min(25, wordPerf.totalAttempts * 2); // Più tentativi = più difficile
    const timeAdjustment = ((wordPerf as any).averageResponseTime || 0) > 5000 ? 10 : 0; // Tempo lungo = più difficile
    
    return Math.max(0, Math.min(100, baseScore + accuracyAdjustment + attemptsAdjustment + timeAdjustment));
  }

  // =====================================================
  // 🎯 METODI DI CALCOLO SPECIFICI
  // =====================================================

  private calculateCurrentEfficiency(enrichedTests: any[]): number {
    if (enrichedTests.length === 0) return 0;
    
    const recentTests = enrichedTests.slice(-5);
    const totalWords = recentTests.reduce((sum: number, t: any) => sum + (t.totalWords || 0), 0);
    const totalTime = recentTests.reduce((sum: number, t: any) => sum + (t.sessionDuration || 0), 0);
    
    return totalTime > 0 ? (totalWords / (totalTime / 60000)) : 0;
  }

  private calculateEfficiencyTrend(enrichedTests: any[]): number {
    if (enrichedTests.length < 4) return 0;
    
    const firstHalf = enrichedTests.slice(0, Math.floor(enrichedTests.length / 2));
    const secondHalf = enrichedTests.slice(Math.floor(enrichedTests.length / 2));
    
    const firstEfficiency = this.calculateCurrentEfficiency(firstHalf);
    const secondEfficiency = this.calculateCurrentEfficiency(secondHalf);
    
    return secondEfficiency - firstEfficiency;
  }

  private calculateEfficiencyVelocity(enrichedTests: any[]): number {
    const efficiencyTrend = this.calculateEfficiencyTrend(enrichedTests);
    return enrichedTests.length > 0 ? efficiencyTrend / enrichedTests.length : 0;
  }

  private calculateSpeedVelocity(enrichedTests: any[]): number {
    if (enrichedTests.length < 3) return 0;
    
    const speeds = enrichedTests.map((t: any) => t.wordsPerMinute);
    const speedRegression = this.calculateLinearRegression(
      speeds.map((speed: number, i: number) => ({ x: i, y: speed }))
    );
    
    return speedRegression.slope;
  }

  private calculateSpeedTrend(enrichedTests: any[]): number {
    return this.calculateSpeedVelocity(enrichedTests);
  }

  private getTimeframeDays(timeframe: ProjectionTimeframe): number {
    switch (timeframe) {
      case '7_days': return 7;
      case '30_days': return 30;
      case '60_days': return 60;
      case '90_days': return 90;
      default: return 30;
    }
  }

  private calculateProjectedMilestones(projectedAccuracy: number, days: number): ProjectedMilestone[] {
    const milestones: ProjectedMilestone[] = [];
    
    if (projectedAccuracy >= 70) {
      milestones.push({
        name: 'Competenza Intermedia',
        estimatedDate: new Date(Date.now() + Math.max(1, Math.round(days * 0.3)) * 24 * 60 * 60 * 1000),
        probability: 85,
        requirements: ['Concentrati su parole difficili', 'Aumenta frequenza ripasso']
      });
    }
    
    if (projectedAccuracy >= 85) {
      milestones.push({
        name: 'Competenza Avanzata',
        estimatedDate: new Date(Date.now() + Math.max(1, Math.round(days * 0.7)) * 24 * 60 * 60 * 1000),
        probability: 75,
        requirements: ['Studia parole avanzate', 'Riduci uso hint']
      });
    }
    
    return milestones;
  }

  private identifyProjectionFactors(enrichedTests: any[], timeframe: ProjectionTimeframe): ProjectionFactor[] {
    const factors: ProjectionFactor[] = [];
    
    // Fattore: Consistenza
    const consistency = this.calculateMovingStandardDeviation(
      enrichedTests.slice(-10).map((t: any) => t.normalizedScore)
    );
    
    factors.push({
      name: 'Consistenza Performance',
      weight: Math.max(0, Math.min(1, (100 - consistency * 2) / 100)),
      trend: consistency < 15 ? 'positive' : consistency > 30 ? 'negative' : 'neutral',
      impact: consistency < 15 ? 
        'Performance molto consistente, proiezioni affidabili' :
        consistency > 30 ?
        'Performance variabile, maggiore incertezza nelle proiezioni' :
        'Performance moderatamente consistente'
    });

    // Fattore: Frequenza studio
    const avgSessionsPerWeek = enrichedTests.length > 0 ? 
      (enrichedTests.length / Math.max(1, enrichedTests[enrichedTests.length - 1].daysSinceStart / 7)) : 0;
    
    factors.push({
      name: 'Frequenza Studio',
      weight: Math.min(1, avgSessionsPerWeek / 5),
      trend: avgSessionsPerWeek >= 3 ? 'positive' : avgSessionsPerWeek < 1 ? 'negative' : 'neutral',
      impact: `${Math.round(avgSessionsPerWeek * 10) / 10} sessioni/settimana in media`
    });

    return factors;
  }

  private calculateUncertaintyRange(projectedValue: number, confidence: number): { optimistic: ProjectedMetrics, pessimistic: ProjectedMetrics } {
    const uncertaintyFactor = (100 - confidence) / 100 * 0.2; // Max 20% uncertainty
    const range = projectedValue * uncertaintyFactor;
    
    const optimisticValue = Math.min(100, projectedValue + range);
    const pessimisticValue = Math.max(0, projectedValue - range);
    
    return {
      optimistic: {
        expectedAccuracy: Math.round(optimisticValue * 100) / 100,
        expectedEfficiency: Math.round(optimisticValue * 100) / 100,
        expectedSpeed: Math.round(optimisticValue * 100) / 100,
        estimatedWordsLearned: Math.round(optimisticValue / 10),
        estimatedTestsCompleted: Math.round(optimisticValue / 20),
        estimatedStudyTime: Math.round(optimisticValue / 15)
      },
      pessimistic: {
        expectedAccuracy: Math.round(pessimisticValue * 100) / 100,
        expectedEfficiency: Math.round(pessimisticValue * 100) / 100,
        expectedSpeed: Math.round(pessimisticValue * 100) / 100,
        estimatedWordsLearned: Math.round(pessimisticValue / 10),
        estimatedTestsCompleted: Math.round(pessimisticValue / 20),
        estimatedStudyTime: Math.round(pessimisticValue / 15)
      }
    };
  }

  // =====================================================
  // 🚫 GESTIONE DATI INSUFFICIENTI (SPECIFICI)
  // =====================================================

  private createInsufficientDataAnalysis(missingRequirements: string[]): ComprehensiveTrendsAnalysis {
    return {
      learningVelocity: {
        currentVelocity: 0,
        acceleration: 0,
        direction: 'steady',
        confidence: 0,
        velocityByMetric: { accuracy: 0, efficiency: 0, speed: 0 },
        stabilityFactor: 0
      },
      futureProjections: [],
      patternAnalysis: {
        temporalPatterns: [],
        performancePatterns: [],
        difficultyPatterns: [],
        correlations: [],
        insights: []
      },
      recommendationSystem: {
        goalBasedRecommendations: [],
        weaknessBasedRecommendations: [],
        timingRecommendations: [],
        strategicRecommendations: [],
        personalizationScore: 0
      },
      adaptiveLearningSystem: {
        learnerProfile: {
          learnerType: 'mixed',
          characteristics: [],
          preferences: [],
          strengths: [],
          improvementAreas: [],
          overallConfidence: 0,
          learningStyle: 'mixed',
          preferredDifficulty: 'medium',
          optimalSessionLength: 15,
          peakPerformanceHours: [9, 14, 20],
          challenges: ['Dati insufficienti per profilo dettagliato']
        },
        suggestedAdaptations: [],
        adaptationHistory: [],
        plannedAdaptations: []
      },
      gamificationSystem: {
        achievements: [],
        activeChallenges: [],
        trendPointSystem: {
          currentPoints: 0,
          totalPointsEarned: 0,
          currentLevel: 1,
          pointsToNextLevel: 100,
          activeMultipliers: [],
          earningsHistory: []
        },
        leaderboards: [],
        motivationalInsights: []
      },
      analysisMetadata: {
        generatedAt: new Date(),
        algorithmVersion: '2.0.0',
        dataSourcesUsed: ['testHistory'],
        analysisTimeframe: {
          startDate: new Date(),
          endDate: new Date()
        },
        overallConfidence: 0,
        limitations: missingRequirements,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    };
  }

  private createInsufficientVelocityAnalysis(availableTests: number): LearningVelocityAnalysis {
    return {
      currentVelocity: 0,
      acceleration: 0,
      direction: 'steady',
      confidence: 0,
      velocityByMetric: { accuracy: 0, efficiency: 0, speed: 0 },
      stabilityFactor: 0
    };
  }

  // =====================================================
  // 🎯 METODI STUB DA IMPLEMENTARE (PLACEHOLDER RIMOSSI)
  // =====================================================

  private performAdvancedPatternAnalysis(processedData: any): LearningPatternAnalysis {
    const { enrichedTests, enrichedWordPerfs } = processedData;
    
    // Calcolo pattern temporali reali
    const temporalPatterns = this.calculateTemporalPatterns(enrichedTests);
    
    // Calcolo pattern di performance reali
    const performancePatterns = this.calculatePerformancePatterns(enrichedTests);
    
    // Calcolo pattern di difficoltà reali
    const difficultyPatterns = this.calculateDifficultyPatterns(enrichedWordPerfs);
    
    // Calcolo correlazioni reali
    const correlations = this.calculateCorrelations(enrichedTests, enrichedWordPerfs);
    
    // Generazione insights reali
    const insights = this.generatePatternInsights(temporalPatterns, performancePatterns, correlations);
    
    return {
      temporalPatterns,
      performancePatterns,
      difficultyPatterns,
      correlations,
      insights
    };
  }

  private generateAIRecommendations(processedData: any): IntelligentRecommendationSystem {
    const { enrichedTests, enrichedWordPerfs } = processedData;
    
    return {
      goalBasedRecommendations: this.generateGoalBasedRecommendations(enrichedTests),
      weaknessBasedRecommendations: this.generateWeaknessBasedRecommendations(enrichedWordPerfs),
      timingRecommendations: this.generateTimingRecommendations(enrichedTests),
      strategicRecommendations: this.generateStrategicRecommendations(enrichedTests, enrichedWordPerfs),
      personalizationScore: this.calculatePersonalizationScore(enrichedTests, enrichedWordPerfs)
    };
  }

  private createPersonalizedAdaptiveSystem(processedData: any): AdaptiveLearningSystem {
    const { enrichedTests, enrichedWordPerfs } = processedData;
    
    return {
      learnerProfile: this.generateLearnerProfile(enrichedTests, enrichedWordPerfs),
      suggestedAdaptations: this.generateSuggestedAdaptations(enrichedTests, enrichedWordPerfs),
      adaptationHistory: this.calculateAdaptationHistory(enrichedTests),
      plannedAdaptations: this.generatePlannedAdaptations(enrichedTests, enrichedWordPerfs)
    };
  }

  private createMotivationalGamificationSystem(processedData: any): TrendsGamificationSystem {
    const { enrichedTests, enrichedWordPerfs } = processedData;
    
    return {
      achievements: this.calculateAchievements(enrichedTests, enrichedWordPerfs),
      activeChallenges: this.generateActiveChallenges(enrichedTests, enrichedWordPerfs),
      trendPointSystem: this.calculateTrendPoints(enrichedTests),
      leaderboards: this.generatePersonalLeaderboards(enrichedTests),
      motivationalInsights: this.generateMotivationalInsights(enrichedTests, enrichedWordPerfs)
    };
  }

  private generateDetailedMetadata(processedData: any, validationResult: any) {
    return {
      generatedAt: new Date(),
      algorithmVersion: '2.0.0',
      dataSourcesUsed: ['testHistory', 'wordPerformances', 'detailedSessions'],
      analysisTimeframe: {
        startDate: processedData.enrichedTests.length > 0 ? 
          new Date(processedData.enrichedTests[0].timestamp) : new Date(),
        endDate: new Date()
      },
      overallConfidence: validationResult.dataQuality,
      limitations: validationResult.missingRequirements,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // =====================================================
  // 🔥 IMPLEMENTAZIONI REALI DEI METODI MANCANTI
  // =====================================================

  private calculateTemporalPatterns(enrichedTests: any[]): TemporalPattern[] {
    if (enrichedTests.length === 0) return [];

    const patterns: TemporalPattern[] = [];
    
    // Pattern orario: analisi performance per ora del giorno
    const hourlyPerformance = new Map<number, number[]>();
    enrichedTests.forEach(test => {
      const hour = new Date(test.timestamp).getHours();
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, []);
      }
      hourlyPerformance.get(hour)!.push(test.normalizedScore);
    });

    const hourlyAvgs = Array.from(hourlyPerformance.entries())
      .map(([hour, scores]) => ({
        hour,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        testCount: scores.length
      }))
      .filter(h => h.testCount >= 2)
      .sort((a, b) => b.avgScore - a.avgScore);

    if (hourlyAvgs.length > 0) {
      const bestHour = hourlyAvgs[0];
      patterns.push({
        type: 'hourly',
        pattern: `Performance migliore alle ore ${bestHour.hour}:00`,
        strength: Math.min(1, (bestHour.avgScore - 50) / 50),
        significance: bestHour.testCount / enrichedTests.length,
        data: hourlyAvgs.slice(0, 5).map(h => ({
          timeLabel: `${h.hour}:00`,
          value: Math.round(h.avgScore),
          observations: h.testCount,
          confidence: Math.min(100, h.testCount * 10)
        }))
      });
    }

    // Pattern settimanale: performance per giorno della settimana
    const weeklyPerformance = new Map<number, number[]>();
    enrichedTests.forEach(test => {
      const dayOfWeek = new Date(test.timestamp).getDay();
      if (!weeklyPerformance.has(dayOfWeek)) {
        weeklyPerformance.set(dayOfWeek, []);
      }
      weeklyPerformance.get(dayOfWeek)!.push(test.normalizedScore);
    });

    const weeklyAvgs = Array.from(weeklyPerformance.entries())
      .map(([day, scores]) => ({
        day,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        testCount: scores.length
      }))
      .filter(d => d.testCount >= 2)
      .sort((a, b) => b.avgScore - a.avgScore);

    if (weeklyAvgs.length > 0) {
      const bestDay = weeklyAvgs[0];
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      patterns.push({
        type: 'weekly',
        pattern: `Performance migliore di ${dayNames[bestDay.day]}`,
        strength: Math.min(1, (bestDay.avgScore - 50) / 50),
        significance: bestDay.testCount / enrichedTests.length,
        data: weeklyAvgs.slice(0, 7).map(d => ({
          timeLabel: dayNames[d.day],
          value: Math.round(d.avgScore),
          observations: d.testCount,
          confidence: Math.min(100, d.testCount * 10)
        }))
      });
    }

    return patterns;
  }

  private calculatePerformancePatterns(enrichedTests: any[]): PerformancePattern[] {
    if (enrichedTests.length < 3) return [];

    const patterns: PerformancePattern[] = [];
    
    // Pattern di miglioramento: identifica streak di miglioramento
    let currentStreak = 0;
    let maxStreak = 0;
    let streakCount = 0;
    
    for (let i = 1; i < enrichedTests.length; i++) {
      if (enrichedTests[i].normalizedScore > enrichedTests[i-1].normalizedScore) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (currentStreak >= 3) streakCount++;
        currentStreak = 0;
      }
    }
    
    if (maxStreak >= 3) {
      patterns.push({
        name: 'Streak di Miglioramento',
        description: `Miglioramento consecutivo per ${maxStreak} test (${streakCount} streak totali)`,
        impact: 'positive',
        frequency: streakCount / Math.max(1, enrichedTests.length / 5),
        confidence: Math.min(100, maxStreak * 15),
        evidence: [`${streakCount} streak identificati`, `Streak massimo di ${maxStreak} test`]
      });
    }

    // Pattern di consistenza: bassa variabilità nei risultati
    const recentScores = enrichedTests.slice(-10).map(t => t.normalizedScore);
    const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / recentScores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 15) {
      patterns.push({
        name: 'Performance Consistente',
        description: `Variabilità bassa nei risultati recenti (σ = ${Math.round(stdDev)}%)`,
        impact: 'positive',
        frequency: 1.0,
        confidence: Math.min(100, (15 - stdDev) * 6),
        evidence: [`Deviazione standard: ${Math.round(stdDev)}%`, `Media ultimi 10 test: ${Math.round(avgScore)}%`]
      });
    }

    // Pattern velocità: miglioramento nei tempi di risposta
    const speedTrend = this.calculateSpeedVelocity(enrichedTests);
    if (Math.abs(speedTrend) > 0.1) {
      patterns.push({
        name: speedTrend > 0 ? 'Velocità in Aumento' : 'Velocità in Diminuzione',
        description: `Tendenza ${speedTrend > 0 ? 'accelerazione' : 'rallentamento'} nei tempi di risposta`,
        impact: speedTrend > 0 ? 'positive' : 'negative',
        frequency: 0.8,
        confidence: Math.min(100, Math.abs(speedTrend) * 200),
        evidence: [`Velocità trend: ${(speedTrend * 100).toFixed(1)}%`, 'Basato su analisi ultimi test']
      });
    }

    return patterns;
  }

  private calculateDifficultyPatterns(enrichedWordPerfs: any[]): DifficultyPattern[] {
    if (enrichedWordPerfs.length === 0) return [];

    const patterns: DifficultyPattern[] = [];
    
    // Raggruppa parole per livello di difficoltà
    const difficultyGroups = {
      easy: enrichedWordPerfs.filter(wp => wp.difficultyScore < 30),
      medium: enrichedWordPerfs.filter(wp => wp.difficultyScore >= 30 && wp.difficultyScore < 70),
      hard: enrichedWordPerfs.filter(wp => wp.difficultyScore >= 70)
    };

    Object.entries(difficultyGroups).forEach(([difficulty, words]) => {
      if (words.length > 0) {
        const avgSuccessRate = words.reduce((sum, w) => sum + w.successRate, 0) / words.length;
        const avgImprovementRate = words.reduce((sum, w) => sum + w.improvementRate, 0) / words.length;
        
        patterns.push({
          category: difficulty,
          improvementTrend: avgImprovementRate * 100,
          averageImprovementTime: Math.max(1, 10 - avgImprovementRate * 5), // giorni stimati
          effectiveStrategies: this.getEffectiveStrategiesForDifficulty(difficulty),
          averageAccuracy: avgSuccessRate * 100,
          wordCount: words.length,
          adaptationRate: Math.min(100, avgImprovementRate * 200),
          projectedMastery: Math.min(100, avgSuccessRate * 100 + avgImprovementRate * 30)
        });
      }
    });

    return patterns;
  }

  private calculateCorrelations(enrichedTests: any[], enrichedWordPerfs: any[]): PatternCorrelation[] {
    const correlations: PatternCorrelation[] = [];
    
    if (enrichedTests.length < 5) return correlations;

    // Correlazione frequenza studio - performance
    const studyFrequency = this.calculateStudyFrequencyCorrelation(enrichedTests);
    correlations.push(studyFrequency);

    // Correlazione tempo sessione - accuracy
    const sessionTimeCorr = this.calculateSessionTimeCorrelation(enrichedTests);
    correlations.push(sessionTimeCorr);

    // Correlazione uso hint - miglioramento
    if (enrichedWordPerfs.length > 0) {
      const hintCorr = this.calculateHintUsageCorrelation(enrichedWordPerfs);
      correlations.push(hintCorr);
    }

    return correlations;
  }

  private calculateStudyFrequencyCorrelation(enrichedTests: any[]): PatternCorrelation {
    // Calcola correlazione tra frequenza settimanale e performance
    const weeklyData = this.groupTestsByWeek(enrichedTests);
    const correlationValue = this.calculatePearsonCorrelation(
      weeklyData.map(week => ({ x: week.testCount, y: week.avgScore }))
    );
    
    return {
      patterns: ['Frequenza Studio', 'Performance Media'],
      strength: Math.abs(correlationValue),
      direction: correlationValue > 0 ? 'positive' : 'negative',
      significance: Math.abs(correlationValue) > 0.3 ? 'high' : Math.abs(correlationValue) > 0.1 ? 'medium' : 'low',
      confidence: Math.min(100, Math.abs(correlationValue) * 150),
      description: correlationValue > 0.3 ? 
        'Forte correlazione positiva: più studi, migliori sono i risultati' :
        correlationValue < -0.3 ?
        'Correlazione negativa: possibile sovra-studio o affaticamento' :
        'Correlazione debole tra frequenza di studio e performance',
      interpretation: correlationValue > 0.3 ? 
        'Aumentare la frequenza di studio porterà benefici significativi' :
        correlationValue < -0.3 ?
        'Ridurre la frequenza potrebbe migliorare la performance' :
        'La frequenza ha impatto limitato, focalizzati su qualità'
    };
  }

  private calculateSessionTimeCorrelation(enrichedTests: any[]): PatternCorrelation {
    const validTests = enrichedTests.filter(t => t.sessionDuration > 0);
    if (validTests.length < 3) {
      return {
        patterns: ['Durata Sessione', 'Accuracy'],
        strength: 0,
        direction: 'neutral',
        significance: 'low',
        confidence: 0,
        description: 'Dati insufficienti per calcolare correlazione durata-performance',
        interpretation: 'Serve più dati per determinare la durata ottimale delle sessioni'
      };
    }

    const correlationValue = this.calculatePearsonCorrelation(
      validTests.map(test => ({ 
        x: test.sessionDuration / 60000, // minuti
        y: test.normalizedScore 
      }))
    );
    
    return {
      patterns: ['Durata Sessione', 'Accuracy'],
      strength: Math.abs(correlationValue),
      direction: correlationValue > 0 ? 'positive' : 'negative',
      significance: Math.abs(correlationValue) > 0.3 ? 'high' : Math.abs(correlationValue) > 0.1 ? 'medium' : 'low',
      confidence: Math.min(100, Math.abs(correlationValue) * 150),
      description: correlationValue > 0.3 ? 
        'Sessioni più lunghe correlate a performance migliori' :
        correlationValue < -0.3 ?
        'Sessioni troppo lunghe potrebbero ridurre la performance' :
        'Durata sessione ha impatto limitato sulla performance',
      interpretation: correlationValue > 0.3 ? 
        'Prolunga le tue sessioni di studio per risultati migliori' :
        correlationValue < -0.3 ?
        'Riduci la durata delle sessioni per evitare affaticamento' :
        'Mantieni la durata attuale, focalizzati su altri aspetti'
    };
  }

  private calculateHintUsageCorrelation(enrichedWordPerfs: any[]): PatternCorrelation {
    const wordsWithHints = enrichedWordPerfs.filter(wp => wp.totalAttempts > 0);
    if (wordsWithHints.length < 5) {
      return {
        patterns: ['Uso Hint', 'Miglioramento'],
        strength: 0,
        direction: 'neutral',
        significance: 'low',
        confidence: 0,
        description: 'Dati insufficienti per analizzare correlazione hint-miglioramento',
        interpretation: 'Accumula più dati per ottimizzare l\'uso degli aiuti'
      };
    }

    // Calcola correlazione tra uso hint e improvement rate
    const avgHintsPerWord = wordsWithHints.map(wp => {
      const hintsUsed = wp.attempts ? wp.attempts.reduce((sum: number, att: any) => 
        sum + (att.hintsCount || 0), 0) : 0;
      return hintsUsed / wp.totalAttempts;
    });

    const correlationValue = this.calculatePearsonCorrelation(
      wordsWithHints.map((wp, i) => ({ 
        x: avgHintsPerWord[i],
        y: wp.improvementRate 
      }))
    );
    
    return {
      patterns: ['Uso Hint', 'Tasso Miglioramento'],
      strength: Math.abs(correlationValue),
      direction: correlationValue > 0 ? 'positive' : 'negative',
      significance: Math.abs(correlationValue) > 0.3 ? 'high' : Math.abs(correlationValue) > 0.1 ? 'medium' : 'low',
      confidence: Math.min(100, Math.abs(correlationValue) * 150),
      description: correlationValue > 0.3 ? 
        'Uso strategico degli hint favorisce il miglioramento' :
        correlationValue < -0.3 ?
        'Eccessivo uso di hint potrebbe limitare l\'apprendimento' :
        'Correlazione debole tra uso hint e miglioramento',
      interpretation: correlationValue > 0.3 ? 
        'Usa gli hint strategicamente per massimizzare l\'apprendimento' :
        correlationValue < -0.3 ?
        'Riduci l\'uso degli hint per sviluppare autonomia' :
        'Gli hint hanno impatto neutro, usali quando necessario'
    };
  }

  private generatePatternInsights(
    temporalPatterns: TemporalPattern[], 
    performancePatterns: PerformancePattern[], 
    correlations: PatternCorrelation[]
  ): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // Insight da pattern temporali
    const timeOfDayPattern = temporalPatterns.find(p => p.type === 'hourly');
    if (timeOfDayPattern && timeOfDayPattern.strength > 0.2) {
      insights.push({
        type: 'opportunity',
        title: 'Orario Ottimale Identificato',
        description: timeOfDayPattern.pattern,
        importance: 4,
        suggestedActions: ['Pianifica sessioni nell\'orario di picco', 'Evita orari con performance bassa'],
        estimatedImpact: Math.min(15, timeOfDayPattern.strength * 100),
        actionable: true,
        priority: 'high',
        evidence: [`Pattern temporale con forza ${Math.round(timeOfDayPattern.strength * 100)}%`],
        solutions: [{
          title: 'Ottimizza Orari di Studio',
          description: `Pianifica le sessioni più impegnative nell'orario di picco performance`,
          difficulty: 'easy',
          estimatedImpact: Math.min(15, timeOfDayPattern.strength * 100),
          timeToImplement: '1 giorno'
        }]
      });
    }

    // Insight da correlazioni forti
    const strongCorrelations = correlations.filter(c => c.strength > 0.4);
    strongCorrelations.forEach(corr => {
      insights.push({
        type: 'opportunity',
        title: `Correlazione Significativa: ${corr.patterns.join(' - ')}`,
        description: corr.interpretation,
        importance: corr.strength > 0.6 ? 5 : 3,
        suggestedActions: [corr.interpretation, 'Monitora questi pattern'],
        estimatedImpact: Math.round(corr.strength * 20),
        actionable: true,
        priority: corr.strength > 0.6 ? 'high' : 'medium',
        evidence: [`Correlazione ${corr.direction} con forza ${Math.round(corr.strength * 100)}%`],
        solutions: this.generateCorrelationSolutions(corr)
      });
    });

    // Insight da pattern di performance
    const consistencyPattern = performancePatterns.find(p => p.name === 'Performance Consistente');
    if (consistencyPattern) {
      insights.push({
        type: 'strength',
        title: 'Performance Stabile Rilevata',
        description: consistencyPattern.description,
        importance: 3,
        suggestedActions: ['Mantieni la routine attuale', 'Consolida i punti di forza'],
        estimatedImpact: 10,
        actionable: true,
        priority: 'medium',
        evidence: [`Consistenza con confidenza ${consistencyPattern.confidence}%`],
        solutions: [{
          title: 'Mantieni Routine Attuale',
          description: 'La tua attuale strategia di studio produce risultati consistenti',
          difficulty: 'easy',
          estimatedImpact: 5,
          timeToImplement: 'Continuativo'
        }]
      });
    }

    return insights;
  }

  private generateCorrelationSolutions(correlation: PatternCorrelation): Solution[] {
    const solutions: Solution[] = [];
    
    if (correlation.patterns.includes('Frequenza Studio') && correlation.direction === 'positive') {
      solutions.push({
        name: 'Aumenta Frequenza Studio',
        title: 'Aumenta Frequenza Studio',
        description: 'Incrementa gradualmente il numero di sessioni settimanali',
        type: 'strategy',
        estimatedEffectiveness: Math.round(correlation.strength * 100),
        requiredEffort: 3,
        instructions: ['Aggiungi 1-2 sessioni extra a settimana', 'Mantieni sessioni brevi', 'Monitora i risultati'],
        difficulty: 'medium',
        estimatedImpact: Math.round(correlation.strength * 20),
        timeToImplement: '1-2 settimane'
      });
    }
    
    if (correlation.patterns.includes('Durata Sessione') && correlation.direction === 'negative') {
      solutions.push({
        name: 'Riduci Durata Sessioni',
        title: 'Riduci Durata Sessioni',
        description: 'Sessioni più brevi e frequenti potrebbero essere più efficaci',
        type: 'timing',
        estimatedEffectiveness: Math.round(correlation.strength * 80),
        requiredEffort: 2,
        instructions: ['Riduci ogni sessione di 5-10 minuti', 'Aumenta la frequenza', 'Concentrati sulla qualità'],
        difficulty: 'easy',
        estimatedImpact: Math.round(correlation.strength * 15),
        timeToImplement: '3-5 giorni'
      });
    }
    
    return solutions;
  }

  // Metodi di supporto matematico
  private groupTestsByWeek(enrichedTests: any[]) {
    const weeks = new Map<string, any[]>();
    
    enrichedTests.forEach(test => {
      const date = new Date(test.timestamp);
      const weekKey = `${date.getFullYear()}-W${Math.floor(date.getDate() / 7)}`;
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, []);
      }
      weeks.get(weekKey)!.push(test);
    });
    
    return Array.from(weeks.values()).map(weekTests => ({
      testCount: weekTests.length,
      avgScore: weekTests.reduce((sum, t) => sum + t.normalizedScore, 0) / weekTests.length
    }));
  }

  private calculatePearsonCorrelation(points: { x: number, y: number }[]): number {
    if (points.length < 2) return 0;
    
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // =====================================================
  // 🎯 IMPLEMENTAZIONE SISTEMI AI E RACCOMANDAZIONI
  // =====================================================

  private generateGoalBasedRecommendations(enrichedTests: any[]): GoalBasedRecommendation[] {
    const recommendations: GoalBasedRecommendation[] = [];
    
    if (enrichedTests.length === 0) return recommendations;

    const currentAccuracy = enrichedTests.slice(-5).reduce((sum, t) => sum + t.normalizedScore, 0) / Math.min(5, enrichedTests.length);
    
    // Obiettivo 70% accuracy
    if (currentAccuracy < 70) {
      const improvement = this.calculateLinearRegression(
        enrichedTests.map((t, i) => ({ x: i, y: t.normalizedScore }))
      );
      
      const daysTo70 = improvement.slope > 0 ? 
        Math.max(7, Math.round((70 - currentAccuracy) / improvement.slope)) : 30;

      recommendations.push({
        targetGoal: {
          name: 'Competenza Intermedia',
          description: 'Raggiungere 70% di accuracy costante',
          type: 'accuracy',
          targetValue: 70,
          currentValue: Math.round(currentAccuracy),
          timeframe: '30_days'
        },
        priority: 3,
        actionPlan: [
          {
            title: 'Focus parole difficili',
            description: 'Concentrati su parole con accuracy < 60%',
            order: 1,
            difficulty: 2,
            estimatedTime: 15,
            expectedOutcome: 'Miglioramento accuracy parole critiche'
          },
          {
            title: 'Ripasso sistematico',
            description: 'Aumenta frequenza ripasso parole difficili',
            order: 2,
            difficulty: 3,
            estimatedTime: 20,
            expectedOutcome: 'Consolidamento apprendimento'
          }
        ],
        estimatedTimeToGoal: daysTo70,
        successProbability: improvement.rSquared * 100,
        trackingMetrics: ['accuracy', 'improvement_rate', 'consistency'],
        goal: {
          type: 'accuracy_milestone',
          targetValue: 70,
          currentValue: Math.round(currentAccuracy),
          unit: 'percentage'
        },
        estimatedTimeframe: `${daysTo70} giorni`,
        confidence: improvement.rSquared > 0.3 ? 'high' : 'medium',
        suggestedActions: [
          'Concentrati su parole con accuracy < 60%',
          'Aumenta frequenza ripasso parole difficili',
          'Utilizza hint strategicamente per consolidare apprendimento'
        ],
        milestones: [
          { value: Math.round(currentAccuracy + (70 - currentAccuracy) * 0.3), description: 'Primo traguardo intermedio' },
          { value: Math.round(currentAccuracy + (70 - currentAccuracy) * 0.7), description: 'Secondo traguardo intermedio' },
          { value: 70, description: 'Obiettivo competenza intermedia' }
        ]
      });
    }

    // Obiettivo 85% accuracy (competenza avanzata)
    if (currentAccuracy >= 60) {
      recommendations.push({
        targetGoal: {
          name: 'Competenza Avanzata',
          description: 'Raggiungere 85% di accuracy avanzata',
          type: 'accuracy',
          targetValue: 85,
          currentValue: Math.round(currentAccuracy),
          timeframe: '60_days'
        },
        priority: 4,
        actionPlan: [
          {
            title: 'Parole avanzate',
            description: 'Studia parole di difficoltà avanzata',
            order: 1,
            difficulty: 4,
            estimatedTime: 25,
            expectedOutcome: 'Espansione vocabolario complesso'
          },
          {
            title: 'Autonomia apprendimento',
            description: 'Riduci uso hint per consolidare memoria a lungo termine',
            order: 2,
            difficulty: 3,
            estimatedTime: 20,
            expectedOutcome: 'Maggiore indipendenza'
          }
        ],
        estimatedTimeToGoal: 50,
        successProbability: 70,
        trackingMetrics: ['accuracy', 'speed', 'hint_usage'],
        goal: {
          type: 'mastery_level',
          targetValue: 85,
          currentValue: Math.round(currentAccuracy),
          unit: 'percentage'
        },
        estimatedTimeframe: '45-60 giorni',
        confidence: 'medium',
        suggestedActions: [
          'Studia parole di difficoltà avanzata',
          'Riduci uso hint per consolidare memoria a lungo termine',
          'Aumenta velocità risposta mantenendo accuracy'
        ],
        milestones: [
          { value: 75, description: 'Competenza intermedia-avanzata' },
          { value: 80, description: 'Competenza pre-avanzata' },
          { value: 85, description: 'Competenza avanzata' }
        ]
      });
    }

    return recommendations;
  }

  private generateWeaknessBasedRecommendations(enrichedWordPerfs: any[]): WeaknessBasedRecommendation[] {
    const recommendations: WeaknessBasedRecommendation[] = [];
    
    if (enrichedWordPerfs.length === 0) return recommendations;

    // Identifica parole con accuracy bassa
    const weakWords = enrichedWordPerfs
      .filter(wp => wp.successRate < 0.5 && wp.totalAttempts >= 2)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 10);

    if (weakWords.length > 0) {
      recommendations.push({
        weakness: {
          area: 'accuracy',
          description: `${weakWords.length} parole con accuracy < 50%`,
          evidence: [
            {
              type: 'statistical',
              value: weakWords.length,
              description: `${weakWords.length} parole sotto soglia critica`,
              confidence: 95
            }
          ],
          trend: 'stable',
          type: 'word_accuracy',
          severity: weakWords.length > 5 ? 'high' : 'medium',
          affectedWords: weakWords.map(w => w.wordId || w.id).slice(0, 5)
        },
        severity: weakWords.length > 5 ? 4 : 3,
        solutions: [
          {
            name: 'Spaced Repetition Intensiva',
            title: 'Spaced Repetition Intensiva',
            description: 'Ripasso programmato delle parole difficili',
            type: 'practice',
            estimatedEffectiveness: 85,
            requiredEffort: 3,
            instructions: ['Ripeti parole difficili 3 volte al giorno', 'Aumenta intervalli gradualmente', 'Verifica ritenzione'],
            difficulty: 'medium',
            estimatedImpact: Math.round((0.7 - weakWords[0].successRate) * 100),
            timeToImplement: '2-3 settimane'
          }
        ],
        estimatedImprovementImpact: Math.round((0.7 - weakWords[0].successRate) * 100),
        timeToResults: 14,
        targetImprovement: Math.round((0.7 - weakWords[0].successRate) * 100),
        recommendedActions: [
          'Ripasso concentrato sulle parole più difficili',
          'Utilizza tecniche di memorizzazione spaziate',
          'Associa parole difficili a contesti memorabili'
        ],
        practiceStrategy: {
          frequency: 'daily',
          duration: '10-15 minuti',
          method: 'spaced_repetition',
          focusAreas: ['vocabulary_recall', 'context_understanding']
        },
        expectedResults: {
          timeframe: '2-3 settimane',
          accuracyIncrease: Math.round((0.7 - weakWords[0].successRate) * 100),
          confidenceLevel: 80
        }
      });
    }

    // Identifica pattern di tempo di risposta lento
    const slowWords = enrichedWordPerfs
      .filter(wp => wp.averageTime > 8000 && wp.successRate > 0.6)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 8);

    if (slowWords.length > 0) {
      recommendations.push({
        weakness: {
          area: 'speed',
          description: `${slowWords.length} parole con tempi di risposta > 8 secondi`,
          evidence: [
            {
              type: 'statistical',
              value: slowWords.length,
              description: `${slowWords.length} parole con risposta lenta`,
              confidence: 90
            }
          ],
          trend: 'stable',
          type: 'response_speed',
          severity: 'medium',
          affectedWords: slowWords.map(w => w.wordId || w.id).slice(0, 5)
        },
        severity: 3,
        solutions: [
          {
            name: 'Allenamento Velocità',
            title: 'Allenamento Velocità',
            description: 'Esercizi specifici per migliorare velocità di risposta',
            type: 'practice',
            estimatedEffectiveness: 75,
            requiredEffort: 2,
            instructions: ['Sessioni rapide di 30 secondi', 'Focus su riconoscimento immediato', 'Evita overthinking'],
            difficulty: 'easy',
            estimatedImpact: 40,
            timeToImplement: '1-2 settimane'
          }
        ],
        estimatedImprovementImpact: 40,
        timeToResults: 10,
        targetImprovement: 40, // riduzione 40% tempo risposta
        recommendedActions: [
          'Esercizi di riconoscimento rapido',
          'Associazioni immediate parola-significato',
          'Ripetizione ad alta frequenza per automatizzare'
        ],
        practiceStrategy: {
          frequency: 'twice_daily',
          duration: '5-8 miniti',
          method: 'rapid_recall',
          focusAreas: ['speed_recognition', 'automatic_response']
        },
        expectedResults: {
          timeframe: '1-2 settimane',
          speedImprovement: 40,
          confidenceLevel: 75
        }
      });
    }

    return recommendations;
  }

  private generateTimingRecommendations(enrichedTests: any[]): TimingRecommendation[] {
    const recommendations: TimingRecommendation[] = [];
    
    if (enrichedTests.length === 0) return recommendations;

    // Analisi orario ottimale
    const hourlyPerformance = new Map<number, number[]>();
    enrichedTests.forEach(test => {
      const hour = new Date(test.timestamp).getHours();
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, []);
      }
      hourlyPerformance.get(hour)!.push(test.normalizedScore);
    });

    const hourlyAvgs = Array.from(hourlyPerformance.entries())
      .map(([hour, scores]) => ({
        hour,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        testCount: scores.length
      }))
      .filter(h => h.testCount >= 2)
      .sort((a, b) => b.avgScore - a.avgScore);

    if (hourlyAvgs.length > 0) {
      const bestHour = hourlyAvgs[0];
      const worstHour = hourlyAvgs[hourlyAvgs.length - 1];
      
      recommendations.push({
        optimalStudyTime: {
          startHour: bestHour.hour,
          endHour: (bestHour.hour + 2) % 24,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // tutti i giorni
          averagePerformance: bestHour.avgScore,
          confidence: Math.min(100, (bestHour.avgScore - 50) * 2)
        },
        recommendedSessionDuration: this.calculateOptimalSessionLength(enrichedTests),
        optimalFrequency: this.calculateOptimalFrequency(enrichedTests),
        recommendedBreakPattern: {
          shortBreakDuration: 5,
          shortBreakFrequency: 15,
          longBreakDuration: 15,
          longBreakFrequency: 45
        },
        supportingEvidence: [
          `Performance migliore alle ${bestHour.hour}:00 (${Math.round(bestHour.avgScore)}% accuracy)`,
          `Differenza performance picco-valle: ${Math.round(bestHour.avgScore - worstHour.avgScore)}%`,
          `Basato su ${bestHour.testCount} sessioni nell'orario ottimale`
        ]
      });
    }

    return recommendations;
  }

  private generateStrategicRecommendations(enrichedTests: any[], enrichedWordPerfs: any[]): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];
    
    // Strategia basata su trend performance
    const trend = this.calculateLinearRegression(
      enrichedTests.map((t, i) => ({ x: i, y: t.normalizedScore }))
    );

    if (trend.slope > 1) {
      recommendations.push({
        strategy: 'accelerated_learning',
        rationale: 'Trend di miglioramento positivo rilevato dai dati',
        expectedBenefits: ['Accelerazione apprendimento', 'Raggiungimento obiettivi più rapido', 'Maggiore sfida cognitiva'],
        potentialRisks: ['Possibile affaticamento', 'Riduzione accuracy temporanea'],
        successMetrics: ['accuracy_trend', 'learning_velocity', 'retention_rate'],
        recommendedTrialDuration: 21,
        title: 'Accelerazione Apprendimento',
        description: 'Il tuo trend di miglioramento è positivo. Aumenta la difficoltà per massimizzare i progressi.',
        priority: 'high',
        implementationSteps: [
          'Aumenta percentuale parole difficili nei test al 40%',
          'Riduci gradualmente uso hint del 20%',
          'Introduci sessioni di ripasso accelerato'
        ],
        expectedOutcome: {
          timeframe: '3-4 settimane',
          performanceGain: Math.round(trend.slope * 10),
          riskLevel: 'low'
        },
        personalizedAspects: [
          `Trend attuale: +${Math.round(trend.slope * 100) / 100} punti per test`,
          `Confidenza predittiva: ${Math.round(trend.rSquared * 100)}%`
        ]
      });
    } else if (trend.slope < -0.5) {
      recommendations.push({
        strategy: 'consolidation_focus',
        rationale: 'Trend di performance in declino richiede intervento correttivo',
        expectedBenefits: ['Stabilizzazione performance', 'Recupero fiducia', 'Consolidamento basi'],
        potentialRisks: ['Rallentamento progressi a breve termine', 'Possibile noia con materiale facile'],
        successMetrics: ['stability_index', 'confidence_recovery', 'error_reduction'],
        recommendedTrialDuration: 14,
        title: 'Consolidamento Performance',
        description: 'Trend in calo rilevato. Concentrati su consolidamento e ripasso.',
        priority: 'high',
        implementationSteps: [
          'Riduci difficoltà test al 60% parole facili',
          'Aumenta frequenza ripasso parole già studiate',
          'Implementa pause più lunghe tra sessioni'
        ],
        expectedOutcome: {
          timeframe: '2-3 settimane',
          performanceGain: Math.abs(Math.round(trend.slope * 5)),
          riskLevel: 'low'
        },
        personalizedAspects: [
          `Declino attuale: ${Math.round(trend.slope * 100) / 100} punti per test`,
          `Necessario intervento preventivo`
        ]
      });
    }

    // Strategia basata su pattern uso hint
    const avgHintUsage = enrichedWordPerfs.length > 0 ? 
      enrichedWordPerfs.reduce((sum, wp) => {
        const hintsPerAttempt = wp.attempts ? 
          wp.attempts.reduce((hSum: number, att: any) => hSum + (att.hintsCount || 0), 0) / wp.totalAttempts : 0;
        return sum + hintsPerAttempt;
      }, 0) / enrichedWordPerfs.length : 0;

    if (avgHintUsage > 1.5) {
      recommendations.push({
        strategy: 'hint_optimization',
        rationale: 'Alto utilizzo di hint limita lo sviluppo della memoria autonoma',
        expectedBenefits: ['Maggiore autonomia', 'Memoria a lungo termine potenziata', 'Confidence aumentata'],
        potentialRisks: ['Temporanea riduzione accuracy', 'Aumento frustrazione iniziale'],
        successMetrics: ['hint_usage_reduction', 'autonomous_recall_rate', 'long_term_retention'],
        recommendedTrialDuration: 18,
        title: 'Ottimizzazione Uso Hint',
        description: 'Uso eccessivo di hint rilevato. Sviluppa maggiore autonomia.',
        priority: 'medium',
        implementationSteps: [
          'Imposta limite massimo 1 hint per parola',
          'Pratica richiamo libero senza hint',
          'Utilizza hint solo dopo 10 secondi di riflessione'
        ],
        expectedOutcome: {
          timeframe: '2-3 settimane',
          performanceGain: 15,
          riskLevel: 'medium'
        },
        personalizedAspects: [
          `Uso hint attuale: ${Math.round(avgHintUsage * 100) / 100} per tentativo`,
          'Obiettivo: riduzione 40% uso hint mantenendo accuracy'
        ]
      });
    }

    return recommendations;
  }

  private calculatePersonalizationScore(enrichedTests: any[], enrichedWordPerfs: any[]): number {
    // Score basato su quantità e qualità dati disponibili
    let score = 0;
    
    // Contributo test history (max 40 punti)
    score += Math.min(40, enrichedTests.length * 3);
    
    // Contributo word performances (max 30 punti)
    score += Math.min(30, enrichedWordPerfs.length * 2);
    
    // Contributo consistenza dati (max 20 punti)
    if (enrichedTests.length > 5) {
      const consistency = 1 - this.calculateMovingStandardDeviation(
        enrichedTests.slice(-10).map(t => t.normalizedScore)
      ) / 100;
      score += Math.max(0, consistency * 20);
    }
    
    // Contributo diversità temporale (max 10 punti)
    if (enrichedTests.length > 0) {
      const timeSpan = enrichedTests[enrichedTests.length - 1].daysSinceStart;
      score += Math.min(10, timeSpan / 7); // 1 punto per settimana
    }
    
    return Math.min(100, Math.round(score));
  }

  // =====================================================
  // 🎯 SISTEMA ADATTIVO
  // =====================================================

  private generateLearnerProfile(enrichedTests: any[], enrichedWordPerfs: any[]): LearnerProfile {
    // Calcola confidence generale basato sui dati disponibili
    const overallConfidence = Math.min(100, 
      (enrichedTests.length * 5) + 
      (enrichedWordPerfs.length * 2) + 
      (enrichedTests.length > 10 ? 30 : 0)
    );

    return {
      learnerType: this.determineLearnerType(enrichedTests, enrichedWordPerfs),
      characteristics: this.generateLearnerCharacteristics(enrichedTests, enrichedWordPerfs),
      preferences: this.generateLearnerPreferences(enrichedTests, enrichedWordPerfs),
      strengths: this.identifyStrengths(enrichedTests, enrichedWordPerfs),
      improvementAreas: this.identifyImprovementAreas(enrichedTests, enrichedWordPerfs),
      overallConfidence,
      learningStyle: this.identifyLearningStyle(enrichedTests, enrichedWordPerfs),
      preferredDifficulty: this.calculatePreferredDifficulty(enrichedWordPerfs),
      optimalSessionLength: this.calculateOptimalSessionLength(enrichedTests),
      peakPerformanceHours: this.identifyPeakHours(enrichedTests),
      challenges: this.identifyMainChallenges(enrichedTests, enrichedWordPerfs)
    };
  }

  private identifyLearningStyle(enrichedTests: any[], enrichedWordPerfs: any[]): string {
    // Analisi velocità vs accuracy per determinare stile
    const avgSpeed = enrichedTests.reduce((sum, t) => sum + t.wordsPerMinute, 0) / enrichedTests.length;
    const avgAccuracy = enrichedTests.reduce((sum, t) => sum + t.normalizedScore, 0) / enrichedTests.length;
    
    if (avgAccuracy > 75 && avgSpeed < 2) {
      return 'methodical'; // Metodico: alta accuracy, velocità moderata
    } else if (avgSpeed > 3 && avgAccuracy > 65) {
      return 'intuitive'; // Intuitivo: veloce e accurato
    } else if (avgAccuracy > 80) {
      return 'analytical'; // Analitico: priorità accuracy
    } else {
      return 'adaptive'; // Adattivo: stile misto
    }
  }

  private calculatePreferredDifficulty(enrichedWordPerfs: any[]): string {
    if (enrichedWordPerfs.length === 0) return 'medium';
    
    const avgDifficulty = enrichedWordPerfs.reduce((sum, wp) => sum + wp.difficultyScore, 0) / enrichedWordPerfs.length;
    
    if (avgDifficulty < 35) return 'easy';
    if (avgDifficulty > 65) return 'hard';
    return 'medium';
  }

  private calculateOptimalSessionLength(enrichedTests: any[]): number {
    if (enrichedTests.length === 0) return 20;
    
    // Calcola durata media sessioni con performance > 70%
    const goodSessions = enrichedTests.filter(t => t.normalizedScore > 70);
    if (goodSessions.length === 0) return 20;
    
    const avgDuration = goodSessions.reduce((sum, t) => sum + (t.sessionDuration / 60000), 0) / goodSessions.length;
    return Math.max(10, Math.min(45, Math.round(avgDuration)));
  }

  private calculateOptimalFrequency(enrichedTests: any[]): StudyFrequency {
    if (enrichedTests.length === 0) {
      return {
        sessionsPerWeek: 3,
        distribution: 'every_other_day' as 'daily' | 'every_other_day' | 'weekends' | 'custom'
      };
    }

    // Calcola frequenza attuale
    const totalDays = enrichedTests.length > 0 ? 
      Math.max(1, enrichedTests[enrichedTests.length - 1].daysSinceStart) : 1;
    const currentFrequency = (enrichedTests.length / totalDays) * 7; // sessioni per settimana

    // Ottimizza la frequenza basandosi sulla performance
    const avgPerformance = enrichedTests.reduce((sum, t) => sum + t.normalizedScore, 0) / enrichedTests.length;
    
    let recommendedFrequency = currentFrequency;
    if (avgPerformance > 80) {
      recommendedFrequency = Math.min(7, currentFrequency * 1.2); // Aumenta se va bene
    } else if (avgPerformance < 50) {
      recommendedFrequency = Math.max(2, currentFrequency * 0.8); // Riduci se va male
    }

    const sessionsPerWeek = Math.max(2, Math.min(7, Math.round(recommendedFrequency)));
    
    return {
      sessionsPerWeek,
      distribution: sessionsPerWeek >= 6 ? 'daily' : 
                   sessionsPerWeek >= 4 ? 'every_other_day' :
                   sessionsPerWeek <= 2 ? 'weekends' : 'custom'
    };
  }

  private identifyPeakHours(enrichedTests: any[]): number[] {
    const hourlyPerformance = new Map<number, number[]>();
    enrichedTests.forEach(test => {
      const hour = new Date(test.timestamp).getHours();
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, []);
      }
      hourlyPerformance.get(hour)!.push(test.normalizedScore);
    });

    return Array.from(hourlyPerformance.entries())
      .map(([hour, scores]) => ({
        hour,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        testCount: scores.length
      }))
      .filter(h => h.testCount >= 2 && h.avgScore > 70)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(h => h.hour);
  }

  private identifyStrengths(enrichedTests: any[], enrichedWordPerfs: any[]): string[] {
    const strengths: string[] = [];
    
    // Consistenza
    if (enrichedTests.length > 5) {
      const stdDev = this.calculateMovingStandardDeviation(
        enrichedTests.slice(-10).map(t => t.normalizedScore)
      );
      if (stdDev < 15) {
        strengths.push('Performance Consistente');
      }
    }
    
    // Miglioramento rapido
    const trend = this.calculateLinearRegression(
      enrichedTests.map((t, i) => ({ x: i, y: t.normalizedScore }))
    );
    if (trend.slope > 1) {
      strengths.push('Apprendimento Rapido');
    }
    
    // Efficienza
    const avgEfficiency = enrichedTests.reduce((sum, t) => sum + t.wordsPerMinute, 0) / enrichedTests.length;
    if (avgEfficiency > 2.5) {
      strengths.push('Alta Efficienza');
    }
    
    return strengths;
  }

  private identifyMainChallenges(enrichedTests: any[], enrichedWordPerfs: any[]): string[] {
    const challenges: string[] = [];
    
    // Bassa accuracy
    const avgAccuracy = enrichedTests.reduce((sum, t) => sum + t.normalizedScore, 0) / enrichedTests.length;
    if (avgAccuracy < 60) {
      challenges.push('Accuracy da Migliorare');
    }
    
    // Lentezza
    const avgSpeed = enrichedTests.reduce((sum, t) => sum + t.wordsPerMinute, 0) / enrichedTests.length;
    if (avgSpeed < 1.5) {
      challenges.push('Velocità di Risposta');
    }
    
    // Inconsistenza
    if (enrichedTests.length > 5) {
      const stdDev = this.calculateMovingStandardDeviation(
        enrichedTests.slice(-10).map(t => t.normalizedScore)
      );
      if (stdDev > 25) {
        challenges.push('Performance Variabile');
      }
    }
    
    return challenges;
  }

  private identifyCurrentAdaptations(enrichedTests: any[]): any[] {
    // Per ora return array vuoto, ma logica esisterebbe per identificare adattamenti in corso
    return [];
  }

  private generateSuggestedAdaptations(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const adaptations: any[] = [];
    
    const avgAccuracy = enrichedTests.reduce((sum, t) => sum + t.normalizedScore, 0) / enrichedTests.length;
    
    if (avgAccuracy > 80) {
      adaptations.push({
        type: 'difficulty_increase',
        description: 'Aumenta difficoltà test per ottimizzare sfida',
        priority: 'medium',
        estimatedImpact: 'positive'
      });
    } else if (avgAccuracy < 50) {
      adaptations.push({
        type: 'difficulty_decrease',
        description: 'Riduci difficoltà per consolidare basi',
        priority: 'high',
        estimatedImpact: 'positive'
      });
    }
    
    return adaptations;
  }

  private calculateAdaptationHistory(enrichedTests: any[]): any[] {
    // Storia adattamenti (implementazione futura con tracking cambiamenti)
    return [];
  }

  private calculateNextAdaptationDate(enrichedTests: any[]): Date {
    // Prossimo adattamento consigliato tra 1 settimana
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // =====================================================
  // 🎮 SISTEMA GAMIFICATION
  // =====================================================

  private calculateAchievements(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const achievements: any[] = [];
    
    // Achievement streak
    const currentStreak = this.calculateCurrentStreak(enrichedTests);
    if (currentStreak >= 7) {
      achievements.push({
        id: 'streak_week',
        title: 'Settimana Perfetta',
        description: `Studiato per ${currentStreak} giorni consecutivi`,
        rarity: 'rare',
        unlockedAt: new Date()
      });
    }
    
    // Achievement accuracy
    const recentAccuracy = enrichedTests.slice(-5).reduce((sum, t) => sum + t.normalizedScore, 0) / Math.min(5, enrichedTests.length);
    if (recentAccuracy >= 90) {
      achievements.push({
        id: 'accuracy_master',
        title: 'Maestro di Precisione',
        description: 'Accuracy media ≥ 90% negli ultimi test',
        rarity: 'legendary',
        unlockedAt: new Date()
      });
    }
    
    return achievements;
  }

  private generateChallengeRecommendations(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const challenges: any[] = [];
    
    const avgAccuracy = enrichedTests.reduce((sum, t) => sum + t.normalizedScore, 0) / enrichedTests.length;
    
    if (avgAccuracy > 70) {
      challenges.push({
        id: 'speed_challenge',
        title: 'Sfida Velocità',
        description: 'Completa un test in meno di 2 minuti mantenendo 80% accuracy',
        difficulty: 'hard',
        reward: 'Speed Master Badge',
        timeLimit: '7 giorni'
      });
    }
    
    return challenges;
  }

  private calculateStreaks(enrichedTests: any[]): any[] {
    if (enrichedTests.length === 0) return [];
    
    const currentStreak = this.calculateCurrentStreak(enrichedTests);
    const longestStreak = this.calculateLongestStreak(enrichedTests);
    
    return [{
      type: 'study_streak',
      current: currentStreak,
      longest: longestStreak,
      target: Math.max(longestStreak + 1, 7),
      description: `${currentStreak} giorni consecutivi (record: ${longestStreak})`
    }];
  }

  private calculateCurrentStreak(enrichedTests: any[]): number {
    if (enrichedTests.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    
    for (let i = enrichedTests.length - 1; i >= 0; i--) {
      const testDate = new Date(enrichedTests[i].timestamp);
      const daysDiff = Math.floor((checkDate.getTime() - testDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === streak) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(enrichedTests: any[]): number {
    if (enrichedTests.length === 0) return 0;
    
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < enrichedTests.length; i++) {
      const prevDate = new Date(enrichedTests[i-1].timestamp);
      const currDate = new Date(enrichedTests[i].timestamp);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(maxStreak, currentStreak);
  }

  private generatePersonalLeaderboards(enrichedTests: any[]): any[] {
    const leaderboards: any[] = [];
    
    if (enrichedTests.length > 0) {
      const bestAccuracy = Math.max(...enrichedTests.map(t => t.normalizedScore));
      const bestSpeed = Math.max(...enrichedTests.map(t => t.wordsPerMinute));
      
      leaderboards.push({
        category: 'personal_best',
        metrics: [
          { name: 'Miglior Accuracy', value: `${Math.round(bestAccuracy)}%`, isPersonalBest: true },
          { name: 'Miglior Velocità', value: `${Math.round(bestSpeed * 100) / 100} parole/min`, isPersonalBest: true }
        ]
      });
    }
    
    return leaderboards;
  }

  private generateMotivationalInsights(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const insights: any[] = [];
    
    if (enrichedTests.length > 1) {
      const improvement = enrichedTests[enrichedTests.length - 1].normalizedScore - enrichedTests[0].normalizedScore;
      
      if (improvement > 20) {
        insights.push({
          type: 'progress_celebration',
          message: `Incredibile! Hai migliorato la tua accuracy di ${Math.round(improvement)} punti!`,
          mood: 'celebratory',
          actionPrompt: 'Continua così per raggiungere nuovi traguardi!'
        });
      } else if (improvement > 0) {
        insights.push({
          type: 'steady_progress',
          message: `Progressi costanti: +${Math.round(improvement)} punti dall'inizio`,
          mood: 'encouraging',
          actionPrompt: 'Ogni piccolo passo conta. Sei sulla strada giusta!'
        });
      }
    }
    
    return insights;
  }

  // =====================================================
  // 🔧 METODI AGGIUNTIVI MANCANTI 
  // =====================================================

  private getEffectiveStrategiesForDifficulty(difficulty: string): string[] {
    switch (difficulty) {
      case 'easy':
        return ['Ripetizione rapida', 'Consolidamento base', 'Volume alto'];
      case 'medium':
        return ['Spaced repetition', 'Contestualizzazione', 'Associazioni mnemoniche'];
      case 'hard':
        return ['Deep learning', 'Elaborazione attiva', 'Multi-modal approach'];
      default:
        return ['Approccio misto', 'Adaptive learning'];
    }
  }

  private generatePlannedAdaptations(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const planned: any[] = [];
    
    if (enrichedTests.length > 0) {
      const avgAccuracy = enrichedTests.reduce((sum: number, t: any) => sum + t.normalizedScore, 0) / enrichedTests.length;
      
      if (avgAccuracy < 70) {
        planned.push({
          adaptation: {
            type: 'difficulty_adjustment',
            description: 'Riduzione temporanea difficoltà per consolidamento',
            parameters: { targetDifficulty: 'easier' },
            expectedImpact: 15,
            implementationDifficulty: 1,
            activationConditions: ['accuracy < 70%']
          },
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 giorni
          triggerConditions: [{
            metric: 'accuracy',
            operator: 'less_than' as const,
            threshold: 70,
            duration: 3
          }],
          priority: 2,
          requiresApproval: false
        });
      }
    }
    
    return planned;
  }

  private generateActiveChallenges(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const challenges: any[] = [];
    
    if (enrichedTests.length > 0) {
      // Challenge settimanale accuracy
      const currentAccuracy = enrichedTests.slice(-5).reduce((sum: number, t: any) => sum + t.normalizedScore, 0) / Math.min(5, enrichedTests.length);
      
      challenges.push({
        id: 'weekly_accuracy_boost',
        name: 'Potenziamento Settimanale',
        description: `Raggiungi ${Math.min(95, currentAccuracy + 10)}% di accuracy media nei prossimi 7 giorni`,
        type: 'short_term',
        duration: 7 * 24 * 60 * 60 * 1000, // 7 giorni in ms
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        objectives: [{
          description: `Accuracy media ≥ ${Math.min(95, currentAccuracy + 10)}%`,
          targetMetric: 'accuracy',
          targetValue: Math.min(95, currentAccuracy + 10),
          currentValue: currentAccuracy,
          completed: false
        }],
        rewards: [{
          type: 'points',
          value: 100,
          description: '100 punti bonus'
        }],
        currentProgress: 0,
        completed: false
      });
    }
    
    return challenges;
  }

  private calculateTrendPoints(enrichedTests: any[]): any {
    const basePoints = enrichedTests.length * 10;
    const bonusPoints = enrichedTests.filter((t: any) => t.normalizedScore > 80).length * 5;
    
    return {
      currentPoints: basePoints + bonusPoints,
      totalPointsEarned: basePoints + bonusPoints + Math.floor(enrichedTests.length / 5) * 20,
      currentLevel: Math.floor((basePoints + bonusPoints) / 100) + 1,
      pointsToNextLevel: 100 - ((basePoints + bonusPoints) % 100),
      activeMultipliers: [],
      earningsHistory: [{
        points: basePoints + bonusPoints,
        reason: 'Calcolo tendenze completato',
        earnedAt: new Date(),
        multipliersApplied: []
      }]
    };
  }

  // =====================================================
  // 🧠 METODI AGGIUNTIVI PER LEARNER PROFILE 
  // =====================================================

  private determineLearnerType(enrichedTests: any[], enrichedWordPerfs: any[]): any {
    if (enrichedTests.length === 0) return 'mixed';

    const avgAccuracy = enrichedTests.reduce((sum: number, t: any) => sum + t.normalizedScore, 0) / enrichedTests.length;
    const avgSpeed = enrichedTests.reduce((sum: number, t: any) => sum + t.wordsPerMinute, 0) / enrichedTests.length;

    if (avgAccuracy > 85 && avgSpeed > 2.5) return 'analytical';
    if (avgSpeed > 3) return 'intuitive';
    if (avgAccuracy > 80) return 'visual';
    return 'mixed';
  }

  private generateLearnerCharacteristics(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const characteristics = [];
    
    if (enrichedTests.length > 0) {
      const avgAccuracy = enrichedTests.reduce((sum: number, t: any) => sum + t.normalizedScore, 0) / enrichedTests.length;
      
      characteristics.push({
        name: 'Precision Focus',
        intensity: avgAccuracy / 100,
        evidence: [`Accuracy media: ${Math.round(avgAccuracy)}%`],
        learningImpact: avgAccuracy > 75 ? 'positive' : 'neutral'
      });
    }

    return characteristics;
  }

  private generateLearnerPreferences(enrichedTests: any[], enrichedWordPerfs: any[]): any[] {
    const preferences = [];

    if (enrichedTests.length > 0) {
      const avgDuration = enrichedTests.reduce((sum: number, t: any) => sum + (t.sessionDuration / 60000), 0) / enrichedTests.length;
      
      preferences.push({
        area: 'timing',
        value: avgDuration > 20 ? 'long_sessions' : 'short_sessions',
        strength: Math.min(1, avgDuration / 30),
        flexibility: 0.7
      });
    }

    return preferences;
  }

  private identifyImprovementAreas(enrichedTests: any[], enrichedWordPerfs: any[]): string[] {
    const areas = [];
    
    if (enrichedTests.length > 0) {
      const avgAccuracy = enrichedTests.reduce((sum: number, t: any) => sum + t.normalizedScore, 0) / enrichedTests.length;
      const avgSpeed = enrichedTests.reduce((sum: number, t: any) => sum + t.wordsPerMinute, 0) / enrichedTests.length;
      
      if (avgAccuracy < 70) areas.push('Accuracy');
      if (avgSpeed < 2) areas.push('Velocità');
      if (enrichedTests.length > 5) {
        const variance = this.calculateVariance(enrichedTests.map((t: any) => t.normalizedScore));
        if (variance > 300) areas.push('Consistenza');
      }
    }

    return areas.length > 0 ? areas : ['Consolidamento generale'];
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}
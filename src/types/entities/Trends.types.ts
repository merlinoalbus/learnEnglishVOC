// =====================================================
// 📈 src/types/entities/Trends.types.ts - Tendenze e Proiezioni
// =====================================================

import type { TestHistoryItem } from './Test.types';
import type { WordPerformanceAnalysis } from './Performance.types';

/**
 * Definizioni complete per analisi tendenze, proiezioni future
 * e sistemi di raccomandazioni intelligenti
 */

// =====================================================
// 🎯 LEARNING VELOCITY & ACCELERATION
// =====================================================

/**
 * Analisi velocità di apprendimento
 */
export interface LearningVelocityAnalysis {
  /** Velocità attuale (punti % per test) */
  currentVelocity: number;
  
  /** Accelerazione (variazione velocità nel tempo) */
  acceleration: number;
  
  /** Direzione del trend */
  direction: 'accelerating' | 'steady' | 'decelerating';
  
  /** Confidenza nella misura (0-100) */
  confidence: number;
  
  /** Velocità media per diverse metriche */
  velocityByMetric: {
    accuracy: number;
    efficiency: number;
    speed: number;
  };
  
  /** Fattore di stabilità (consistency della velocità) */
  stabilityFactor: number;
}

// =====================================================
// 🔮 FUTURE PROJECTIONS
// =====================================================

/**
 * Proiezione performance future
 */
export interface PerformanceProjection {
  /** Timeframe della proiezione */
  timeframe: ProjectionTimeframe;
  
  /** Metriche proiettate */
  projectedMetrics: ProjectedMetrics;
  
  /** Confidenza nella proiezione (0-100) */
  confidence: number;
  
  /** Fattori considerati */
  factors: ProjectionFactor[];
  
  /** Range di incertezza */
  uncertaintyRange: {
    optimistic: ProjectedMetrics;
    pessimistic: ProjectedMetrics;
  };
  
  /** Milestone previsti */
  expectedMilestones: ProjectedMilestone[];
}

/**
 * Timeframe per proiezioni
 */
export type ProjectionTimeframe = '7_days' | '30_days' | '60_days' | '90_days';

/**
 * Metriche proiettate
 */
export interface ProjectedMetrics {
  /** Accuracy attesa */
  expectedAccuracy: number;
  
  /** Efficienza attesa */
  expectedEfficiency: number;
  
  /** Velocità media attesa */
  expectedSpeed: number;
  
  /** Parole apprese stimate */
  estimatedWordsLearned: number;
  
  /** Test completati stimati */
  estimatedTestsCompleted: number;
  
  /** Tempo di studio stimato (ore) */
  estimatedStudyTime: number;
}

/**
 * Fattori che influenzano le proiezioni
 */
export interface ProjectionFactor {
  /** Nome del fattore */
  name: string;
  
  /** Peso del fattore (0-1) */
  weight: number;
  
  /** Trend del fattore */
  trend: 'positive' | 'neutral' | 'negative';
  
  /** Descrizione dell'impatto */
  impact: string;
}

/**
 * Milestone proiettato
 */
export interface ProjectedMilestone {
  /** Nome del milestone */
  name: string;
  
  /** Data stimata di raggiungimento */
  estimatedDate: Date;
  
  /** Probabilità di raggiungimento (0-100) */
  probability: number;
  
  /** Requisiti per il milestone */
  requirements: string[];
}

// =====================================================
// 📊 PATTERN ANALYSIS
// =====================================================

/**
 * Analisi pattern di apprendimento
 */
export interface LearningPatternAnalysis {
  /** Pattern temporali */
  temporalPatterns: TemporalPattern[];
  
  /** Pattern di performance */
  performancePatterns: PerformancePattern[];
  
  /** Pattern di difficoltà */
  difficultyPatterns: DifficultyPattern[];
  
  /** Correlazioni identificate */
  correlations: PatternCorrelation[];
  
  /** Insights derivati */
  insights: PatternInsight[];
}

/**
 * Pattern temporale
 */
export interface TemporalPattern {
  /** Tipo di pattern */
  type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  
  /** Pattern identificato */
  pattern: string;
  
  /** Dati del pattern */
  data: TemporalPatternData[];
  
  /** Forza del pattern (0-1) */
  strength: number;
  
  /** Significatività statistica */
  significance: number;
}

/**
 * Dati pattern temporale
 */
export interface TemporalPatternData {
  /** Etichetta temporale */
  timeLabel: string;
  
  /** Valore metrica */
  value: number;
  
  /** Numero di osservazioni */
  observations: number;
  
  /** Confidenza nel dato */
  confidence: number;
}

/**
 * Pattern di performance
 */
export interface PerformancePattern {
  /** Nome del pattern */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Frequenza del pattern */
  frequency: number;
  
  /** Impatto sulle performance */
  impact: 'positive' | 'neutral' | 'negative';
  
  /** Evidenze del pattern */
  evidence: string[];
  
  /** Confidenza nel pattern (0-100) */
  confidence: number;
}

/**
 * Pattern di difficoltà
 */
export interface DifficultyPattern {
  /** Categoria difficoltà */
  category: string;
  
  /** Trend di miglioramento */
  improvementTrend: number;
  
  /** Tempo medio per miglioramento */
  averageImprovementTime: number;
  
  /** Strategie efficaci */
  effectiveStrategies: string[];
  
  /** Accuracy media per questa categoria */
  averageAccuracy: number;
  
  /** Numero di parole in questa categoria */
  wordCount: number;
  
  /** Tasso di adattamento */
  adaptationRate: number;
  
  /** Maestria proiettata */
  projectedMastery: number;
}

/**
 * Correlazione tra pattern
 */
export interface PatternCorrelation {
  /** Pattern correlati */
  patterns: [string, string];
  
  /** Forza correlazione (-1 to 1) */
  strength: number;
  
  /** Direzione relazione */
  direction: 'positive' | 'negative' | 'neutral';
  
  /** Significatività */
  significance: 'high' | 'medium' | 'low';
  
  /** Interpretazione */
  interpretation: string;
  
  /** Confidenza nella correlazione (0-100) */
  confidence: number;
  
  /** Descrizione dettagliata */
  description: string;
}

/**
 * Insight da pattern
 */
export interface PatternInsight {
  /** Tipo insight */
  type: 'opportunity' | 'risk' | 'strength' | 'weakness';
  
  /** Titolo insight */
  title: string;
  
  /** Descrizione dettagliata */
  description: string;
  
  /** Importanza (1-5) */
  importance: number;
  
  /** Azioni suggerite */
  suggestedActions: string[];
  
  /** Impatto stimato */
  estimatedImpact: number;
  
  /** Se l'insight è actionable */
  actionable: boolean;
  
  /** Priorità dell'insight */
  priority: 'high' | 'medium' | 'low';
  
  /** Evidenze del pattern */
  evidence: string[];
  
  /** Soluzioni proposte */
  solutions: any[];
}

// =====================================================
// 🎯 INTELLIGENT RECOMMENDATIONS
// =====================================================

/**
 * Sistema di raccomandazioni intelligenti
 */
export interface IntelligentRecommendationSystem {
  /** Raccomandazioni per obiettivi */
  goalBasedRecommendations: GoalBasedRecommendation[];
  
  /** Raccomandazioni per debolezze */
  weaknessBasedRecommendations: WeaknessBasedRecommendation[];
  
  /** Raccomandazioni temporali */
  timingRecommendations: TimingRecommendation[];
  
  /** Raccomandazioni strategiche */
  strategicRecommendations: StrategicRecommendation[];
  
  /** Score di personalizzazione */
  personalizationScore: number;
}

/**
 * Raccomandazione basata su obiettivi
 */
export interface GoalBasedRecommendation {
  /** Obiettivo target */
  targetGoal: LearningGoal;
  
  /** Priorità (1-5) */
  priority: number;
  
  /** Piano d'azione */
  actionPlan: ActionStep[];
  
  /** Tempo stimato per obiettivo */
  estimatedTimeToGoal: number;
  
  /** Probabilità successo */
  successProbability: number;
  
  /** Metriche da monitorare */
  trackingMetrics: string[];
  
  /** Obiettivo specifico */
  goal: {
    type: string;
    targetValue: number;
    currentValue: number;
    unit: string;
  };
  
  /** Timeframe stimato */
  estimatedTimeframe: string;
  
  /** Confidenza nella raccomandazione */
  confidence: string;
  
  /** Azioni suggerite */
  suggestedActions: string[];
  
  /** Milestones intermedi */
  milestones: Array<{
    value: number;
    description: string;
  }>;
}

/**
 * Obiettivo di apprendimento
 */
export interface LearningGoal {
  /** Nome obiettivo */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Tipo obiettivo */
  type: 'accuracy' | 'speed' | 'efficiency' | 'vocabulary' | 'consistency';
  
  /** Valore target */
  targetValue: number;
  
  /** Valore attuale */
  currentValue: number;
  
  /** Timeframe obiettivo */
  timeframe: ProjectionTimeframe;
}

/**
 * Step di azione
 */
export interface ActionStep {
  /** Titolo step */
  title: string;
  
  /** Descrizione dettagliata */
  description: string;
  
  /** Ordine di esecuzione */
  order: number;
  
  /** Difficoltà (1-5) */
  difficulty: number;
  
  /** Tempo stimato */
  estimatedTime: number;
  
  /** Risultato atteso */
  expectedOutcome: string;
}

/**
 * Raccomandazione per debolezze
 */
export interface WeaknessBasedRecommendation {
  /** Debolezza identificata */
  weakness: IdentifiedWeakness;
  
  /** Severità (1-5) */
  severity: number;
  
  /** Soluzioni proposte */
  solutions: Solution[];
  
  /** Impatto stimato miglioramento */
  estimatedImprovementImpact: number;
  
  /** Tempo per vedere risultati */
  timeToResults: number;
  
  /** Miglioramento target */
  targetImprovement: number;
  
  /** Azioni raccomandate */
  recommendedActions: string[];
  
  /** Strategia di pratica */
  practiceStrategy: {
    frequency: string;
    duration: string;
    method: string;
    focusAreas: string[];
  };
  
  /** Risultati attesi */
  expectedResults: {
    timeframe: string;
    accuracyIncrease?: number;
    speedImprovement?: number;
    confidenceLevel: number;
  };
}

/**
 * Debolezza identificata
 */
export interface IdentifiedWeakness {
  /** Area della debolezza */
  area: 'accuracy' | 'speed' | 'consistency' | 'efficiency' | 'retention';
  
  /** Descrizione specifica */
  description: string;
  
  /** Evidenze */
  evidence: WeaknessEvidence[];
  
  /** Trend della debolezza */
  trend: 'worsening' | 'stable' | 'improving';
  
  /** Tipo di debolezza */
  type: string;
  
  /** Severità della debolezza */
  severity: string;
  
  /** Parole affette da questa debolezza */
  affectedWords: any[];
}

/**
 * Evidenza di debolezza
 */
export interface WeaknessEvidence {
  /** Tipo evidenza */
  type: 'statistical' | 'pattern' | 'comparative';
  
  /** Valore numerico */
  value: number;
  
  /** Descrizione */
  description: string;
  
  /** Confidenza evidenza */
  confidence: number;
}

/**
 * Soluzione proposta
 */
export interface Solution {
  /** Nome soluzione */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Tipo soluzione */
  type: 'practice' | 'strategy' | 'timing' | 'focus';
  
  /** Efficacia stimata (0-100) */
  estimatedEffectiveness: number;
  
  /** Effort richiesto (1-5) */
  requiredEffort: number;
  
  /** Istruzioni specifiche */
  instructions: string[];
  
  /** Titolo della soluzione */
  title: string;
  
  /** Livello di difficoltà */
  difficulty: string;
  
  /** Impatto stimato */
  estimatedImpact: number;
  
  /** Tempo per implementare */
  timeToImplement: string;
}

/**
 * Raccomandazione temporale
 */
export interface TimingRecommendation {
  /** Orario ottimale studio */
  optimalStudyTime: TimeSlot;
  
  /** Durata sessione consigliata */
  recommendedSessionDuration: number;
  
  /** Frequenza ottimale */
  optimalFrequency: StudyFrequency;
  
  /** Break pattern consigliato */
  recommendedBreakPattern: BreakPattern;
  
  /** Evidenze per la raccomandazione */
  supportingEvidence: string[];
}

/**
 * Slot temporale
 */
export interface TimeSlot {
  /** Ora inizio */
  startHour: number;
  
  /** Ora fine */
  endHour: number;
  
  /** Giorni settimana */
  daysOfWeek: number[];
  
  /** Performance media in questo slot */
  averagePerformance: number;
  
  /** Confidenza raccomandazione */
  confidence: number;
}

/**
 * Frequenza studio
 */
export interface StudyFrequency {
  /** Sessioni per settimana */
  sessionsPerWeek: number;
  
  /** Distribuzione nel tempo */
  distribution: 'daily' | 'every_other_day' | 'weekends' | 'custom';
  
  /** Pattern personalizzato se custom */
  customPattern?: number[];
}

/**
 * Pattern di break
 */
export interface BreakPattern {
  /** Durata break breve (minuti) */
  shortBreakDuration: number;
  
  /** Frequenza break breve */
  shortBreakFrequency: number;
  
  /** Durata break lungo (minuti) */
  longBreakDuration: number;
  
  /** Frequenza break lungo */
  longBreakFrequency: number;
}

/**
 * Raccomandazione strategica
 */
export interface StrategicRecommendation {
  /** Strategia consigliata */
  strategy: LearningStrategy | string;
  
  /** Motivo raccomandazione */
  rationale: string;
  
  /** Benefici attesi */
  expectedBenefits: string[];
  
  /** Rischi potenziali */
  potentialRisks: string[];
  
  /** Metriche per valutare successo */
  successMetrics: string[];
  
  /** Durata test consigliata */
  recommendedTrialDuration: number;
  
  /** Titolo della raccomandazione */
  title: string;
  
  /** Descrizione dettagliata */
  description: string;
  
  /** Priorità della raccomandazione */
  priority: string;
  
  /** Passi di implementazione */
  implementationSteps: string[];
  
  /** Risultato atteso */
  expectedOutcome: {
    timeframe: string;
    performanceGain: number;
    riskLevel: string;
  };
  
  /** Aspetti personalizzati */
  personalizedAspects: string[];
}

/**
 * Strategia di apprendimento
 */
export interface LearningStrategy {
  /** Nome strategia */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Tipo strategia */
  type: 'spaced_repetition' | 'intensive_focus' | 'mixed_practice' | 'difficulty_progression';
  
  /** Parametri strategia */
  parameters: Record<string, any>;
  
  /** Complessità implementazione (1-5) */
  complexity: number;
}

// =====================================================
// 🔄 ADAPTIVE LEARNING SYSTEM
// =====================================================

/**
 * Sistema di apprendimento adattivo
 */
export interface AdaptiveLearningSystem {
  /** Profilo learner corrente */
  learnerProfile: LearnerProfile;
  
  /** Adattamenti suggeriti */
  suggestedAdaptations: LearningAdaptation[];
  
  /** Efficacia adattamenti precedenti */
  adaptationHistory: AdaptationHistoryEntry[];
  
  /** Prossimi adattamenti pianificati */
  plannedAdaptations: PlannedAdaptation[];
}

/**
 * Profilo del learner
 */
export interface LearnerProfile {
  /** Tipo di learner */
  learnerType: LearnerType;
  
  /** Caratteristiche principali */
  characteristics: LearnerCharacteristic[];
  
  /** Preferenze identificate */
  preferences: LearnerPreference[];
  
  /** Punti di forza */
  strengths: string[];
  
  /** Aree di miglioramento */
  improvementAreas: string[];
  
  /** Confidence generale */
  overallConfidence: number;
  
  /** Stile di apprendimento */
  learningStyle: string;
  
  /** Difficoltà preferita */
  preferredDifficulty: string;
  
  /** Durata sessione ottimale */
  optimalSessionLength: number;
  
  /** Ore di picco performance */
  peakPerformanceHours: number[];
  
  /** Sfide attuali */
  challenges: string[];
}

/**
 * Tipo di learner
 */
export type LearnerType = 
  | 'visual'
  | 'auditory' 
  | 'kinesthetic'
  | 'analytical'
  | 'intuitive'
  | 'mixed';

/**
 * Caratteristica del learner
 */
export interface LearnerCharacteristic {
  /** Nome caratteristica */
  name: string;
  
  /** Intensità (0-1) */
  intensity: number;
  
  /** Evidenze */
  evidence: string[];
  
  /** Impatto sull'apprendimento */
  learningImpact: 'positive' | 'neutral' | 'negative';
}

/**
 * Preferenza del learner
 */
export interface LearnerPreference {
  /** Area preferenza */
  area: 'timing' | 'difficulty' | 'content' | 'format' | 'feedback';
  
  /** Valore preferenza */
  value: string;
  
  /** Forza preferenza (0-1) */
  strength: number;
  
  /** Flessibilità */
  flexibility: number;
}

/**
 * Adattamento di apprendimento
 */
export interface LearningAdaptation {
  /** Tipo adattamento */
  type: AdaptationType;
  
  /** Descrizione cambiamento */
  description: string;
  
  /** Parametri specifici */
  parameters: Record<string, any>;
  
  /** Impatto atteso */
  expectedImpact: number;
  
  /** Difficoltà implementazione */
  implementationDifficulty: number;
  
  /** Condizioni per attivazione */
  activationConditions: string[];
}

/**
 * Tipo di adattamento
 */
export type AdaptationType = 
  | 'difficulty_adjustment'
  | 'pacing_change'
  | 'content_reordering'
  | 'feedback_modification'
  | 'practice_intensification'
  | 'break_pattern_change';

/**
 * Entry storica adattamenti
 */
export interface AdaptationHistoryEntry {
  /** Adattamento applicato */
  adaptation: LearningAdaptation;
  
  /** Data applicazione */
  appliedAt: Date;
  
  /** Durata applicazione */
  duration: number;
  
  /** Risultati osservati */
  observedResults: AdaptationResult[];
  
  /** Efficacia complessiva */
  overallEffectiveness: number;
  
  /** Note aggiuntive */
  notes: string;
}

/**
 * Risultato adattamento
 */
export interface AdaptationResult {
  /** Metrica impattata */
  metric: string;
  
  /** Valore prima */
  beforeValue: number;
  
  /** Valore dopo */
  afterValue: number;
  
  /** Cambiamento percentuale */
  percentageChange: number;
  
  /** Significatività cambiamento */
  significance: number;
}

/**
 * Adattamento pianificato
 */
export interface PlannedAdaptation {
  /** Adattamento da applicare */
  adaptation: LearningAdaptation;
  
  /** Data pianificata */
  scheduledFor: Date;
  
  /** Condizioni per attivazione */
  triggerConditions: TriggerCondition[];
  
  /** Priorità (1-5) */
  priority: number;
  
  /** Approvazione richiesta */
  requiresApproval: boolean;
}

/**
 * Condizione trigger
 */
export interface TriggerCondition {
  /** Metrica da monitorare */
  metric: string;
  
  /** Operatore confronto */
  operator: 'greater_than' | 'less_than' | 'equals' | 'trend_up' | 'trend_down';
  
  /** Valore soglia */
  threshold: number;
  
  /** Durata condizione */
  duration: number;
}

// =====================================================
// 🏆 GAMIFICATION & MOTIVATION
// =====================================================

/**
 * Sistema di gamificazione per tendenze
 */
export interface TrendsGamificationSystem {
  /** Achievement sbloccabili */
  achievements: TrendsAchievement[];
  
  /** Challenge attivi */
  activeChallenges: TrendsChallenge[];
  
  /** Sistema punti trend */
  trendPointSystem: TrendPointSystem;
  
  /** Classifiche competitive */
  leaderboards: TrendsLeaderboard[];
  
  /** Motivational insights */
  motivationalInsights: MotivationalInsight[];
}

/**
 * Achievement delle tendenze
 */
export interface TrendsAchievement {
  /** ID achievement */
  id: string;
  
  /** Nome achievement */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Icona */
  icon: string;
  
  /** Rarità */
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  /** Condizioni unlock */
  unlockConditions: AchievementCondition[];
  
  /** Punti reward */
  rewardPoints: number;
  
  /** Sbloccato */
  unlocked: boolean;
  
  /** Data unlock */
  unlockedAt?: Date;
}

/**
 * Condizione achievement
 */
export interface AchievementCondition {
  /** Tipo condizione */
  type: 'trend_improvement' | 'consistency' | 'velocity' | 'projection_accuracy';
  
  /** Parametri condizione */
  parameters: Record<string, any>;
  
  /** Progresso attuale */
  currentProgress: number;
  
  /** Target richiesto */
  requiredProgress: number;
}

/**
 * Challenge delle tendenze
 */
export interface TrendsChallenge {
  /** ID challenge */
  id: string;
  
  /** Nome challenge */
  name: string;
  
  /** Descrizione */
  description: string;
  
  /** Tipo challenge */
  type: 'short_term' | 'medium_term' | 'long_term';
  
  /** Durata challenge */
  duration: number;
  
  /** Data inizio */
  startDate: Date;
  
  /** Data fine */
  endDate: Date;
  
  /** Obiettivi challenge */
  objectives: ChallengeObjective[];
  
  /** Rewards */
  rewards: ChallengeReward[];
  
  /** Progresso attuale */
  currentProgress: number;
  
  /** Completato */
  completed: boolean;
}

/**
 * Obiettivo challenge
 */
export interface ChallengeObjective {
  /** Descrizione obiettivo */
  description: string;
  
  /** Metrica target */
  targetMetric: string;
  
  /** Valore target */
  targetValue: number;
  
  /** Valore attuale */
  currentValue: number;
  
  /** Completato */
  completed: boolean;
}

/**
 * Reward challenge
 */
export interface ChallengeReward {
  /** Tipo reward */
  type: 'points' | 'badge' | 'feature_unlock' | 'cosmetic';
  
  /** Valore reward */
  value: any;
  
  /** Descrizione */
  description: string;
}

/**
 * Sistema punti trend
 */
export interface TrendPointSystem {
  /** Punti attuali */
  currentPoints: number;
  
  /** Punti totali guadagnati */
  totalPointsEarned: number;
  
  /** Livello attuale */
  currentLevel: number;
  
  /** Punti per prossimo livello */
  pointsToNextLevel: number;
  
  /** Moltiplicatori attivi */
  activeMultipliers: PointMultiplier[];
  
  /** Storia guadagni */
  earningsHistory: PointEarningEntry[];
}

/**
 * Moltiplicatore punti
 */
export interface PointMultiplier {
  /** Nome moltiplicatore */
  name: string;
  
  /** Valore moltiplicatore */
  multiplier: number;
  
  /** Condizioni applicazione */
  conditions: string[];
  
  /** Scadenza */
  expiresAt?: Date;
}

/**
 * Entry guadagno punti
 */
export interface PointEarningEntry {
  /** Punti guadagnati */
  points: number;
  
  /** Motivo guadagno */
  reason: string;
  
  /** Data guadagno */
  earnedAt: Date;
  
  /** Moltiplicatori applicati */
  multipliersApplied: string[];
}

/**
 * Classifica tendenze
 */
export interface TrendsLeaderboard {
  /** Tipo classifica */
  type: 'improvement_velocity' | 'consistency' | 'projection_accuracy' | 'achievement_count';
  
  /** Timeframe classifica */
  timeframe: 'weekly' | 'monthly' | 'all_time';
  
  /** Posizioni */
  rankings: LeaderboardEntry[];
  
  /** Posizione utente corrente */
  userRank?: number;
  
  /** Aggiornata al */
  updatedAt: Date;
}

/**
 * Entry classifica
 */
export interface LeaderboardEntry {
  /** Posizione */
  rank: number;
  
  /** ID utente (anonimizzato) */
  userId: string;
  
  /** Nome display */
  displayName: string;
  
  /** Valore metrica */
  value: number;
  
  /** Badge/Achievement speciali */
  badges: string[];
}

/**
 * Insight motivazionale
 */
export interface MotivationalInsight {
  /** Tipo insight */
  type: 'encouragement' | 'milestone_celebration' | 'challenge_reminder' | 'progress_highlight';
  
  /** Messaggio */
  message: string;
  
  /** Dati di supporto */
  supportingData: Record<string, any>;
  
  /** Priorità visualizzazione */
  priority: number;
  
  /** Validità */
  validUntil: Date;
  
  /** Azioni suggerite */
  suggestedActions: string[];
}

// =====================================================
// 📋 AGGREGATE INTERFACES
// =====================================================

/**
 * Risultato completo analisi tendenze
 */
export interface ComprehensiveTrendsAnalysis {
  /** Analisi velocità apprendimento */
  learningVelocity: LearningVelocityAnalysis;
  
  /** Proiezioni future */
  futureProjections: PerformanceProjection[];
  
  /** Analisi pattern */
  patternAnalysis: LearningPatternAnalysis;
  
  /** Sistema raccomandazioni */
  recommendationSystem: IntelligentRecommendationSystem;
  
  /** Sistema adattivo */
  adaptiveLearningSystem: AdaptiveLearningSystem;
  
  /** Sistema gamificazione */
  gamificationSystem: TrendsGamificationSystem;
  
  /** Metadati analisi */
  analysisMetadata: TrendsAnalysisMetadata;
}

/**
 * Metadati analisi tendenze
 */
export interface TrendsAnalysisMetadata {
  /** Timestamp generazione */
  generatedAt: Date;
  
  /** Versione algoritmo */
  algorithmVersion: string;
  
  /** Dati utilizzati */
  dataSourcesUsed: string[];
  
  /** Periodo analizzato */
  analysisTimeframe: {
    startDate: Date;
    endDate: Date;
  };
  
  /** Confidenza complessiva */
  overallConfidence: number;
  
  /** Limitazioni analisi */
  limitations: string[];
  
  /** Validità risultati */
  validUntil: Date;
}

/**
 * Input per calcolo tendenze
 */
export interface TrendsCalculationInput {
  /** Cronologia test */
  testHistory: TestHistoryItem[];
  
  /** Analisi performance parole */
  wordPerformances: WordPerformanceAnalysis[];
  
  /** Sessioni dettagliate */
  detailedSessions?: any[];
  
  /** Configurazioni utente */
  userPreferences?: Record<string, any>;
  
  /** Obiettivi utente */
  userGoals?: LearningGoal[];
  
  /** Timeframe analisi */
  analysisTimeframe: ProjectionTimeframe;
}
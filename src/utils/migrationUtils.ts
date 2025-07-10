// =====================================================
// 📁 src/utils/migrationUtils.ts - VERSIONE SISTEMATA CON CHIAVI CORRETTE
// =====================================================

import {
  DATA_VERSION,
  DetailedWordResponse,
  OptimizedTestResult,
  OptimizedWord,
  STORAGE_KEYS,
  TestDifficulty,
  TestType
} from '../types/optimized';

// ⭐ LEGACY TYPES (struttura attuale)
interface LegacyWord {
  id: string;
  english: string;
  italian: string;
  group?: string | null;
  sentence?: string | null;
  notes?: string | null;
  chapter?: string | null;
  learned: boolean;
  difficult: boolean;
}

interface LegacyTestResult {
  id: number;
  timestamp: Date | string;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  hintsUsed: number;
  totalTime: number;
  avgTimePerWord: number;
  percentage: number;
  wrongWords?: LegacyWord[];
  wordTimes?: Array<{
    wordId: string;
    timeSpent: number;
    isCorrect: boolean;
    usedHint: boolean;
  }>;
  chapterStats?: Record<string, any>;
  testParameters?: {
    selectedChapters: string[];
  };
  testType?: string;
  difficulty?: string;
}

// ⭐ MIGRATION REPORT TYPES
interface MigrationReport {
  startTime: string;
  endTime: string;
  wordsProcessed: number;
  testsProcessed: number;
  errorsEncountered: Array<{
    type: string;
    item: string;
    error: string;
  }>;
  warnings: string[];
  estimationsUsed: number;
  dataQualityScore: number;
}

interface QualityCheck {
  hasEstimations: boolean;
  warnings: string[];
  accuracyScore: number;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Carica le parole legacy dal localStorage - SISTEMATO con chiavi multiple
 */
function loadLegacyWords(): LegacyWord[] {
  const possibleKeys = [
    'vocabularyWords',      // Chiave originale dal tuo codice
    'vocabulary_words',     // Possibile alternativa
    'words',               // Alternativa semplice
    'wordList',
    'vocabulary_wordList'
  ];

  for (const key of possibleKeys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ Parole legacy trovate in: ${key} (${data.length} elementi)`);
          return data;
        }
      }
    } catch (error) {
      console.warn(`Errore nel parsing della chiave ${key}:`, error);
    }
  }

  console.warn('⚠️ Nessuna parola legacy trovata nelle chiavi:', possibleKeys);
  return [];
}

/**
 * Carica i test legacy dal localStorage - SISTEMATO con chiavi multiple
 */
function loadLegacyTests(): LegacyTestResult[] {
  const possibleKeys = [
    'vocabulary_test_history',  // ⭐ AGGIUNGIAMO QUESTA PRIMA (quella che hai menzionato)
    'vocabularyTests',          // Chiave originale dal tuo codice  
    'testHistory',             // Alternativa comune
    'test_history',
    'testResults',
    'vocabulary_testResults'
  ];

  for (const key of possibleKeys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ Test legacy trovati in: ${key} (${data.length} elementi)`);
          return data;
        }
      }
    } catch (error) {
      console.warn(`Errore nel parsing della chiave ${key}:`, error);
    }
  }

  console.warn('⚠️ Nessun test legacy trovato nelle chiavi:', possibleKeys);
  return [];
}

/**
 * Carica le statistiche legacy dal localStorage - SISTEMATO con chiavi multiple
 */
function loadLegacyStats(): any {
  const possibleKeys = [
    'vocabularyStats',      // Chiave originale dal tuo codice
    'vocabulary_stats',
    'stats',
    'appStats'
  ];

  for (const key of possibleKeys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        if (typeof data === 'object' && Object.keys(data).length > 0) {
          console.log(`✅ Statistiche legacy trovate in: ${key}`);
          return data;
        }
      }
    } catch (error) {
      console.warn(`Errore nel parsing della chiave ${key}:`, error);
    }
  }

  console.warn('⚠️ Nessuna statistica legacy trovata');
  return {};
}

/**
 * Carica le performance delle parole legacy dal localStorage - SISTEMATO con chiavi multiple
 */
function loadLegacyWordPerformance(): any {
  const possibleKeys = [
    'wordPerformance',          // Chiave originale dal tuo codice
    'vocabulary_wordPerformance',
    'word_performance',
    'wordStats'
  ];

  for (const key of possibleKeys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        if (typeof data === 'object' && Object.keys(data).length > 0) {
          console.log(`✅ Word performance legacy trovata in: ${key} (${Object.keys(data).length} parole)`);
          return data;
        }
      }
    } catch (error) {
      console.warn(`Errore nel parsing della chiave ${key}:`, error);
    }
  }

  console.warn('⚠️ Nessuna word performance legacy trovata');
  return {};
}

// ===== CONVERSION FUNCTIONS =====

/**
 * Converte una parola legacy nella nuova struttura ottimizzata
 */
export function migrateLegacyWord(legacyWord: LegacyWord): OptimizedWord {
  const now = new Date().toISOString();
  
  // ⭐ GESTIONE SENTENCE come array
  let optimizedSentence: string | string[] | null = null;
  if (legacyWord.sentence) {
    // Se contiene separatori, dividi in array
    if (legacyWord.sentence.includes('|') || legacyWord.sentence.includes(';')) {
      optimizedSentence = legacyWord.sentence
        .split(/[|;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else {
      optimizedSentence = legacyWord.sentence;
    }
  }
  
  return {
    id: legacyWord.id,
    english: legacyWord.english,
    italian: legacyWord.italian,
    group: legacyWord.group,
    sentence: optimizedSentence,
    notes: legacyWord.notes,
    chapter: legacyWord.chapter,
    learned: legacyWord.learned,
    difficult: legacyWord.difficult,
    // ⭐ NUOVI CAMPI con valori di default
    synonyms: [],
    antonyms: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Converte un test legacy nella nuova struttura ottimizzata CON integrazione statistiche
 */
function migrateLegacyTestResultWithStats(
  legacyTest: LegacyTestResult,
  allWords: OptimizedWord[],
  legacyWordPerformance: any
): OptimizedTestResult {
  const timestamp = typeof legacyTest.timestamp === 'string' 
    ? legacyTest.timestamp 
    : legacyTest.timestamp.toISOString();

  // ⭐ CRITICAL: Ricostruisci le risposte dettagliate CON dati performance
  const { rightWords, wrongWords } = reconstructDetailedResponsesWithStats(
    legacyTest, 
    allWords, 
    legacyWordPerformance
  );

  // ⭐ Mappatura del tipo di test
  const testType: TestType = mapLegacyTestType(legacyTest.testType);
  
  // ⭐ Mappatura della difficoltà
  const difficulty: TestDifficulty = mapLegacyDifficulty(legacyTest.difficulty, legacyTest.totalWords);

  return {
    id: `migrated_${legacyTest.id}_${Date.now()}`,
    timestamp,
    totalWords: legacyTest.totalWords,
    correctWords: legacyTest.correctWords,
    incorrectWords: legacyTest.incorrectWords,
    totalTime: legacyTest.totalTime * 1000, // Converti in millisecondi
    avgTimePerWord: legacyTest.avgTimePerWord * 1000, // Converti in millisecondi
    percentage: legacyTest.percentage,
    difficulty,
    hintsUsed: legacyTest.hintsUsed,
    selectedChapters: legacyTest.testParameters?.selectedChapters || [],
    testType,
    rightWords,
    wrongWords,
    version: DATA_VERSION
  };
}

/**
 * Ricostruisce le risposte dettagliate dai dati legacy CON integrazione statistiche
 */
function reconstructDetailedResponsesWithStats(
  legacyTest: LegacyTestResult,
  allWords: OptimizedWord[],
  legacyWordPerformance: any
): { rightWords: DetailedWordResponse[]; wrongWords: DetailedWordResponse[] } {
  const rightWords: DetailedWordResponse[] = [];
  const wrongWords: DetailedWordResponse[] = [];

  // ⭐ PRIORITY 1: Usa wordTimes se disponibili (dati più accurati)
  if (legacyTest.wordTimes && legacyTest.wordTimes.length > 0) {
    legacyTest.wordTimes.forEach(wordTime => {
      const response: DetailedWordResponse = {
        wordId: wordTime.wordId,
        timeResponse: wordTime.timeSpent,
        hintsUsed: wordTime.usedHint ? 1 : 0,
        currentDifficulty: estimateWordDifficulty(wordTime.wordId, allWords),
        isCorrect: wordTime.isCorrect,
        timestamp: legacyTest.timestamp.toString()
      };

      if (wordTime.isCorrect) {
        rightWords.push(response);
      } else {
        wrongWords.push(response);
      }
    });
  } else {
    // ⭐ PRIORITY 2: Ricostruisci dai dati aggregati + performance legacy
    
    // Prima, aggiungi le parole sbagliate (abbiamo l'elenco)
    if (legacyTest.wrongWords && legacyTest.wrongWords.length > 0) {
      legacyTest.wrongWords.forEach(wrongWord => {
        const wordPerf = legacyWordPerformance[wrongWord.id];
        
        const response: DetailedWordResponse = {
          wordId: wrongWord.id,
          timeResponse: estimateTimeFromPerformance(wordPerf, 'incorrect'),
          hintsUsed: estimateHintsFromPerformance(wordPerf, 'incorrect'),
          currentDifficulty: estimateWordDifficulty(wrongWord.id, allWords),
          isCorrect: false,
          timestamp: legacyTest.timestamp.toString()
        };
        wrongWords.push(response);
      });
    }

    // ⭐ CRITICAL: Stima le parole corrette usando performance data
    const correctWordsCount = legacyTest.correctWords;
    const testedChapters = legacyTest.testParameters?.selectedChapters || [];
    
    // Trova parole probabilmente corrette nel test
    const candidateCorrectWords = allWords.filter(word => {
      // Se il test aveva capitoli specifici, filtra per quelli
      if (testedChapters.length > 0) {
        return testedChapters.includes(word.chapter || '');
      }
      return true;
    }).filter(word => {
      // Escludi parole che sappiamo essere sbagliate
      return !legacyTest.wrongWords?.some(w => w.id === word.id);
    });

    // Prendi le migliori candidate basandoti su performance
    const sortedCandidates = candidateCorrectWords
      .map(word => ({
        word,
        performance: legacyWordPerformance[word.id],
        estimatedCorrectness: estimateWordCorrectnessProbability(word, legacyWordPerformance[word.id])
      }))
      .sort((a, b) => b.estimatedCorrectness - a.estimatedCorrectness)
      .slice(0, correctWordsCount);

    sortedCandidates.forEach((candidate, index) => {
      const response: DetailedWordResponse = {
        wordId: candidate.word.id,
        timeResponse: estimateTimeFromPerformance(candidate.performance, 'correct'),
        hintsUsed: estimateHintsFromPerformance(candidate.performance, 'correct'),
        currentDifficulty: estimateWordDifficulty(candidate.word.id, allWords),
        isCorrect: true,
        timestamp: legacyTest.timestamp.toString()
      };
      rightWords.push(response);
    });
  }

  return { rightWords, wrongWords };
}

// ===== ESTIMATION FUNCTIONS =====

/**
 * Stima il tempo basandosi sui dati di performance
 */
function estimateTimeFromPerformance(wordPerf: any, type: 'correct' | 'incorrect'): number {
  if (wordPerf && wordPerf.avgTime) {
    // Usa tempo medio dalla performance
    const baseTime = wordPerf.avgTime * 1000; // Converti in millisecondi
    
    if (type === 'incorrect') {
      return Math.round(baseTime * 1.4); // Le parole sbagliate prendono più tempo
    } else {
      return Math.round(baseTime * 0.9); // Le parole corrette sono più veloci
    }
  }
  
  // Fallback a stima generica
  return type === 'incorrect' ? 15000 : 8000; // millisecondi
}

/**
 * Stima gli aiuti basandosi sui dati di performance
 */
function estimateHintsFromPerformance(wordPerf: any, type: 'correct' | 'incorrect'): number {
  if (wordPerf && wordPerf.hintsPercentage !== undefined) {
    // Usa percentuale aiuti dalla performance
    const hintProbability = wordPerf.hintsPercentage / 100;
    
    if (type === 'incorrect') {
      // Le parole sbagliate hanno maggiore probabilità di aver usato aiuti
      return Math.random() < (hintProbability * 1.5) ? 1 : 0;
    } else {
      // Le parole corrette hanno minore probabilità
      return Math.random() < (hintProbability * 0.7) ? 1 : 0;
    }
  }
  
  // Fallback a stima generica
  return type === 'incorrect' && Math.random() < 0.4 ? 1 : 0;
}

/**
 * Stima la probabilità che una parola sia stata corretta in un test
 */
function estimateWordCorrectnessProbability(word: OptimizedWord, wordPerf: any): number {
  let probability = 0.5; // Base 50%
  
  if (wordPerf) {
    if (wordPerf.accuracy !== undefined) {
      probability = wordPerf.accuracy / 100; // Usa accuratezza storica
    }
    
    if (wordPerf.currentStreak > 2) {
      probability += 0.2; // Bonus per streak
    }
    
    if (wordPerf.hintsPercentage > 50) {
      probability -= 0.1; // Penalità per troppi aiuti
    }
  }
  
  if (word.learned) {
    probability += 0.3; // Bonus per parole apprese
  }
  
  if (word.difficult) {
    probability -= 0.2; // Penalità per parole difficili
  }
  
  return Math.max(0.1, Math.min(0.9, probability)); // Clamp tra 10% e 90%
}

/**
 * Stima la difficoltà di una parola basandosi sui metadati
 */
function estimateWordDifficulty(wordId: string, allWords: OptimizedWord[]): TestDifficulty {
  const word = allWords.find(w => w.id === wordId);
  
  if (!word) return 'medium';
  
  // Logica di stima basata sulle caratteristiche della parola
  if (word.difficult) return 'hard';
  if (word.learned) return 'easy';
  
  // Stima basata sulla lunghezza della parola
  const wordLength = word.english.length;
  if (wordLength > 12) return 'hard';
  if (wordLength < 6) return 'easy';
  
  return 'medium';
}

/**
 * Mappa il tipo di test legacy al nuovo enum
 */
function mapLegacyTestType(legacyType?: string): TestType {
  if (!legacyType) return 'complete';
  
  const typeMap: Record<string, TestType> = {
    'complete': 'complete',
    'selective': 'selective',
    'difficult': 'difficult',
    'learned': 'learned',
    'mixed': 'mixed',
    'review': 'review'
  };
  
  return typeMap[legacyType.toLowerCase()] || 'complete';
}

/**
 * Mappa la difficoltà legacy al nuovo enum
 */
function mapLegacyDifficulty(legacyDifficulty?: string, totalWords?: number): TestDifficulty {
  if (legacyDifficulty) {
    const difficultyMap: Record<string, TestDifficulty> = {
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard'
    };
    
    const mapped = difficultyMap[legacyDifficulty.toLowerCase()];
    if (mapped) return mapped;
  }
  
  // Stima basata sul numero di parole
  if (!totalWords) return 'medium';
  
  if (totalWords < 15) return 'easy';
  if (totalWords > 30) return 'hard';
  return 'medium';
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Valida la qualità dei dati del test migrato
 */
function validateTestDataQuality(
  legacyTest: LegacyTestResult,
  optimizedTest: OptimizedTestResult
): QualityCheck {
  const warnings: string[] = [];
  let hasEstimations = false;
  let accuracyScore = 100;

  // ⭐ CHECK 1: Verifica la presenza di wordTimes
  if (!legacyTest.wordTimes || legacyTest.wordTimes.length === 0) {
    warnings.push(`Test ${legacyTest.id}: wordTimes mancanti, dati stimati`);
    hasEstimations = true;
    accuracyScore -= 20;
  }

  // ⭐ CHECK 2: Verifica la coerenza dei contatori
  const expectedTotal = optimizedTest.rightWords.length + optimizedTest.wrongWords.length;
  if (expectedTotal !== legacyTest.totalWords) {
    warnings.push(`Test ${legacyTest.id}: discrepanza nel conteggio parole (${expectedTotal} vs ${legacyTest.totalWords})`);
    accuracyScore -= 15;
  }

  // ⭐ CHECK 3: Verifica la presenza di timing data
  const hasTimingData = optimizedTest.rightWords.some(w => w.timeResponse > 0) ||
                       optimizedTest.wrongWords.some(w => w.timeResponse > 0);
  if (!hasTimingData) {
    warnings.push(`Test ${legacyTest.id}: dati di timing stimati`);
    hasEstimations = true;
    accuracyScore -= 10;
  }

  // ⭐ CHECK 4: Verifica la distribuzione degli aiuti
  const totalHints = optimizedTest.rightWords.reduce((sum, w) => sum + w.hintsUsed, 0) +
                    optimizedTest.wrongWords.reduce((sum, w) => sum + w.hintsUsed, 0);
  if (Math.abs(totalHints - legacyTest.hintsUsed) > 1) {
    warnings.push(`Test ${legacyTest.id}: distribuzione aiuti stimata (${totalHints} vs ${legacyTest.hintsUsed})`);
    hasEstimations = true;
    accuracyScore -= 5;
  }

  return {
    hasEstimations,
    warnings,
    accuracyScore: Math.max(0, accuracyScore)
  };
}

/**
 * Calcola un punteggio di qualità generale dei dati migrati
 */
function calculateDataQualityScore(
  legacyTests: LegacyTestResult[],
  optimizedTests: OptimizedTestResult[],
  report: MigrationReport
): number {
  if (legacyTests.length === 0) return 100;

  // ⭐ Fattori che influenzano la qualità
  const testsWithWordTimes = legacyTests.filter(t => t.wordTimes && t.wordTimes.length > 0).length;
  const wordTimesPercentage = (testsWithWordTimes / legacyTests.length) * 100;
  
  const errorRate = (report.errorsEncountered.length / (report.wordsProcessed + report.testsProcessed)) * 100;
  const estimationRate = (report.estimationsUsed / legacyTests.length) * 100;

  // ⭐ Calcolo del punteggio (0-100)
  let qualityScore = 100;
  
  // Penalizza per mancanza di dati dettagliati
  qualityScore -= (100 - wordTimesPercentage) * 0.5;
  
  // Penalizza per errori
  qualityScore -= errorRate * 2;
  
  // Penalizza per stime
  qualityScore -= estimationRate * 0.3;
  
  return Math.max(0, Math.round(qualityScore));
}

/**
 * Salva i dati ottimizzati nel localStorage
 */
async function saveOptimizedData(
  optimizedWords: OptimizedWord[],
  optimizedTests: OptimizedTestResult[]
): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.optimizedWords, JSON.stringify(optimizedWords));
    localStorage.setItem(STORAGE_KEYS.optimizedTests, JSON.stringify(optimizedTests));
    localStorage.setItem(STORAGE_KEYS.lastCalculated, new Date().toISOString());
    
    // ⭐ Mantieni i dati legacy come backup
    const backupKey = `backup_legacy_${Date.now()}`;
    
    // ⭐ SISTEMATO: Cerca in tutte le chiavi possibili per il backup
    const legacyWords = loadLegacyWords();
    const legacyTests = loadLegacyTests();
    
    if (legacyWords.length > 0 || legacyTests.length > 0) {
      localStorage.setItem(backupKey, JSON.stringify({
        words: legacyWords,
        tests: legacyTests,
        backupDate: new Date().toISOString()
      }));
    }
    
    console.log(`💾 Dati salvati. Backup legacy creato: ${backupKey}`);
    
  } catch (error) {
    throw new Error(`Errore nel salvataggio dei dati ottimizzati: ${(error as Error).message}`);
  }
}

// ===== MAIN MIGRATION FUNCTION =====

/**
 * Funzione principale di migrazione che converte tutti i dati legacy
 */
export async function migrateAllLegacyData(): Promise<{
  words: OptimizedWord[];
  tests: OptimizedTestResult[];
  migrationReport: MigrationReport;
}> {
  const migrationReport: MigrationReport = {
    startTime: new Date().toISOString(),
    endTime: '',
    wordsProcessed: 0,
    testsProcessed: 0,
    errorsEncountered: [],
    warnings: [],
    estimationsUsed: 0,
    dataQualityScore: 0
  };

  try {
    // ⭐ STEP 1: Carica i dati legacy - SISTEMATO con chiavi multiple
    const legacyWords = loadLegacyWords();
    const legacyTests = loadLegacyTests();
    
    // ⭐ STEP 1.5: Carica e migra anche le statistiche legacy - SISTEMATO con chiavi multiple
    const legacyStats = loadLegacyStats();
    const legacyWordPerformance = loadLegacyWordPerformance();
    
    console.log(`🔄 Iniziando migrazione: ${legacyWords.length} parole, ${legacyTests.length} test, performance: ${Object.keys(legacyWordPerformance).length} parole`);

    // ⭐ STEP 2: Migra le parole
    const optimizedWords: OptimizedWord[] = [];
    
    legacyWords.forEach((legacyWord: LegacyWord, index: number) => {
      try {
        const optimizedWord = migrateLegacyWord(legacyWord);
        optimizedWords.push(optimizedWord);
        migrationReport.wordsProcessed++;
      } catch (error) {
        migrationReport.errorsEncountered.push({
          type: 'word_migration',
          item: `Word ${index}: ${legacyWord.english}`,
          error: (error as Error).message
        });
      }
    });

    // ⭐ STEP 3: Migra i test con integrazione delle statistiche
    const optimizedTests: OptimizedTestResult[] = [];
    
    legacyTests.forEach((legacyTest: LegacyTestResult, index: number) => {
      try {
        const optimizedTest = migrateLegacyTestResultWithStats(
          legacyTest, 
          optimizedWords, 
          legacyWordPerformance
        );
        
        // ⭐ QUALITY CHECK: Verifica la coerenza dei dati
        const qualityCheck = validateTestDataQuality(legacyTest, optimizedTest);
        if (qualityCheck.hasEstimations) {
          migrationReport.estimationsUsed++;
        }
        if (qualityCheck.warnings.length > 0) {
          migrationReport.warnings.push(...qualityCheck.warnings);
        }
        
        optimizedTests.push(optimizedTest);
        migrationReport.testsProcessed++;
      } catch (error) {
        migrationReport.errorsEncountered.push({
          type: 'test_migration',
          item: `Test ${index}: ID ${legacyTest.id}`,
          error: (error as Error).message
        });
      }
    });

    // ⭐ STEP 4: Calcola il punteggio di qualità dei dati
    migrationReport.dataQualityScore = calculateDataQualityScore(
      legacyTests,
      optimizedTests,
      migrationReport
    );

    // ⭐ STEP 5: Salva i dati migrati
    await saveOptimizedData(optimizedWords, optimizedTests);

    migrationReport.endTime = new Date().toISOString();
    
    console.log(`✅ Migrazione completata!`, {
      words: migrationReport.wordsProcessed,
      tests: migrationReport.testsProcessed,
      errors: migrationReport.errorsEncountered.length,
      warnings: migrationReport.warnings.length,
      qualityScore: migrationReport.dataQualityScore
    });

    return {
      words: optimizedWords,
      tests: optimizedTests,
      migrationReport
    };

  } catch (error) {
    migrationReport.endTime = new Date().toISOString();
    migrationReport.errorsEncountered.push({
      type: 'migration_failure',
      item: 'Global migration process',
      error: (error as Error).message
    });
    
    throw error;
  }
}

// ===== UTILITY FUNCTIONS FOR MANUAL MIGRATION =====

/**
 * Verifica se è necessaria una migrazione - SISTEMATO con chiavi multiple
 */
export function needsMigration(): boolean {
  const hasOptimizedData = localStorage.getItem(STORAGE_KEYS.optimizedTests) !== null;
  
  // ⭐ SISTEMATO: Controlla tutte le possibili chiavi legacy
  const legacyWords = loadLegacyWords();
  const legacyTests = loadLegacyTests();
  const hasLegacyData = legacyWords.length > 0 || legacyTests.length > 0;
  
  console.log(`🔍 Controllo migrazione:`, {
    hasOptimizedData,
    hasLegacyData,
    legacyWordsCount: legacyWords.length,
    legacyTestsCount: legacyTests.length
  });
  
  return !hasOptimizedData && hasLegacyData;
}

/**
 * Ottieni un report sulla qualità dei dati legacy - SISTEMATO con chiavi multiple
 */
export function getLegacyDataReport(): {
  wordsCount: number;
  testsCount: number;
  testsWithDetailedData: number;
  estimatedQuality: number;
  recommendations: string[];
} {
  const legacyWords = loadLegacyWords();
  const legacyTests = loadLegacyTests();
  
  const testsWithDetailedData = legacyTests.filter(t => 
    t.wordTimes && t.wordTimes.length > 0
  ).length;
  
  const qualityPercentage = legacyTests.length > 0 ? 
    (testsWithDetailedData / legacyTests.length) * 100 : 0;
  
  const recommendations: string[] = [];
  
  if (qualityPercentage < 50) {
    recommendations.push('⚠️ Molti test non hanno dati dettagliati - saranno necessarie stime');
  }
  
  if (legacyTests.length === 0) {
    recommendations.push('ℹ️ Nessun test trovato - solo le parole saranno migrate');
  }
  
  if (legacyWords.length === 0) {
    recommendations.push('⚠️ Nessuna parola trovata - verifica che i dati siano presenti');
  }

  if (qualityPercentage >= 80) {
    recommendations.push('✅ Ottima qualità dei dati - migrazione raccomandata');
  }
  
  return {
    wordsCount: legacyWords.length,
    testsCount: legacyTests.length,
    testsWithDetailedData,
    estimatedQuality: Math.round(qualityPercentage),
    recommendations
  };
}

/**
 * Esegui una migrazione di test (dry run) - SISTEMATO con chiavi multiple
 */
export function testMigration(): MigrationReport {
  const report: MigrationReport = {
    startTime: new Date().toISOString(),
    endTime: '',
    wordsProcessed: 0,
    testsProcessed: 0,
    errorsEncountered: [],
    warnings: [],
    estimationsUsed: 0,
    dataQualityScore: 0
  };

  try {
    const legacyWords = loadLegacyWords();
    const legacyTests = loadLegacyTests();
    const legacyWordPerformance = loadLegacyWordPerformance();
    
    // Simula la migrazione senza salvare
    legacyWords.forEach((word: LegacyWord, index: number) => {
      try {
        migrateLegacyWord(word);
        report.wordsProcessed++;
      } catch (error) {
        report.errorsEncountered.push({
          type: 'word_test',
          item: `Word ${index}`,
          error: (error as Error).message
        });
      }
    });

    const optimizedWords = legacyWords.map(migrateLegacyWord);
    
    legacyTests.forEach((test: LegacyTestResult, index: number) => {
      try {
        const optimizedTest = migrateLegacyTestResultWithStats(test, optimizedWords, legacyWordPerformance);
        const qualityCheck = validateTestDataQuality(test, optimizedTest);
        
        if (qualityCheck.hasEstimations) report.estimationsUsed++;
        report.warnings.push(...qualityCheck.warnings);
        report.testsProcessed++;
      } catch (error) {
        report.errorsEncountered.push({
          type: 'test_test',
          item: `Test ${index}`,
          error: (error as Error).message
        });
      }
    });

    report.dataQualityScore = calculateDataQualityScore(legacyTests, [], report);
    report.endTime = new Date().toISOString();
    
    return report;
    
  } catch (error) {
    report.errorsEncountered.push({
      type: 'test_failure',
      item: 'Test migration',
      error: (error as Error).message
    });
    report.endTime = new Date().toISOString();
    return report;
  }
}

// ⭐ AGGIUNTO: Funzione di debug per vedere le chiavi localStorage
export function debugLocalStorageKeys(): void {
  console.log('🔍 === LOCALSTORAGE DEBUG ===');
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }
  
  console.log(`📊 Total keys: ${allKeys.length}`);
  console.log('📋 All keys:', allKeys.sort());
  
  // Filtra chiavi potenzialmente interessanti
  const testKeys = allKeys.filter(key => 
    key.toLowerCase().includes('test') || 
    key.toLowerCase().includes('history') || 
    key.toLowerCase().includes('result')
  );
  
  const wordKeys = allKeys.filter(key =>
    key.toLowerCase().includes('word') ||
    key.toLowerCase().includes('vocabulary') ||
    key.toLowerCase().includes('dict')
  );
  
  console.log('🧪 Test-related keys:', testKeys);
  console.log('📝 Word-related keys:', wordKeys);
  
  // Analizza contenuto delle chiavi interessanti
  [...testKeys, ...wordKeys].forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const data = JSON.parse(item);
        console.log(`🔑 ${key}:`, {
          type: Array.isArray(data) ? 'array' : typeof data,
          length: Array.isArray(data) ? data.length : 
                 typeof data === 'object' ? Object.keys(data).length : 
                 typeof data === 'string' ? data.length : 0
        });
      }
    } catch (e) {
      console.log(`🔑 ${key}: unparseable`);
    }
  });
}
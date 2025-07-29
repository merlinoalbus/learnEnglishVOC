// =====================================================
// 📊 src/services/WordPerformanceService.ts
// =====================================================

import type { Word } from '../types/entities/Word.types';
import type { 
  WordPerformanceAnalysis, 
  WordPerformance,
  PerformanceAttempt 
} from '../types/entities/Performance.types';
import type { TestHistoryItem } from '../types/entities/Test.types';

/**
 * Service dedicato per calcoli e analisi performance delle parole
 * Estrae tutte le logiche business dai componenti per rispettare l'architettura
 * DB => types => hooks/services => components
 */
export class WordPerformanceService {
  
  /**
   * ⭐ OTTIMIZZATO: Separa parole con/senza performance usando dati già disponibili
   * @param words - Array parole dal dizionario
   * @param wordPerformances - Map delle performance per wordId (già con dati aggregati!)
   * @param testHistory - Cronologia test per fallback data
   * @returns Oggetto con parole separate: conPerformance, senzaPerformance
   */
  analyzeWordsPerformanceOptimized(
    words: Word[],
    wordPerformances: Record<string, WordPerformance>,
    testHistory: TestHistoryItem[]
  ): {
    wordsWithPerformance: WordPerformanceAnalysis[];
    wordsWithoutPerformance: WordPerformanceAnalysis[];
    totalWords: number;
  } {
    
    if (!words || words.length === 0) {
      return {
        wordsWithPerformance: [],
        wordsWithoutPerformance: [],
        totalWords: 0
      };
    }

    // ⭐ CALCOLA IL TOTALE DEGLI AIUTI USATI DALL'UTENTE SU TUTTE LE PAROLE
    let totalUserHints = 0;
    Object.values(wordPerformances).forEach(performance => {
      if (performance?.attempts) {
        performance.attempts.forEach((attempt: any) => {
          totalUserHints += attempt.hintsCount || 0;
        });
      }
    });

    // Performance Map per accesso veloce con word.id come chiave
    const performanceMap = new Map(
      Object.entries(wordPerformances).map(([wordId, performance]) => [wordId, performance])
    );

    const wordsWithPerformance: WordPerformanceAnalysis[] = [];
    const wordsWithoutPerformance: WordPerformanceAnalysis[] = [];

    // Separa parole in base alla presenza di performance
    words.forEach((word) => {
      const performance = performanceMap.get(word.id);
      const hasAttempts = performance && performance.attempts && performance.attempts.length > 0;
      
      // ⭐ DEBUG: Log specifico per "quite"
      if (word.english === 'quite') {
        console.log(`🔍 DEBUG [quite] - analyzeWordsPerformanceOptimized:`, {
          wordId: word.id,
          english: word.english,
          hasPerformance: !!performance,
          hasAttempts,
          performance: performance,
          attemptsLength: performance?.attempts?.length || 0
        });
      }
      
      const baseWordData = {
        id: word.id,
        english: word.english,
        italian: word.italian,
        chapter: word.chapter || '',
        group: word.group || '',
        sentences: (word.sentences && word.sentences.length > 0) ? word.sentences.join('; ') : '',
        notes: word.notes || '',
        learned: word.learned || false,
        difficult: word.difficult || false,
      };

      if (hasAttempts) {
        // ⭐ USA DATI GIÀ AGGREGATI dalla collezione performance!
        const performanceData = this.calculateOptimizedPerformanceData(word, performance!, totalUserHints);
        wordsWithPerformance.push({
          ...baseWordData,
          ...performanceData
        });
        
        if (word.english === 'quite') {
          console.log(`🔍 DEBUG [quite] - Aggiunta a wordsWithPerformance`);
        }
      } else {
        // Parole senza tentativi
        wordsWithoutPerformance.push({
          ...baseWordData,
          ...this.createEmptyPerformanceData(word)
        });
        
        if (word.english === 'quite') {
          console.log(`🔍 DEBUG [quite] - Aggiunta a wordsWithoutPerformance`);
        }
      }
    });

    return {
      wordsWithPerformance,
      wordsWithoutPerformance,
      totalWords: words.length
    };
  }

  /**
   * LEGACY: Mantiene backward compatibility
   */
  analyzeWordsPerformance(
    words: Word[],
    wordPerformances: Record<string, WordPerformance>,
    testHistory: TestHistoryItem[]
  ): WordPerformanceAnalysis[] {
    const optimized = this.analyzeWordsPerformanceOptimized(words, wordPerformances, testHistory);
    return [...optimized.wordsWithPerformance, ...optimized.wordsWithoutPerformance];
  }

  /**
   * ⭐ OTTIMIZZATO: Usa dati già aggregati dalla collezione performance
   * La collezione performance già contiene: totalAttempts, correctAttempts, accuracy, averageResponseTime
   * Evita tutti i calcoli pesanti sfruttando questi dati pre-calcolati!
   */
  private calculateOptimizedPerformanceData(
    word: Word,
    performance: WordPerformance,
    totalUserHints: number
  ) {
    // ⭐ DEBUG: Log dei dati performance grezzi
    if (word.english === 'quite') {
      console.log(`🔍 DEBUG [quite] - Dati performance grezzi:`, {
        wordId: word.id,
        english: word.english,
        performanceRaw: performance,
        totalAttempts: performance.totalAttempts || 0,
        correctAttempts: performance.correctAttempts || 0,
        accuracy: performance.accuracy,
        averageResponseTime: performance.averageResponseTime,
        attempts: performance.attempts || []
      });
      
      // ⭐ DEBUG: Log di TUTTE le proprietà dell'oggetto performance
      console.log(`🔍 DEBUG [quite] - TUTTE le proprietà performance:`, Object.keys(performance));
      console.log(`🔍 DEBUG [quite] - Performance object completo:`, performance);
    }
    
    const attempts = performance.attempts || [];
    
    // ⭐ CALCOLA DATI dagli attempts se i dati aggregati non sono disponibili
    let totalAttempts, correctAttempts, accuracy, avgTime;
    
    if (performance.totalAttempts && performance.correctAttempts !== undefined && performance.accuracy) {
      // ⭐ USA DATI GIÀ AGGREGATI se disponibili
      totalAttempts = performance.totalAttempts;
      correctAttempts = performance.correctAttempts;
      accuracy = Math.round(performance.accuracy);
      avgTime = performance.averageResponseTime ? Math.round(performance.averageResponseTime / 1000) : 0;
      
      if (word.english === 'quite') {
        console.log(`🔍 DEBUG [quite] - Usando dati già aggregati:`, { totalAttempts, correctAttempts, accuracy, avgTime });
      }
    } else {
      // ⭐ CALCOLA dai tentativi reali
      totalAttempts = attempts.length;
      correctAttempts = attempts.filter(a => a.correct).length;
      accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      avgTime = totalAttempts > 0 ? 
        Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAttempts / 1000) : 0;
      
      if (word.english === 'quite') {
        console.log(`🔍 DEBUG [quite] - Calcolando dai tentativi reali:`, { 
          totalAttempts, correctAttempts, accuracy, avgTime,
          attemptsData: attempts.map(a => ({ correct: a.correct, timeSpent: a.timeSpent }))
        });
      }
    }
    
    // ⭐ CALCOLI HINTS CORRETTI
    // hintsUsed = numero totale di hints usati in tutti i test per questa parola
    const hintsUsed = attempts.reduce((sum, a) => sum + (a.hintsCount || 0), 0);
    // testsWithHints = numero di test che hanno usato almeno un hint  
    const testsWithHints = attempts.filter(a => a.usedHint || (a.hintsCount && a.hintsCount > 0)).length;
    // ⭐ NUOVO CALCOLO: hintsPercentage = percentuale degli aiuti di questa parola rispetto al totale aiuti utente
    const hintsPercentage = totalUserHints > 0 ? Math.round((hintsUsed / totalUserHints) * 100) : 0;
    
    if (word.english === 'quite') {
      console.log(`🔍 DEBUG [quite] - Calcolo hints corretto:`, {
        hintsUsed, // hints totali usati (somma di tutti)
        testsWithHints, // numero di test che hanno usato almeno un hint
        hintsPercentage, // percentuale di test con hints
        hintsPerTest: attempts.map(a => a.hintsCount || 0), // hints per ogni singolo test [0,3,2,1,0]
        attempts: attempts.map(a => ({ usedHint: a.usedHint, hintsCount: a.hintsCount }))
      });
      
      // ⭐ DEBUG: VERIFICA AUTENTICITA' DATI - NON MOCKATI
      console.log(`🔍 DEBUG [quite] - VERIFICA DATI REALI:`, {
        sorgenteDati: 'collezione performance Firebase',
        timestampCreazione: performance.firestoreMetadata?.createdAt,
        timestampUltimoAggiornamento: performance.firestoreMetadata?.updatedAt,
        userId: performance.firestoreMetadata?.userId,
        versioneDocumento: performance.firestoreMetadata?.version,
        attemptsTimestamps: attempts.map(a => a.timestamp),
        attemptsDettaglio: attempts.map((a, idx) => ({
          test: idx + 1,
          timestamp: a.timestamp,
          correct: a.correct,
          timeSpent: a.timeSpent,
          usedHint: a.usedHint,
          hintsCount: a.hintsCount || 0,
          dataFormatted: new Date(a.timestamp).toLocaleString('it-IT')
        }))
      });
    }
    
    // Calcola streak corrente (veloce - solo dalla fine dell'array)
    const currentStreak = this.calculateCurrentStreak(attempts);
    
    // Determina status usando dati già calcolati
    const status = this.determineWordStatus(accuracy, totalAttempts, currentStreak);
    
    // Calcoli minimi per UI
    const recentAccuracy = this.calculateRecentAccuracy(attempts);
    const trend = this.calculateTrend(attempts);
    const difficulty = this.determineDifficulty(accuracy);

    const result = {
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      accuracy,
      hintsUsed,
      hintsPercentage,
      currentStreak,
      status,
      attempts,
      lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null,
      recentAccuracy,
      avgTime,
      trend,
      difficulty,
      needsWork: accuracy < 70,
      mastered: accuracy >= 90 && currentStreak >= 3,
      hasPerformanceData: true,
      recommendations: this.generateRecommendations(accuracy, hintsPercentage, currentStreak, avgTime)
    };
    
    // ⭐ DEBUG: Log del risultato calcolato
    if (word.english === 'quite') {
      console.log(`🔍 DEBUG [quite] - Risultato calcolato:`, result);
    }
    
    return result;
  }

  /**
   * Calcola i dati performance per una singola parola (LEGACY - più lento)
   */
  private calculateWordPerformanceData(
    word: Word,
    performance: WordPerformance | undefined,
    testHistory: TestHistoryItem[]
  ) {
    // Se non ci sono dati performance, ritorna valori di default
    if (!performance || !performance.attempts || performance.attempts.length === 0) {
      return this.createEmptyPerformanceData(word);
    }

    const attempts = performance.attempts;
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    
    // Calcola hints usando dati reali dagli attempts
    const hintsUsed = attempts.filter(a => a.usedHint).length;
    const hintsPercentage = totalAttempts > 0 ? Math.round((hintsUsed / totalAttempts) * 100) : 0;
    
    // Calcola tempo medio
    const avgTime = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAttempts / 1000)
      : 0;

    // Calcola streak corrente
    const currentStreak = this.calculateCurrentStreak(attempts);
    
    // Determina status
    const status = this.determineWordStatus(accuracy, totalAttempts, currentStreak);
    
    // Calcola accuratezza recente (ultimi 5 tentativi)
    const recentAccuracy = this.calculateRecentAccuracy(attempts);
    
    // Determina trend
    const trend = this.calculateTrend(attempts);
    
    // Determina difficoltà
    const difficulty = this.determineDifficulty(accuracy);

    return {
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      accuracy,
      hintsUsed,
      hintsPercentage,
      currentStreak,
      status,
      attempts,
      lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null,
      recentAccuracy,
      avgTime,
      trend,
      difficulty,
      needsWork: accuracy < 70,
      mastered: accuracy >= 90 && currentStreak >= 3,
      hasPerformanceData: true,
      recommendations: this.generateRecommendations(accuracy, hintsPercentage, currentStreak, avgTime)
    };
  }

  /**
   * Crea dati performance vuoti per parole mai testate
   */
  private createEmptyPerformanceData(word: Word) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: 0,
      hintsUsed: 0,
      hintsPercentage: 0,
      currentStreak: 0,
      status: 'new' as const,
      attempts: [] as PerformanceAttempt[],
      lastAttempt: null,
      recentAccuracy: 0,
      avgTime: 0,
      trend: 'stable' as const,
      difficulty: 'unknown' as const,
      needsWork: false,
      mastered: false,
      hasPerformanceData: false,
      recommendations: ['🎯 Inizia a praticare questa parola per vedere l\'andamento!']
    };
  }

  /**
   * Calcola lo streak corrente (tentativi consecutivi corretti dalla fine)
   */
  private calculateCurrentStreak(attempts: PerformanceAttempt[]): number {
    let streak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].correct) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Determina lo status della parola basato su accuracy, tentativi e streak
   */
  private determineWordStatus(
    accuracy: number, 
    totalAttempts: number, 
    currentStreak: number
  ): WordPerformanceAnalysis['status'] {
    if (totalAttempts === 0) return 'new';
    if (totalAttempts < 3) {
      return currentStreak > 0 ? 'promising' : 'struggling';
    }
    
    if (accuracy >= 90 && currentStreak >= 3) return 'consolidated';
    if (accuracy >= 70) return 'improving';
    if (accuracy <= 30) return 'critical';
    if (accuracy <= 60) return 'inconsistent';
    
    return 'improving';
  }

  /**
   * Calcola accuratezza recente (ultimi 5 tentativi)
   */
  private calculateRecentAccuracy(attempts: PerformanceAttempt[]): number {
    if (attempts.length === 0) return 0;
    
    const recentAttempts = attempts.slice(-5);
    const correctRecent = recentAttempts.filter(a => a.correct).length;
    
    return Math.round((correctRecent / recentAttempts.length) * 100);
  }

  /**
   * Calcola trend di miglioramento/peggioramento
   */
  private calculateTrend(attempts: PerformanceAttempt[]): 'improving' | 'stable' | 'declining' {
    if (attempts.length < 4) return 'stable';
    
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2));
    
    const firstHalfAccuracy = firstHalf.filter(a => a.correct).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(a => a.correct).length / secondHalf.length;
    
    const improvement = secondHalfAccuracy - firstHalfAccuracy;
    
    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Determina difficoltà basata sull'accuracy
   */
  private determineDifficulty(accuracy: number): 'easy' | 'medium' | 'hard' | 'unknown' {
    if (accuracy >= 80) return 'easy';
    if (accuracy >= 60) return 'medium';
    if (accuracy > 0) return 'hard';
    return 'unknown';
  }

  /**
   * Genera raccomandazioni personalizzate
   */
  private generateRecommendations(
    accuracy: number,
    hintsPercentage: number,
    currentStreak: number,
    avgTime: number
  ): string[] {
    const recommendations: string[] = [];

    if (accuracy < 60) {
      recommendations.push('📚 Rivedi questa parola più spesso - precisione sotto il 60%');
    }
    
    if (hintsPercentage > 50) {
      recommendations.push('💭 Cerca di rispondere senza aiuti - uso eccessivo di suggerimenti');
    }
    
    if (avgTime > 20) {
      recommendations.push('⚡ Pratica per migliorare i tempi di risposta');
    }
    
    if (currentStreak >= 5) {
      recommendations.push('🏆 Ottimo! Continua così - streak impressionante');
    }
    
    if (accuracy >= 80 && currentStreak >= 3) {
      recommendations.push('✨ Parola ben consolidata - potresti concentrarti su altre parole difficili');
    }
    
    if (accuracy === 0) {
      recommendations.push('🔥 Parola molto difficile - continua a praticare, migliorerai!');
    }

    return recommendations.length > 0 ? recommendations : ['📊 Continua a praticare per ricevere suggerimenti personalizzati'];
  }

  /**
   * Filtra parole basato sui criteri forniti
   */
  filterWords(
    words: WordPerformanceAnalysis[],
    filters: {
      searchWord?: string;
      filterChapter?: string;
      filterLearned?: string;
      filterDifficult?: string;
      filterGroup?: string;
    }
  ): WordPerformanceAnalysis[] {
    return words.filter(word => {
      // Filtro ricerca per testo
      if (filters.searchWord && 
          !word.english.toLowerCase().includes(filters.searchWord.toLowerCase())) {
        return false;
      }
      
      // Filtro capitolo
      if (filters.filterChapter !== undefined && filters.filterChapter !== '') {
        if (filters.filterChapter === 'no-chapter') {
          if (word.chapter) return false;
        } else {
          if (word.chapter !== filters.filterChapter) return false;
        }
      }
      
      // Filtro gruppo/categoria
      if (filters.filterGroup && word.group !== filters.filterGroup) {
        return false;
      }
      
      // Filtro apprese
      if (filters.filterLearned === 'learned' && !word.learned) return false;
      if (filters.filterLearned === 'not_learned' && word.learned) return false;
      
      // Filtro difficili
      if (filters.filterDifficult === 'difficult' && !word.difficult) return false;
      if (filters.filterDifficult === 'not_difficult' && word.difficult) return false;
      
      return true;
    });
  }

  /**
   * Raggruppa parole per capitolo
   */
  groupWordsByChapter(words: WordPerformanceAnalysis[]): Record<string, WordPerformanceAnalysis[]> {
    return words.reduce((groups, word) => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(word);
      return groups;
    }, {} as Record<string, WordPerformanceAnalysis[]>);
  }

  /**
   * Calcola statistiche aggregate per le parole
   */
  calculateWordStats(words: WordPerformanceAnalysis[]) {
    const withPerformance = words.filter(w => w.hasPerformanceData);
    
    return {
      total: words.length,
      learned: words.filter(w => w.learned).length,
      notLearned: words.filter(w => !w.learned).length,
      difficult: words.filter(w => w.difficult).length,
      withChapter: words.filter(w => w.chapter).length,
      withPerformance: withPerformance.length,
      avgAccuracy: withPerformance.length > 0 
        ? Math.round(withPerformance.reduce((sum, w) => sum + w.accuracy, 0) / withPerformance.length)
        : 0
    };
  }

  /**
   * ⭐ NUOVO: Separazione ottimizzata parole con/senza attempts per UI
   * Mantiene stessa interfaccia ma ottimizza internamente
   */
  separateWordsByPerformance(
    words: Word[],
    wordPerformances: Record<string, WordPerformance>
  ): {
    wordsWithAttempts: Word[];
    wordsWithoutAttempts: Word[];
    performanceMap: Map<string, WordPerformance>;
  } {
    const performanceMap = new Map(
      Object.entries(wordPerformances).map(([wordId, performance]) => [wordId, performance])
    );

    const wordsWithAttempts: Word[] = [];
    const wordsWithoutAttempts: Word[] = [];

    words.forEach(word => {
      const performance = performanceMap.get(word.id);
      const hasAttempts = performance && performance.attempts && performance.attempts.length > 0;
      
      if (hasAttempts) {
        wordsWithAttempts.push(word);
      } else {
        wordsWithoutAttempts.push(word);
      }
    });

    return {
      wordsWithAttempts,
      wordsWithoutAttempts,
      performanceMap
    };
  }

  /**
   * ⭐ SUPER OTTIMIZZATO: Usa dati già aggregati dalla collezione performance
   * Evita tutti i loop e calcoli sfruttando accuracy già calcolata per ogni parola
   */
  calculateOptimizedWordStats(
    words: Word[],
    wordPerformances: Record<string, WordPerformance>
  ) {
    const { wordsWithAttempts, wordsWithoutAttempts } = this.separateWordsByPerformance(words, wordPerformances);
    
    // ⭐ USA ACCURACY GIÀ CALCOLATA - ZERO DIVISIONI!
    let totalAccuracy = 0;
    let performanceCount = 0;
    
    wordsWithAttempts.forEach(word => {
      const performance = wordPerformances[word.id];
      if (performance && performance.totalAttempts && performance.totalAttempts > 0) {
        // ⭐ USA performance.accuracy già calcolato invece di ricalcolare!
        const accuracy = performance.accuracy ? Math.round(performance.accuracy) : 
                         Math.round((performance.correctAttempts || 0) / performance.totalAttempts * 100);
        totalAccuracy += accuracy;
        performanceCount++;
      }
    });

    return {
      total: words.length,
      learned: words.filter(w => w.learned).length,
      notLearned: words.filter(w => !w.learned).length,  
      difficult: words.filter(w => w.difficult).length,
      withChapter: words.filter(w => w.chapter).length,
      withPerformance: wordsWithAttempts.length,
      withoutPerformance: wordsWithoutAttempts.length,
      avgAccuracy: performanceCount > 0 ? Math.round(totalAccuracy / performanceCount) : 0
    };
  }

  /**
   * Ottiene opzioni disponibili per i filtri
   */
  getFilterOptions(words: WordPerformanceAnalysis[]) {
    const chapters = new Set<string>();
    const groups = new Set<string>();
    
    words.forEach(word => {
      if (word.chapter) chapters.add(word.chapter);
      if (word.group) groups.add(word.group);
    });
    
    return {
      chapters: Array.from(chapters).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
      }),
      groups: Array.from(groups).sort(),
      wordsWithoutChapter: words.filter(w => !w.chapter)
    };
  }
}

export default WordPerformanceService;
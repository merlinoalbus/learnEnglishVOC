// =====================================================
// 📁 src/hooks/useOptimizedTest.ts - Type-Safe Test Management Hook
// =====================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    EnhancedTestStats,
    TestStats,
    Word,
    WordTimeRecord
} from '../types/global';
import type {
    OptimizedTestReturn,
    TestCompleteCallback,
    TestProgress,
    TestSummary
} from '../types/hooks';

export const useOptimizedTest = (onTestComplete: TestCompleteCallback): OptimizedTestReturn => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [stats, setStats] = useState<TestStats>({ correct: 0, incorrect: 0, hints: 0 });
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [testSaved, setTestSaved] = useState<boolean>(false);
  
  // Enhanced: Timer e transizioni
  const [wordTimes, setWordTimes] = useState<WordTimeRecord[]>([]);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const testStartTimeRef = useRef<number | null>(null);
  const wordStartTimeRef = useRef<number | null>(null);
  
  // Enhanced: Hint functionality
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintUsedForCurrentWord, setHintUsedForCurrentWord] = useState<boolean>(false);

  // Start timing when word appears (SOLO quando non in transizione)
  useEffect(() => {
    if (currentWord && testMode && !isTransitioning) {
      wordStartTimeRef.current = Date.now();
      setHintUsedForCurrentWord(false);
      setShowHint(false);
      setShowMeaning(false);
    }
  }, [currentWord, testMode, isTransitioning]);

  // Enhanced: Record word completion time
  const recordWordTime = useCallback((isCorrect: boolean, usedHint: boolean = false): void => {
    if (wordStartTimeRef.current && currentWord) {
      const timeSpent = Date.now() - wordStartTimeRef.current;
      
      const wordRecord: WordTimeRecord = {
        wordId: currentWord.id,
        english: currentWord.english,
        italian: currentWord.italian,
        chapter: currentWord.chapter || '',
        timeSpent,
        isCorrect,
        usedHint,
        timestamp: new Date().toISOString()
      };
      
      setWordTimes(prev => [...prev, wordRecord]);
      wordStartTimeRef.current = null;
    }
  }, [currentWord]);

  // Progress: Enhanced with hints
  const progressData = useMemo((): TestProgress => {
    if (testWords.length === 0) return { current: 0, total: 0, percentage: 0, hints: 0 };
    
    const answered = stats.correct + stats.incorrect;
    
    return {
      current: answered + 1,
      total: testWords.length,
      percentage: Math.round((answered / testWords.length) * 100),
      hints: stats.hints
    };
  }, [stats.correct, stats.incorrect, stats.hints, testWords.length]);

  // Enhanced: Summary con TUTTI i dati timing e hints per ResultsView
  const summaryData = useMemo((): TestSummary => {
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    const totalTestTime = testStartTimeRef.current ? Date.now() - testStartTimeRef.current : 0;
    
    // Enhanced: Calcoli timing più precisi da wordTimes
    const timingStats = wordTimes.length > 0 ? {
      avgTimePerWord: Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / wordTimes.length / 1000),
      maxTimePerWord: Math.round(Math.max(...wordTimes.map(r => r.timeSpent)) / 1000),
      minTimePerWord: Math.round(Math.min(...wordTimes.map(r => r.timeSpent)) / 1000),
      totalRecordedTime: Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / 1000)
    } : {
      avgTimePerWord: 0,
      maxTimePerWord: 0,
      minTimePerWord: 0,
      totalRecordedTime: 0
    };
    
    // Return COMPLETE summary with ALL enhanced data
    const completeSummary: TestSummary = {
      current: totalAnswered + 1,
      total: testWords.length,
      percentage: Math.round((totalAnswered / testWords.length) * 100),
      answered: totalAnswered,
      remaining: testWords.length - totalAnswered,
      accuracy,
      correct: stats.correct,
      incorrect: stats.incorrect,
      hints: stats.hints,
      totalTime: Math.round(totalTestTime / 1000),
      ...timingStats,
      // Additional enhanced data for results
      wordTimes: [...wordTimes],
      testStartTime: testStartTimeRef.current,
      hintsPercentage: totalAnswered > 0 ? Math.round((stats.hints / totalAnswered) * 100) : 0,
      efficiency: totalAnswered > 0 ? Math.max(0, accuracy - Math.round((stats.hints / totalAnswered) * 100)) : 0
    };
    
    return completeSummary;
  }, [stats.correct, stats.incorrect, stats.hints, testWords.length, wordTimes, testStartTimeRef.current]);

  // Optimized random word selection
  const getRandomUnusedWord = useCallback((wordList: Word[], usedIds: Set<string>): Word | null => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  }, []);

  // Enhanced: Save test results with complete stats
  const saveTestResultsWithStats = useCallback((finalStats: TestStats): void => {
    if (!testSaved && (finalStats.correct > 0 || finalStats.incorrect > 0) && onTestComplete) {

    // 🐛 DEBUG START
    console.log('💾 SALVANDO TEST RESULTS:', {
      finalStats: finalStats,
      wrongWordsCount: wrongWords.length,
      wrongWordsArray: wrongWords.map(w => ({id: w.id, english: w.english, chapter: w.chapter})),
      testWordsCount: testWords.length
    });
    // 🐛 DEBUG END
      const finalTestTime = testStartTimeRef.current ? Date.now() - testStartTimeRef.current : 0;
      
      // Enhanced: Calcoli timing completi
      const timingStats = wordTimes.length > 0 ? {
        avgTimePerWord: Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / wordTimes.length / 1000),
        maxTimePerWord: Math.round(Math.max(...wordTimes.map(r => r.timeSpent)) / 1000),
        minTimePerWord: Math.round(Math.min(...wordTimes.map(r => r.timeSpent)) / 1000),
        totalRecordedTime: Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / 1000)
      } : {
        avgTimePerWord: 0,
        maxTimePerWord: 0,
        minTimePerWord: 0,
        totalRecordedTime: 0
      };
      
      const enhancedStats: EnhancedTestStats = {
        ...finalStats,
        totalTime: Math.round(finalTestTime / 1000),
        ...timingStats,
        wordTimes: [...wordTimes]
      };
      
      onTestComplete(enhancedStats, testWords, wrongWords);
      setTestSaved(true);
    }
  }, [testWords, wrongWords, testSaved, onTestComplete, wordTimes]);

  const startTest = useCallback((filteredWords: Word[] = []): void => {
    if (filteredWords.length === 0) return;
    
    setTestWords(filteredWords);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setUsedWordIds(new Set());
    setWordTimes([]);
    setIsTransitioning(false);
    testStartTimeRef.current = Date.now();
    wordStartTimeRef.current = null;
    
    const firstWord = getRandomUnusedWord(filteredWords, new Set());
    setCurrentWord(firstWord);
    
    if (firstWord) {
      setUsedWordIds(new Set([firstWord.id]));
    }
    
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setTestMode(true);
  }, [getRandomUnusedWord]);

  // Enhanced: Next word con transizione corretta
  const nextWord = useCallback((): void => {
    const nextRandomWord = getRandomUnusedWord(testWords, usedWordIds);
    
    if (nextRandomWord) {
      setIsTransitioning(true);
      setShowMeaning(false);
      
      setTimeout(() => {
        setCurrentWord(nextRandomWord);
        setUsedWordIds(prev => new Set([...prev, nextRandomWord.id]));
        setShowHint(false);
        setHintUsedForCurrentWord(false);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 400);
    }
  }, [testWords, usedWordIds, getRandomUnusedWord]);

  // Enhanced: Hint functionality
  const toggleHint = useCallback((): void => {
    if (!showHint && currentWord?.sentence) {
      setShowHint(true);
      setHintUsedForCurrentWord(true);
    } else {
      setShowHint(false);
    }
  }, [showHint, currentWord]);

  // Answer handling con timing corretto
  const handleAnswer = useCallback((isCorrect: boolean): void => {
    // Record timing IMMEDIATAMENTE
    // 🐛 DEBUG START
  console.log('🔴 RISPOSTA:', {
    parola: currentWord?.english,
    capitolo: currentWord?.chapter,
    isCorrect: isCorrect,
    wrongWordsBefore: wrongWords.length
  });
  // 🐛 DEBUG END
    recordWordTime(isCorrect, hintUsedForCurrentWord);
    
    // Update stats with hints properly tracked
    const newStats: TestStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1),
      hints: stats.hints + (hintUsedForCurrentWord ? 1 : 0)
    };
    
    setStats(newStats);
    
    // Track wrong words with hint info
    if (!isCorrect && currentWord) {

        // 🐛 DEBUG START
  console.log('🔴 AGGIUNTA A WRONG WORDS:', {
    parolaAggiunta: currentWord.english,
    capitolo: currentWord.chapter
  });
  // 🐛 DEBUG END
      const wrongWord: Word & { usedHint?: boolean } = { 
        ...currentWord, 
        usedHint: hintUsedForCurrentWord 
      };
      setWrongWords(prev => [...prev, wrongWord]);
    }
    
    const totalAnswered = newStats.correct + newStats.incorrect;
    const isLastQuestion = totalAnswered >= testWords.length;
    
    // Enhanced: Gestione sequenza risposta → fine test o prossima parola
    if (isLastQuestion) {
      saveTestResultsWithStats(newStats);
      setTestMode(false);
      setShowResults(true);
      setCurrentWord(null);
    } else {
      setTimeout(() => {
        nextWord();
      }, showMeaning ? 1000 : 600);
    }
  }, [currentWord, showMeaning, stats, testWords.length, hintUsedForCurrentWord, recordWordTime, saveTestResultsWithStats, nextWord]);

  const resetTest = useCallback((): void => {
    if (!testSaved && (stats.correct > 0 || stats.incorrect > 0)) {
      saveTestResultsWithStats(stats);
    }
    
    setTestMode(false);
    setShowResults(false);
    setCurrentWord(null);
    setUsedWordIds(new Set());
    setWrongWords([]);
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setTestWords([]);
    setTestSaved(false);
    setWordTimes([]);
    setIsTransitioning(false);
    testStartTimeRef.current = null;
    wordStartTimeRef.current = null;
  }, [stats, testSaved, saveTestResultsWithStats]);

  const startNewTest = useCallback((): void => {
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setUsedWordIds(new Set());
    setCurrentWord(null);
    setWordTimes([]);
    setIsTransitioning(false);
    startTest(testWords);
  }, [startTest, testWords]);

  return {
    currentWord,
    usedWordIds,
    showMeaning,
    setShowMeaning,
    testMode,
    showResults,
    stats,
    wrongWords,
    testWords,
    isTransitioning,
    
    // Enhanced: Hint functionality
    showHint,
    toggleHint,
    hintUsed: hintUsedForCurrentWord,
    
    // Enhanced: Timer functionality
    wordTimes,
    
    startTest,
    handleAnswer,
    resetTest,
    startNewTest,
    getTestProgress: useCallback(() => progressData, [progressData]),
    // Return complete summary with ALL enhanced data
    getTestSummary: useCallback(() => summaryData, [summaryData])
  };
};
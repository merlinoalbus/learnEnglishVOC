// =====================================================
// 📁 hooks/useOptimizedTest.js - CLEANED VERSION
// =====================================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export const useOptimizedTest = (onTestComplete) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [showMeaning, setShowMeaning] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, hints: 0 });
  const [wrongWords, setWrongWords] = useState([]);
  const [testWords, setTestWords] = useState([]);
  const [testSaved, setTestSaved] = useState(false);
  
  // Enhanced: Timer e transizioni
  const [wordTimes, setWordTimes] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const testStartTimeRef = useRef(null);
  const wordStartTimeRef = useRef(null);
  
  // Enhanced: Hint functionality
  const [showHint, setShowHint] = useState(false);
  const [hintUsedForCurrentWord, setHintUsedForCurrentWord] = useState(false);

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
  const recordWordTime = useCallback((isCorrect, usedHint = false) => {
    if (wordStartTimeRef.current && currentWord) {
      const timeSpent = Date.now() - wordStartTimeRef.current;
      
      const wordRecord = {
        wordId: currentWord.id,
        english: currentWord.english,
        italian: currentWord.italian,
        chapter: currentWord.chapter,
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
  const progressData = useMemo(() => {
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
  const summaryData = useMemo(() => {
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
    const completeSummary = {
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
  const getRandomUnusedWord = useCallback((wordList, usedIds) => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  }, []);

  // Enhanced: Save test results with complete stats
  const saveTestResultsWithStats = useCallback((finalStats) => {
    if (!testSaved && (finalStats.correct > 0 || finalStats.incorrect > 0) && onTestComplete) {
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
      
      const enhancedStats = {
        ...finalStats,
        totalTime: Math.round(finalTestTime / 1000),
        ...timingStats,
        wordTimes: [...wordTimes]
      };
      
      onTestComplete(enhancedStats, testWords, wrongWords);
      setTestSaved(true);
    }
  }, [testWords, wrongWords, testSaved, onTestComplete, wordTimes]);

  const startTest = useCallback((filteredWords = []) => {
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
  const nextWord = useCallback(() => {
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
  const toggleHint = useCallback(() => {
    if (!showHint && currentWord?.sentence) {
      setShowHint(true);
      setHintUsedForCurrentWord(true);
    } else {
      setShowHint(false);
    }
  }, [showHint, currentWord]);

  // Answer handling con timing corretto
  const handleAnswer = useCallback((isCorrect) => {
    // Record timing IMMEDIATAMENTE
    recordWordTime(isCorrect, hintUsedForCurrentWord);
    
    // Update stats with hints properly tracked
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1),
      hints: stats.hints + (hintUsedForCurrentWord ? 1 : 0)
    };
    
    setStats(newStats);
    
    // Track wrong words with hint info
    if (!isCorrect && currentWord) {
      const wrongWord = { ...currentWord, usedHint: hintUsedForCurrentWord };
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

  const resetTest = useCallback(() => {
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

  const startNewTest = useCallback(() => {
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
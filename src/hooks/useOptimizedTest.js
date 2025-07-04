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
  
  // ⭐ ENHANCED: Timer functionality
  const [wordTimes, setWordTimes] = useState([]);
  const testStartTimeRef = useRef(null);
  const wordStartTimeRef = useRef(null); // ⭐ CRITICAL: Track when word appears
  
  // ⭐ ENHANCED: Hint functionality
  const [showHint, setShowHint] = useState(false);
  const [hintUsedForCurrentWord, setHintUsedForCurrentWord] = useState(false);

  // ⭐ CRITICAL FIX: Start timing when word appears and reset meaning state
  useEffect(() => {
    if (currentWord && testMode) {
      console.log('⏱️ New word appeared, starting timer:', currentWord.english);
      wordStartTimeRef.current = Date.now();
      setHintUsedForCurrentWord(false);
      setShowHint(false);
      
      // ⭐ CRITICAL: Reset meaning state for new word
      setShowMeaning(false);
    }
  }, [currentWord, testMode]);

  // ⭐ ENHANCED: Record word completion time
  const recordWordTime = useCallback((isCorrect, usedHint = false) => {
    if (wordStartTimeRef.current && currentWord) {
      const timeSpent = Date.now() - wordStartTimeRef.current;
      console.log(`⏱️ Recording time for ${currentWord.english}:`, {
        timeSpent: Math.round(timeSpent / 1000) + 's',
        isCorrect,
        usedHint
      });
      
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
      
      setWordTimes(prev => {
        const newTimes = [...prev, wordRecord];
        console.log('📊 Updated wordTimes:', newTimes.length, 'total records');
        return newTimes;
      });
      
      // Reset timer reference
      wordStartTimeRef.current = null;
    } else {
      console.warn('⚠️ Cannot record time - missing wordStartTimeRef or currentWord');
    }
  }, [currentWord]);

  // ⭐ PROGRESS: Enhanced with hints
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

  // ⭐ SUMMARY: Enhanced with hints and timing
  const summaryData = useMemo(() => {
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    const totalTestTime = testStartTimeRef.current ? Date.now() - testStartTimeRef.current : 0;
    const avgTimePerWord = wordTimes.length > 0 
      ? Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / wordTimes.length / 1000)
      : 0;
    
    return {
      current: totalAnswered + 1,
      total: testWords.length,
      percentage: Math.round((totalAnswered / testWords.length) * 100),
      answered: totalAnswered,
      remaining: testWords.length - totalAnswered,
      accuracy,
      correct: stats.correct,
      incorrect: stats.incorrect,
      hints: stats.hints,
      avgTimePerWord,
      totalTime: Math.round(totalTestTime / 1000)
    };
  }, [stats.correct, stats.incorrect, stats.hints, testWords.length, wordTimes, testStartTimeRef.current]);

  // ⭐ OPTIMIZED RANDOM WORD SELECTION
  const getRandomUnusedWord = useCallback((wordList, usedIds) => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  }, []);

  // ⭐ ENHANCED: Save test results with complete stats
  const saveTestResultsWithStats = useCallback((finalStats) => {
    if (!testSaved && (finalStats.correct > 0 || finalStats.incorrect > 0) && onTestComplete) {
      const finalTestTime = testStartTimeRef.current ? Date.now() - testStartTimeRef.current : 0;
      
      console.log('💾 Saving test results:', {
        finalStats,
        wordTimesCount: wordTimes.length,
        totalTime: Math.round(finalTestTime / 1000) + 's'
      });
      
      const enhancedStats = {
        ...finalStats,
        totalTime: Math.round(finalTestTime / 1000),
        avgTimePerWord: wordTimes.length > 0 
          ? Math.round(wordTimes.reduce((sum, record) => sum + record.timeSpent, 0) / wordTimes.length / 1000)
          : 0,
        wordTimes: [...wordTimes] // ⭐ CRITICAL: Pass complete word times array
      };
      
      console.log('📤 Calling onTestComplete with enhancedStats:', enhancedStats);
      onTestComplete(enhancedStats, testWords, wrongWords);
      setTestSaved(true);
    }
  }, [testWords, wrongWords, testSaved, onTestComplete, wordTimes]);

  const startTest = useCallback((filteredWords = []) => {
    if (filteredWords.length === 0) return;
    
    console.log('🚀 Starting test with', filteredWords.length, 'words');
    
    setTestWords(filteredWords);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setUsedWordIds(new Set());
    setWordTimes([]);
    testStartTimeRef.current = Date.now();
    wordStartTimeRef.current = null; // ⭐ Reset word timer
    
    const firstWord = getRandomUnusedWord(filteredWords, new Set());
    setCurrentWord(firstWord);
    
    if (firstWord) {
      setUsedWordIds(new Set([firstWord.id]));
      console.log('📝 First word set:', firstWord.english);
    }
    
    setShowMeaning(false);
    setShowHint(false);
    setHintUsedForCurrentWord(false);
    setTestMode(true);
  }, [getRandomUnusedWord]);

  const nextWord = useCallback(() => {
    const nextRandomWord = getRandomUnusedWord(testWords, usedWordIds);
    
    if (nextRandomWord) {
      console.log('➡️ Moving to next word:', nextRandomWord.english);
      setCurrentWord(nextRandomWord);
      setUsedWordIds(prev => new Set([...prev, nextRandomWord.id]));
      setShowMeaning(false);
      setShowHint(false);
      setHintUsedForCurrentWord(false);
      // ⭐ Timer will be started by useEffect when currentWord changes
    }
  }, [testWords, usedWordIds, getRandomUnusedWord]);

  // ⭐ ENHANCED: Hint functionality
  const toggleHint = useCallback(() => {
    if (!showHint && currentWord?.sentence) {
      console.log('💡 Showing hint for:', currentWord.english);
      setShowHint(true);
      setHintUsedForCurrentWord(true);
    } else {
      setShowHint(false);
    }
  }, [showHint, currentWord]);

  // ⭐ CRITICAL FIX: Answer handling with proper timing
  const handleAnswer = useCallback((isCorrect) => {
    console.log('📝 Handling answer:', { 
      isCorrect, 
      word: currentWord?.english, 
      hintUsed: hintUsedForCurrentWord,
      timeElapsed: wordStartTimeRef.current ? Math.round((Date.now() - wordStartTimeRef.current) / 1000) + 's' : 'no-timer'
    });
    
    // ⭐ CRITICAL: Record timing BEFORE any state changes
    recordWordTime(isCorrect, hintUsedForCurrentWord);
    
    // ⭐ Update stats with hints properly tracked
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1),
      hints: stats.hints + (hintUsedForCurrentWord ? 1 : 0)
    };
    
    console.log('📊 Updated stats:', newStats);
    setStats(newStats);
    
    // ⭐ Track wrong words with hint info
    if (!isCorrect && currentWord) {
      const wrongWord = { ...currentWord, usedHint: hintUsedForCurrentWord };
      setWrongWords(prev => [...prev, wrongWord]);
      console.log('❌ Added wrong word:', wrongWord.english, 'with hint:', hintUsedForCurrentWord);
    }
    
    const totalAnswered = newStats.correct + newStats.incorrect;
    const isLastQuestion = totalAnswered >= testWords.length;
    
    console.log('🎯 Test progress:', {
      answered: totalAnswered,
      total: testWords.length,
      isLastQuestion
    });
    
    if (showMeaning) {
      setShowMeaning(false);
      setTimeout(() => {
        if (isLastQuestion) {
          console.log('🏁 Test completed, saving results...');
          saveTestResultsWithStats(newStats);
          setTestMode(false);
          setShowResults(true);
          setCurrentWord(null);
        } else {
          nextWord();
        }
      }, 800);
    } else {
      setTimeout(() => {
        if (isLastQuestion) {
          console.log('🏁 Test completed, saving results...');
          saveTestResultsWithStats(newStats);
          setTestMode(false);
          setShowResults(true);
          setCurrentWord(null);
        } else {
          nextWord();
        }
      }, 300);
    }
  }, [currentWord, showMeaning, stats, testWords.length, hintUsedForCurrentWord, recordWordTime, saveTestResultsWithStats, nextWord]);

  const resetTest = useCallback(() => {
    if (!testSaved && (stats.correct > 0 || stats.incorrect > 0)) {
      console.log('💾 Auto-saving test before reset...');
      saveTestResultsWithStats(stats);
    }
    
    console.log('🔄 Resetting test...');
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
    testStartTimeRef.current = null;
    wordStartTimeRef.current = null; // ⭐ Reset word timer
  }, [stats, testSaved, saveTestResultsWithStats]);

  const startNewTest = useCallback(() => {
    console.log('🔄 Starting new test...');
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0, hints: 0 });
    setUsedWordIds(new Set());
    setCurrentWord(null);
    setWordTimes([]);
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
    
    // ⭐ ENHANCED: Hint functionality
    showHint,
    toggleHint,
    hintUsed: hintUsedForCurrentWord,
    
    // ⭐ ENHANCED: Timer functionality
    wordTimes,
    
    startTest,
    handleAnswer,
    resetTest,
    startNewTest,
    getTestProgress: useCallback(() => progressData, [progressData]),
    getTestSummary: useCallback(() => summaryData, [summaryData])
  };
};
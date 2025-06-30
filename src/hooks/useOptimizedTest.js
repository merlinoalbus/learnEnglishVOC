import { useState, useCallback, useMemo } from 'react';

export const useOptimizedTest = (onTestComplete) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [showMeaning, setShowMeaning] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [wrongWords, setWrongWords] = useState([]);
  const [testWords, setTestWords] = useState([]);
  const [testSaved, setTestSaved] = useState(false);

  // ⭐ CORREZIONE: Progress basato su parole RISPOSTE, non viste
  const progressData = useMemo(() => {
    if (testWords.length === 0) return { current: 0, total: 0, percentage: 0 };
    
    const answered = stats.correct + stats.incorrect;
    
    return {
      current: answered + 1, // +1 per la parola corrente in corso
      total: testWords.length,
      percentage: Math.round((answered / testWords.length) * 100)
    };
  }, [stats.correct, stats.incorrect, testWords.length]);

  const summaryData = useMemo(() => {
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    
    return {
      current: totalAnswered + 1, // +1 per la parola corrente
      total: testWords.length,
      percentage: Math.round((totalAnswered / testWords.length) * 100),
      answered: totalAnswered,
      remaining: testWords.length - totalAnswered,
      accuracy,
      correct: stats.correct,
      incorrect: stats.incorrect
    };
  }, [stats.correct, stats.incorrect, testWords.length]);

  // ⭐ OPTIMIZED RANDOM WORD SELECTION
  const getRandomUnusedWord = useCallback((wordList, usedIds) => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  }, []);

  // ⭐ BATCH TEST COMPLETION
  const saveTestResultsWithStats = useCallback((finalStats) => {
    if (!testSaved && (finalStats.correct > 0 || finalStats.incorrect > 0) && onTestComplete) {
      onTestComplete(finalStats, testWords, wrongWords);
      setTestSaved(true);
    }
  }, [testWords, wrongWords, testSaved, onTestComplete]);

  const startTest = useCallback((filteredWords = []) => {
    if (filteredWords.length === 0) return;
    
    setTestWords(filteredWords);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0 });
    setUsedWordIds(new Set());
    
    const firstWord = getRandomUnusedWord(filteredWords, new Set());
    setCurrentWord(firstWord);
    
    // ⭐ CORREZIONE: Aggiungi la prima parola a usedWordIds per evitare duplicati
    if (firstWord) {
      setUsedWordIds(new Set([firstWord.id]));
    }
    
    setShowMeaning(false);
    setTestMode(true);
  }, [getRandomUnusedWord]);

  const nextWord = useCallback(() => {
    const nextRandomWord = getRandomUnusedWord(testWords, usedWordIds);
    
    if (nextRandomWord) {
      setCurrentWord(nextRandomWord);
      // ⭐ CORREZIONE: Aggiungi la nuova parola a usedWordIds subito per evitare duplicati
      setUsedWordIds(prev => new Set([...prev, nextRandomWord.id]));
      setShowMeaning(false);
    }
  }, [testWords, usedWordIds, getRandomUnusedWord]);

  const handleAnswer = useCallback((isCorrect) => {
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1)
    };
    
    setStats(newStats);
    
    // ⭐ NOTA: usedWordIds è già aggiornato quando mostro la parola
    if (!isCorrect && currentWord) {
      setWrongWords(prev => [...prev, currentWord]);
    }
    
    const totalAnswered = newStats.correct + newStats.incorrect;
    const isLastQuestion = totalAnswered >= testWords.length;
    
    if (showMeaning) {
      setShowMeaning(false);
      setTimeout(() => {
        if (isLastQuestion) {
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
          saveTestResultsWithStats(newStats);
          setTestMode(false);
          setShowResults(true);
          setCurrentWord(null);
        } else {
          nextWord();
        }
      }, 300);
    }
  }, [currentWord, showMeaning, stats, testWords.length, saveTestResultsWithStats, nextWord]);

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
    setStats({ correct: 0, incorrect: 0 });
    setTestWords([]);
    setTestSaved(false);
  }, [stats, testSaved, saveTestResultsWithStats]);

  const startNewTest = useCallback(() => {
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false);
    setStats({ correct: 0, incorrect: 0 });
    setUsedWordIds(new Set());
    setCurrentWord(null);
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
    startTest,
    handleAnswer,
    resetTest,
    startNewTest,
    getTestProgress: useCallback(() => progressData, [progressData]),
    getTestSummary: useCallback(() => summaryData, [summaryData])
  };
};
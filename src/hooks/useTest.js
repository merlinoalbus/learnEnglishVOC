import { useState, useCallback } from 'react';

export const useTest = (onTestComplete) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [showMeaning, setShowMeaning] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [wrongWords, setWrongWords] = useState([]);
  const [testWords, setTestWords] = useState([]); // Parole per il test corrente
  const [testSaved, setTestSaved] = useState(false); // Flag per evitare salvataggi multipli

  const getRandomUnusedWord = useCallback((wordList, usedIds) => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  }, []);

  // Funzione per salvare i risultati del test con statistiche specifiche
  const saveTestResultsWithStats = useCallback((finalStats) => {
    if (!testSaved && (finalStats.correct > 0 || finalStats.incorrect > 0) && onTestComplete) {
      console.log('🔄 Salvando test con stats finali:', finalStats); // Debug log
      onTestComplete(finalStats, testWords, wrongWords);
      setTestSaved(true);
      console.log('✅ Test salvato con successo'); // Debug log
    } else if (testSaved) {
      console.log('⏭️ Test già salvato, skip'); // Debug log
    }
  }, [testWords, wrongWords, testSaved, onTestComplete]);

  // Funzione per salvare i risultati del test (versione con stato corrente)
  const saveTestResults = useCallback(() => {
    if (!testSaved && (stats.correct > 0 || stats.incorrect > 0) && onTestComplete) {
      console.log('🔄 Salvando test:', stats); // Debug log
      onTestComplete(stats, testWords, wrongWords);
      setTestSaved(true);
      console.log('✅ Test salvato con successo'); // Debug log
    } else if (testSaved) {
      console.log('⏭️ Test già salvato, skip'); // Debug log
    }
  }, [stats, testWords, wrongWords, testSaved, onTestComplete]);

  // Funzione aggiornata che accetta parole filtrate
  const startTest = useCallback((filteredWords = []) => {
    if (filteredWords.length === 0) return;
    
    setTestWords(filteredWords);
    setUsedWordIds(new Set());
    setWrongWords([]);
    setTestSaved(false); // Reset flag salvataggio
    const firstWord = getRandomUnusedWord(filteredWords, new Set());
    setCurrentWord(firstWord);
    setUsedWordIds(new Set([firstWord.id]));
    setShowMeaning(false);
    setTestMode(true);
    setStats({ correct: 0, incorrect: 0 });
  }, [getRandomUnusedWord]);

  const nextWord = useCallback(() => {
    const nextRandomWord = getRandomUnusedWord(testWords, usedWordIds);
    
    if (nextRandomWord) {
      setUsedWordIds(prev => new Set([...prev, nextRandomWord.id]));
      setCurrentWord(nextRandomWord);
      setShowMeaning(false);
    }
    // Rimosso il salvataggio automatico da qui - ora viene fatto in handleAnswer
  }, [testWords, usedWordIds, getRandomUnusedWord]);

  const handleAnswer = useCallback((isCorrect) => {
    // Calcola immediatamente le nuove statistiche
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1)
    };
    
    // Aggiorna lo stato
    setStats(newStats);
    
    if (!isCorrect && currentWord) {
      setWrongWords(prev => [...prev, currentWord]);
    }
    
    // Passa le statistiche aggiornate per verificare se è l'ultima domanda
    const totalAnswered = newStats.correct + newStats.incorrect;
    const isLastQuestion = totalAnswered >= testWords.length;
    
    if (showMeaning) {
      setShowMeaning(false);
      setTimeout(() => {
        if (isLastQuestion) {
          // Test completato - salva con le statistiche aggiornate
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
          // Test completato - salva con le statistiche aggiornate
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
    // Salva il test se c'erano risposte e non è già stato salvato
    if (!testSaved && (stats.correct > 0 || stats.incorrect > 0)) {
      saveTestResults();
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
  }, [stats, testSaved, saveTestResults]);

  const startNewTest = useCallback(() => {
    // Il test precedente è già stato salvato, non serve rifarlo
    setShowResults(false);
    setWrongWords([]);
    setTestSaved(false); // IMPORTANTE: Reset flag per il NUOVO test
    setStats({ correct: 0, incorrect: 0 }); // Reset stats per il nuovo test
    setUsedWordIds(new Set()); // Reset parole usate
    setCurrentWord(null); // Reset parola corrente
    startTest(testWords); // Riusa le stesse parole del test
  }, [startTest, testWords]);

  // Nuove funzioni di utilità
  const getTestProgress = useCallback(() => {
    if (testWords.length === 0) return { current: 0, total: 0, percentage: 0 };
    
    return {
      current: usedWordIds.size,
      total: testWords.length,
      percentage: Math.round((usedWordIds.size / testWords.length) * 100)
    };
  }, [usedWordIds, testWords]);

  const getTestSummary = useCallback(() => {
    const progress = getTestProgress();
    const totalAnswered = stats.correct + stats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    
    return {
      ...progress,
      answered: totalAnswered,
      remaining: testWords.length - usedWordIds.size,
      accuracy,
      stats
    };
  }, [getTestProgress, stats, testWords.length, usedWordIds.size]);

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
    // Nuove funzioni
    getTestProgress,
    getTestSummary,
    saveTestResults // Esportiamo per uso manuale se necessario
  };
};
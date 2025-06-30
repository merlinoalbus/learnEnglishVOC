import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import TestResults from '../components/TestResults';

export const ResultsView = React.memo(() => {
  const {
    wrongWords,
    startNewTest,
    resetTest,
    // ⭐ PROVA TUTTE LE POSSIBILI PROPRIETÀ DEL TEST CORRENTE
    testCounters,
    getTestSummary,
    currentTestResults,
    lastTestStats,
    testResults,
    currentTestStats,
    finalTestResults
  } = useAppContext();

  // ⭐ DEBUG: Vediamo tutti i dati disponibili (ESCLUDENDO stats generali)
  console.log('🎯 ResultsView - Dati test corrente:', {
    testCounters,
    getTestSummary: getTestSummary ? getTestSummary() : null,
    currentTestResults,
    lastTestStats,
    testResults,
    currentTestStats,
    finalTestResults,
    wrongWords: wrongWords?.length || 0
  });

  // ⭐ LOGICA: Trova SOLO i dati del test appena completato (NON stats generali)
  const getTestResultData = () => {
    // 1. Prova testCounters (che funzionava durante il test)
    if (testCounters && (testCounters.correct >= 0 && testCounters.incorrect >= 0)) {
      console.log('✅ Usando testCounters:', testCounters);
      return testCounters;
    }
    
    // 2. Prova getTestSummary
    const summary = getTestSummary && getTestSummary();
    if (summary && (summary.correct >= 0 && summary.incorrect >= 0)) {
      console.log('✅ Usando summary:', summary);
      return {
        correct: summary.correct,
        incorrect: summary.incorrect
      };
    }
    
    // 3. Prova currentTestResults
    if (currentTestResults && (currentTestResults.correct >= 0 || currentTestResults.incorrect >= 0)) {
      console.log('✅ Usando currentTestResults:', currentTestResults);
      return currentTestResults;
    }
    
    // 4. Prova lastTestStats
    if (lastTestStats && (lastTestStats.correct >= 0 || lastTestStats.incorrect >= 0)) {
      console.log('✅ Usando lastTestStats:', lastTestStats);
      return lastTestStats;
    }
    
    // 5. Prova testResults
    if (testResults && (testResults.correct >= 0 || testResults.incorrect >= 0)) {
      console.log('✅ Usando testResults:', testResults);
      return testResults;
    }
    
    // 6. Prova currentTestStats
    if (currentTestStats && (currentTestStats.correct >= 0 || currentTestStats.incorrect >= 0)) {
      console.log('✅ Usando currentTestStats:', currentTestStats);
      return currentTestStats;
    }
    
    // 7. Prova finalTestResults
    if (finalTestResults && (finalTestResults.correct >= 0 || finalTestResults.incorrect >= 0)) {
      console.log('✅ Usando finalTestResults:', finalTestResults);
      return finalTestResults;
    }
    
    // 8. ULTIMO TENTATIVO: Calcola dalle parole sbagliate
    if (wrongWords && Array.isArray(wrongWords)) {
      // Se ho 5 parole sbagliate su un totale di parole del test...
      // Dovrei avere anche il totale del test da qualche parte
      const incorrect = wrongWords.length;
      
      // Prova a vedere se c'è un totale nelle funzioni
      const summary = getTestSummary && getTestSummary();
      if (summary && summary.total) {
        const correct = summary.total - incorrect;
        console.log('✅ Calcolato da wrongWords + summary.total:', { correct, incorrect });
        return { correct, incorrect };
      }
      
      // Fallback estremo: assumo che sia un test piccolo
      console.log('⚠️ Usando fallback da wrongWords:', { correct: 0, incorrect });
      return { correct: 0, incorrect };
    }
    
    // FALLBACK FINALE: nessun dato trovato
    console.log('❌ Nessun dato del test trovato, usando default');
    return { correct: 0, incorrect: 0 };
  };

  const finalTestData = getTestResultData();

  console.log('🎯 ResultsView - Dati finali scelti:', finalTestData);

  return (
    <TestResults
      stats={finalTestData}
      wrongWords={wrongWords}
      onStartNewTest={startNewTest}
      onResetTest={resetTest}
    />
  );
});
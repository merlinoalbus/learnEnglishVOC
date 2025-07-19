import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import TestResults from '../components/TestResults';

export const ResultsView: React.FC = React.memo(() => {
  const {
    wrongWords,
    startNewTest,
    resetTest,
    getTestSummary
  } = useAppContext();

  const getTestResultData = () => {
    const summary = getTestSummary && getTestSummary();
        
    if (summary && (summary.correct >= 0 || summary.incorrect >= 0)) {
      const processedData = {
        correct: summary.correct || 0,
        incorrect: summary.incorrect || 0,
        hints: summary.hints || 0,
        totalTime: summary.totalTime || 0,
        avgTimePerWord: summary.avgTimePerWord || 0,
        maxTimePerWord: summary.maxTimePerWord || 0,
        minTimePerWord: summary.minTimePerWord || 0,
        totalRecordedTime: summary.totalRecordedTime || 0,
        total: summary.total || (summary.correct + summary.incorrect),
        answered: summary.answered || (summary.correct + summary.incorrect),
        accuracy: summary.accuracy || 0,
        percentage: summary.percentage || 0
      };
      
      return processedData;
    }
    
    if (wrongWords && Array.isArray(wrongWords)) {
      const incorrect = wrongWords.length;
      const fallbackData = { 
        correct: 0, 
        incorrect, 
        hints: 0, 
        totalTime: 0, 
        avgTimePerWord: 0,
        maxTimePerWord: 0,
        minTimePerWord: 0,
        totalRecordedTime: 0,
        total: incorrect,
        answered: incorrect,
        accuracy: 0,
        percentage: 0
      };
      
      return fallbackData;
    }
    
    return null;
  };

  return (
    <TestResults
      stats={getTestResultData() || {
        correct: 0,
        incorrect: 0,
        hints: 0,
        totalTime: 0,
        avgTimePerWord: 0,
        maxTimePerWord: 0,
        minTimePerWord: 0,
        totalRecordedTime: 0
      }}
      wrongWords={wrongWords}
      onStartNewTest={startNewTest}
      onResetTest={resetTest}
    />
  );
});

ResultsView.displayName = 'ResultsView';
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import TestResults from '../components/TestResults';

export const ResultsView = React.memo(() => {
  const {
    wrongWords,
    startNewTest,
    resetTest,
    getTestSummary // ⭐ CRITICAL: Use this function that contains all enhanced data
  } = useAppContext();

  // ⭐ FIXED: Get test results directly from getTestSummary which contains enhanced data
  const getTestResultData = () => {
    // Get the enhanced summary with all timing and hints data
    const summary = getTestSummary && getTestSummary();
    
    console.log('🎯 ResultsView - Using getTestSummary data:', summary);
    
    if (summary && (summary.correct >= 0 || summary.incorrect >= 0)) {
      // ⭐ ENHANCED: Extract all available data from summary
      const enhancedData = {
        correct: summary.correct || 0,
        incorrect: summary.incorrect || 0,
        hints: summary.hints || 0, // ⭐ CRITICAL: Include hints count
        totalTime: summary.totalTime || 0, // ⭐ CRITICAL: Include total time
        avgTimePerWord: summary.avgTimePerWord || 0, // ⭐ CRITICAL: Include average time
        maxTimePerWord: summary.maxTimePerWord || 0, // ⭐ NEW: Include max time
        minTimePerWord: summary.minTimePerWord || 0, // ⭐ NEW: Include min time
        totalRecordedTime: summary.totalRecordedTime || 0, // ⭐ NEW: Include recorded time
        // Additional summary data
        total: summary.total || (summary.correct + summary.incorrect),
        answered: summary.answered || (summary.correct + summary.incorrect),
        accuracy: summary.accuracy || 0,
        percentage: summary.percentage || 0
      };
      
      console.log('✅ ResultsView - Enhanced data prepared:', enhancedData);
      return enhancedData;
    }
    
    // ⭐ FALLBACK: Calculate from wrongWords if summary not available
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
        totalRecordedTime: 0
      };
      
      console.log('⚠️ ResultsView - Using fallback from wrongWords:', fallbackData);
      return fallbackData;
    }
    
    // ⭐ FINAL FALLBACK
    const defaultData = { 
      correct: 0, 
      incorrect: 0, 
      hints: 0, 
      totalTime: 0, 
      avgTimePerWord: 0,
      maxTimePerWord: 0,
      minTimePerWord: 0,
      totalRecordedTime: 0
    };
    
    console.log('❌ ResultsView - Using default data:', defaultData);
    return defaultData;
  };

  const finalTestData = getTestResultData();

  console.log('🎯 ResultsView - Final data being passed to TestResults:', finalTestData);

  return (
    <TestResults
      stats={finalTestData}
      wrongWords={wrongWords}
      onStartNewTest={startNewTest}
      onResetTest={resetTest}
    />
  );
});
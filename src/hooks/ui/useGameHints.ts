import { useState, useCallback, useMemo } from 'react';
import { Word } from '../../types/entities/Word.types';

interface UseGameHintsConfig {
  mode: 'disabled' | 'unlimited' | 'limited';
  maxPerWord?: number;
  maxTotal?: number;
  enableTotalLimit?: boolean;
}

interface GameHints {
  synonym?: string[];
  antonym?: string[];
  context?: string[];
}

interface HintUsage {
  type: 'synonym' | 'antonym' | 'context';
  content: string;
  requestedAt: Date;
  sequenceOrder: number;
}

interface UseGameHintsReturn {
  gameHints: GameHints;
  totalHintsUsed: number;
  hintsUsedThisWord: number;
  hintUsageHistory: HintUsage[];
  canRequestHint: (type: 'synonym' | 'antonym' | 'context') => boolean;
  requestHint: (type: 'synonym' | 'antonym' | 'context', word: Word) => string | null;
  resetWordHints: () => void;
  resetAllHints: () => void;
}

export const useGameHints = (config: UseGameHintsConfig): UseGameHintsReturn => {
  const { mode, maxPerWord = 2, maxTotal = 5, enableTotalLimit = true } = config;
  
  const [gameHints, setGameHints] = useState<GameHints>({});
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [hintUsageHistory, setHintUsageHistory] = useState<HintUsage[]>([]);
  const [sequenceCounter, setSequenceCounter] = useState(0);
  
  // Calculate hints used for current word
  const hintsUsedThisWord = useMemo(() => {
    return Object.values(gameHints).reduce((total, hints) => total + (hints?.length || 0), 0);
  }, [gameHints]);
  
  // Check if a hint can be requested
  const canRequestHint = useCallback((type: 'synonym' | 'antonym' | 'context'): boolean => {
    if (mode === 'disabled') return false;
    if (mode === 'unlimited') return true;
    
    // Check per-word limit
    if (maxPerWord && hintsUsedThisWord >= maxPerWord) return false;
    
    // Check total limit
    if (enableTotalLimit && maxTotal && totalHintsUsed >= maxTotal) return false;
    
    return true;
  }, [mode, maxPerWord, maxTotal, enableTotalLimit, hintsUsedThisWord, totalHintsUsed]);
  
  // Generate a random hint from available options
  const generateHint = useCallback((type: 'synonym' | 'antonym' | 'context', word: Word): string | null => {
    const usedHints = gameHints[type] || [];
    let availableHints: string[] = [];
    
    switch (type) {
      case 'synonym':
        availableHints = word.synonyms || [];
        break;
      case 'antonym':
        availableHints = word.antonyms || [];
        break;
      case 'context':
        availableHints = word.sentences || [];
        break;
    }
    
    // Filter out already used hints
    const remainingHints = availableHints.filter(hint => !usedHints.includes(hint));
    
    if (remainingHints.length === 0) return null;
    
    // Return random hint from remaining options
    const randomIndex = Math.floor(Math.random() * remainingHints.length);
    return remainingHints[randomIndex];
  }, [gameHints]);
  
  // Request a hint
  const requestHint = useCallback((type: 'synonym' | 'antonym' | 'context', word: Word): string | null => {
    if (!canRequestHint(type)) return null;
    
    const newHint = generateHint(type, word);
    if (!newHint) return null;
    
    // Update game hints
    setGameHints(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), newHint]
    }));
    
    // Update counters
    setTotalHintsUsed(prev => prev + 1);
    setSequenceCounter(prev => prev + 1);
    
    // Record usage
    const usage: HintUsage = {
      type,
      content: newHint,
      requestedAt: new Date(),
      sequenceOrder: sequenceCounter + 1
    };
    
    setHintUsageHistory(prev => [...prev, usage]);
    
    return newHint;
  }, [canRequestHint, generateHint, sequenceCounter]);
  
  // Reset hints for current word
  const resetWordHints = useCallback(() => {
    setGameHints({});
  }, []);
  
  // Reset all hints
  const resetAllHints = useCallback(() => {
    setGameHints({});
    setTotalHintsUsed(0);
    setHintUsageHistory([]);
    setSequenceCounter(0);
  }, []);
  
  return {
    gameHints,
    totalHintsUsed,
    hintsUsedThisWord,
    hintUsageHistory,
    canRequestHint,
    requestHint,
    resetWordHints,
    resetAllHints,
  };
};
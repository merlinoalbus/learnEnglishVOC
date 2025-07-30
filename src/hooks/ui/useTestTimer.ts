import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTestTimerConfig {
  enabled: boolean;
  timePerWord: number; // in seconds
  autoAdvance: boolean;
  onTimeExpired?: () => void;
  onTick?: (elapsed: number) => void;
}

interface UseTestTimerReturn {
  currentTime: number;
  timeExpired: boolean;
  isRunning: boolean;
  timeRemaining: number;
  progressPercentage: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export const useTestTimer = (config: UseTestTimerConfig): UseTestTimerReturn => {
  const { enabled, timePerWord, autoAdvance, onTimeExpired, onTick } = config;
  
  const [currentTime, setCurrentTime] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeExpiredRef = useRef(false);
  
  // Calculate derived values
  const timeRemaining = Math.max(0, timePerWord - currentTime);
  const progressPercentage = timePerWord > 0 ? Math.min(100, (currentTime / timePerWord) * 100) : 0;
  
  const startTimer = useCallback(() => {
    if (!enabled || isRunning) return;
    
    setIsRunning(true);
    setTimeExpired(false);
    timeExpiredRef.current = false;
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCurrentTime(elapsed);
      
      // Call onTick callback
      onTick?.(elapsed);
      
      // Check if time expired
      if (elapsed >= timePerWord && !timeExpiredRef.current) {
        timeExpiredRef.current = true;
        setTimeExpired(true);
        setIsRunning(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        if (autoAdvance) {
          onTimeExpired?.();
        }
      }
    }, 1000);
  }, [enabled, isRunning, timePerWord, autoAdvance, onTimeExpired, onTick]);
  
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const resetTimer = useCallback(() => {
    stopTimer();
    setCurrentTime(0);
    setTimeExpired(false);
    timeExpiredRef.current = false;
    startTimeRef.current = null;
  }, [stopTimer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Auto-start when enabled changes
  useEffect(() => {
    if (enabled && !isRunning && !timeExpired) {
      startTimer();
    } else if (!enabled && isRunning) {
      stopTimer();
    }
  }, [enabled, isRunning, timeExpired, startTimer, stopTimer]);
  
  return {
    currentTime,
    timeExpired,
    isRunning,
    timeRemaining,
    progressPercentage,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
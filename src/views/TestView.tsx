import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import TestCard from '../components/TestCard';
import { RotateCcw, Check, X, HelpCircle, Clock, Lightbulb } from 'lucide-react';

export const TestView: React.FC = React.memo(() => {
  const {
    currentWord,
    showMeaning,
    setShowMeaning,
    handleAnswer,
    resetTest,
    getTestProgress,
    getTestSummary,
    showHint,
    toggleHint,
    hintUsed,
    isTransitioning
  } = useAppContext();

  const [currentWordTime, setCurrentWordTime] = useState<number>(0);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wordStartTimeRef = useRef<number | null>(null);

  const progress = getTestProgress();
  const summary = getTestSummary();

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentWord && !isTransitioning && !isAnswering) {
      setCurrentWordTime(0);
      wordStartTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        if (wordStartTimeRef.current && !isAnswering) {
          const elapsed = Math.floor((Date.now() - wordStartTimeRef.current) / 1000);
          setCurrentWordTime(elapsed);
        }
      }, 1000);
    } else if (!currentWord) {
      setCurrentWordTime(0);
      wordStartTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentWord, isTransitioning, isAnswering]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleAnswerWithTimer = (isCorrect: boolean) => {
    setIsAnswering(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    handleAnswer(isCorrect);
    
    setTimeout(() => {
      setIsAnswering(false);
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p>Nessuna parola disponibile</p>
          </div>
          <Button onClick={resetTest} className="bg-blue-500 hover:bg-blue-600">
            <RotateCcw className="w-4 h-4 mr-2" />
            Ricomincia Test
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Progress */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Domanda {progress?.current || 0} di {progress?.total || 0}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {formatTime(currentWordTime)}
          </div>
        </div>
        <Button
          onClick={resetTest}
          variant="outline"
          className="bg-red-50 hover:bg-red-100 text-red-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((progress?.current || 0) / (progress?.total || 1)) * 100}%` }}
        />
      </div>

      {/* Test Card */}
      <TestCard
        word={currentWord}
        showMeaning={showMeaning}
        onFlip={() => setShowMeaning(!showMeaning)}
        showHint={showHint}
        hintUsed={hintUsed}
      />

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!showMeaning && (
          <Button
            onClick={() => setShowMeaning(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Mostra Significato
          </Button>
        )}
        
        {!showHint && !hintUsed && (
          <Button
            onClick={toggleHint}
            variant="outline"
            className="bg-purple-50 hover:bg-purple-100 text-purple-600"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggerimento
          </Button>
        )}
      </div>

      {/* Test Summary */}
      {summary && (
        <Card className="p-4">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Riepilogo Test</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Corrette</div>
                <div className="text-green-600">{summary.correct || 0}</div>
              </div>
              <div>
                <div className="font-medium">Sbagliate</div>
                <div className="text-red-600">{summary.incorrect || 0}</div>
              </div>
              <div>
                <div className="font-medium">Punteggio</div>
                <div className="text-blue-600">{summary.score || 0}%</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

TestView.displayName = 'TestView';
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import TestCard from '../components/TestCard';
import { RotateCcw, Check, X, HelpCircle, Clock, Lightbulb } from 'lucide-react';

export const TestView = React.memo(() => {
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
    hintUsed
  } = useAppContext();

  // ⭐ FIXED: Local timer management for UI display
  const [currentWordTime, setCurrentWordTime] = useState(0);
  const timerRef = useRef(null);
  const wordStartTimeRef = useRef(null);

  const progress = getTestProgress();
  const summary = getTestSummary();

  // ⭐ FIXED: Proper timer effect that starts when word appears
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start timer when word appears and meaning is not shown
    if (currentWord && !showMeaning) {
      console.log('🕐 Starting UI timer for word:', currentWord.english);
      setCurrentWordTime(0);
      wordStartTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        if (wordStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - wordStartTimeRef.current) / 1000);
          setCurrentWordTime(elapsed);
        }
      }, 1000);
    } else {
      // Reset timer when showing meaning or no word
      setCurrentWordTime(0);
      wordStartTimeRef.current = null;
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentWord, showMeaning]);

  // ⭐ FIXED: Stop timer when component unmounts or test ends
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ⭐ ENHANCED: Handle answer with proper timer cleanup
  const handleAnswerWithTimer = (isCorrect) => {
    console.log('📝 Answer given, stopping timer at:', currentWordTime, 'seconds');
    
    // Stop the timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Call the original handler
    handleAnswer(isCorrect);
  };

  // ⭐ NEW: Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* ⭐ ENHANCED: Test Header with Fixed Timer */}
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
          <div className="bg-white rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Test in Corso
                </h2>
                <p className="text-gray-600">Parola {progress.current} di {progress.total}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>Accuratezza: {summary.accuracy}%</span>
                  <span>Rimanenti: {summary.remaining}</span>
                  {progress.hints > 0 && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Lightbulb className="w-4 h-4" />
                      Aiuti: {progress.hints}
                    </span>
                  )}
                  {summary.totalTime > 0 && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Clock className="w-4 h-4" />
                      Totale: {formatTime(summary.totalTime)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.correct}</div>
                    <div className="text-sm text-green-700">Corrette</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.incorrect}</div>
                    <div className="text-sm text-red-700">Sbagliate</div>
                  </div>
                  {/* ⭐ FIXED: Current word timer display */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center gap-1 transition-colors ${
                      currentWordTime > 30 ? 'text-red-600' : 
                      currentWordTime > 15 ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      <Clock className="w-6 h-6" />
                      {formatTime(currentWordTime)}
                    </div>
                    <div className="text-sm text-blue-700">Tempo Parola</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Progress bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress.percentage}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="text-center mt-2 text-sm font-medium text-gray-600">
                {progress.percentage}% completato
                {summary.avgTimePerWord > 0 && (
                  <span className="ml-4 text-purple-600">
                    Media: {summary.avgTimePerWord}s/parola
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ⭐ ENHANCED: Hint Display */}
      {showHint && currentWord?.sentence && (
        <Card className="backdrop-blur-sm bg-orange-50 border-2 border-orange-200 shadow-xl rounded-2xl overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-orange-400 to-yellow-400 p-1">
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-bold text-orange-800">💡 Suggerimento</h3>
                <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  Frase di contesto
                </span>
              </div>
              <div className="text-lg italic text-orange-900 bg-orange-50 p-4 rounded-xl border border-orange-200">
                "{currentWord.sentence}"
              </div>
              <p className="text-sm text-orange-600 mt-2 text-center">
                ⚠️ Questo aiuto verrà conteggiato nelle statistiche
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Test Card Area */}
      {currentWord && (
        <div className="relative min-h-[80vh] flex items-center justify-center">
          <TestCard 
            word={currentWord}
            showMeaning={showMeaning}
            onFlip={() => setShowMeaning(!showMeaning)}
          />

          {/* ⭐ FIXED: Answer Buttons with timer cleanup */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
            <div className="flex justify-center space-x-6 mb-6">
              {showMeaning ? (
                <>
                  <Button
                    onClick={() => handleAnswerWithTimer(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-0"
                  >
                    <Check className="w-6 h-6 mr-3" />
                    Sapevo la risposta!
                  </Button>
                  <Button
                    onClick={() => handleAnswerWithTimer(false)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-0"
                  >
                    <X className="w-6 h-6 mr-3" />
                    Non la sapevo
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-xl text-gray-700 font-medium">🎯 Clicca la carta per vedere la traduzione</p>
                  <p className="text-sm text-gray-500">Cerca di ricordare il significato prima di girare</p>
                  
                  {/* ⭐ ENHANCED: Hint Button with timer awareness */}
                  {currentWord?.sentence && (
                    <div className="flex justify-center">
                      <Button
                        onClick={toggleHint}
                        disabled={hintUsed}
                        className={`${
                          showHint 
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600' 
                            : hintUsed
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500'
                        } text-white px-6 py-3 text-base rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 border-0 disabled:transform-none disabled:hover:scale-100`}
                        title={hintUsed ? "Aiuto già utilizzato per questa parola" : "Mostra frase di contesto"}
                      >
                        <HelpCircle className="w-5 h-5 mr-2" />
                        {showHint ? '🔍 Nascondi Aiuto' : hintUsed ? '✅ Aiuto Usato' : '💡 Chiedi Aiuto'}
                      </Button>
                    </div>
                  )}
                  
                  {/* ⭐ NEW: Timer indicator for user */}
                  <div className="mt-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      currentWordTime > 30 ? 'bg-red-100 text-red-700' : 
                      currentWordTime > 15 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-bold">{formatTime(currentWordTime)}</span>
                      <span className="text-sm">
                        {currentWordTime > 30 ? 'Tempo lungo!' : 
                         currentWordTime > 15 ? 'Continua a riflettere...' : 'Tempo di riflessione'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* End Test Button */}
      <div className="flex justify-center">
        <Button 
          onClick={resetTest} 
          variant="outline"
          className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white/90 rounded-xl px-6 py-3 shadow-lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Termina Test
        </Button>
      </div>
    </>
  );
});
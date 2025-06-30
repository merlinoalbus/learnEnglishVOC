import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import TestCard from '../components/TestCard';
import { RotateCcw, Check, X } from 'lucide-react';

export const TestView = React.memo(() => {
  const {
    currentWord,
    showMeaning,
    setShowMeaning,
    handleAnswer,
    resetTest,
    getTestProgress,
    getTestSummary
  } = useAppContext();

  const progress = getTestProgress();
  const summary = getTestSummary();

  return (
    <>
      {/* Test Header with Enhanced Progress */}
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
          <div className="bg-white rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Test in Corso
                </h2>
                <p className="text-gray-600">Parola {progress.current} di {progress.total}</p>
                <p className="text-sm text-gray-500">
                  Accuratezza: {summary.accuracy}% • Rimanenti: {summary.remaining}
                </p>
              </div>
              <div className="text-right">
                <div className="flex gap-4">
                  <div className="text-center">
                    {/* ⭐ CORRETTO: Usa summary.correct dall'hook sistemato */}
                    <div className="text-2xl font-bold text-green-600">{summary.correct}</div>
                    <div className="text-sm text-green-700">Corrette</div>
                  </div>
                  <div className="text-center">
                    {/* ⭐ CORRETTO: Usa summary.incorrect dall'hook sistemato */}
                    <div className="text-2xl font-bold text-red-600">{summary.incorrect}</div>
                    <div className="text-sm text-red-700">Sbagliate</div>
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
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Card Area */}
      {currentWord && (
        <div className="relative min-h-[80vh] flex items-center justify-center">
          <TestCard 
            word={currentWord}
            showMeaning={showMeaning}
            onFlip={() => setShowMeaning(!showMeaning)}
          />

          {/* Answer Buttons */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
            <div className="flex justify-center space-x-6 mb-6">
              {showMeaning ? (
                <>
                  <Button
                    onClick={() => handleAnswer(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-0"
                  >
                    <Check className="w-6 h-6 mr-3" />
                    Sapevo la risposta!
                  </Button>
                  <Button
                    onClick={() => handleAnswer(false)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-0"
                  >
                    <X className="w-6 h-6 mr-3" />
                    Non la sapevo
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-xl text-gray-700 font-medium">🎯 Clicca la carta per vedere la traduzione</p>
                  <p className="text-sm text-gray-500">Cerca di ricordare il significato prima di girare</p>
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
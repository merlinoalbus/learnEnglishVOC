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
    isTransitioning,
    gameHints,
    totalHintsUsed,
    testConfig,
    handleGameHintRequest,
    currentWordSession,
    detailedSession
  } = useAppContext();

  const [currentWordTime, setCurrentWordTime] = useState<number>(0);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [timeExpired, setTimeExpired] = useState<boolean>(false);
  
  // Timer configuration dalla TestSelector
  const timerEnabled = testConfig?.enableTimer || false;
  const timePerWord = testConfig?.maxTimePerWord || 30;
  const autoAdvanceEnabled = true; // Sempre abilitato per modalità gioco
  
  // Debug configurazione timer
  React.useEffect(() => {
    console.log('🔧 Timer Config:', {
      timerEnabled,
      timePerWord,
      autoAdvanceEnabled,
      testConfig: testConfig
    });
  }, [timerEnabled, timePerWord, autoAdvanceEnabled, testConfig]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wordStartTimeRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeExpiredRef = useRef<boolean>(false);

  const progress = getTestProgress();
  const summary = getTestSummary();

  // Reset timer quando cambia parola
  useEffect(() => {
    if (currentWord) {
      setTimeExpired(false);
    }
  }, [currentWord]);

  useEffect(() => {
    // Clear existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (currentWord && !isTransitioning && !isAnswering) {
      // ⭐ CRITICAL FIX: Reset timeExpired IMMEDIATELY when starting new word
      setCurrentWordTime(0);
      setTimeExpired(false);
      timeExpiredRef.current = false; // Sync ref with state
      wordStartTimeRef.current = Date.now();
      
      console.log(`🔄 TIMER RESET per nuova parola: ${currentWord.english}, timeExpired reset a false`);
      
      // Start timer
      timerRef.current = setInterval(() => {
        if (wordStartTimeRef.current && !isAnswering) {
          const elapsed = Math.floor((Date.now() - wordStartTimeRef.current) / 1000);
          setCurrentWordTime(elapsed);
          
          // Debug logging per timer
          if (elapsed % 5 === 0 && elapsed > 0) { // Log ogni 5 secondi
            console.log(`🕒 Timer debug - Elapsed: ${elapsed}s, Limit: ${timePerWord}s, Enabled: ${timerEnabled}, AutoAdvance: ${autoAdvanceEnabled}, TimeExpired: ${timeExpiredRef.current}`);
          }
          
          // Check if timer enabled and time limit exceeded
          if (timerEnabled && elapsed >= timePerWord && !timeExpiredRef.current) {
            console.log(`⏰ TIMER SCADUTO! Elapsed: ${elapsed}, Limit: ${timePerWord}, Triggering auto-advance...`);
            setTimeExpired(true);
            timeExpiredRef.current = true; // Sync ref with state
            
            // FERMA IMMEDIATAMENTE IL TIMER per evitare scatti multipli
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              console.log(`🛑 Timer fermato dopo scadenza`);
            }
            
            // Auto-advance se abilitato
            if (autoAdvanceEnabled) {
              console.log(`🚀 Auto-advance abilitato, mostrando traduzione per lettura...`);
              
              // ⭐ CRITICAL FIX: Gira immediatamente la card e blocca input utente
              if (!showMeaning) {
                setShowMeaning(true);
              }
              
              // Mantieni 6 secondi per permettere lettura, ma input già bloccato da timeExpired
              autoAdvanceTimeoutRef.current = setTimeout(() => {
                console.log(`🔄 Girando carta coperta prima di passare alla parola successiva`);
                // Prima gira la carta coperta
                setShowMeaning(false);
                
                // Aspetta 500ms per l'animazione di flip, poi processa la risposta
                setTimeout(() => {
                  console.log(`🎯 Processando risposta sbagliata dopo flip`);
                  handleAnswer(false, true); // Segna come sbagliato per timeout
                }, 500);
              }, 6000); // Ripristinato a 6 secondi per lettura
            } else {
              console.log(`🚫 Auto-advance disabilitato`);
            }
          } else if (timerEnabled && elapsed > timePerWord && !timeExpiredRef.current) {
            // ⭐ CRITICAL FIX: Additional safety check - only if not already expired
            console.log(`🚨 TIMER SAFETY STOP! Elapsed: ${elapsed} > Limit: ${timePerWord}, but timeExpired not set yet`);
            setTimeExpired(true);
            timeExpiredRef.current = true;
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Clamp the display time to the limit
            setCurrentWordTime(timePerWord);
            return; // Exit early to prevent further updates
          }
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
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [currentWord, isTransitioning, isAnswering, timerEnabled, timePerWord, autoAdvanceEnabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const handleAnswerWithTimer = (isCorrect: boolean) => {
    console.log(`📝 handleAnswerWithTimer chiamato - isCorrect: ${isCorrect}, timeExpired: ${timeExpired}, showMeaning: ${showMeaning}`);
    
    // Se il timer è scaduto, non permettere più risposte manuali dell'utente
    if (timeExpired) {
      console.log(`🚫 Timer scaduto - risposta utente ignorata`);
      return;
    }
    
    setIsAnswering(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    console.log(`✅ Processando risposta utente normalmente`);
    // Chiamata normale
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
      <div className="test-view-loading">
        <div className="flex-center-column">
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

  // Calcola dati in tempo reale
  const currentProgress = getTestProgress();
  const currentSummary = getTestSummary();
  
  // Calcola limiti suggerimenti per interfaccia
  const currentHintsThisWord = Object.values(gameHints || {}).reduce((total: number, hints: any) => total + (hints?.length || 0), 0);
  const isWordLimitReached = testConfig?.hintsMode === 'limited' && 
                            testConfig.maxHintsPerWord && 
                            (currentHintsThisWord as number) >= testConfig.maxHintsPerWord;
  const isTotalLimitReached = testConfig?.hintsMode === 'limited' && 
                             testConfig.enableTotalHintsLimit && 
                             testConfig.maxTotalHints && 
                             (totalHintsUsed || 0) >= testConfig.maxTotalHints;

  return (
    <div className="test-view-content">
      {/* Header Unificato con Progress e Stats */}
      <div className="test-view-progress-card">
        {/* Prima riga: Informazioni principali */}
        <div className="test-view-progress-header">
          <div className="test-view-progress-stats">
            {/* Progress principale */}
            <div className="test-view-progress-stat">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex-center text-white font-bold shadow-lg">
                {currentProgress.current}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Domanda {currentProgress.current} di {currentProgress.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentProgress.percentage}% completato
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className={`test-view-timer-display ${timeExpired ? 'test-view-timer-warning' : 'test-view-timer-normal'}`}>
              <Clock className="w-4 h-4 text-blue-600" />
              <span className={`font-mono ${timeExpired ? 'text-red-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatTime(currentWordTime)}
              </span>
              {timerEnabled && (
                <span className="text-xs text-gray-500">
                  / {timePerWord}s
                </span>
              )}
            </div>

          </div>

          <Button
            onClick={resetTest}
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Seconda riga: Progress bars */}
        <div className="stack-md">
          {/* Progress Bar principale */}
          <div className="stack-sm">
            <div className="flex-between text-xs text-gray-600 dark:text-gray-400">
              <span>Progresso test</span>
              <span>{currentProgress.remaining} rimanenti</span>
            </div>
            <div className="test-view-progress-bar">
              <div 
                className="test-view-progress-fill"
                style={{ width: `${currentProgress.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Timer Progress Bar (se timer abilitato) */}
          {timerEnabled && (
            <div className="stack-sm">
              <div className="flex-between text-xs text-gray-600 dark:text-gray-400">
                <span>Tempo parola</span>
                <span className={timeExpired ? 'text-red-600 font-bold' : ''}>
                  {timeExpired ? 'Scaduto!' : `${timePerWord - currentWordTime}s rimanenti`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    timeExpired ? 'bg-red-500' : 
                    currentWordTime >= timePerWord * 0.8 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min((currentWordTime / timePerWord) * 100, 100)}%`,
                    transition: timeExpired ? 'none' : 'width 1s linear'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Terza riga: Statistiche in tempo reale */}
        <div className="flex-between mt-4 pt-4 border-t border-blue-200/30 dark:border-blue-700/30">
          <div className="test-view-summary-stats">
            <div className="text-center">
              <div className="test-view-summary-value text-green-600">{currentSummary.correctAnswers}</div>
              <div className="test-view-summary-label">Corrette</div>
            </div>
            <div className="text-center">
              <div className="test-view-summary-value text-red-600">{currentSummary.incorrectAnswers}</div>
              <div className="test-view-summary-label">Sbagliate</div>
            </div>
            <div className="text-center">
              <div className="test-view-summary-value text-orange-600">{totalHintsUsed || 0}</div>
              <div className="test-view-summary-label">Aiuti</div>
            </div>
            <div className="text-center">
              <div className="test-view-summary-value text-blue-600">{currentSummary.accuracy}%</div>
              <div className="test-view-summary-label">Precisione</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area: Card + Suggerimenti a lato */}
      <div className="flex gap-4 items-start justify-center min-h-[500px]">
        {/* Test Card */}
        <div className="test-view-card-wrapper flex-shrink-0">
          <TestCard
            word={currentWord}
            showMeaning={showMeaning}
            onFlip={() => setShowMeaning(!showMeaning)}
            showHint={showHint}
            hintUsed={hintUsed}
            gameMode={true}
            gameHints={gameHints || {}}
            onGameHintRequest={handleGameHintRequest}
          />
        </div>

        {/* Pannello Suggerimenti a Lato */}
        {(
          <div className="flex-shrink-0 w-80 stack-md">
            <div className={`card-glass border border-white/30 dark:border-gray-700/30 p-6 transition-opacity duration-300 ${showMeaning ? 'opacity-50' : ''}`}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Suggerimenti
              </h3>
              
              <div className="stack-md">
                {/* Sinonimi */}
                <div>
                  <button
                    onClick={() => handleGameHintRequest('synonym')}
                    disabled={showMeaning || testConfig?.hintsMode === 'disabled' || isWordLimitReached || isTotalLimitReached}
                    className="test-view-hint-button test-view-hint-context w-full group rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <div className="text-left flex-1">
                        <div className="font-bold">Sinonimi</div>
                        <div className="text-sm opacity-90">
                          {gameHints?.synonym?.length || 0} rivelati
                        </div>
                      </div>
                      <div className="text-2xl opacity-75 group-hover:opacity-100 transition-opacity">
                        +
                      </div>
                    </div>
                  </button>
                  
                  {/* Lista sinonimi rivelati */}
                  {gameHints?.synonym && gameHints.synonym.length > 0 && (
                    <div className="mt-3 stack-sm">
                      {gameHints.synonym.map((hint: string, index: number) => (
                        <div key={index} className="status-info rounded-lg p-3 border border-blue-200 dark:border-blue-700 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">🔄</span>
                            <span className="font-medium">{hint}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contrari */}
                <div>
                  <button
                    onClick={() => handleGameHintRequest('antonym')}
                    disabled={showMeaning || testConfig?.hintsMode === 'disabled' || isWordLimitReached || isTotalLimitReached}
                    className="test-view-hint-button test-view-hint-antonym w-full group rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div className="text-left flex-1">
                        <div className="font-bold">Contrari</div>
                        <div className="text-sm opacity-90">
                          {gameHints?.antonym?.length || 0} rivelati
                        </div>
                      </div>
                      <div className="text-2xl opacity-75 group-hover:opacity-100 transition-opacity">
                        +
                      </div>
                    </div>
                  </button>
                  
                  {/* Lista contrari rivelati */}
                  {gameHints?.antonym && gameHints.antonym.length > 0 && (
                    <div className="mt-3 stack-sm">
                      {gameHints.antonym.map((hint: string, index: number) => (
                        <div key={index} className="status-warning rounded-lg p-3 border border-orange-200 dark:border-orange-700 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600">⚡</span>
                            <span className="font-medium">{hint}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contesto */}
                <div>
                  <button
                    onClick={() => handleGameHintRequest('context')}
                    disabled={showMeaning || testConfig?.hintsMode === 'disabled' || isWordLimitReached || isTotalLimitReached}
                    className="test-view-hint-button test-view-hint-synonym w-full group rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      <div className="text-left flex-1">
                        <div className="font-bold">Contesto</div>
                        <div className="text-sm opacity-90">
                          {gameHints?.context?.length || 0} rivelati
                        </div>
                      </div>
                      <div className="text-2xl opacity-75 group-hover:opacity-100 transition-opacity">
                        +
                      </div>
                    </div>
                  </button>
                  
                  {/* Lista contesti rivelati */}
                  {gameHints?.context && gameHints.context.length > 0 && (
                    <div className="mt-3 stack-sm">
                      {gameHints.context.map((hint: string, index: number) => (
                        <div key={index} className="status-success rounded-lg p-3 border border-green-200 dark:border-green-700 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">💬</span>
                            <span className="italic">"{hint}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info limiti */}
              {testConfig?.hintsMode === 'limited' && (
                <div className="mt-6 pt-4 border-soft">
                  <div className="text-xs text-gray-600 dark:text-gray-400 stack-sm">
                    {testConfig.maxHintsPerWord && (
                      <div className={`flex-between ${isWordLimitReached ? 'text-red-600 font-bold' : ''}`}>
                        <span>Max per parola:</span>
                        <span>{currentHintsThisWord}/{testConfig.maxHintsPerWord}</span>
                      </div>
                    )}
                    {testConfig.enableTotalHintsLimit && testConfig.maxTotalHints && (
                      <div className={`flex-between ${isTotalLimitReached ? 'text-red-600 font-bold' : ''}`}>
                        <span>Max totali:</span>
                        <span>{totalHintsUsed || 0}/{testConfig.maxTotalHints}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Warning messages */}
                  {(isWordLimitReached || isTotalLimitReached) && (
                    <div className="mt-3 p-3 status-error border border-red-300 dark:border-red-700 rounded-lg">
                      <div className="text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                        <span>🚫</span>
                        {isWordLimitReached && isTotalLimitReached ? 
                          'Limite per parola e limite totale raggiunti!' :
                          isWordLimitReached ? 
                            'Limite suggerimenti per questa parola raggiunto!' :
                            'Limite totale suggerimenti raggiunto!'
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Mode sempre attivo - non servono più i vecchi controlli */}

      {/* Answer Buttons - Always visible */}
      <div className="test-view-answer-buttons">
        <Button
          onClick={() => handleAnswerWithTimer(false)}
          disabled={!showMeaning || isAnswering || timeExpired}
          variant="ghost"
          className={`test-view-answer-button test-view-answer-incorrect ${!showMeaning ? 'opacity-50' : ''}`}
        >
          <X className="w-5 h-5 mr-2" />
          {timeExpired ? 'Tempo scaduto' : 'Sbagliato'}
        </Button>
        
        <Button
          onClick={() => handleAnswerWithTimer(true)}
          disabled={!showMeaning || isAnswering || timeExpired}
          variant="ghost"
          className={`test-view-answer-button test-view-answer-correct ${!showMeaning ? 'opacity-50' : ''}`}
        >
          <Check className="w-5 h-5 mr-2" />
          Corretto
        </Button>
      </div>
      
      {/* Timer warning/auto-advance notification */}
      {timeExpired && (
        <div className="test-view-timeout-notice">
          <div className="test-view-timeout-badge">
            <Clock className="w-4 h-4" />
            <span>Tempo scaduto! Passaggio automatico...</span>
          </div>
        </div>
      )}

      {/* Test Summary finale solo quando il test è completato */}
      {!currentWord && currentProgress.current > 0 && (
        <Card className="test-view-summary">
          <div className="text-center">
            <div className="flex-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex-center">
                <span className="text-2xl">🎉</span>
              </div>
              <div>
                <h3 className="test-view-summary-title">Test Completato!</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">🎮 Modalità Gioco</div>
              </div>
            </div>
            
            <div className="test-view-summary-stats">
              <div className="test-view-summary-stat">
                <div className="test-view-summary-value text-green-600">{currentSummary.correctAnswers}</div>
                <div className="test-view-summary-label">Risposte Corrette</div>
              </div>
              <div className="test-view-summary-stat">
                <div className="test-view-summary-value text-red-600">{currentSummary.incorrectAnswers}</div>
                <div className="test-view-summary-label">Risposte Sbagliate</div>
              </div>
              <div className="test-view-summary-stat">
                <div className="test-view-summary-value text-orange-600">{totalHintsUsed || 0}</div>
                <div className="test-view-summary-label">Aiuti Usati</div>
              </div>
              <div className="test-view-summary-stat">
                <div className="test-view-summary-value text-blue-600">{currentSummary.accuracy}%</div>
                <div className="test-view-summary-label">Precisione</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-green-200/30 dark:border-green-700/30">
              <div className="test-view-summary-label">
                Tempo totale: {formatTime(Math.floor(currentSummary.timeSpent / 1000))} • 
                Media per parola: {formatTime(Math.floor(currentSummary.averageTimePerWord / 1000))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

TestView.displayName = 'TestView';
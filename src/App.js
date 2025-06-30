import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from './components/ui/modal';
import { 
  Play, RotateCcw, Check, X, RefreshCw, Trash2, BarChart3, 
  Brain, Sparkles, Calendar, BookOpen
} from 'lucide-react';

// Custom Hooks
import { useWords } from './hooks/useWords';
import { useTest } from './hooks/useTest';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotification } from './hooks/useNotification';

// Components
import TestCard from './components/TestCard';
import TestResults from './components/TestResults';
import AddWordForm from './components/AddWordForm';
import WordsList from './components/WordsList';
import JSONManager from './components/JSONManager';
import StatsOverview from './components/StatsOverview';
import ChapterTestSelector from './components/ChapterTestSelector';

import './App.css';

const VocabularyApp = () => {
  const { 
    words, 
    editingWord, 
    setEditingWord, 
    addWord, 
    removeWord, 
    toggleWordLearned,
    clearAllWords, 
    importWords,
    getAvailableChapters,
    getChapterStats
  } = useWords();
  
  const { message: statusMessage, showNotification } = useNotification();
  const [testHistory, setTestHistory] = useLocalStorage('testHistory', []);

  // Ottieni i capitoli usati nel test corrente
  const getUsedChapters = useCallback((testWordsArray) => {
    const chapters = new Set();
    testWordsArray.forEach(word => {
      if (word.chapter) {
        chapters.add(word.chapter);
      } else {
        chapters.add('Senza Capitolo');
      }
    });
    return Array.from(chapters);
  }, []);
  
  // Test completion handler con parametri avanzati
  const handleTestComplete = useCallback((testStats, testWordsUsed, wrongWordsArray) => {
    // Calcola statistiche per capitolo
    const chapterStats = {};
    const usedChapters = getUsedChapters(testWordsUsed);
    
    usedChapters.forEach(chapter => {
      const chapterWords = testWordsUsed.filter(word => 
        (word.chapter || 'Senza Capitolo') === chapter
      );
      const chapterWrongWords = wrongWordsArray.filter(word => 
        (word.chapter || 'Senza Capitolo') === chapter
      );
      
      chapterStats[chapter] = {
        totalWords: chapterWords.length,
        correctWords: chapterWords.length - chapterWrongWords.length,
        incorrectWords: chapterWrongWords.length,
        percentage: chapterWords.length > 0 ? 
          Math.round(((chapterWords.length - chapterWrongWords.length) / chapterWords.length) * 100) : 0
      };
    });

    // Calcola difficoltà del test basata sui parametri
    const calculateTestDifficulty = () => {
      const factors = {
        chapters: usedChapters.length / Math.max(getAvailableChapters().length, 1),
        learned: testWordsUsed.filter(w => w.learned).length / Math.max(testWordsUsed.length, 1),
        size: Math.min(testWordsUsed.length / 50, 1) // Normalizza su 50 parole
      };
      
      const score = (factors.chapters * 0.4) + (factors.learned * 0.3) + (factors.size * 0.3);
      
      if (score < 0.3) return 'easy';
      if (score < 0.7) return 'medium';
      return 'hard';
    };

    const testResult = {
      id: Date.now(),
      timestamp: new Date(),
      
      // Statistiche generali
      totalWords: testStats.correct + testStats.incorrect,
      correctWords: testStats.correct,
      incorrectWords: testStats.incorrect,
      percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
      wrongWords: [...wrongWordsArray],
      
      // Nuovi parametri avanzati
      testParameters: {
        selectedChapters: usedChapters,
        includeLearnedWords: testWordsUsed.some(word => word.learned),
        totalAvailableWords: words.filter(word => !word.learned).length,
        chaptersAvailable: getAvailableChapters().length
      },
      
      // Statistiche per capitolo
      chapterStats,
      
      // Metadata test
      testType: usedChapters.length === getAvailableChapters().length ? 'complete' : 'selective',
      wordsUsed: testWordsUsed.length,
      difficulty: calculateTestDifficulty()
    };
    
    setTestHistory(prev => [testResult, ...prev]);
    showNotification(`✅ Test completato! Risultato: ${testResult.percentage}%`);
  }, [words, getAvailableChapters, getUsedChapters, setTestHistory, showNotification]);
  
  const {
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
    getTestProgress,
    getTestSummary
  } = useTest(handleTestComplete);

  // UI State
  const [currentView, setCurrentView] = useState('main');
  const [showWordsList, setShowWordsList] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);

  // Enhanced test functions that save to history
  // Non serve più handleStartNewTest perché il salvataggio è automatico

  // Funzione per avviare il test con selezione capitoli
  const handleStartTestWithChapters = () => {
    const availableWords = words.filter(word => !word.learned);
    if (availableWords.length === 0) {
      showNotification('⚠️ Nessuna parola disponibile per il test! Tutte le parole sono già state apprese.');
      return;
    }
    setShowChapterSelector(true);
  };

  // Funzione chiamata dal ChapterTestSelector
  const handleTestStart = (filteredWords) => {
    startTest(filteredWords);
  };

  // Word management handlers
  const handleAddWord = (wordData) => {
    try {
      addWord(wordData);
      showNotification(
        editingWord 
          ? `✅ Parola "${wordData.english}" modificata con successo!`
          : `✅ Parola "${wordData.english}" aggiunta con successo!`
      );
      // Reset del form dopo salvataggio
      setEditingWord(null);
    } catch (error) {
      showNotification(`❌ ${error.message}`);
    }
  };

  const handleRemoveWord = (id) => {
    const wordToDelete = words.find(word => word.id === id);
    if (wordToDelete) {
      setConfirmDelete(wordToDelete);
    }
  };

  const confirmRemoveWord = () => {
    if (confirmDelete) {
      removeWord(confirmDelete.id);
      showNotification(`✅ Parola "${confirmDelete.english}" eliminata con successo!`);
      setConfirmDelete(null);
    }
  };

  const handleToggleWordLearned = (id) => {
    const word = words.find(w => w.id === id);
    if (word) {
      toggleWordLearned(id);
      showNotification(
        word.learned 
          ? `📖 "${word.english}" segnata come da studiare`
          : `✅ "${word.english}" segnata come appresa!`
      );
    }
  };

  const handleClearAllWords = () => {
    if (words.length === 0) return;
    setShowConfirmClear(true);
  };

  const confirmClearWords = () => {
    clearAllWords();
    setShowConfirmClear(false);
    showNotification('✅ Tutte le parole sono state eliminate!');
  };

  // JSON management
  const handleImportWords = (jsonText) => {
    const count = importWords(jsonText);
    return count;
  };

  // History management
  const clearTestHistory = () => {
    setTestHistory([]);
    setConfirmClearHistory(false);
    showNotification('✅ Cronologia test eliminata con successo!');
  };

  // Main render function
  if (testMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <BackgroundParticles />
        <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
          <TestMode 
            words={testWords}
            usedWordIds={usedWordIds}
            stats={stats}
            currentWord={currentWord}
            showMeaning={showMeaning}
            onFlipCard={() => setShowMeaning(!showMeaning)}
            onAnswer={handleAnswer}
            onResetTest={resetTest}
            getTestProgress={getTestProgress}
            getTestSummary={getTestSummary}
          />
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <BackgroundParticles />
        <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
          <AppHeader />
          <TestResults
            stats={stats}
            wrongWords={wrongWords}
            onStartNewTest={startNewTest}
            onResetTest={resetTest}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <BackgroundParticles />
      
      {/* Notification Toast */}
      <NotificationToast message={statusMessage} />
      
      {/* Chapter Test Selector */}
      {showChapterSelector && (
        <ChapterTestSelector
          words={words}
          onStartTest={handleTestStart}
          onClose={() => setShowChapterSelector(false)}
          showNotification={showNotification}
        />
      )}
      
      {/* Modals */}
      <ConfirmationModals
        confirmDelete={confirmDelete}
        showConfirmClear={showConfirmClear}
        confirmClearHistory={confirmClearHistory}
        words={words}
        testHistory={testHistory}
        onConfirmDelete={confirmRemoveWord}
        onCancelDelete={() => setConfirmDelete(null)}
        onConfirmClear={confirmClearWords}
        onCancelClear={() => setShowConfirmClear(false)}
        onConfirmClearHistory={clearTestHistory}
        onCancelClearHistory={() => setConfirmClearHistory(false)}
      />

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        <AppHeader />
        
        {/* Navigation */}
        <ViewNavigation currentView={currentView} setCurrentView={setCurrentView} testHistory={testHistory} />

        {currentView === 'stats' ? (
          <StatsOverview
            testHistory={testHistory}
            words={words}
            onClearHistory={() => setConfirmClearHistory(true)}
            onGoToMain={() => setCurrentView('main')}
          />
        ) : (
          <MainView
            words={words}
            editingWord={editingWord}
            showWordsList={showWordsList}
            setShowWordsList={setShowWordsList}
            onStartTest={handleStartTestWithChapters}
            onAddWord={handleAddWord}
            onEditWord={setEditingWord}
            onRemoveWord={handleRemoveWord}
            onToggleWordLearned={handleToggleWordLearned}
            onClearForm={() => setEditingWord(null)}
            onClearAllWords={handleClearAllWords}
            onImportWords={handleImportWords}
            showNotification={showNotification}
            getAvailableChapters={getAvailableChapters}
            getChapterStats={getChapterStats}
          />
        )}
      </div>
    </div>
  );
};

// Sub-components for better organization
const BackgroundParticles = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
    <div className="absolute top-0 right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>
);

const AppHeader = () => (
  <div className="text-center relative">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
    <Card className="relative backdrop-blur-sm bg-white/80 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      <CardHeader className="relative py-8">
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-blue-600" />
          Vocabulary Master
          <Sparkles className="w-8 h-8 text-purple-600" />
        </CardTitle>
        <p className="text-gray-600 text-lg mt-2">La tua app intelligente per imparare l'inglese</p>
      </CardHeader>
    </Card>
  </div>
);

const NotificationToast = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5" />
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

const ViewNavigation = ({ currentView, setCurrentView, testHistory }) => (
  <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
    <CardContent className="p-2">
      <div className="flex gap-2 p-2">
        <Button
          onClick={() => setCurrentView('main')}
          className={`flex-1 py-4 px-6 rounded-2xl text-lg font-semibold transition-all duration-300 ${
            currentView === 'main' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Brain className="w-6 h-6 mr-3" />
          Studio & Vocabolario
        </Button>
        <Button
          onClick={() => setCurrentView('stats')}
          className={`flex-1 py-4 px-6 rounded-2xl text-lg font-semibold transition-all duration-300 ${
            currentView === 'stats' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-6 h-6 mr-3" />
          Statistiche
          {testHistory.length > 0 && (
            <span className="ml-2 bg-white/20 text-white px-2 py-1 rounded-full text-sm">
              {testHistory.length}
            </span>
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);

const TestMode = ({ words, usedWordIds, stats, currentWord, showMeaning, onFlipCard, onAnswer, onResetTest, getTestProgress, getTestSummary }) => {
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
                    <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                    <div className="text-sm text-green-700">Corrette</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
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
            onFlip={onFlipCard}
          />

          {/* Answer Buttons */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
            <div className="flex justify-center space-x-6 mb-6">
              {showMeaning ? (
                <>
                  <Button
                    onClick={() => onAnswer(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 border-0"
                  >
                    <Check className="w-6 h-6 mr-3" />
                    Sapevo la risposta!
                  </Button>
                  <Button
                    onClick={() => onAnswer(false)}
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
          onClick={onResetTest} 
          variant="outline"
          className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white/90 rounded-xl px-6 py-3 shadow-lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Termina Test
        </Button>
      </div>
    </>
  );
};

const MainView = ({ 
  words, 
  editingWord, 
  showWordsList, 
  setShowWordsList, 
  onStartTest, 
  onAddWord, 
  onEditWord, 
  onRemoveWord, 
  onToggleWordLearned,
  onClearForm, 
  onClearAllWords, 
  onImportWords, 
  showNotification,
  getAvailableChapters,
  getChapterStats 
}) => (
  <div className="space-y-8 animate-fade-in">
    {/* Enhanced Control Panel with Chapter Info */}
    <ControlPanel 
      words={words}
      onStartTest={onStartTest}
      onClearAllWords={onClearAllWords}
      showNotification={showNotification}
      getAvailableChapters={getAvailableChapters}
      getChapterStats={getChapterStats}
    />

    {/* JSON Manager */}
    <JSONManager 
      words={words}
      onImportWords={onImportWords}
      showNotification={showNotification}
    />

    {/* Enhanced Add Word Form */}
    <AddWordForm
      onAddWord={onAddWord}
      editingWord={editingWord}
      onClearForm={onClearForm}
      showNotification={showNotification}
    />

    {/* Enhanced Words List */}
    <WordsList
      words={words}
      onEditWord={onEditWord}
      onRemoveWord={onRemoveWord}
      onToggleLearned={onToggleWordLearned}
      showWordsList={showWordsList}
      setShowWordsList={setShowWordsList}
    />
  </div>
);

const ControlPanel = ({ words, onStartTest, onClearAllWords, showNotification, getAvailableChapters, getChapterStats }) => {
  const availableWords = words.filter(word => !word.learned);
  const learnedWords = words.filter(word => word.learned);
  const chapters = getAvailableChapters();
  
  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
        <div className="bg-white rounded-3xl p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            <Play className="w-6 h-6 text-blue-600" />
            Controlli di Studio
          </CardTitle>
          
          {/* Statistiche Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{words.length}</div>
              <div className="text-blue-700 text-sm">Totale Parole</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">{learnedWords.length}</div>
              <div className="text-green-700 text-sm">Apprese</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{availableWords.length}</div>
              <div className="text-orange-700 text-sm">Da Studiare</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{chapters.length}</div>
              <div className="text-purple-700 text-sm">Capitoli</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onStartTest} 
              disabled={availableWords.length === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 h-auto rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8" />
                <span className="font-bold">Inizia Test</span>
                <span className="text-sm opacity-90">({availableWords.length} disponibili)</span>
              </div>
            </Button>

            <Button 
              onClick={onClearAllWords} 
              variant="outline" 
              disabled={words.length === 0}
              className="border-2 border-red-300 hover:border-red-400 p-6 h-auto rounded-2xl bg-red-50 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2 text-red-600">
                <RefreshCw className="w-8 h-8" />
                <span className="font-bold">Pulisci Vocabolario</span>
                <span className="text-sm">Elimina tutte le parole</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ConfirmationModals = ({ 
  confirmDelete, showConfirmClear, confirmClearHistory, words, testHistory,
  onConfirmDelete, onCancelDelete, onConfirmClear, onCancelClear, 
  onConfirmClearHistory, onCancelClearHistory 
}) => (
  <>
    {/* Delete Word Modal */}
    <Modal isOpen={!!confirmDelete} onClose={onCancelDelete}>
      <ModalHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-2xl">
        <ModalTitle className="text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Conferma Eliminazione
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="text-center py-4">
          <div className="text-6xl mb-4">🗑️</div>
          <p className="text-gray-700 mb-2">Sei sicuro di voler eliminare la parola</p>
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <span className="font-bold text-lg text-red-600">"{confirmDelete?.english}"</span>
            {confirmDelete?.italian && (
              <>
                <span className="mx-2 text-gray-400">→</span>
                <span className="text-gray-700">{confirmDelete.italian}</span>
              </>
            )}
          </div>
          {confirmDelete?.chapter && (
            <p className="text-sm text-gray-500 mb-2">Capitolo: {confirmDelete.chapter}</p>
          )}
          <p className="text-sm text-gray-500">Questa azione non può essere annullata.</p>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button onClick={onCancelDelete} variant="outline">Annulla</Button>
        <Button onClick={onConfirmDelete} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white">Elimina</Button>
      </ModalFooter>
    </Modal>

    {/* Clear All Words Modal */}
    <Modal isOpen={showConfirmClear} onClose={onCancelClear}>
      <ModalHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl">
        <ModalTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Eliminazione Completa
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="text-center py-4">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-4">
            Sei sicuro di voler eliminare tutte le <strong>{words.length} parole</strong>?
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 text-sm">
              Questa azione eliminerà permanentemente tutto il tuo vocabolario e non può essere annullata.
            </p>
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button onClick={onCancelClear} variant="outline">Annulla</Button>
        <Button onClick={onConfirmClear} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">Elimina Tutto</Button>
      </ModalFooter>
    </Modal>

    {/* Clear History Modal */}
    <Modal isOpen={confirmClearHistory} onClose={onCancelClearHistory}>
      <ModalHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl">
        <ModalTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Elimina Cronologia
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="text-center py-4">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-700 mb-4">
            Sei sicuro di voler eliminare tutta la cronologia dei test ({testHistory.length} test)?
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-800 text-sm">
              Perderai tutte le statistiche e i progressi registrati fino ad ora.
            </p>
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button onClick={onCancelClearHistory} variant="outline">Annulla</Button>
        <Button onClick={onConfirmClearHistory} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Elimina Cronologia</Button>
      </ModalFooter>
    </Modal>
  </>
);

export default VocabularyApp;
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import { ControlPanel } from '../components/main/ControlPanel';
import JSONManager from '../components/JSONManager';
import AddWordForm from '../components/AddWordForm';
import WordsList from '../components/WordsList';

export const MainView = React.memo(() => {
  const {
    words,
    editingWord,
    showWordsList,
    dispatch,
    addWord,
    toggleWordLearned,
    toggleWordDifficult, // ⭐ NEW: Difficult toggle
    importWords,
    getAvailableChapters,
    getChapterStats,
    wordStats
  } = useAppContext();

  const { showSuccess, showError, showWarning } = useNotification();

  const handleStartTest = React.useCallback(() => {
    const availableWords = words.filter(word => !word.learned);
    if (availableWords.length === 0) {
      showWarning('⚠️ Nessuna parola disponibile per il test!');
      return;
    }
    dispatch({ type: 'SET_SHOW_CHAPTER_SELECTOR', payload: true });
  }, [words, dispatch, showWarning]);

  const handleAddWord = React.useCallback((wordData) => {
    try {
      addWord(wordData);
      dispatch({ type: 'SET_EDITING_WORD', payload: null });
      showSuccess(
        editingWord 
          ? `✅ Parola "${wordData.english}" modificata!`
          : `✅ Parola "${wordData.english}" aggiunta!`
      );
    } catch (error) {
      showError(error, 'Add Word');
    }
  }, [addWord, editingWord, dispatch, showSuccess, showError]);

  const handleRemoveWord = React.useCallback((id) => {
    const wordToDelete = words.find(word => word.id === id);
    if (wordToDelete) {
      dispatch({ type: 'SET_CONFIRM_DELETE', payload: wordToDelete });
    }
  }, [words, dispatch]);

  const handleToggleWordLearned = React.useCallback((id) => {
    const word = words.find(w => w.id === id);
    if (word) {
      toggleWordLearned(id);
      showSuccess(
        word.learned 
          ? `📖 "${word.english}" segnata come da studiare`
          : `✅ "${word.english}" segnata come appresa!`
      );
    }
  }, [words, toggleWordLearned, showSuccess]);

  // ⭐ NEW: Handle difficult toggle
  const handleToggleWordDifficult = React.useCallback((id) => {
    const word = words.find(w => w.id === id);
    if (word) {
      toggleWordDifficult(id);
      showSuccess(
        word.difficult 
          ? `📚 "${word.english}" rimossa dalle parole difficili`
          : `⭐ "${word.english}" segnata come difficile!`
      );
    }
  }, [words, toggleWordDifficult, showSuccess]);

  const handleImportWords = React.useCallback((jsonText) => {
    try {
      const count = importWords(jsonText);
      showSuccess(`✅ ${count} parole importate con successo!`);
      return count;
    } catch (error) {
      showError(error, 'Import Words');
      throw error;
    }
  }, [importWords, showSuccess, showError]);

  return (
    <div className="space-y-8 animate-fade-in">
      <ControlPanel 
        onStartTest={handleStartTest}
        onClearAllWords={() => dispatch({ type: 'SET_SHOW_CONFIRM_CLEAR', payload: true })}
        words={words}
        wordStats={wordStats}
        getAvailableChapters={getAvailableChapters}
        getChapterStats={getChapterStats}
      />

      <JSONManager 
        words={words}
        onImportWords={handleImportWords}
      />

      <AddWordForm
        onAddWord={handleAddWord}
        editingWord={editingWord}
        onClearForm={() => dispatch({ type: 'SET_EDITING_WORD', payload: null })}
      />

      <WordsList
        words={words}
        onEditWord={(word) => dispatch({ type: 'SET_EDITING_WORD', payload: word })}
        onRemoveWord={handleRemoveWord}
        onToggleLearned={handleToggleWordLearned}
        onToggleDifficult={handleToggleWordDifficult} // ⭐ NEW: Difficult toggle
        showWordsList={showWordsList}
        setShowWordsList={() => dispatch({ type: 'TOGGLE_WORDS_LIST' })}
      />
    </div>
  );
});

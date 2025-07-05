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
    toggleWordDifficult,
    importWords,
    forceRefresh, // ⭐ NEW: Force refresh function
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

  // ⭐ ENHANCED: Better word addition with validation
  const handleAddWord = React.useCallback((wordData) => {
    try {
      console.log('MainView: Adding/editing word:', wordData);
      addWord(wordData);
      dispatch({ type: 'SET_EDITING_WORD', payload: null });
      showSuccess(
        editingWord 
          ? `✅ Parola "${wordData.english}" modificata!`
          : `✅ Parola "${wordData.english}" aggiunta!`
      );
    } catch (error) {
      console.error('MainView: Error adding word:', error);
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

  // ⭐ FIXED: Enhanced import with better error handling and force refresh
  const handleImportWords = React.useCallback(async (jsonText) => {
    try {
      console.log('MainView: Starting import process...');
      
      // Call the import function
      const count = await importWords(jsonText);
      
      // ⭐ CRITICAL: Force refresh to ensure UI synchronization
      if (forceRefresh) {
        console.log('MainView: Forcing refresh after import');
        setTimeout(forceRefresh, 100);
      }
      
      showSuccess(`✅ ${count} parole importate con successo!`);
      return count;
    } catch (error) {
      console.error('MainView: Import error:', error);
      
      // ⭐ ENHANCED: Better error messages
      if (error.message.includes('already exist')) {
        showWarning('⚠️ Tutte le parole nel JSON sono già presenti nel vocabolario.');
      } else if (error.message.includes('JSON')) {
        showError(new Error('❌ File JSON non valido. Controlla la sintassi.'), 'Import Words');
      } else {
        showError(error, 'Import Words');
      }
      throw error;
    }
  }, [importWords, forceRefresh, showSuccess, showError, showWarning]);

  // ⭐ NEW: Handle edit word with better ID validation
  const handleEditWord = React.useCallback((word) => {
    console.log('MainView: Editing word:', word);
    
    if (!word || !word.id) {
      showError(new Error('Impossibile modificare: parola non valida'), 'Edit Word');
      return;
    }
    
    // ⭐ ENHANCED: Validate word exists in current words list
    const existingWord = words.find(w => w.id === word.id);
    if (!existingWord) {
      showError(new Error('Parola non trovata nel vocabolario'), 'Edit Word');
      console.error('Word not found in words list:', word.id, 'Available IDs:', words.map(w => w.id));
      
      // ⭐ RECOVERY: Force refresh and retry
      if (forceRefresh) {
        forceRefresh();
        setTimeout(() => {
          const refreshedWord = words.find(w => w.english === word.english);
          if (refreshedWord) {
            dispatch({ type: 'SET_EDITING_WORD', payload: refreshedWord });
          }
        }, 500);
      }
      return;
    }
    
    dispatch({ type: 'SET_EDITING_WORD', payload: existingWord });
  }, [words, dispatch, showError, forceRefresh]);

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
        onEditWord={handleEditWord} // ⭐ FIXED: Use enhanced edit handler
        onRemoveWord={handleRemoveWord}
        onToggleLearned={handleToggleWordLearned}
        onToggleDifficult={handleToggleWordDifficult}
        showWordsList={showWordsList}
        setShowWordsList={() => dispatch({ type: 'TOGGLE_WORDS_LIST' })}
      />
    </div>
  );
});
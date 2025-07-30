import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import { ControlPanel } from '../components/main/ControlPanel';
import AddWordForm from '../components/AddWordForm';
import WordsList from '../components/WordsList';
import { Word, CreateWordInput, UpdateWordInput } from '../types';

export const MainView: React.FC = React.memo(() => {
  const {
    words,
    editingWord,
    showWordsList,
    dispatch,
    addWord,
    updateWord,
    toggleWordLearned,
    toggleWordDifficult,
    importWords,
    forceRefresh,
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

  const handleAddWord = React.useCallback(async (wordData: CreateWordInput) => {
    try {
      const result = await addWord(wordData);
      if (result.success) {
        dispatch({ type: 'SET_EDITING_WORD', payload: null });
        showSuccess(
          editingWord 
            ? `✅ Parola "${wordData.english}" modificata!`
            : `✅ Parola "${wordData.english}" aggiunta con successo!`
        );
      } else {
        console.error('MainView: Error adding word:', result.error);
        showError(result.error || new Error('Failed to add word'), 'Add Word');
      }
    } catch (error) {
      console.error('MainView: Error adding word:', error);
      showError(error instanceof Error ? error : new Error('Unknown error'), 'Add Word');
    }
  }, [addWord, editingWord, dispatch, showSuccess, showError]);

  const handleUpdateWord = React.useCallback(async (wordData: UpdateWordInput) => {
    try {
      const result = await updateWord(wordData.id, wordData);
      if (result.success) {
        dispatch({ type: 'SET_EDITING_WORD', payload: null });
        showSuccess(`✅ Parola "${wordData.english}" modificata!`);
      } else {
        console.error('MainView: Error updating word:', result.error);
        if (result.warning) {
          showError(new Error(result.warning), 'Attenzione');
        } else {
          showError(result.error || new Error('Failed to update word'), 'Update Word');
        }
      }
    } catch (error) {
      console.error('MainView: Error updating word:', error);
      showError(error instanceof Error ? error : new Error('Unknown error'), 'Update Word');
    }
  }, [updateWord, dispatch, showSuccess, showError]);

  const handleRemoveWord = React.useCallback((id: string) => {
    const wordToDelete = words.find(word => word.id === id);
    if (wordToDelete) {
      dispatch({ type: 'SET_CONFIRM_DELETE', payload: wordToDelete });
    }
  }, [words, dispatch]);

  const handleToggleWordLearned = React.useCallback((id: string) => {
    const word = words.find(w => w.id === id);
    if (word) {
      toggleWordLearned(id);
      showSuccess(
        !word.learned 
          ? `📖 "${word.english}" segnata come da studiare`
          : `✅ "${word.english}" segnata come appresa!`
      );
    }
  }, [words, toggleWordLearned, showSuccess]);

  const handleToggleWordDifficult = React.useCallback((id: string) => {
    const word = words.find(w => w.id === id);
    if (word) {
      toggleWordDifficult(id);
      showSuccess(
        !word.difficult 
          ? `📚 "${word.english}" rimossa dalle parole difficili`
          : `⭐ "${word.english}" segnata come difficile!`
      );
    }
  }, [words, toggleWordDifficult, showSuccess]);


  const handleEditWord = React.useCallback((word: Word) => {
    if (!word || !word.id) {
      showError(new Error('Impossibile modificare: parola non valida'), 'Edit Word');
      return;
    }
    
    const existingWord = words.find(w => w.id === word.id);
    if (!existingWord) {
      showError(new Error('Parola non trovata nel vocabolario'), 'Edit Word');
      console.error('Word not found in words list:', word.id, 'Available IDs:', words.map(w => w.id));
      
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
      <ControlPanel {...{
        onStartTest: handleStartTest,
        words: words,
        wordStats: {
          ...wordStats,
          unlearned: wordStats.total - wordStats.learned,
          normal: wordStats.total - wordStats.learned - wordStats.difficult,
          completionPercentage: wordStats.total > 0 ? Math.round((wordStats.learned / wordStats.total) * 100) : 0,
          byCategory: {},
          byChapter: {}
        },
        getAvailableChapters: getAvailableChapters
      }} />


      <AddWordForm
        onAddWord={handleAddWord}
        onUpdateWord={handleUpdateWord}
        editingWord={editingWord}
        onClearForm={() => dispatch({ type: 'SET_EDITING_WORD', payload: null })}
      />

      <WordsList
        words={words}
        onEditWord={handleEditWord}
        onRemoveWord={handleRemoveWord}
        onToggleLearned={handleToggleWordLearned}
        onToggleDifficult={handleToggleWordDifficult}
        showWordsList={showWordsList}
        setShowWordsList={() => dispatch({ type: 'TOGGLE_WORDS_LIST' })}
      />
    </div>
  );
});

MainView.displayName = 'MainView';
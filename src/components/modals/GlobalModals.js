import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../ui/modal';
import { Button } from '../ui/button';
import TestSelector from '../TestSelector';
import { Trash2, RefreshCw } from 'lucide-react';

export const GlobalModals = React.memo(() => {
  const { 
    confirmDelete, 
    showConfirmClear, 
    showChapterSelector,
    dispatch,
    words,
    // testHistory, // ✅ Removed unused variable
    removeWord,
    clearAllWords,
    startTest
  } = useAppContext();
  
  const { showSuccess, showError } = useNotification();

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      try {
        const result = await removeWord(confirmDelete.id);
        
        if (result.success) {
          showSuccess(`✅ Parola "${confirmDelete.english}" eliminata!`);
          dispatch({ type: 'SET_CONFIRM_DELETE', payload: null });
        } else {
          console.error('❌ Failed to delete word:', result.error);
          showError(new Error(result.error?.message || 'Errore sconosciuto'), 'Eliminazione Parola');
        }
      } catch (error) {
        console.error('❌ Exception during delete:', error);
        showError(error instanceof Error ? error : new Error(String(error)), 'Eliminazione Parola');
      }
    }
  };

  const handleConfirmClear = () => {
    clearAllWords();
    dispatch({ type: 'SET_SHOW_CONFIRM_CLEAR', payload: false });
    showSuccess('✅ Tutte le parole sono state eliminate!');
  };

  const handleTestStart = (filteredWords) => {
    startTest(filteredWords);
    dispatch({ type: 'SET_SHOW_CHAPTER_SELECTOR', payload: false });
  };

  return (
    <>
      {/* Delete Word Modal */}
      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => dispatch({ type: 'SET_CONFIRM_DELETE', payload: null })}
      >
        <ModalHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-2xl">
          <ModalTitle className="text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Conferma Eliminazione
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🗑️</div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">Sei sicuro di voler eliminare la parola</p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <span className="font-bold text-lg text-red-600">"{confirmDelete?.english}"</span>
              {confirmDelete?.italian && (
                <>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-gray-700 dark:text-gray-300">{confirmDelete.italian}</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Questa azione non può essere annullata.</p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button 
            onClick={() => dispatch({ type: 'SET_CONFIRM_DELETE', payload: null })} 
            variant="outline"
          >
            Annulla
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            Elimina
          </Button>
        </ModalFooter>
      </Modal>

      {/* Clear All Words Modal */}
      <Modal 
        isOpen={showConfirmClear} 
        onClose={() => dispatch({ type: 'SET_SHOW_CONFIRM_CLEAR', payload: false })}
      >
        <ModalHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl">
          <ModalTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Eliminazione Completa
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="text-center py-4">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Sei sicuro di voler eliminare tutte le <strong>{words.length} parole</strong>?
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
              <p className="text-orange-800 dark:text-orange-300 text-sm">
                Questa azione eliminerà permanentemente tutto il tuo vocabolario e non può essere annullata.
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button 
            onClick={() => dispatch({ type: 'SET_SHOW_CONFIRM_CLEAR', payload: false })} 
            variant="outline"
          >
            Annulla
          </Button>
          <Button 
            onClick={handleConfirmClear} 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            Elimina Tutto
          </Button>
        </ModalFooter>
      </Modal>

      {/* Test Selector */}
      {showChapterSelector && (
        <TestSelector
          words={words}
          onStartTest={handleTestStart}
          onClose={() => dispatch({ type: 'SET_SHOW_CHAPTER_SELECTOR', payload: false })}
        />
      )}
    </>
  );
});
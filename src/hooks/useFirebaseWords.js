// =====================================================
// 📁 src/hooks/useFirebaseWords.js - SAFE VERSION
// =====================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useNotification } from '../contexts/NotificationContext';

const EMPTY_ARRAY = [];
const EMPTY_STATS = {
  total: 0,
  learned: 0,
  unlearned: 0,
  difficult: 0,
  normal: 0,
  chapters: [],
  groups: []
};

/**
 * 🔄 SAFE Firebase adapter che replica l'API di useOptimizedWords
 * Con inizializzazioni robuste e error handling
 */
export const useFirebaseWords = () => {
  // ⭐ SAFE INITIALIZATION - Always start with empty arrays
  const [words, setWords] = useState(EMPTY_ARRAY);
  const [editingWord, setEditingWord] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useFirebaseAuth();
  const { showSuccess, showError } = useNotification();

  // 🔄 Safe subscription with error handling
  useEffect(() => {
    // Always reset to safe state first
    setWords(EMPTY_ARRAY);
    setError(null);
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up Firebase words subscription...');
    setLoading(true);

    try {
      const unsubscribe = firebaseService.subscribeToWords((newWords) => {
        console.log(`📝 Words updated: ${newWords?.length || 0} words`);
        
        // ⭐ SAFE: Always ensure we have an array
        const safeWords = Array.isArray(newWords) ? newWords : EMPTY_ARRAY;
        setWords(safeWords);
        setLoading(false);
        setError(null);
        setRefreshTrigger(prev => prev + 1);
      });

      return () => {
        console.log('🔄 Cleaning up words subscription');
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.error('❌ Subscription setup error:', err);
      setError(err);
      setLoading(false);
      setWords(EMPTY_ARRAY);
    }
  }, [isAuthenticated, user?.uid]);

  // ⭐ SAFE Force refresh function
  const forceRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔄 Force refreshing words...');
      setError(null);
      const freshWords = await firebaseService.getWords();
      
      // ⭐ SAFE: Always ensure we have an array
      const safeWords = Array.isArray(freshWords) ? freshWords : EMPTY_ARRAY;
      setWords(safeWords);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('❌ Force refresh error:', err);
      setError(err);
      setWords(EMPTY_ARRAY);
    }
  }, [isAuthenticated]);

  // ⭐ SAFE Word stats with null checks
  const wordStats = useMemo(() => {
    // ⭐ SAFE: Always check if words is an array
    if (!Array.isArray(words)) {
      console.warn('⚠️ Words is not an array:', words);
      return EMPTY_STATS;
    }

    try {
      const stats = {
        total: words.length,
        learned: words.filter(w => w?.learned).length,
        unlearned: words.filter(w => !w?.learned).length,
        difficult: words.filter(w => w?.difficult).length,
        normal: words.filter(w => !w?.difficult && !w?.learned).length,
        chapters: [...new Set(words.map(w => w?.chapter).filter(Boolean))].sort(),
        groups: [...new Set(words.map(w => w?.group).filter(Boolean))].sort()
      };
      
      return stats;
    } catch (err) {
      console.error('❌ Error calculating word stats:', err);
      return EMPTY_STATS;
    }
  }, [words, refreshTrigger]);

  // ⭐ SAFE Word map for fast lookups
  const wordMap = useMemo(() => {
    const map = {};
    
    // ⭐ SAFE: Always check if words is an array
    if (!Array.isArray(words)) {
      return map;
    }

    try {
      words.forEach(word => {
        if (word?.id) {
          map[word.id] = word;
        }
        if (word?.english) {
          map[`english_${word.english.toLowerCase()}`] = word;
        }
      });
    } catch (err) {
      console.error('❌ Error creating word map:', err);
    }
    
    return map;
  }, [words, refreshTrigger]);

  // ⭐ SAFE Add word with comprehensive error handling
  const addWord = useCallback(async (wordData) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    if (!wordData?.english?.trim() || !wordData?.italian?.trim()) {
      throw new Error('English word and Italian translation are required');
    }

    const englishWord = wordData.english.trim().toLowerCase();
    const englishKey = `english_${englishWord}`;
    
    // ⭐ SAFE Duplicate check
    const existingWord = wordMap[englishKey];
    if (existingWord && (!editingWord || existingWord.id !== editingWord.id)) {
      throw new Error(`Word "${wordData.english}" already exists`);
    }
    
    try {
      setError(null);
      
      if (editingWord) {
        console.log('✏️ Updating word:', editingWord.id);
        
        await firebaseService.updateWord(editingWord.id, {
          english: wordData.english.trim(),
          italian: wordData.italian.trim(),
          group: wordData.group?.trim() || null,
          sentence: wordData.sentence?.trim() || null,
          notes: wordData.notes?.trim() || null,
          chapter: wordData.chapter?.trim() || null,
          learned: Boolean(wordData.learned),
          difficult: Boolean(wordData.difficult)
        });
        
        console.log('✅ Word updated successfully');
        
      } else {
        console.log('➕ Adding new word:', wordData.english);
        
        await firebaseService.addWord({
          english: wordData.english.trim(),
          italian: wordData.italian.trim(),
          group: wordData.group?.trim() || null,
          sentence: wordData.sentence?.trim() || null,
          notes: wordData.notes?.trim() || null,
          chapter: wordData.chapter?.trim() || null,
          learned: Boolean(wordData.learned),
          difficult: Boolean(wordData.difficult)
        });
        
        console.log('✅ Word added successfully');
      }
      
      setEditingWord(null);
      
    } catch (err) {
      console.error('❌ Add word error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, editingWord, wordMap]);

  // ⭐ SAFE Remove word
  const removeWord = useCallback(async (id) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    try {
      setError(null);
      console.log('🗑️ Removing word:', id);
      await firebaseService.deleteWord(id);
      
      if (editingWord?.id === id) {
        setEditingWord(null);
      }
      
      console.log('✅ Word removed successfully');
      
    } catch (err) {
      console.error('❌ Remove word error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, wordMap, editingWord?.id]);

  // ⭐ SAFE Toggle functions
  const toggleWordLearned = useCallback(async (id) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    try {
      setError(null);
      await firebaseService.updateWord(id, {
        ...existingWord,
        learned: !existingWord.learned
      });
      
    } catch (err) {
      console.error('❌ Toggle learned error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, wordMap]);

  const toggleWordDifficult = useCallback(async (id) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    try {
      setError(null);
      await firebaseService.updateWord(id, {
        ...existingWord,
        difficult: !existingWord.difficult
      });
      
    } catch (err) {
      console.error('❌ Toggle difficult error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, wordMap]);

  // ⭐ SAFE Clear all words
  const clearAllWords = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      setError(null);
      console.log('🗑️ Clearing all words...');
      
      // ⭐ SAFE: Check if words is an array
      if (!Array.isArray(words)) {
        console.warn('⚠️ Words is not an array, skipping clear');
        return;
      }
      
      const deletePromises = words.map(word => firebaseService.deleteWord(word.id));
      await Promise.all(deletePromises);
      
      setEditingWord(null);
      console.log('✅ All words cleared');
      
    } catch (err) {
      console.error('❌ Clear all words error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, words]);

  // ⭐ SAFE Import words
  const importWords = useCallback(async (jsonText) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      console.log('📥 Importing words from JSON...');
      
      const importedWords = JSON.parse(jsonText.trim());
      
      if (!Array.isArray(importedWords) || importedWords.length === 0) {
        throw new Error('Invalid JSON data - expected array of words');
      }

      const validWords = importedWords
        .filter(word => word?.english && word?.italian)
        .map(word => ({
          english: String(word.english).trim(),
          italian: String(word.italian).trim(),
          group: word.group ? String(word.group).trim() : null,
          sentence: word.sentence ? String(word.sentence).trim() : null,
          notes: word.notes ? String(word.notes).trim() : null,
          chapter: word.chapter ? String(word.chapter).trim() : null,
          learned: Boolean(word.learned),
          difficult: Boolean(word.difficult)
        }));

      if (validWords.length === 0) {
        throw new Error('No valid words found in JSON data');
      }

      // ⭐ SAFE: Check current words
      const currentWords = Array.isArray(words) ? words : [];
      const existingEnglish = new Set(currentWords.map(w => w?.english?.toLowerCase()).filter(Boolean));
      const newWords = validWords.filter(word =>
        !existingEnglish.has(word.english.toLowerCase())
      );

      if (newWords.length === 0) {
        throw new Error('All words already exist in your vocabulary');
      }

      console.log(`📤 Importing ${newWords.length} new words...`);
      await firebaseService.batchImportWords(newWords);
      
      console.log('✅ Words imported successfully');
      return newWords.length;
      
    } catch (err) {
      console.error('❌ Import words error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, words]);

  // ⭐ SAFE Getters with null checks
  const getters = useMemo(() => ({
    getWordsByChapter: (chapter) => {
      if (!Array.isArray(words)) return EMPTY_ARRAY;
      return words.filter(word => word?.chapter === chapter);
    },
    getDifficultWordsByChapter: (chapter) => {
      if (!Array.isArray(words)) return EMPTY_ARRAY;
      return words.filter(word => word?.chapter === chapter && word?.difficult);
    },
    getAvailableChapters: () => {
      if (!Array.isArray(words)) return [];
      
      const chapters = new Set();
      words.forEach(word => {
        if (word?.chapter) chapters.add(word.chapter);
      });
      return Array.from(chapters).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
      });
    },
    getChapterStats: (chapter) => {
      if (!Array.isArray(words)) return { total: 0, learned: 0, unlearned: 0, difficult: 0, normal: 0 };
      
      const chapterWords = words.filter(word => word?.chapter === chapter);
      return {
        total: chapterWords.length,
        learned: chapterWords.filter(w => w?.learned).length,
        unlearned: chapterWords.filter(w => !w?.learned).length,
        difficult: chapterWords.filter(w => w?.difficult).length,
        normal: chapterWords.filter(w => !w?.difficult && !w?.learned).length
      };
    }
  }), [words, refreshTrigger]);

  // ⭐ Migration function
  const migrateFromLocalStorage = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      console.log('🔄 Starting migration from localStorage...');
      
      const result = await firebaseService.migrateFromLocalStorage();
      
      if (result?.success) {
        console.log('✅ Migration successful:', result);
        await forceRefresh();
        return result;
      } else {
        throw new Error(result?.error || 'Migration failed');
      }
      
    } catch (err) {
      console.error('❌ Migration error:', err);
      setError(err);
      throw err;
    }
  }, [isAuthenticated, forceRefresh]);

  // ⭐ Return IDENTICAL API to useOptimizedWords but with safety
  return {
    // State (identico a useOptimizedWords ma con safety)
    words: Array.isArray(words) ? words : EMPTY_ARRAY,
    editingWord,
    setEditingWord,
    wordStats,
    
    // Methods (identici a useOptimizedWords)
    addWord,
    removeWord,
    toggleWordLearned,
    toggleWordDifficult,
    clearAllWords,
    importWords,
    forceRefresh,
    
    // Getters (identici a useOptimizedWords)
    ...getters,
    
    // Firebase-specific
    migrateFromLocalStorage,
    loading,
    error,
    
    // Debug info
    isAuthenticated,
    refreshTrigger
  };
};
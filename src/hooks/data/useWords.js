// =====================================================
// 📁 hooks/useOptimizedWords.js - FIXED MAJOR ISSUES
// =====================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

const EMPTY_ARRAY = [];

export const useOptimizedWords = () => {
  const [words, setWords] = useLocalStorage('vocabularyWords', EMPTY_ARRAY);
  const [editingWord, setEditingWord] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ⭐ FIXED: Better import change detection
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'vocabularyWords' || e.key === 'vocabularyWords_lastUpdate') {
        forceRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomRefresh = () => {
      forceRefresh();
    };
    
    window.addEventListener('wordsImported', handleCustomRefresh);

    let lastCheck = localStorage.getItem('vocabularyWords_lastUpdate');
    const checkInterval = setInterval(() => {
      const currentCheck = localStorage.getItem('vocabularyWords_lastUpdate');
      if (currentCheck && currentCheck !== lastCheck) {
        lastCheck = currentCheck;
        handleCustomRefresh();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wordsImported', handleCustomRefresh);
      clearInterval(checkInterval);
    };
  }, []);

  // ⭐ NEW: Force refresh function
  const forceRefresh = useCallback(() => {
    try {
      const updatedWords = JSON.parse(localStorage.getItem('vocabularyWords') || '[]');
      setWords(updatedWords);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      // Silently handle errors
    }
  }, [setWords]);

  // ⭐ ENHANCED: Word stats with difficult words
  const wordStats = useMemo(() => ({
    total: words.length,
    learned: words.filter(w => w.learned).length,
    unlearned: words.filter(w => !w.learned).length,
    difficult: words.filter(w => w.difficult).length,
    normal: words.filter(w => !w.difficult && !w.learned).length,
    chapters: [...new Set(words.map(w => w.chapter).filter(Boolean))].sort(),
    groups: [...new Set(words.map(w => w.group).filter(Boolean))].sort()
  }), [words, refreshTrigger]);

  // ⭐ FIXED: Better word map generation with proper ID handling
  const wordMap = useMemo(() => {
    const map = {};
    words.forEach(word => {
      // Map by ID (primary key)
      if (word.id) {
        map[word.id] = word;
      }
      // Separate map for english words (for duplicate checking)
      if (word.english) {
        map[`english_${word.english.toLowerCase()}`] = word;
      }
    });
    return map;
  }, [words, refreshTrigger]);

  // ⭐ FIXED: Batch word operations with immediate localStorage sync
  const batchUpdateWords = useCallback((updateFn) => {
    setWords(prevWords => {
      const newWords = updateFn(prevWords);
      const sortedWords = newWords.sort((a, b) => a.english.localeCompare(b.english));
      
      // ⭐ CRITICAL: Immediate localStorage sync
      try {
        localStorage.setItem('vocabularyWords', JSON.stringify(sortedWords));
        localStorage.setItem('vocabularyWords_lastUpdate', Date.now().toString());
      } catch (error) {
        // Silently handle errors
      }
      
      return sortedWords;
    });
    
    // ⭐ FIXED: Force trigger refresh to ensure UI updates
    setRefreshTrigger(prev => prev + 1);
  }, [setWords]);

  // ⭐ FIXED: Enhanced add word with better duplicate checking and editing logic
  const addWord = useCallback((wordData) => {
    if (!wordData.english?.trim() || !wordData.italian?.trim()) {
      throw new Error('English word and Italian translation are required');
    }

    const englishWord = wordData.english.trim().toLowerCase();
    const englishKey = `english_${englishWord}`;
    
    // ⭐ FIXED: Better duplicate checking logic
    const existingWord = wordMap[englishKey];
    if (existingWord && (!editingWord || existingWord.id !== editingWord.id)) {
      throw new Error(`Word "${wordData.english}" already exists`);
    }
    
    batchUpdateWords(prevWords => {
      if (editingWord) {
        // ⭐ FIXED: Editing mode - ensure we find and update the correct word
        
        const updatedWords = prevWords.map(word => {
          if (word.id === editingWord.id) {
            const updatedWord = { 
              ...word, 
              ...wordData, 
              id: editingWord.id, // ⭐ CRITICAL: Preserve original ID
              english: wordData.english.trim(),
              italian: wordData.italian.trim()
            };
            return updatedWord;
          }
          return word;
        });
        
        // ⭐ VERIFICATION: Check if update actually happened
        const foundUpdated = updatedWords.find(w => w.id === editingWord.id);
        if (!foundUpdated) {
          throw new Error('Failed to update word - word not found');
        }
        
        return updatedWords;
      } else {
        // ⭐ FIXED: Adding new word with guaranteed unique ID
        const newWord = {
          id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          english: wordData.english.trim(),
          italian: wordData.italian.trim(),
          group: wordData.group?.trim() || null,
          sentence: wordData.sentence?.trim() || null,
          notes: wordData.notes?.trim() || null,
          chapter: wordData.chapter?.trim() || null,
          learned: Boolean(wordData.learned),
          difficult: Boolean(wordData.difficult)
        };
        return [...prevWords, newWord];
      }
    });
    
    // ⭐ FIXED: Clear editing state after successful operation
    setEditingWord(null);
  }, [editingWord, wordMap, batchUpdateWords]);

  // ⭐ FIXED: Enhanced toggle functions with proper ID validation
  const toggleWordLearned = useCallback((id) => {
    // ⭐ VERIFICATION: Check if word exists before toggle
    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    batchUpdateWords(prevWords =>
      prevWords.map(word => {
        if (word.id === id) {
          return { ...word, learned: !word.learned };
        }
        return word;
      })
    );
  }, [wordMap, batchUpdateWords]);

  // ⭐ FIXED: Enhanced toggle difficult with proper validation
  const toggleWordDifficult = useCallback((id) => {
    // ⭐ VERIFICATION: Check if word exists before toggle
    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    batchUpdateWords(prevWords =>
      prevWords.map(word => {
        if (word.id === id) {
          return { ...word, difficult: !word.difficult };
        }
        return word;
      })
    );
  }, [wordMap, batchUpdateWords]);

  // ⭐ FIXED: Enhanced remove word with proper validation
  const removeWord = useCallback((id) => {
    // ⭐ VERIFICATION: Check if word exists before removal
    const existingWord = wordMap[id];
    if (!existingWord) {
      throw new Error('Word not found');
    }
    
    batchUpdateWords(prevWords => {
      const filteredWords = prevWords.filter(word => word.id !== id);
      return filteredWords;
    });
    
    // ⭐ FIXED: Clear editing state if we're removing the word being edited
    if (editingWord?.id === id) {
      setEditingWord(null);
    }
  }, [editingWord?.id, wordMap, batchUpdateWords]);

  // ⭐ FIXED: Enhanced import with better validation and sync
  const importWords = useCallback((jsonText) => {
    try {
      const importedWords = JSON.parse(jsonText.trim());
      
      if (!Array.isArray(importedWords) || importedWords.length === 0) {
        throw new Error('Invalid JSON data - expected array of words');
      }

      // ⭐ FIXED: Better word validation and ID generation
      const validWords = importedWords
        .filter(word => word?.english && word?.italian)
        .map(word => ({
          id: word.id || `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

      // ⭐ FIXED: Better duplicate checking using current words state
      const currentWords = JSON.parse(localStorage.getItem('vocabularyWords') || '[]');
      const existingEnglish = new Set(currentWords.map(w => w.english.toLowerCase()));
      const newWords = validWords.filter(word =>
        !existingEnglish.has(word.english.toLowerCase())
      );

      if (newWords.length === 0) {
        throw new Error('All words already exist in your vocabulary');
      }

      // ⭐ FIXED: Direct localStorage update + state update for immediate sync
      const allWords = [...currentWords, ...newWords];
      localStorage.setItem('vocabularyWords', JSON.stringify(allWords));
      localStorage.setItem('vocabularyWords_lastUpdate', Date.now().toString());
      
      // Update state immediately
      setWords(allWords);
      setRefreshTrigger(prev => prev + 1);
      
      // ⭐ FIXED: Trigger refresh event for other components
      window.dispatchEvent(new CustomEvent('wordsImported', { 
        detail: { count: newWords.length, total: allWords.length }
      }));
      
      return newWords.length;
    } catch (error) {
      throw error;
    }
  }, [setWords]);

  // ⭐ ENHANCED: Getters with proper filtering
  const getters = useMemo(() => ({
    getWordsByChapter: (chapter) => words.filter(word => word.chapter === chapter),
    getDifficultWordsByChapter: (chapter) => words.filter(word => word.chapter === chapter && word.difficult),
    getAvailableChapters: () => {
      const chapters = new Set();
      words.forEach(word => {
        if (word.chapter) chapters.add(word.chapter);
      });
      return Array.from(chapters).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
      });
    },
    getChapterStats: (chapter) => {
      const chapterWords = words.filter(word => word.chapter === chapter);
      return {
        total: chapterWords.length,
        learned: chapterWords.filter(w => w.learned).length,
        unlearned: chapterWords.filter(w => !w.learned).length,
        difficult: chapterWords.filter(w => w.difficult).length,
        normal: chapterWords.filter(w => !w.difficult && !w.learned).length
      };
    }
  }), [words, refreshTrigger]);

  // ⭐ FIXED: Clear all words with proper cleanup
  const clearAllWords = useCallback(() => {
    setWords(EMPTY_ARRAY);
    setEditingWord(null);
    localStorage.setItem('vocabularyWords_lastUpdate', Date.now().toString());
    setRefreshTrigger(prev => prev + 1);
  }, [setWords]);

  return {
    words,
    editingWord,
    setEditingWord,
    wordStats,
    addWord,
    removeWord,
    toggleWordLearned,
    toggleWordDifficult,
    clearAllWords,
    importWords,
    forceRefresh,
    ...getters
  };
};
import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const EMPTY_ARRAY = [];

export const useOptimizedWords = () => {
  const [words, setWords] = useLocalStorage('vocabularyWords', EMPTY_ARRAY);
  const [editingWord, setEditingWord] = useState(null);

  // ⭐ MEMOIZED COMPUTATIONS - Enhanced with difficult words
  const wordStats = useMemo(() => ({
    total: words.length,
    learned: words.filter(w => w.learned).length,
    unlearned: words.filter(w => !w.learned).length,
    difficult: words.filter(w => w.difficult).length,
    normal: words.filter(w => !w.difficult && !w.learned).length,
    chapters: [...new Set(words.map(w => w.chapter).filter(Boolean))].sort(),
    groups: [...new Set(words.map(w => w.group).filter(Boolean))].sort()
  }), [words]);

  // ⭐ MEMOIZED WORD MAP
  const wordMap = useMemo(() => {
    return words.reduce((map, word) => {
      map[word.id] = word;
      map[word.english.toLowerCase()] = word;
      return map;
    }, {});
  }, [words]);

  // ⭐ BATCH WORD OPERATIONS
  const batchUpdateWords = useCallback((updateFn) => {
    setWords(prevWords => {
      const newWords = updateFn(prevWords);
      return newWords.sort((a, b) => a.english.localeCompare(b.english));
    });
  }, [setWords]);

  // ⭐ OPTIMIZED ADD WORD - Enhanced with difficult flag
  const addWord = useCallback((wordData) => {
    if (!wordData.english?.trim() || !wordData.italian?.trim()) {
      throw new Error('English word and Italian translation are required');
    }

    const englishWord = wordData.english.trim().toLowerCase();
    
    if (!editingWord && wordMap[englishWord]) {
      throw new Error('Word already exists');
    }
    
    batchUpdateWords(prevWords => {
      if (editingWord) {
        return prevWords.map(word => 
          word.id === editingWord.id 
            ? { ...word, ...wordData, id: editingWord.id }
            : word
        );
      } else {
        const newWord = {
          id: Date.now() + Math.random(),
          english: wordData.english.trim(),
          italian: wordData.italian.trim(),
          group: wordData.group?.trim() || null,
          sentence: wordData.sentence?.trim() || null,
          notes: wordData.notes?.trim() || null,
          chapter: wordData.chapter?.trim() || null,
          learned: wordData.learned || false,
          difficult: wordData.difficult || false // ⭐ NEW: Difficult flag
        };
        return [...prevWords, newWord];
      }
    });
    
    setEditingWord(null);
  }, [editingWord, wordMap, batchUpdateWords]);

  // ⭐ FILTERED GETTERS - Enhanced with difficult words
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
  }), [words]);

  return {
    words,
    editingWord,
    setEditingWord,
    wordStats,
    addWord,
    
    removeWord: useCallback((id) => {
      batchUpdateWords(prevWords => prevWords.filter(word => word.id !== id));
      if (editingWord?.id === id) setEditingWord(null);
    }, [editingWord?.id, batchUpdateWords]),

    toggleWordLearned: useCallback((id) => {
      batchUpdateWords(prevWords => 
        prevWords.map(word => 
          word.id === id ? { ...word, learned: !word.learned } : word
        )
      );
    }, [batchUpdateWords]),

    // ⭐ NEW: Toggle difficult status
    toggleWordDifficult: useCallback((id) => {
      batchUpdateWords(prevWords => 
        prevWords.map(word => 
          word.id === id ? { ...word, difficult: !word.difficult } : word
        )
      );
    }, [batchUpdateWords]),

    clearAllWords: useCallback(() => {
      setWords(EMPTY_ARRAY);
      setEditingWord(null);
    }, [setWords]),

    importWords: useCallback((jsonText) => {
      const importedWords = JSON.parse(jsonText.trim());
      
      if (!Array.isArray(importedWords) || importedWords.length === 0) {
        throw new Error('Invalid JSON data');
      }

      const validWords = importedWords
        .filter(word => word?.english && word?.italian)
        .map(word => ({
          id: word.id || Date.now() + Math.random(),
          english: word.english,
          italian: word.italian,
          group: word.group || null,
          sentence: word.sentence || null,
          notes: word.notes || null,
          chapter: word.chapter || null,
          learned: word.learned || false,
          difficult: word.difficult || false // ⭐ NEW: Import difficult flag
        }));

      const existingEnglish = new Set(words.map(w => w.english.toLowerCase()));
      const newWords = validWords.filter(word => 
        !existingEnglish.has(word.english.toLowerCase())
      );

      if (newWords.length === 0) {
        throw new Error('All words already exist');
      }

      batchUpdateWords(prevWords => [...prevWords, ...newWords]);
      return newWords.length;
    }, [words, batchUpdateWords]),

    ...getters
  };
};

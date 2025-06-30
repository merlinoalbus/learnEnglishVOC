// /src/hooks/useWords.js
// This file contains a custom React hook for managing vocabulary words.
// It provides functionality to add, remove, edit, and import words, as well as manage the current editing state.
// The hook uses local storage to persist the vocabulary words, allowing them to be retained across sessions.
// It also includes validation to ensure that words are unique and that required fields are filled out.
// The `useWords` hook can be used in any React component to manage vocabulary words, making it easy to build a vocabulary learning application.
// It returns the list of words, the current editing word, and functions to manipulate the vocabulary.
// It is a convenient way to manage vocabulary state in a React application.
import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useWords = () => {
  const [words, setWords] = useLocalStorage('vocabularyWords', []);
  const [editingWord, setEditingWord] = useState(null);

  const addWord = useCallback((wordData) => {
    if (!wordData.english?.trim() || !wordData.italian?.trim()) {
      throw new Error('English word and Italian translation are required');
    }

    const englishWord = wordData.english.trim().toLowerCase();
    
    if (!editingWord) {
      const wordExists = words.some(word => word.english.toLowerCase() === englishWord);
      if (wordExists) {
        throw new Error('Word already exists');
      }
    }
    
    if (editingWord) {
      const updatedWords = words.map(word => 
        word.id === editingWord.id 
          ? { 
              ...word, 
              ...wordData, 
              id: editingWord.id,
              // Mantieni i nuovi campi se non specificati
              learned: wordData.learned !== undefined ? wordData.learned : word.learned,
              chapter: wordData.chapter !== undefined ? wordData.chapter : word.chapter
            }
          : word
      );
      setWords(updatedWords.sort((a, b) => a.english.localeCompare(b.english)));
    } else {
      const newWord = {
        id: Date.now(),
        english: wordData.english.trim(),
        italian: wordData.italian.trim(),
        group: wordData.group?.trim() || null,
        sentence: wordData.sentence?.trim() || null,
        notes: wordData.notes?.trim() || null,
        chapter: wordData.chapter?.trim() || null,
        learned: wordData.learned || false
      };
      setWords(prev => [...prev, newWord].sort((a, b) => a.english.localeCompare(b.english)));
    }
    
    setEditingWord(null);
  }, [words, editingWord, setWords]);

  const removeWord = useCallback((id) => {
    setWords(prev => prev.filter(word => word.id !== id));
    if (editingWord && editingWord.id === id) {
      setEditingWord(null);
    }
  }, [setWords, editingWord]);

  const toggleWordLearned = useCallback((id) => {
    setWords(prev => prev.map(word => 
      word.id === id 
        ? { ...word, learned: !word.learned }
        : word
    ));
  }, [setWords]);

  const clearAllWords = useCallback(() => {
    setWords([]);
    setEditingWord(null);
  }, [setWords]);

  const importWords = useCallback((jsonText) => {
    const importedWords = JSON.parse(jsonText.trim());
    
    if (!Array.isArray(importedWords)) {
      throw new Error('JSON must contain an array of words');
    }

    if (importedWords.length === 0) {
      throw new Error('Array is empty');
    }

    const validWords = importedWords.filter(word => 
      word && word.english && word.italian
    ).map(word => ({
      id: word.id || Date.now() + Math.random(),
      english: word.english,
      italian: word.italian,
      group: word.group || null,
      sentence: word.sentence || null,
      notes: word.notes || null,
      chapter: word.chapter || null,
      learned: word.learned || false
    }));

    if (validWords.length === 0) {
      throw new Error('No valid words found in JSON');
    }

    const existingWords = words.map(w => w.english.toLowerCase());
    const newWords = validWords.filter(word => 
      !existingWords.includes(word.english.toLowerCase())
    );

    if (newWords.length === 0) {
      throw new Error('All words already exist in vocabulary');
    }

    setWords(prev => [...prev, ...newWords].sort((a, b) => a.english.localeCompare(b.english)));
    return newWords.length;
  }, [words, setWords]);

  // Nuove funzioni di utilità per le statistiche
  const getWordsByChapter = useCallback((chapter) => {
    return words.filter(word => word.chapter === chapter);
  }, [words]);

  const getLearnedWords = useCallback(() => {
    return words.filter(word => word.learned);
  }, [words]);

  const getUnlearnedWords = useCallback(() => {
    return words.filter(word => !word.learned);
  }, [words]);

  const getAvailableChapters = useCallback(() => {
    const chapters = new Set();
    words.forEach(word => {
      if (word.chapter) {
        chapters.add(word.chapter);
      }
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    });
  }, [words]);

  const getChapterStats = useCallback((chapter) => {
    const chapterWords = getWordsByChapter(chapter);
    return {
      total: chapterWords.length,
      learned: chapterWords.filter(w => w.learned).length,
      unlearned: chapterWords.filter(w => !w.learned).length
    };
  }, [getWordsByChapter]);

  return {
    words,
    editingWord,
    setEditingWord,
    addWord,
    removeWord,
    toggleWordLearned,
    clearAllWords,
    importWords,
    // Nuove funzioni di utilità
    getWordsByChapter,
    getLearnedWords,
    getUnlearnedWords,
    getAvailableChapters,
    getChapterStats
  };
};
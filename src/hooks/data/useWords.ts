import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useFirestore } from "../core/useFirestore";
import { useFirebase } from "../../contexts/FirebaseContext";
import AppConfig from "../../config/appConfig";
import type {
  Word,
  WordFilters,
  WordCategory,
  WordChapter,
} from "../../types/entities/Word.types";
import type {
  CreateInput,
  UpdateInput,
  OperationResult,
} from "../../types/index";
import type {
  FirestoreError,
  FirestoreOperationResult,
} from "../../types/infrastructure/Firestore.types";

const EMPTY_ARRAY: Word[] = [];

interface WordStats {
  total: number;
  learned: number;
  unlearned: number;
  difficult: number;
  normal: number;
  byChapter: Record<string, number>;
  byCategory: Record<string, number>;
}

interface ChapterStats {
  total: number;
  learned: number;
  unlearned: number;
  difficult: number;
  normal: number;
}

interface WordsState {
  words: Word[];
  editingWord: Word | null;
  loading: boolean;
  error: FirestoreError | null;
  refreshTrigger: number;
  isInitialized: boolean;
  lastSync: Date | null;
  fromCache: boolean;
}

interface WordsOperations {
  addWord: (wordData: CreateInput<Word>) => Promise<OperationResult<Word>>;
  removeWord: (wordId: string) => Promise<OperationResult<void>>;
  updateWord: (
    wordId: string,
    updates: UpdateInput<Word>
  ) => Promise<OperationResult<Word>>;
  toggleWordLearned: (wordId: string) => Promise<OperationResult<Word>>;
  toggleWordDifficult: (wordId: string) => Promise<OperationResult<Word>>;
  clearAllWords: () => Promise<OperationResult<void>>;
  importWords: (words: (CreateInput<Word> & { id?: string })[]) => Promise<OperationResult<Word[]>>;
  forceRefresh: () => void;
  setEditingWord: (word: Word | null) => void;
}

interface WordsGetters {
  getAvailableChapters: () => string[];
  getChapterStats: (chapter: string) => ChapterStats;
  getFilteredWords: (filters?: WordFilters) => Word[];
  getWordsByCategory: (category: WordCategory) => Word[];
  searchWords: (searchTerm: string) => Word[];
}

interface WordsResult extends WordsState, WordsOperations, WordsGetters {
  wordStats: WordStats;
}

export const useWords = (): WordsResult => {
  // Core Firebase hook
  const firestoreHook = useFirestore<Word>({
    collection: "words",
    realtime: true,
    enableCache: true,
    autoFetch: true,
    syncWithLocalStorage: true,
    localStorageKey: "vocabularyWords",
    debug: AppConfig.app.environment === "development",
  });

  const { isReady } = useFirebase();

  // Local state
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Performance optimization refs
  const statsCache = useRef<{ stats: WordStats; timestamp: number } | null>(
    null
  );
  const STATS_CACHE_TTL = 5000; // 5 seconds
  
  // Invalidate cache when data changes
  useEffect(() => {
    statsCache.current = null;
  }, [firestoreHook.data.length]);

  // Initialize when Firebase is ready
  useEffect(() => {
    if (isReady && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isReady, isInitialized]);

  // Create word with validation and error handling
  const addWord = useCallback(
    async (wordData: CreateInput<Word>): Promise<OperationResult<Word>> => {
      const startTime = Date.now();

      try {
        // Validation
        if (!wordData.english?.trim() || !wordData.italian?.trim()) {
          throw new Error("English word and Italian translation are required");
        }

        // Check for duplicates
        const existingWord = firestoreHook.data.find(
          (w) => w.english.toLowerCase() === wordData.english.toLowerCase()
        );

        if (existingWord) {
          throw new Error("Word already exists");
        }

        // Prepare word data with defaults
        const wordToCreate = {
          ...wordData,
          english: wordData.english.trim(),
          italian: wordData.italian.trim(),
          chapter: wordData.chapter || "1",
          group: wordData.group || "GENERAL",
          sentences: wordData.sentences || [],
          synonyms: wordData.synonyms || [],
          learned: false,
          difficult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createdWord = await firestoreHook.create(wordToCreate);

        // Invalidate stats cache
        statsCache.current = null;
        setRefreshTrigger((prev) => prev + 1);

        return {
          success: true,
          data: createdWord,
          metadata: {
            operation: "addWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        const firestoreError = error as FirestoreError;
        return {
          success: false,
          error: firestoreError,
          metadata: {
            operation: "addWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [firestoreHook.create, firestoreHook.data]
  );

  // Remove word
  const removeWord = useCallback(
    async (wordId: string): Promise<OperationResult<void>> => {
      const startTime = Date.now();

      try {
        // Prima trova la parola per ottenere l'english
        const word = firestoreHook.data.find((w) => w.id === wordId);
        
        await firestoreHook.remove(wordId);
        
        // Se la parola esiste e ha un english, cancella anche la performance
        if (word?.english) {
          try {
            const { collection, query, where, getDocs, deleteDoc, doc } = await import("firebase/firestore");
            const { db } = await import("../../config/firebase");
            
            // Query per trovare la performance associata
            const performanceRef = collection(db, "performance");
            const q = query(
              performanceRef, 
              where("english", "==", word.english)
            );
            const snapshot = await getDocs(q);
            
            // Cancella tutti i documenti performance trovati per questa parola
            const deletePromises = snapshot.docs.map(docSnap => 
              deleteDoc(doc(db, "performance", docSnap.id))
            );
            await Promise.all(deletePromises);
            
            console.log(`✅ Cancellata performance per la parola: ${word.english} (${snapshot.size} documenti)`);
          } catch (perfError) {
            console.error("⚠️ Errore nella cancellazione della performance:", perfError);
            // Non bloccare l'operazione se la cancellazione performance fallisce
          }
        }

        // Clear editing word if it was the removed one
        if (editingWord?.id === wordId) {
          setEditingWord(null);
        }

        // Invalidate stats cache
        statsCache.current = null;
        setRefreshTrigger((prev) => prev + 1);

        return {
          success: true,
          metadata: {
            operation: "removeWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "removeWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [firestoreHook.remove, firestoreHook.data, editingWord?.id]
  );

  // Update word
  const updateWord = useCallback(
    async (
      wordId: string,
      updates: UpdateInput<Word>
    ): Promise<OperationResult<Word> & { synced?: boolean; warning?: string }> => {
      const startTime = Date.now();

      try {
        const updatedWord = await firestoreHook.update(wordId, updates);

        // Update editing word if it matches
        if (editingWord?.id === wordId) {
          setEditingWord(updatedWord);
        }

        // Invalidate stats cache
        statsCache.current = null;
        setRefreshTrigger((prev) => prev + 1);

        // Check if the update was synced to Firestore
        const isSynced = (updatedWord as any)._firestoreStatus === 'synced';
        
        return {
          success: isSynced,
          data: updatedWord,
          metadata: {
            operation: "updateWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
          synced: isSynced,
          warning: !isSynced ? "Parola salvata solo localmente. Controllare la connessione di rete." : undefined,
        } as OperationResult<Word> & { synced: boolean; warning?: string };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "updateWord",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [firestoreHook.update, editingWord?.id]
  );

  // Toggle word learned status
  const toggleWordLearned = useCallback(
    async (wordId: string): Promise<OperationResult<Word>> => {
      const word = firestoreHook.data.find((w) => w.id === wordId);
      if (!word) {
        return {
          success: false,
          error: {
            code: "not-found" as any,
            message: "Word not found",
            operation: "toggle-learned" as any,
            recoverable: false,
            timestamp: new Date(),
          } as any,
          metadata: {
            operation: "toggleWordLearned",
            timestamp: new Date(),
            duration: 0,
          },
        };
      }

      return updateWord(wordId, { id: wordId, learned: !word.learned });
    },
    [firestoreHook.data, updateWord]
  );

  // Toggle word difficult status
  const toggleWordDifficult = useCallback(
    async (wordId: string): Promise<OperationResult<Word>> => {
      const word = firestoreHook.data.find((w) => w.id === wordId);
      if (!word) {
        return {
          success: false,
          error: {
            code: "not-found" as any,
            message: "Word not found",
            operation: "toggle-difficult" as any,
            recoverable: false,
            timestamp: new Date(),
          } as any,
          metadata: {
            operation: "toggleWordDifficult",
            timestamp: new Date(),
            duration: 0,
          },
        };
      }

      return updateWord(wordId, { id: wordId, difficult: !word.difficult });
    },
    [firestoreHook.data, updateWord]
  );

  // Clear all words
  const clearAllWords = useCallback(async (): Promise<
    OperationResult<void>
  > => {
    const startTime = Date.now();

    try {
      // Use batch operation for better performance
      const operations = firestoreHook.data.map((word) => ({
        type: "delete" as const,
        id: word.id,
      }));

      await firestoreHook.batchUpdate(operations);

      setEditingWord(null);
      statsCache.current = null;
      setRefreshTrigger((prev) => prev + 1);

      return {
        success: true,
        metadata: {
          operation: "clearAllWords",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as FirestoreError,
        metadata: {
          operation: "clearAllWords",
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }, [firestoreHook.data, firestoreHook.batchUpdate]);

  // Import words
  const importWords = useCallback(
    async (
      wordsToImport: (CreateInput<Word> & { id?: string })[]
    ): Promise<OperationResult<Word[]>> => {
      const startTime = Date.now();

      try {
        const validWords = wordsToImport.filter(
          (word) => word.english?.trim() && word.italian?.trim()
        );

        if (validWords.length === 0) {
          throw new Error("No valid words to import");
        }

        // Check for duplicates
        const existingEnglishWords = new Set(
          firestoreHook.data.map((w) => w.english.toLowerCase())
        );

        const newWords = validWords.filter(
          (word) => !existingEnglishWords.has(word.english.toLowerCase())
        );

        if (newWords.length === 0) {
          throw new Error("All words already exist");
        }

        // Prepare words for batch creation
        const operations = newWords.map((word) => ({
          type: "create" as const,
          id: word.id, // Preserve custom ID from import if present
          data: {
            ...word,
            english: word.english.trim(),
            italian: word.italian.trim(),
            chapter: word.chapter || "1",
            group: word.group || "GENERAL",
            sentences: word.sentences || [],
            synonyms: word.synonyms || [],
            learned: false,
            difficult: false,
          },
        }));

        await firestoreHook.batchUpdate(operations);

        // The actual created words will be available through the realtime listener
        const createdWords = firestoreHook.data.slice(-newWords.length);

        statsCache.current = null;
        setRefreshTrigger((prev) => prev + 1);

        return {
          success: true,
          data: createdWords,
          metadata: {
            operation: "importWords",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error as FirestoreError,
          metadata: {
            operation: "importWords",
            timestamp: new Date(),
            duration: Date.now() - startTime,
          },
        };
      }
    },
    [firestoreHook.data, firestoreHook.batchUpdate]
  );

  // Force refresh
  const forceRefresh = useCallback(() => {
    firestoreHook.fetch();
    statsCache.current = null;
    setRefreshTrigger((prev) => prev + 1);
  }, [firestoreHook.fetch]);

  // Computed stats with caching
  const wordStats = useMemo<WordStats>(() => {
    const now = Date.now();

    // Check cache
    if (
      statsCache.current &&
      now - statsCache.current.timestamp < STATS_CACHE_TTL
    ) {
      return statsCache.current.stats;
    }

    const words = firestoreHook.data;
    
    const stats: WordStats = {
      total: words.length,
      learned: words.filter((w) => w.learned).length,
      unlearned: words.filter((w) => !w.learned).length,
      difficult: words.filter((w) => w.difficult).length,
      normal: words.filter((w) => !w.difficult && !w.learned).length,
      byChapter: {},
      byCategory: {},
    };

    // Calculate chapter distribution
    words.forEach((word) => {
      const chapter = word.chapter || "Unknown";
      stats.byChapter[chapter] = (stats.byChapter[chapter] || 0) + 1;
    });

    // Calculate category distribution
    words.forEach((word) => {
      const category = word.group || "GENERAL";
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    // Cache the result
    statsCache.current = { stats, timestamp: now };
    
    return stats;
  }, [firestoreHook.data, firestoreHook.data.length, refreshTrigger]);

  // Getter functions
  const getAvailableChapters = useCallback((): string[] => {
    const chapters = new Set<string>();
    firestoreHook.data.forEach((word) => {
      if (word.chapter) {
        chapters.add(word.chapter);
      }
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
    });
  }, [firestoreHook.data]);

  const getChapterStats = useCallback(
    (chapter: string): ChapterStats => {
      const chapterWords = firestoreHook.data.filter(
        (word) => word.chapter === chapter
      );
      return {
        total: chapterWords.length,
        learned: chapterWords.filter((w) => w.learned).length,
        unlearned: chapterWords.filter((w) => !w.learned).length,
        difficult: chapterWords.filter((w) => w.difficult).length,
        normal: chapterWords.filter((w) => !w.difficult && !w.learned).length,
      };
    },
    [firestoreHook.data]
  );

  const getFilteredWords = useCallback(
    (filters?: WordFilters): Word[] => {
      if (!filters) return firestoreHook.data;

      return firestoreHook.data.filter((word) => {
        if (filters.chapter && word.chapter !== filters.chapter) return false;
        if (
          filters.difficult !== undefined &&
          word.difficult !== filters.difficult
        )
          return false;
        if (filters.learned !== undefined && word.learned !== filters.learned)
          return false;
        if (filters.category && word.group !== filters.category) return false;
        if (filters.createdAfter && word.createdAt < filters.createdAfter)
          return false;
        if (filters.createdBefore && word.createdAt > filters.createdBefore)
          return false;
        return true;
      });
    },
    [firestoreHook.data]
  );

  const getWordsByCategory = useCallback(
    (category: WordCategory): Word[] => {
      return firestoreHook.data.filter((word) => word.group === category);
    },
    [firestoreHook.data]
  );

  const searchWords = useCallback(
    (searchTerm: string): Word[] => {
      if (!searchTerm.trim()) return firestoreHook.data;

      const term = searchTerm.toLowerCase();
      return firestoreHook.data.filter(
        (word) =>
          word.english.toLowerCase().includes(term) ||
          word.italian.toLowerCase().includes(term) ||
          word.sentences?.some((sentence) =>
            sentence.toLowerCase().includes(term)
          ) ||
          word.synonyms?.some((synonym) => synonym.toLowerCase().includes(term))
      );
    },
    [firestoreHook.data]
  );

  return {
    // State
    words: firestoreHook.data || EMPTY_ARRAY,
    editingWord,
    loading: firestoreHook.loading,
    error: firestoreHook.error,
    refreshTrigger,
    isInitialized,
    lastSync: firestoreHook.lastSync,
    fromCache: firestoreHook.fromCache,

    // Operations
    addWord,
    removeWord,
    updateWord,
    toggleWordLearned,
    toggleWordDifficult,
    clearAllWords,
    importWords,
    forceRefresh,
    setEditingWord,

    // Getters
    getAvailableChapters,
    getChapterStats,
    getFilteredWords,
    getWordsByCategory,
    searchWords,

    // Computed
    wordStats,
  };
};

export default useWords;

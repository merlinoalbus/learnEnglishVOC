import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  type Query,
  type DocumentData,
  type Unsubscribe,
  type WhereFilterOp,
  type OrderByDirection,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useAsyncOperation } from "./useAsyncOperation";
import type { Word } from "../../types/entities/Word.types";
import type { Statistics } from "../../types/entities/Statistics.types";
import type { WordPerformance } from "../../types/entities/Performance.types";
import type {
  FirestoreDoc,
  FirestoreQuery,
  FirestoreError,
  FirestoreOperationResult,
  FirestoreCollectionName,
  FirestoreOperation,
  FirestoreListener,
  FirestoreListenerData,
  ChangeType,
} from "../../types/infrastructure/Firestore.types";

interface UseFirestoreConfig<T> {
  collection: string;
  realtime?: boolean;
  autoFetch?: boolean;
  enableCache?: boolean;
  syncWithLocalStorage?: boolean;
  localStorageKey?: string;
  debug?: boolean;
}

interface UseFirestoreState<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  listening: boolean;
  lastSync: Date | null;
  fromCache: boolean;
}

interface UseFirestoreOperations<T> {
  fetch: () => Promise<T[]>;
  create: (data: Omit<T, "id">) => Promise<T>;
  update: (id: string, data: Partial<Omit<T, "id">>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  batchUpdate: (operations: BatchOperation<T>[]) => Promise<void>;
  clearCache: () => void;
  refresh: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
}

interface UseFirestoreUtils<T> {
  findById: (id: string) => T | undefined;
  filter: (predicate: (item: T) => boolean) => T[];
  sort: (compareFn: (a: T, b: T) => number) => T[];
  getStats: () => {
    total: number;
    lastUpdated: Date | null;
    cacheHits: number;
  };
}

interface UseFirestoreResult<T>
  extends UseFirestoreState<T>,
    UseFirestoreOperations<T> {
  utils: UseFirestoreUtils<T>;
}

interface BatchOperation<T> {
  type: "create" | "update" | "delete";
  id?: string;
  data?: Partial<Omit<T, "id">>;
}

// Hook principale con protezione anti-loop
export function useFirestore<T extends { id: string }>(
  config: UseFirestoreConfig<T>
): UseFirestoreResult<T> {
  const {
    collection: collectionName,
    realtime = false,
    enableCache = true,
    autoFetch = true,
    syncWithLocalStorage = false,
    localStorageKey,
    debug = false,
  } = config;

  const { isReady } = useFirebase();

  // 🛡️ PROTEZIONI ANTI-LOOP
  const hasInitialFetch = useRef(false);
  const isInitializing = useRef(false);
  const fetchAttempts = useRef(0);
  const MAX_FETCH_ATTEMPTS = 1; // Massimo un tentativo di fetch automatico

  const [state, setState] = useState<UseFirestoreState<T>>({
    data: [],
    loading: false,
    error: null,
    listening: false,
    lastSync: null,
    fromCache: false,
  });

  const listenerRef = useRef<Unsubscribe | null>(null);
  const cacheRef = useRef<Map<string, T>>(new Map());
  const statsRef = useRef({
    cacheHits: 0,
    totalFetches: 0,
  });

  const getCurrentUserId = useCallback(() => {
    return auth.currentUser?.uid || null;
  }, []);

  const createError = useCallback(
    (code: string, message: string, originalError?: any): FirestoreError => {
      return {
        code: code as any,
        message,
        details: originalError,
        operation: "unknown" as any,
        recoverable: true,
        timestamp: new Date(),
      };
    },
    []
  );

  // 🚀 FETCH OPERATION CON PROTEZIONI
  const fetchOperation = useAsyncOperation(
    async (): Promise<T[]> => {
      if (!isReady) {
        throw new Error(
          "🔥 Firebase not ready - please wait for initialization"
        );
      }

      const userId = getCurrentUserId();
      if (!userId) {
        if (debug) {
          console.log(
            `🔥 [useFirestore] No user authenticated for ${collectionName}, returning empty array`
          );
        }
        return [];
      }

      if (debug) {
        console.log(
          `🔥 [useFirestore] Fetching ${collectionName} for user ${userId}`
        );
      }

      const collectionRef = collection(db, collectionName);
      let q: Query<DocumentData> = query(
        collectionRef,
        where("firestoreMetadata.userId", "==", userId),
        where("firestoreMetadata.deleted", "==", false)
      );

      const snapshot = await getDocs(q);
      const docs: T[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const firestoreDoc = {
          id: docSnap.id,
          ...data,
        } as T;
        docs.push(firestoreDoc);
      });

      // Cache management
      if (enableCache) {
        docs.forEach((doc) => {
          cacheRef.current.set(doc.id, doc);
        });
      }

      // Local storage sync
      if (syncWithLocalStorage && localStorageKey) {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(docs));
          localStorage.setItem(
            `${localStorageKey}_lastUpdate`,
            Date.now().toString()
          );
        } catch (error) {
          console.warn(
            "🔥 [useFirestore] Failed to sync with localStorage:",
            error
          );
        }
      }

      statsRef.current.totalFetches++;

      if (debug) {
        console.log(
          `🔥 [useFirestore] Fetched ${docs.length} documents from ${collectionName}`
        );
      }

      return docs;
    },
    { retry: { maxAttempts: 3 }, debug }
  );

  // 📦 CRUD OPERATIONS
  const create = useCallback(
    async (data: Omit<T, "id">): Promise<T> => {
      if (!isReady) {
        throw new Error("🔥 Firebase not ready for create operation");
      }

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("🔐 User not authenticated for create operation");
      }

      if (debug) {
        console.log(
          `🔥 [useFirestore] Creating document in ${collectionName}:`,
          data
        );
      }

      const now = new Date();
      const documentData = {
        ...data,
        firestoreMetadata: {
          userId,
          createdAt: now,
          updatedAt: now,
          version: 1,
          deleted: false,
          custom: {},
        },
      };

      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, documentData);

      const newDoc = {
        id: docRef.id,
        ...documentData,
      } as unknown as T;

      setState((prev) => ({
        ...prev,
        data: [...prev.data, newDoc],
        lastSync: new Date(),
      }));

      if (enableCache) {
        cacheRef.current.set(newDoc.id, newDoc);
      }

      // Sync to localStorage
      if (syncWithLocalStorage && localStorageKey) {
        try {
          const updatedData = [...state.data, newDoc];
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
          localStorage.setItem(
            `${localStorageKey}_lastUpdate`,
            Date.now().toString()
          );
        } catch (error) {
          console.warn(
            "🔥 [useFirestore] Failed to sync create with localStorage:",
            error
          );
        }
      }

      return newDoc;
    },
    [
      isReady,
      collectionName,
      enableCache,
      debug,
      getCurrentUserId,
      syncWithLocalStorage,
      localStorageKey,
      state.data,
    ]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Omit<T, "id">>): Promise<T> => {
      if (!isReady) {
        throw new Error("🔥 Firebase not ready for update operation");
      }

      if (debug) {
        console.log(
          `🔥 [useFirestore] Updating document ${id} in ${collectionName}:`,
          updates
        );
      }

      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...updates,
        "firestoreMetadata.updatedAt": new Date(),
      };

      await updateDoc(docRef, updateData);

      const existingItem = state.data.find((item) => item.id === id);
      if (!existingItem) {
        throw new Error(`Document with id ${id} not found in local state`);
      }

      const updatedItem = { ...existingItem, ...updates } as T;

      setState((prev) => ({
        ...prev,
        data: prev.data.map((item) => (item.id === id ? updatedItem : item)),
        lastSync: new Date(),
      }));

      if (enableCache) {
        cacheRef.current.set(id, updatedItem);
      }

      // Sync to localStorage
      if (syncWithLocalStorage && localStorageKey) {
        try {
          const updatedData = state.data.map((item) =>
            item.id === id ? updatedItem : item
          );
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
          localStorage.setItem(
            `${localStorageKey}_lastUpdate`,
            Date.now().toString()
          );
        } catch (error) {
          console.warn(
            "🔥 [useFirestore] Failed to sync update with localStorage:",
            error
          );
        }
      }

      return updatedItem;
    },
    [
      isReady,
      collectionName,
      enableCache,
      debug,
      state.data,
      syncWithLocalStorage,
      localStorageKey,
    ]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!isReady) {
        throw new Error("🔥 Firebase not ready for delete operation");
      }

      if (debug) {
        console.log(
          `🔥 [useFirestore] Soft deleting document ${id} in ${collectionName}`
        );
      }

      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        "firestoreMetadata.deleted": true,
        "firestoreMetadata.deletedAt": new Date(),
        "firestoreMetadata.updatedAt": new Date(),
      });

      setState((prev) => ({
        ...prev,
        data: prev.data.filter((item) => item.id !== id),
        lastSync: new Date(),
      }));

      if (enableCache) {
        cacheRef.current.delete(id);
      }

      // Sync to localStorage
      if (syncWithLocalStorage && localStorageKey) {
        try {
          const updatedData = state.data.filter((item) => item.id !== id);
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
          localStorage.setItem(
            `${localStorageKey}_lastUpdate`,
            Date.now().toString()
          );
        } catch (error) {
          console.warn(
            "🔥 [useFirestore] Failed to sync delete with localStorage:",
            error
          );
        }
      }
    },
    [
      isReady,
      collectionName,
      enableCache,
      debug,
      state.data,
      syncWithLocalStorage,
      localStorageKey,
    ]
  );

  const batchUpdate = useCallback(
    async (operations: BatchOperation<T>[]): Promise<void> => {
      if (!isReady) {
        throw new Error("🔥 Firebase not ready for batch operation");
      }

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("🔐 User not authenticated for batch operation");
      }

      if (debug) {
        console.log(
          `🔥 [useFirestore] Batch update with ${operations.length} operations`
        );
      }

      const batch = writeBatch(db);

      operations.forEach((operation) => {
        const docRef = operation.id
          ? doc(db, collectionName, operation.id)
          : doc(collection(db, collectionName));

        switch (operation.type) {
          case "create":
            if (operation.data) {
              batch.set(docRef, {
                ...operation.data,
                firestoreMetadata: {
                  userId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  version: 1,
                  deleted: false,
                  custom: {},
                },
              });
            }
            break;
          case "update":
            if (operation.data) {
              batch.update(docRef, {
                ...operation.data,
                "firestoreMetadata.updatedAt": new Date(),
              });
            }
            break;
          case "delete":
            batch.update(docRef, {
              "firestoreMetadata.deleted": true,
              "firestoreMetadata.deletedAt": new Date(),
              "firestoreMetadata.updatedAt": new Date(),
            });
            break;
        }
      });

      await batch.commit();

      // Force refresh after batch operation
      await refresh();

      if (debug) {
        console.log(`🔥 [useFirestore] Batch update completed`);
      }
    },
    [isReady, collectionName, debug, getCurrentUserId]
  );

  // 🔄 FETCH CON PROTEZIONI
  const fetch = useCallback(async (): Promise<T[]> => {
    // Previeni fetch multipli simultanei
    if (fetchOperation.loading || isInitializing.current) {
      if (debug) {
        console.log(
          `🔥 [useFirestore] Fetch already in progress for ${collectionName}, skipping`
        );
      }
      return state.data;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const docs = await fetchOperation.execute();
      setState((prev) => ({
        ...prev,
        data: docs,
        loading: false,
        lastSync: new Date(),
        fromCache: false,
      }));
      return docs;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as FirestoreError,
      }));
      throw error;
    }
  }, [fetchOperation, collectionName, debug, state.data]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    statsRef.current.cacheHits = 0;
    if (debug) {
      console.log(`🔥 [useFirestore] Cleared cache for ${collectionName}`);
    }
  }, [collectionName, debug]);

  const refresh = useCallback(async (): Promise<void> => {
    clearCache();
    await fetch();
  }, [clearCache, fetch]);

  // 📡 REAL-TIME LISTENER
  const startListening = useCallback(() => {
    if (!isReady || !realtime || listenerRef.current) {
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }

    if (debug) {
      console.log(
        `🔥 [useFirestore] Starting real-time listener for ${collectionName}`
      );
    }

    const collectionRef = collection(db, collectionName);
    const q = query(
      collectionRef,
      where("firestoreMetadata.userId", "==", userId),
      where("firestoreMetadata.deleted", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const docs: T[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const firestoreDoc = {
            id: docSnap.id,
            ...data,
          } as unknown as T;
          docs.push(firestoreDoc);
        });

        setState((prev) => ({
          ...prev,
          data: docs,
          lastSync: new Date(),
          listening: true,
          fromCache: snapshot.metadata.fromCache,
        }));

        if (enableCache) {
          cacheRef.current.clear();
          docs.forEach((doc) => {
            cacheRef.current.set(doc.id, doc);
          });
        }

        if (syncWithLocalStorage && localStorageKey) {
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(docs));
            localStorage.setItem(
              `${localStorageKey}_lastUpdate`,
              Date.now().toString()
            );
          } catch (error) {
            console.warn(
              "🔥 [useFirestore] Failed to sync with localStorage:",
              error
            );
          }
        }

        if (debug) {
          console.log(
            `🔥 [useFirestore] Real-time update ${collectionName}: ${docs.length} docs`
          );
        }
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error: createError(
            "listener-failed",
            "Real-time listener failed",
            error
          ),
          listening: false,
        }));
        if (debug) {
          console.error(
            `🔥 [useFirestore] Real-time listener error for ${collectionName}:`,
            error
          );
        }
      }
    );

    listenerRef.current = unsubscribe;
    setState((prev) => ({ ...prev, listening: true }));
  }, [
    isReady,
    realtime,
    collectionName,
    enableCache,
    syncWithLocalStorage,
    localStorageKey,
    debug,
    getCurrentUserId,
    createError,
  ]);

  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current();
      listenerRef.current = null;
      setState((prev) => ({ ...prev, listening: false }));
      if (debug) {
        console.log(
          `🔥 [useFirestore] Stopped real-time listener for ${collectionName}`
        );
      }
    }
  }, [collectionName, debug]);

  // 🛠️ UTILITIES
  const utils = useMemo(
    () => ({
      findById: (id: string): T | undefined => {
        if (enableCache && cacheRef.current.has(id)) {
          statsRef.current.cacheHits++;
          return cacheRef.current.get(id);
        }
        return state.data.find((item) => item.id === id);
      },
      filter: (predicate: (item: T) => boolean): T[] => {
        return state.data.filter(predicate);
      },
      sort: (compareFn: (a: T, b: T) => number): T[] => {
        return [...state.data].sort(compareFn);
      },
      getStats: () => ({
        total: state.data.length,
        lastUpdated: state.lastSync,
        cacheHits: statsRef.current.cacheHits,
      }),
    }),
    [state.data, state.lastSync, enableCache]
  );

  // 🔄 AUTO-FETCH CON PROTEZIONE ANTI-LOOP
  useEffect(() => {
    if (
      isReady &&
      autoFetch &&
      !hasInitialFetch.current &&
      !isInitializing.current &&
      !state.loading &&
      !state.listening &&
      fetchAttempts.current < MAX_FETCH_ATTEMPTS
    ) {
      isInitializing.current = true;
      fetchAttempts.current++;

      if (debug) {
        console.log(
          `🔥 [useFirestore] Auto-fetching data for ${collectionName} (attempt ${fetchAttempts.current}/${MAX_FETCH_ATTEMPTS})`
        );
      }

      fetch()
        .then(() => {
          hasInitialFetch.current = true;
          if (debug) {
            console.log(
              `🔥 [useFirestore] Auto-fetch completed for ${collectionName}`
            );
          }
        })
        .catch((error) => {
          if (debug) {
            console.error(
              `🔥 [useFirestore] Auto-fetch failed for ${collectionName}:`,
              error
            );
          }
        })
        .finally(() => {
          isInitializing.current = false;
        });
    }
  }, [
    isReady,
    autoFetch,
    state.loading,
    state.listening,
    fetch,
    collectionName,
    debug,
  ]);

  // 📡 REAL-TIME LISTENER SETUP
  useEffect(() => {
    if (isReady && realtime && !listenerRef.current) {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [isReady, realtime, startListening, stopListening]);

  // 📊 SYNC LOADING/ERROR STATE
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      loading: fetchOperation.loading,
      error: fetchOperation.error as FirestoreError | null,
    }));
  }, [fetchOperation.loading, fetchOperation.error]);

  return {
    ...state,
    fetch,
    create,
    update,
    remove,
    batchUpdate,
    clearCache,
    refresh,
    startListening,
    stopListening,
    utils,
  };
}

// 🏭 FACTORY FUNCTIONS PER HOOK SPECIALIZZATI
interface BatchOperation<T> {
  type: "create" | "update" | "delete";
  id?: string;
  data?: Partial<Omit<T, "id">>;
}

type WordPerformanceDoc = WordPerformance & { id: string };
type StatisticsDoc = Statistics & { id: string };

export function useFirestoreWords() {
  return useFirestore<Word>({
    collection: "words",
    realtime: true,
    enableCache: true,
    autoFetch: true,
    syncWithLocalStorage: true,
    localStorageKey: "vocabularyWords",
    debug: process.env.NODE_ENV === "development",
  });
}

export function useFirestoreStats() {
  return useFirestore<StatisticsDoc>({
    collection: "statistics",
    realtime: true,
    enableCache: true,
    autoFetch: true,
    syncWithLocalStorage: true,
    localStorageKey: "vocabularyStats",
    debug: process.env.NODE_ENV === "development",
  });
}

export function useFirestorePerformance() {
  return useFirestore<WordPerformanceDoc>({
    collection: "performance",
    realtime: false, // 📝 Performance non usa realtime per evitare conflitti
    enableCache: true,
    autoFetch: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export default useFirestore;

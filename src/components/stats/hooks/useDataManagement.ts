// =====================================================
// 📁 hooks/useDataManagement.ts - TYPESCRIPT VERSION
// =====================================================

import { useState, useRef } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import type { ChangeEvent } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/integration/useAuth';
import { useWords } from '../../../hooks/data/useWords';

interface UseDataManagementReturn {
  // States
  isExporting: boolean;
  isImporting: boolean;
  isProcessing: boolean;
  
  // Actions
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  
  // ⭐ NEW: Separate export/import functions
  handleExportStatistics: () => Promise<void>;
  handleExportTestHistory: () => Promise<void>;
  handleExportPerformance: () => Promise<void>;
  handleExportWords: () => Promise<void>;
  handleImportStatistics: () => void;
  handleImportTestHistory: () => void;
  handleImportPerformance: () => void;
  handleImportWords: () => void;
  
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const useDataManagement = (): UseDataManagementReturn => {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [importType, setImportType] = useState<string>(''); // ⭐ NEW: Track import type
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { importWords } = useWords(); // ⭐ NEW: Use useWords for proper word import

  const {
    importStats,
    refreshData,
    forceRefresh,    // ⭐ NEW: Force refresh for better data sync
    isProcessing,
    stats,           // ⭐ NEW: For individual exports
    testHistory,     // ⭐ NEW: For individual exports
    wordPerformance, // ⭐ NEW: For individual exports
  } = useAppContext();


  // ⭐ FIXED: Proper file reading and data passing
  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;


    if (file.type !== 'application/json') {
      alert('Per favore seleziona un file JSON valido');
      return;
    }

    setIsImporting(true);
    
    try {
      
      // ⭐ FIXED: Read file content as text
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        
        reader.onerror = () => {
          reject(new Error('Errore nella lettura del file'));
        };
        
        reader.readAsText(file);
      });

      // ⭐ FIXED: Validate importStats function exists
      if (typeof importStats !== 'function') {
        throw new Error(`importStats is not a function. Available type: ${typeof importStats}`);
      }

      
      // ⭐ ENHANCED: Parse and detect import type
      const parsedData = JSON.parse(fileContent);
      
      // ⭐ SPECIFIC IMPORT: Handle based on importType set by specific import buttons
      if (!importType) {
        alert('⚠️ Errore: Tipo di import non specificato');
        return;
      }
      
      // Validate that the file matches the expected import type (if it has exportType metadata)
      if (parsedData.exportType && parsedData.exportType !== importType) {
        alert(`⚠️ Errore: File non compatibile. Atteso: ${importType}, trovato: ${parsedData.exportType}`);
        return;
      }
      
      // ⭐ DECLARE: Variables to hold import results
      let statsResult: any = undefined;
      let historyResult: any = undefined;
      let performanceResult: any = undefined;
      
      switch (importType) {
        case 'statistics_only':
          
          // ⭐ ENHANCED: Handle userId remapping for statistics
          const statsToImport = parsedData.statistics || parsedData;
          const statsArray = Array.isArray(statsToImport) ? statsToImport : [statsToImport];
          
          try {
            const currentUserId = user?.id || 'current-user';
            
            // Get current user's words and test sessions to remap references in statistics
            
            const wordsRef = collection(db, "words");
            const wordsQuery = query(wordsRef, where("firestoreMetadata.userId", "==", currentUserId));
            const wordsSnapshot = await getDocs(wordsQuery);
            
            const englishToWordIdMap = new Map();
            wordsSnapshot.docs.forEach(doc => {
              const wordData = doc.data();
              englishToWordIdMap.set(wordData.english.toLowerCase(), doc.id);
            });
            
            // Get current user's test sessions for session ID remapping
            const sessionsRef = collection(db, "detailedTestSessions");
            const sessionsQuery = query(sessionsRef, where("userId", "==", currentUserId));
            const sessionsSnapshot = await getDocs(sessionsQuery);
            
            const originalToNewSessionIdMap = new Map();
            // This will be populated during test session import, for now we'll handle it gracefully
            
            let remappedStats = 0;
            let referenceRemappings = 0;
            
            // Track processed IDs to avoid importing same document multiple times
            const processedIds = new Set<string>();
            
            for (const stat of statsArray) {
              if (!stat.id) continue;
              
              // Skip if this ID was already processed in this import
              if (processedIds.has(stat.id)) {
                continue;
              }
              processedIds.add(stat.id);
              
              // Check if document with this ID already exists on DB
              const existingDocRef = doc(db, "statistics", stat.id);
              const existingDocSnap = await getDoc(existingDocRef);
              
              let docId = stat.id;
              let needsRemapping = false;
              
              if (existingDocSnap.exists()) {
                const existingData = existingDocSnap.data();
                const existingUserId = existingData?.firestoreMetadata?.userId;
                
                if (existingUserId && existingUserId !== currentUserId) {
                  // Generate new ID for documents owned by different user
                  const newDocRef = doc(collection(db, "statistics"));
                  docId = newDocRef.id;
                  needsRemapping = true;
                  remappedStats++;
                } else {
                }
              } else {
              }
              
              // Deep copy stat data to avoid mutations and clean all userId references
              const statData: any = {
                ...stat,
                id: docId,
                userId: currentUserId, // Update root userId
                firestoreMetadata: {
                  ...(stat.firestoreMetadata || {}),
                  userId: currentUserId // Always use current user's ID
                }
              };
              
              // Recursive function to clean all userId references in nested objects
              const cleanUserIds = (obj: any): any => {
                if (obj === null || obj === undefined) return obj;
                
                if (typeof obj === 'object') {
                  if (Array.isArray(obj)) {
                    return obj.map(item => cleanUserIds(item));
                  } else {
                    const cleaned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                      if (key === 'userId') {
                        cleaned[key] = currentUserId; // Replace any userId with current user
                      } else if (typeof value === 'object') {
                        cleaned[key] = cleanUserIds(value); // Recursive cleaning
                      } else {
                        cleaned[key] = value;
                      }
                    }
                    return cleaned;
                  }
                }
                return obj;
              };
              
              // Apply recursive cleaning to the entire document first
              let finalStatData = cleanUserIds(statData);
              
              // Remap internal references if this statistic came from a different user
              if (needsRemapping) {
                // Remap word references in chapter statistics
                if (stat.chapterStats) {
                  finalStatData.chapterStats = { ...stat.chapterStats };
                  Object.keys(stat.chapterStats).forEach(chapterKey => {
                    const chapterData = stat.chapterStats[chapterKey];
                    if (chapterData && typeof chapterData === 'object') {
                      // If chapter data contains word references, remap them
                      if (chapterData.words && Array.isArray(chapterData.words)) {
                        finalStatData.chapterStats[chapterKey] = {
                          ...chapterData,
                          words: chapterData.words.map((word: any) => {
                            if (word.english) {
                              const newWordId = englishToWordIdMap.get(word.english.toLowerCase());
                              if (newWordId && newWordId !== word.id) {
                                referenceRemappings++;
                                return { ...word, id: newWordId };
                              }
                            }
                            return word;
                          })
                        };
                      }
                    }
                  });
                }
                
                // Remap word references in performance data
                if (stat.performanceData) {
                  finalStatData.performanceData = { ...stat.performanceData };
                  if (stat.performanceData.wordPerformances && Array.isArray(stat.performanceData.wordPerformances)) {
                    finalStatData.performanceData.wordPerformances = stat.performanceData.wordPerformances.map((perf: any) => {
                      if (perf.english) {
                        const newWordId = englishToWordIdMap.get(perf.english.toLowerCase());
                        if (newWordId && newWordId !== perf.wordId) {
                          referenceRemappings++;
                          return { ...perf, wordId: newWordId, id: newWordId };
                        }
                      }
                      return perf;
                    });
                  }
                }
                
                // Remap test session references
                if (stat.recentSessions && Array.isArray(stat.recentSessions)) {
                  finalStatData.recentSessions = stat.recentSessions.map((sessionRef: any) => {
                    // For now, we can't easily remap session IDs since they might not be imported yet
                    // We'll keep the original session reference but note it might be invalid
                    return sessionRef;
                  });
                }
                
                // Remap any other word ID arrays that might exist
                if (stat.wordIds && Array.isArray(stat.wordIds)) {
                  finalStatData.wordIds = stat.wordIds.map((wordId: string) => {
                    // Try to find by looking up the word by its ID in the original data
                    // This is more complex and might require additional data structure
                    return wordId;
                  });
                }
                
                // Clean userIds again after remapping in case new objects were created
                finalStatData = cleanUserIds(finalStatData);
              }
              
              const docRef = doc(db, "statistics", docId);
              await setDoc(docRef, finalStatData);
            }
            
            statsResult = { success: true };
          } catch (error) {
            statsResult = { success: false, error };
          }
          
          break;
          
        case 'test_history_only':
          
          // ⭐ ENHANCED: Handle userId remapping for test history
          const testHistoryToImport = parsedData.testHistory || parsedData;
          const testResultsForImport = Array.isArray(testHistoryToImport) ? testHistoryToImport : [];
          
          try {
            const currentUserId = user?.id || 'current-user';
            
            // Get current user's words to remap word references in test sessions
            
            const wordsRef = collection(db, "words");
            const wordsQuery = query(wordsRef, where("firestoreMetadata.userId", "==", currentUserId));
            const wordsSnapshot = await getDocs(wordsQuery);
            
            const englishToWordIdMap = new Map();
            wordsSnapshot.docs.forEach(doc => {
              const wordData = doc.data();
              englishToWordIdMap.set(wordData.english.toLowerCase(), doc.id);
            });
            
            let remappedSessions = 0;
            let wordReferencesRemapped = 0;
            
            // Track processed IDs to avoid importing same document multiple times
            const processedSessionIds = new Set<string>();
            
            for (const session of testResultsForImport) {
              const originalDocId = session.id || session.sessionId;
              if (!originalDocId) continue;
              
              // Skip if this ID was already processed in this import
              if (processedSessionIds.has(originalDocId)) {
                continue;
              }
              processedSessionIds.add(originalDocId);
              
              // Check if document with this ID already exists on DB
              const existingDocRef = doc(db, "detailedTestSessions", originalDocId);
              const existingDocSnap = await getDoc(existingDocRef);
              
              let docId = originalDocId;
              let needsRemapping = false;
              
              if (existingDocSnap.exists()) {
                const existingData = existingDocSnap.data();
                const existingUserId = existingData?.userId;
                
                if (existingUserId && existingUserId !== currentUserId) {
                  // Generate new ID for documents owned by different user
                  const newDocRef = doc(collection(db, "detailedTestSessions"));
                  docId = newDocRef.id;
                  needsRemapping = true;
                  remappedSessions++;
                } else {
                }
              } else {
              }
              
              // Deep copy session data to avoid mutations and clean all userId references
              const sessionData: any = {
                ...session,
                id: docId,
                sessionId: docId,
                userId: currentUserId,
                deleted: session.deleted !== undefined ? session.deleted : false
              };
              
              // Recursive function to clean all userId references in nested objects
              const cleanUserIds = (obj: any): any => {
                if (obj === null || obj === undefined) return obj;
                
                if (typeof obj === 'object') {
                  if (Array.isArray(obj)) {
                    return obj.map(item => cleanUserIds(item));
                  } else {
                    const cleaned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                      if (key === 'userId') {
                        cleaned[key] = currentUserId; // Replace any userId with current user
                      } else if (typeof value === 'object') {
                        cleaned[key] = cleanUserIds(value); // Recursive cleaning
                      } else {
                        cleaned[key] = value;
                      }
                    }
                    return cleaned;
                  }
                }
                return obj;
              };
              
              // Apply recursive cleaning to the entire document first
              let finalSessionData = cleanUserIds(sessionData);
              
              // Remap word references in test session data if needed
              if (needsRemapping && session.exportData) {
                // Remap word IDs in detailedAnswers
                if (session.exportData.detailedAnswers) {
                  finalSessionData.exportData = { ...session.exportData };
                  finalSessionData.exportData.detailedAnswers = session.exportData.detailedAnswers.map((answer: any) => {
                    if (answer.word && answer.word.english) {
                      const newWordId = englishToWordIdMap.get(answer.word.english.toLowerCase());
                      if (newWordId && newWordId !== answer.word.id) {
                        wordReferencesRemapped++;
                        return {
                          ...answer,
                          word: {
                            ...answer.word,
                            id: newWordId
                          }
                        };
                      }
                    }
                    return answer;
                  });
                }
                
                // Remap word IDs in wrongWords array
                if (session.exportData.wrongWords) {
                  finalSessionData.exportData.wrongWords = session.exportData.wrongWords.map((word: any) => {
                    if (word.english) {
                      const newWordId = englishToWordIdMap.get(word.english.toLowerCase());
                      if (newWordId && newWordId !== word.id) {
                        wordReferencesRemapped++;
                        return { ...word, id: newWordId };
                      }
                    }
                    return word;
                  });
                }
                
                // Remap word IDs in analytics insights
                if (session.analytics?.insights) {
                  finalSessionData.analytics = { ...session.analytics };
                  finalSessionData.analytics.insights = session.analytics.insights.map((insight: any) => {
                    if (insight.data?.wordId && insight.data?.english) {
                      const newWordId = englishToWordIdMap.get(insight.data.english.toLowerCase());
                      if (newWordId && newWordId !== insight.data.wordId) {
                        wordReferencesRemapped++;
                        return {
                          ...insight,
                          data: {
                            ...insight.data,
                            wordId: newWordId
                          }
                        };
                      }
                    }
                    return insight;
                  });
                }
                
                // Clean userIds again after remapping in case new objects were created
                finalSessionData = cleanUserIds(finalSessionData);
              }
              
              const docRef = doc(db, "detailedTestSessions", docId);
              await setDoc(docRef, finalSessionData);
            }
            
            historyResult = { success: true };
          } catch (error) {
            historyResult = { success: false, error };
          }
          
          break;
          
        case 'words_only':
          
          // ⭐ ENHANCED: Handle words import with userId remapping  
          // Support multiple formats: words, wordPerformance, exportData, or raw array
          let rawWords = parsedData.words || parsedData.wordPerformance || parsedData;
          
          // If it's an old JSONManager export format, extract words array
          if (parsedData.exportData && Array.isArray(parsedData.exportData)) {
            rawWords = parsedData.exportData;
          }
          
          const wordsToImport = Array.isArray(rawWords) ? rawWords : [];
          
          try {
            const currentUserId = user?.id || 'current-user';
            
            let importedCount = 0;
            let remappedCount = 0;
            
            // Track processed IDs to avoid importing same document multiple times
            const processedWordIds = new Set<string>();
            
            for (const word of wordsToImport) {
              if (!word || typeof word !== 'object') continue;
              if (!word.english || !word.italian) continue;
              
              // ⭐ FIXED: Generate ID if missing
              const wordId = word.id || doc(collection(db, "words")).id;
              
              // Skip if this ID was already processed in this import
              if (processedWordIds.has(wordId)) {
                continue;
              }
              processedWordIds.add(wordId);
              
              // Check if document with this ID already exists on DB
              const existingDocRef = doc(db, "words", wordId);
              const existingDocSnap = await getDoc(existingDocRef);
              
              let docId = wordId;
              
              if (existingDocSnap.exists()) {
                const existingData = existingDocSnap.data();
                const existingUserId = existingData?.firestoreMetadata?.userId;
                
                if (existingUserId && existingUserId !== currentUserId) {
                  // Generate new ID for words owned by different user
                  const newDocRef = doc(collection(db, "words"));
                  docId = newDocRef.id;
                  remappedCount++;
                } else {
                }
              } else {
              }
              
              // ⭐ FIXED: Deep copy word data with proper Firestore Timestamps
              const now = Timestamp.now();
              const wordData: any = {
                ...word,
                id: docId, // Update with new ID
                userId: currentUserId, // Update root userId
                learned: word.learned !== undefined ? word.learned : false, // Default to false
                difficult: word.difficult !== undefined ? word.difficult : false, // Default to false
                createdAt: word.createdAt ? (word.createdAt instanceof Timestamp ? word.createdAt : Timestamp.fromDate(new Date(word.createdAt))) : now,
                updatedAt: word.updatedAt ? (word.updatedAt instanceof Timestamp ? word.updatedAt : Timestamp.fromDate(new Date(word.updatedAt))) : now,
                firestoreMetadata: {
                  ...(word.firestoreMetadata || {}),
                  userId: currentUserId, // Always use current user's ID
                  createdAt: word.firestoreMetadata?.createdAt ? (word.firestoreMetadata.createdAt instanceof Timestamp ? word.firestoreMetadata.createdAt : Timestamp.fromDate(new Date(word.firestoreMetadata.createdAt))) : now,
                  updatedAt: now,
                  custom: {
                    deleted: false,
                    version: 1
                  }
                }
              };
              
              // Recursive function to clean all userId references in nested objects
              const cleanUserIds = (obj: any): any => {
                if (obj === null || obj === undefined) return obj;
                
                if (typeof obj === 'object') {
                  if (Array.isArray(obj)) {
                    return obj.map(item => cleanUserIds(item));
                  } else {
                    const cleaned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                      if (key === 'userId') {
                        cleaned[key] = currentUserId; // Replace any userId with current user
                      } else if (typeof value === 'object') {
                        cleaned[key] = cleanUserIds(value); // Recursive cleaning
                      } else {
                        cleaned[key] = value;
                      }
                    }
                    return cleaned;
                  }
                }
                return obj;
              };
              
              // Apply recursive cleaning to the entire document
              const finalWordData = cleanUserIds(wordData);
              
              const docRef = doc(db, "words", docId);
              await setDoc(docRef, finalWordData);
              importedCount++;
            }
            
            statsResult = { success: true, imported: importedCount, remapped: remappedCount };
          } catch (error) {
            statsResult = { success: false, error };
          }
          
          break;
          
        case 'performance_only':
          
          // ⭐ ENHANCED: Handle complex performance remapping with word matching
          const rawWordPerformance = parsedData.wordPerformance || parsedData;
          
          // ⭐ Convert to array format if it's an object
          let performancesToImport = [];
          if (Array.isArray(rawWordPerformance)) {
            performancesToImport = rawWordPerformance;
          } else {
            performancesToImport = Object.values(rawWordPerformance || {});
          }
          
          try {
            const currentUserId = user?.id || 'current-user';
            
            // First, get all current user's words to match against
            
            const wordsRef = collection(db, "words");
            const wordsQuery = query(wordsRef, where("firestoreMetadata.userId", "==", currentUserId));
            const wordsSnapshot = await getDocs(wordsQuery);
            
            const currentUserWords = new Map();
            const englishToWordIdMap = new Map();
            
            wordsSnapshot.docs.forEach(doc => {
              const wordData = doc.data();
              currentUserWords.set(doc.id, wordData);
              englishToWordIdMap.set(wordData.english.toLowerCase(), doc.id);
            });
            
            let importedCount = 0;
            let skippedCount = 0;
            
            // Track processed IDs to avoid importing same document multiple times
            const processedPerfIds = new Set<string>();
            
            for (const perf of performancesToImport) {
              if (!perf || typeof perf !== 'object') continue;
              
              // Clean the performance data
              const cleanPerf: any = {};
              for (const [key, value] of Object.entries(perf as Record<string, any>)) {
                if (value !== undefined && value !== null) {
                  cleanPerf[key] = value;
                }
              }
              
              // IGNORE original performance ID completely - we only care about the english word
              const englishText = cleanPerf.english;
              if (!englishText) {
                skippedCount++;
                continue;
              }
              
              // Skip if this english word was already processed in this import
              if (processedPerfIds.has(englishText.toLowerCase())) {
                continue;
              }
              processedPerfIds.add(englishText.toLowerCase());
              
              // Find the word ID for current user that matches this english text
              const targetWordId = englishToWordIdMap.get(englishText.toLowerCase());
              
              if (!targetWordId) {
                skippedCount++;
                continue;
              }
              
              // Create performance document with the target word ID
              const docData = {
                ...cleanPerf,
                id: targetWordId, // Use the found word ID as performance ID
                wordId: targetWordId, // Performance ID = Word ID
                userId: currentUserId, // Always current user
                firestoreMetadata: {
                  ...(cleanPerf.firestoreMetadata || {}),
                  userId: currentUserId, // Always use current user's ID
                  updatedAt: new Date()
                }
              };
              
              // Recursive function to clean all userId references in nested objects
              const cleanUserIds = (obj: any): any => {
                if (obj === null || obj === undefined) return obj;
                
                if (typeof obj === 'object') {
                  if (Array.isArray(obj)) {
                    return obj.map(item => cleanUserIds(item));
                  } else {
                    const cleaned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                      if (key === 'userId') {
                        cleaned[key] = currentUserId; // Replace any userId with current user
                      } else if (typeof value === 'object') {
                        cleaned[key] = cleanUserIds(value); // Recursive cleaning
                      } else {
                        cleaned[key] = value;
                      }
                    }
                    return cleaned;
                  }
                }
                return obj;
              };
              
              // Apply recursive cleaning to the entire document
              const finalPerfData = cleanUserIds(docData);
              
              const docRef = doc(db, "performance", targetWordId);
              await setDoc(docRef, finalPerfData);
              importedCount++;
            }
            
            performanceResult = { success: true, imported: importedCount, skipped: skippedCount };
          } catch (error) {
            performanceResult = { success: false, error };
          }
          
          break;
          
        default:
          alert(`⚠️ Errore: Tipo di import non supportato: ${importType}`);
          return;
      }
      
      // ⭐ Check if any import failed
      let hasErrors = false;
      const results = [
        ...(importType === 'statistics_only' && typeof statsResult !== 'undefined' ? [statsResult] : []),
        ...(importType === 'test_history_only' && typeof historyResult !== 'undefined' ? [historyResult] : []),
        ...(importType === 'words_only' && typeof statsResult !== 'undefined' ? [statsResult] : []),
        ...(importType === 'performance_only' && typeof performanceResult !== 'undefined' ? [performanceResult] : [])
      ];
      
      for (const result of results) {
        if (result && !result.success) {
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        alert('⚠️ Import completato con errori. Controlla la console per dettagli.');
        return;
      }
      
      // ⭐ ENHANCED: Force complete data refresh after import
      
      // First refresh the data
      if (typeof refreshData === 'function') {
        refreshData();
      }
      
      // Then force refresh with a slight delay to ensure data propagation
      setTimeout(() => {
        if (typeof forceRefresh === 'function') {
          forceRefresh();
        }
      }, 500);
      
      // Additional refresh to ensure UI is fully updated
      setTimeout(() => {
        if (typeof refreshData === 'function') {
          refreshData();
        }
        
        // Show success message after all refreshes
        alert(`✅ Import ${importType} completato con successo!`);
      }, 1000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      alert(`Errore durante l'importazione: ${errorMessage}`);
    } finally {
      setIsImporting(false);
      setImportType(''); // ⭐ ENHANCED: Reset import type
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };


  // ⭐ NEW: Export only statistics
  const handleExportStatistics = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      
      // Get data directly from DB for current user
      const userId = user?.id;
      if (!userId) return;
      
      const statsRef = collection(db, "statistics");
      const statsQuery = query(statsRef, where("firestoreMetadata.userId", "==", userId));
      const statsSnapshot = await getDocs(statsQuery);
      const statistics = statsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove userId from export
        if (data.firestoreMetadata) {
          const { userId, ...restMetadata } = data.firestoreMetadata;
          return { id: doc.id, ...data, firestoreMetadata: restMetadata };
        }
        return { id: doc.id, ...data };
      });
      
      const statisticsData = {
        statistics: statistics,
        exportDate: new Date().toISOString(),
        exportType: 'statistics_only'
      };
      
      const blob = new Blob([JSON.stringify(statisticsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('Errore durante l\'esportazione delle statistiche');
    } finally {
      setIsExporting(false);
    }
  };

  // ⭐ NEW: Export only test history
  const handleExportTestHistory = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      
      // Get data directly from DB for current user
      const userId = user?.id;
      if (!userId) return;
      
      const sessionsRef = collection(db, "detailedTestSessions");
      const sessionsQuery = query(sessionsRef, where("userId", "==", userId), where("deleted", "==", false));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove userId from export but keep the rest of the structure
        const { userId, ...restData } = data;
        return { id: doc.id, ...restData };
      });
      
      const testHistoryData = {
        testHistory: sessions,
        exportDate: new Date().toISOString(),
        exportType: 'test_history_only'
      };
      
      const blob = new Blob([JSON.stringify(testHistoryData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('Errore durante l\'esportazione della cronologia test');
    } finally {
      setIsExporting(false);
    }
  };

  // ⭐ NEW: Export only words
  const handleExportWords = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      
      // Get data directly from DB for current user
      const userId = user?.id;
      if (!userId) return;
      
      const wordsRef = collection(db, "words");
      const wordsQuery = query(wordsRef, where("firestoreMetadata.userId", "==", userId));
      const wordsSnapshot = await getDocs(wordsQuery);
      const words = wordsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove userId from export but keep the rest of the structure
        if (data.firestoreMetadata) {
          const { userId, ...restMetadata } = data.firestoreMetadata;
          return { id: doc.id, ...data, firestoreMetadata: restMetadata };
        }
        return { id: doc.id, ...data };
      });
      
      const wordsData = {
        words: words,
        exportDate: new Date().toISOString(),
        exportType: 'words_only'
      };
      
      const blob = new Blob([JSON.stringify(wordsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `words_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('Errore durante l\'esportazione delle parole');
    } finally {
      setIsExporting(false);
    }
  };

  // ⭐ NEW: Export only word performance
  const handleExportPerformance = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      
      // Get data directly from DB for current user
      const userId = user?.id;
      if (!userId) return;
      
      const performanceRef = collection(db, "performance");
      const performanceQuery = query(performanceRef, where("firestoreMetadata.userId", "==", userId), where("firestoreMetadata.deleted", "==", false));
      const performanceSnapshot = await getDocs(performanceQuery);
      const performances = performanceSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove userId from export
        if (data.firestoreMetadata) {
          const { userId, ...restMetadata } = data.firestoreMetadata;
          return { id: doc.id, ...data, firestoreMetadata: restMetadata };
        }
        return { id: doc.id, ...data };
      });
      
      const performanceData = {
        wordPerformance: performances,
        exportDate: new Date().toISOString(),
        exportType: 'performance_only'
      };
      
      const blob = new Blob([JSON.stringify(performanceData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `word_performance_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('Errore durante l\'esportazione delle performance parole');
    } finally {
      setIsExporting(false);
    }
  };

  // ⭐ NEW: Import only statistics
  const handleImportStatistics = () => {
    if (isImporting || isProcessing) return;
    setImportType('statistics_only');
    fileInputRef.current?.click();
  };

  // ⭐ NEW: Import only test history
  const handleImportTestHistory = () => {
    if (isImporting || isProcessing) return;
    setImportType('test_history_only');
    fileInputRef.current?.click();
  };

  // ⭐ NEW: Import only words
  const handleImportWords = () => {
    if (isImporting || isProcessing) return;
    setImportType('words_only');
    fileInputRef.current?.click();
  };

  // ⭐ NEW: Import only word performance
  const handleImportPerformance = () => {
    if (isImporting || isProcessing) return;
    setImportType('performance_only');
    fileInputRef.current?.click();
  };

  return {
    // States
    isExporting,
    isImporting,
    isProcessing,
    
    // Actions
    handleFileSelect,
    
    // ⭐ NEW: Separate export functions
    handleExportStatistics,
    handleExportTestHistory,
    handleExportWords,
    handleExportPerformance,
    
    // ⭐ NEW: Separate import functions
    handleImportStatistics,
    handleImportTestHistory,
    handleImportWords,
    handleImportPerformance,
    
    // Refs
    fileInputRef
  };
};
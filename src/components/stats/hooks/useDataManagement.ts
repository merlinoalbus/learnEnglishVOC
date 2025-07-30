// =====================================================
// 📁 hooks/useDataManagement.ts - TYPESCRIPT VERSION
// =====================================================

import { useState, useRef } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import type { ChangeEvent } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/integration/useAuth';

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
  handleImportStatistics: () => void;
  handleImportTestHistory: () => void;
  handleImportPerformance: () => void;
  
  // Refs
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const useDataManagement = (): UseDataManagementReturn => {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [importType, setImportType] = useState<string>(''); // ⭐ NEW: Track import type
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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

    console.log('📁 File selected:', file.name, 'Type:', file.type);

    if (file.type !== 'application/json') {
      alert('Per favore seleziona un file JSON valido');
      return;
    }

    setIsImporting(true);
    
    try {
      console.log('🔍 Reading file content...');
      
      // ⭐ FIXED: Read file content as text
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          console.log('✅ File read successfully');
          resolve(e.target?.result as string);
        };
        
        reader.onerror = () => {
          console.error('❌ File reading failed');
          reject(new Error('Errore nella lettura del file'));
        };
        
        reader.readAsText(file);
      });

      // ⭐ FIXED: Validate importStats function exists
      if (typeof importStats !== 'function') {
        throw new Error(`importStats is not a function. Available type: ${typeof importStats}`);
      }

      console.log('🔄 Starting import with content length:', fileContent.length);
      
      // ⭐ ENHANCED: Parse and detect import type
      const parsedData = JSON.parse(fileContent);
      
      // ⭐ SPECIFIC IMPORT: Handle based on importType set by specific import buttons
      if (!importType) {
        alert('⚠️ Errore: Tipo di import non specificato');
        return;
      }
      
      console.log(`📁 Specific import requested: ${importType}`);
      
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
          console.log('📊 Importing statistics only...');
          console.log('📊 Raw parsed data:', parsedData);
          
          // ⭐ Import ONLY statistics, no testResults or wordPerformances
          const statsToImport = parsedData.statistics || parsedData;
          
          statsResult = await importStats({
            statistics: statsToImport,
            sourceData: {
              testResults: [], // Empty - don't import
              wordPerformances: [], // Empty - don't import
              words: []
            },
            exportMetadata: {
              exportDate: new Date(),
              appVersion: "1.0.0",
              dataVersion: "1.0",
              userId: "current-user",
              exportType: "statistics-only"
            }
          });
          console.log('📊 Statistics import result:', statsResult);
          break;
          
        case 'test_history_only':
          console.log('📝 Importing test history only...');
          console.log('📝 Raw parsed data:', parsedData);
          
          // ⭐ Import ONLY test history, no statistics or wordPerformances
          const testHistoryToImport = parsedData.testHistory || parsedData;
          const testResultsForImport = Array.isArray(testHistoryToImport) ? testHistoryToImport : [];
          
          historyResult = await importStats({
            statistics: null, // Don't import statistics
            sourceData: {
              testResults: testResultsForImport, // Only import test history
              wordPerformances: [], // Empty - don't import
              words: []
            },
            exportMetadata: {
              exportDate: new Date(), 
              appVersion: "1.0.0",
              dataVersion: "1.0",
              userId: "current-user",
              exportType: "test_history_only"
            }
          });
          console.log('📝 Test history import result:', historyResult);
          break;
          
        case 'performance_only':
          console.log('🎯 Importing word performance only...');
          console.log('🎯 Raw parsed data:', parsedData);
          
          // ⭐ Import ONLY word performance, no statistics or testResults
          const rawWordPerformance = parsedData.wordPerformance || parsedData;
          
          // ⭐ Convert to array format if it's an object
          let performancesToImport = [];
          if (Array.isArray(rawWordPerformance)) {
            performancesToImport = rawWordPerformance;
          } else {
            performancesToImport = Object.values(rawWordPerformance || {});
          }
          
          // ⭐ CLEAN: Remove undefined values from performance data
          const cleanWordPerformances = performancesToImport
            .filter(perf => perf && typeof perf === 'object')
            .map(perf => {
              const cleanPerf: any = {};
              for (const [key, value] of Object.entries(perf as Record<string, any>)) {
                if (value !== undefined && value !== null) {
                  cleanPerf[key] = value;
                }
              }
              
              if (!cleanPerf.id && cleanPerf.wordId) {
                cleanPerf.id = cleanPerf.wordId;
              }
              
              return cleanPerf;
            })
            .filter(perf => perf.id && perf.wordId);
          
          console.log(`🧹 Cleaned ${cleanWordPerformances.length} performance records`);
          
          performanceResult = await importStats({
            statistics: null, // Don't import statistics
            sourceData: {
              testResults: [], // Empty - don't import
              wordPerformances: cleanWordPerformances, // Only import performance
              words: []
            },
            exportMetadata: {
              exportDate: new Date(),
              appVersion: "1.0.0", 
              dataVersion: "1.0",
              userId: "current-user",
              exportType: "performance_only"
            }
          });
          console.log('🎯 Word performance import result:', performanceResult);
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
        ...(importType === 'performance_only' && typeof performanceResult !== 'undefined' ? [performanceResult] : [])
      ];
      
      for (const result of results) {
        if (result && !result.success) {
          hasErrors = true;
          console.error('❌ Import failed:', result.error);
        }
      }
      
      if (hasErrors) {
        alert('⚠️ Import completato con errori. Controlla la console per dettagli.');
        return;
      }
      
      console.log('✅ Import completed successfully');
      
      // ⭐ ENHANCED: Force complete data refresh after import
      console.log('🔄 Forcing complete data refresh after import...');
      
      // First refresh the data
      if (typeof refreshData === 'function') {
        refreshData();
      }
      
      // Then force refresh with a slight delay to ensure data propagation
      setTimeout(() => {
        if (typeof forceRefresh === 'function') {
          console.log('🔄 Force refreshing UI components...');
          forceRefresh();
        }
      }, 500);
      
      // Additional refresh to ensure UI is fully updated
      setTimeout(() => {
        if (typeof refreshData === 'function') {
          console.log('🔄 Final data refresh...');
          refreshData();
        }
        
        // ⭐ DEBUG: Log current data state after import
        console.log('📊 Current stats after import:', stats);
        console.log('📝 Current testHistory after import:', testHistory?.length);
        console.log('🎯 Current wordPerformance after import:', Object.keys(wordPerformance || {}).length);
        
        // ⭐ WARNING: These values might be stale from hook creation time
        console.log('⚠️ Note: These values might be stale - they are captured at hook creation time');
        console.log('🔍 Check the actual UI for updated data display');
        
        // Show success message after all refreshes
        alert(`✅ Import ${importType} completato con successo!\n\nStato dopo import:\n- Statistiche: ${stats ? 'presenti' : 'assenti'}\n- Test History: ${testHistory?.length || 0} elementi\n- Performance: ${Object.keys(wordPerformance || {}).length} parole`);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Errore importazione:', error);
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
      const statsQuery = query(statsRef, where("firestoreMetadata.userId", "==", userId), where("firestoreMetadata.deleted", "==", false));
      const statsSnapshot = await getDocs(statsQuery);
      const statistics = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
      const performances = performanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
    console.log('📊 Opening file dialog for statistics import...');
    fileInputRef.current?.click();
  };

  // ⭐ NEW: Import only test history
  const handleImportTestHistory = () => {
    if (isImporting || isProcessing) return;
    setImportType('test_history_only');
    console.log('📝 Opening file dialog for test history import...');
    fileInputRef.current?.click();
  };

  // ⭐ NEW: Import only word performance
  const handleImportPerformance = () => {
    if (isImporting || isProcessing) return;
    setImportType('performance_only');
    console.log('🎯 Opening file dialog for word performance import...');
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
    handleExportPerformance,
    
    // ⭐ NEW: Separate import functions
    handleImportStatistics,
    handleImportTestHistory,
    handleImportPerformance,
    
    // Refs
    fileInputRef
  };
};
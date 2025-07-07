// =====================================================
// 📁 hooks/useDataManagement.js - FIXED Import/Export (WORKING VERSION)
// =====================================================

import { useState, useRef } from 'react';
import { useAppContext } from '../../../contexts/AppContext';

export const useDataManagement = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  const {
    exportStats,
    importStats,
    resetStats,
    refreshData,
    isProcessing
  } = useAppContext();

  const handleExport = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      console.log('🔄 Starting export...');
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ⭐ FIXED: Call exportStats correctly
      if (typeof exportStats === 'function') {
        exportStats();
        console.log('✅ Export completed');
      } else {
        throw new Error('exportStats is not available');
      }
    } catch (error) {
      console.error('❌ Errore export:', error);
      alert(`Errore durante l'esportazione: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (isImporting || isProcessing) return;
    console.log('📂 Opening file dialog...');
    fileInputRef.current?.click();
  };

  // ⭐ FIXED: Proper file reading and data passing
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
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
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          console.log('✅ File read successfully');
          resolve(e.target.result);
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
      
      // ⭐ FIXED: Pass file content as string to importStats
      await importStats(fileContent);
      
      console.log('✅ Import completed successfully');
      
      // Refresh data after import
      setTimeout(() => {
        if (typeof refreshData === 'function') {
          console.log('🔄 Refreshing data after import...');
          refreshData();
        }
      }, 200);
      
    } catch (error) {
      console.error('❌ Errore importazione:', error);
      alert(`Errore durante l'importazione: ${error.message}`);
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleReset = async () => {
    if (isProcessing) return;

    const confirmation = window.confirm(
      '⚠️ ATTENZIONE: Questa operazione cancellerà TUTTI i dati (parole, test, statistiche).\n\n' +
      'Sei sicuro di voler continuare?'
    );
    
    if (!confirmation) return;

    try {
      console.log('🗑️ Starting data reset...');
      
      // ⭐ FIXED: Call resetStats correctly
      if (typeof resetStats === 'function') {
        await resetStats();
        console.log('✅ Reset completed');
        
        // Refresh data after reset
        setTimeout(() => {
          if (typeof refreshData === 'function') {
            console.log('🔄 Refreshing data after reset...');
            refreshData();
          }
        }, 200);
        
      } else {
        throw new Error('resetStats is not available');
      }
    } catch (error) {
      console.error('❌ Errore reset:', error);
      alert(`Errore durante il reset: ${error.message}`);
    }
  };

  // ⭐ DEBUG: Log available functions
  console.log('🔍 useDataManagement - Available functions:', {
    exportStats: typeof exportStats,
    importStats: typeof importStats,
    resetStats: typeof resetStats,
    refreshData: typeof refreshData,
    isProcessing
  });

  return {
    // States
    isExporting,
    isImporting,
    isProcessing,
    
    // Actions
    handleExport,
    handleImportClick,
    handleFileSelect,
    handleReset,
    
    // Refs
    fileInputRef
  };
};
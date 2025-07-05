// =====================================================
// 6. hooks/useDataManagement.js - FIXED Import/Export
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
      await new Promise(resolve => setTimeout(resolve, 100));
      exportStats();
    } catch (error) {
      console.error('❌ Errore export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (isImporting || isProcessing) return;
    fileInputRef.current?.click();
  };

  // ⭐ FIXED: Proper file selection handler
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Per favore seleziona un file JSON valido');
      return;
    }

    setIsImporting(true);
    
    try {
      await importStats(file);
      setTimeout(() => {
        refreshData();
      }, 200);
    } catch (error) {
      console.error('❌ Errore importazione:', error);
      alert(`Errore durante l'importazione: ${error.message}`);
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleReset = async () => {
    if (isProcessing) return;

    const confirmation = window.confirm('⚠️ ATTENZIONE: Questa operazione cancellerà tutti i dati. Continuare?');
    if (!confirmation) return;

    try {
      await resetStats();
      setTimeout(() => {
        refreshData();
      }, 200);
    } catch (error) {
      console.error('❌ Errore reset:', error);
      alert(`Errore durante il reset: ${error.message}`);
    }
  };

  return {
    isExporting,
    isImporting,
    isProcessing,
    handleExport,
    handleImportClick,
    handleFileSelect, // ⭐ FIXED: Export the file handler
    handleReset,
    fileInputRef
  };
};
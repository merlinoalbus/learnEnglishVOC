// =====================================================
// DataManagementPanel.js - FIXED File Import/Export
// =====================================================

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Shield, Download, Upload } from 'lucide-react';
import { useDataManagement } from '../stats/hooks/useDataManagement';
import { useStats } from '../../hooks/data/useStats';

const DataManagementPanel = () => {
  const {
    isExporting,
    isImporting,
    isProcessing,
    handleFileSelect, // ⭐ FIXED: Use the correct file handler
    handleExportStatistics, // ⭐ NEW: Individual export functions
    handleExportTestHistory,
    handleExportPerformance,
    handleExportWords, // ⭐ NEW: Words export
    handleImportStatistics, // ⭐ NEW: Individual import functions
    handleImportTestHistory,
    handleImportPerformance,
    handleImportWords, // ⭐ NEW: Words import
    fileInputRef
  } = useDataManagement();


  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ⭐ NEW: Separate exports section */}
        <div className="text-center">
          <h4 className="font-bold text-green-800 dark:text-green-200 mb-3 flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Export Separati
          </h4>
          <div className="space-y-2">
            <Button 
              onClick={handleExportStatistics}
              disabled={isExporting || isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm"
            >
              📊 Export Statistiche
            </Button>
            <Button 
              onClick={handleExportTestHistory}
              disabled={isExporting || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm"
            >
              📝 Export Cronologia Test
            </Button>
            <Button 
              onClick={handleExportPerformance}
              disabled={isExporting || isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
            >
              🎯 Export Performance Parole
            </Button>
            <Button 
              onClick={handleExportWords}
              disabled={isExporting || isProcessing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm"
            >
              📚 Export Vocabolario
            </Button>
          </div>
          
          {/* ⭐ Info about separate exports */}
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-xs text-green-700 dark:text-green-300">
              <strong>Export singoli:</strong> Scarica solo il tipo di dato selezionato
            </p>
          </div>
        </div>

        {/* ⭐ NEW: Separate imports section */}
        <div className="text-center">
          <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-3 flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Import Separati
          </h4>
          <div className="space-y-2">
            <Button 
              onClick={handleImportStatistics}
              disabled={isImporting || isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm"
            >
              📊 Import Statistiche
            </Button>
            <Button 
              onClick={handleImportTestHistory}
              disabled={isImporting || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm"
            >
              📝 Import Cronologia Test
            </Button>
            <Button 
              onClick={handleImportPerformance}
              disabled={isImporting || isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
            >
              🎯 Import Performance Parole
            </Button>
            <Button 
              onClick={handleImportWords}
              disabled={isImporting || isProcessing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm"
            >
              📚 Import Vocabolario
            </Button>
          </div>
          
          {/* ⭐ Info about separate imports */}
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              <strong>Import singoli:</strong> Carica solo il tipo di dato selezionato
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Sovrascrive documenti esistenti con gli stessi ID
            </p>
          </div>
        </div>

      </div>

      {/* ⭐ FIXED: Correct file input with proper onChange handler */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Card>
  );
};

export default DataManagementPanel;
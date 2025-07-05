// =====================================================
// DataManagementPanel.js - FIXED File Import/Export
// =====================================================

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Shield, AlertTriangle, Download, Upload, RefreshCw } from 'lucide-react';
import { useDataManagement } from './hooks/useDataManagement';

const DataManagementPanel = () => {
  const {
    isExporting,
    isImporting,
    isProcessing,
    handleExport,
    handleImportClick,
    handleFileSelect, // ⭐ FIXED: Use the correct file handler
    handleReset,
    fileInputRef
  } = useDataManagement();

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="text-center">
          <h4 className="font-bold text-indigo-800 mb-3 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            Backup Completo
          </h4>
          <div className="space-y-2">
            <Button 
              onClick={handleExport}
              disabled={isExporting || isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? '⏳ Esportando...' : 'Esporta Backup'}
            </Button>
            <Button 
              onClick={handleImportClick}
              disabled={isImporting || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? '⏳ Importando...' : 'Importa Backup'}
            </Button>
          </div>
          
          {/* ⭐ ENHANCED: Info about backup content */}
          <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-700">
              <strong>Include:</strong> Parole, Statistiche, Cronologia Test, Performance Parole
            </p>
          </div>
        </div>

        {/* Reset Section */}
        <div className="text-center">
          <h4 className="font-bold text-red-800 mb-3 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Reset Completo
          </h4>
          <Button 
            onClick={handleReset}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Completo
          </Button>
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Cancella tutto: parole, test, statistiche
          </p>
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
// =====================================================
// 📁 src/App.js - REACT IMPORT FORZATO
// =====================================================

// ⭐ IMPORT PROTETTO che VS Code NON PUÒ RIMUOVERE
import React, { useEffect } from 'react';
// Questo uso esplicito impedisce la rimozione automatica:
const ReactVersion = React.version;
console.log('React loaded:', ReactVersion);

import './App.css';
import { AppRouter } from './components/AppRouter';
import { ErrorTracker, MainAppErrorBoundary } from './components/ErrorBoundaries';
import { AppProvider } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './layouts/AppLayout';

const VocabularyApp = () => {
  // 🆘 EMERGENCY EXPORT SENZA HOOK (import diretto localStorage)
  useEffect(() => {
    const handleEmergencyExport = () => {
      try {
        // ⭐ IMPORT DIRETTO senza hook per evitare problemi context
        const words = JSON.parse(localStorage.getItem('vocabularyWords') || '[]');
        const stats = JSON.parse(localStorage.getItem('vocabularyStats') || '{}');
        const testHistory = JSON.parse(localStorage.getItem('testHistory') || '[]');
        const wordPerformance = JSON.parse(localStorage.getItem('wordPerformance') || '{}');
        
        const exportData = {
          words,
          stats,
          testHistory,
          wordPerformance,
          exportDate: new Date().toISOString(),
          version: '2.3',
          dataTypes: ['words', 'stats', 'testHistory', 'wordPerformance'],
          totalTests: testHistory.length,
          totalWords: words.length,
          totalWordPerformance: Object.keys(wordPerformance).length,
          description: 'EMERGENCY backup v2.3: parole + statistiche + cronologia + performance'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `vocabulary-EMERGENCY-backup-v2.3-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ Export di emergenza completato!');
      } catch (error) {
        console.error('❌ Emergency export failed:', error);
        alert('❌ Export fallito');
      }
    };

    // ⭐ AGGIUNGI FORCE MIGRATION per testing
    const handleForceMigration = () => {
      // Trigger re-check migrazione nel router
      window.location.hash = '#migration';
      window.location.reload();
    };

    window.addEventListener('emergencyExport', handleEmergencyExport);
    window.addEventListener('forceExport', handleEmergencyExport);
    window.addEventListener('forceMigration', handleForceMigration);

    return () => {
      window.removeEventListener('emergencyExport', handleEmergencyExport);
      window.removeEventListener('forceExport', handleEmergencyExport);
      window.removeEventListener('forceMigration', handleForceMigration);
    };
  }, []);

  return (
    <MainAppErrorBoundary 
      onAppError={(error, errorInfo) => {
        ErrorTracker.logError(error, 'Main App', { errorInfo });
        
        if (process.env.NODE_ENV === 'development') {
          console.group('🚨 Main App Error Caught');
          console.error('Error:', error);
          console.groupEnd();
        }
      }}
    >
      <NotificationProvider>
        <AppProvider>
          <AppLayout>
            <AppRouter />
          </AppLayout>
        </AppProvider>
      </NotificationProvider>
    </MainAppErrorBoundary>
  );
};

export default VocabularyApp;
import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './layouts/AppLayout';
import { AppRouter } from './components/AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';

// =====================================================
// 🧪 STEP 2: Import nuovo sistema (dual-system testing)
// =====================================================
import { AppStoreProvider } from './store/AppStore';
import { NotificationStoreProvider } from './store/NotificationStore';
import { useStoreBridge } from './hooks/useStoreBridge';
import './App.css';

// =====================================================
// 🧪 Componente di Test Dual-System
// =====================================================
const DualSystemTester = () => {
  const bridge = useStoreBridge({ 
    enableComparison: true, 
    logDifferences: true,
    autoValidate: true 
  });
  
  // Log dello stato ogni volta che cambia
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    console.log('🔍 DUAL SYSTEM STATUS:', {
      identical: bridge.comparison.identical,
      wordCounts: {
        old: bridge.systems.old.app.words.length,
        new: bridge.systems.new.app.words.length
      },
      notificationCounts: {
        old: bridge.systems.old.notifications.notifications?.length || 0,
        new: bridge.systems.new.notifications.notifications?.length || 0
      },
      differences: {
        app: bridge.comparison.app.differences.length,
        notifications: bridge.comparison.notifications.differences.length
      }
    });
    
    // Se ci sono differenze, logga i dettagli
    if (!bridge.comparison.identical) {
      console.warn('⚠️ SISTEMI NON SINCRONIZZATI:', {
        appDifferences: bridge.comparison.app.differences,
        notificationDifferences: bridge.comparison.notifications.differences
      });
    } else {
      console.log('✅ SISTEMI PERFETTAMENTE SINCRONIZZATI');
    }
  });
  
  // Test automatico delle operazioni critiche
  React.useEffect(() => {
    const runTests = async () => {
      console.log('🧪 ESEGUENDO TEST AUTOMATICI...');
      
      // Test 1: Verifica che entrambi i sistemi leggano gli stessi dati
      const readTest = await bridge.testDualSystemOperation(
        'read_words',
        (appSystem) => appSystem.words
      );
      
      // Test 2: Verifica stato UI
      const uiTest = await bridge.testDualSystemOperation(
        'read_ui_state',
        (appSystem) => ({
          currentView: appSystem.currentView,
          testMode: appSystem.testMode,
          showResults: appSystem.showResults
        })
      );
      
      console.log('🧪 RISULTATI TEST:', { readTest, uiTest });
    };
    
    // Esegui test dopo 2 secondi per dare tempo al sistema di caricarsi
    const timer = setTimeout(runTests, 2000);
    return () => clearTimeout(timer);
  }, [bridge]);
  
  return null; // Componente invisibile, solo per testing
};

// =====================================================
// 🧪 Wrapper Dual-System per Testing
// =====================================================
const DualSystemWrapper = ({ children }) => {
  return (
    <AppStoreProvider>
      <NotificationStoreProvider>
        <DualSystemTester />
        {children}
      </NotificationStoreProvider>
    </AppStoreProvider>
  );
};

// =====================================================
// 🧪 App Component con Dual-System
// =====================================================
const VocabularyApp = () => {
  return (
    <ErrorBoundary>
      {/* SISTEMA VECCHIO (manteniamo tutto come prima) */}
      <NotificationProvider>
        <AppProvider>
          
          {/* SISTEMA NUOVO (wrappato per coesistenza) */}
          <DualSystemWrapper>
            
            <AppLayout>
              <AppRouter />
            </AppLayout>
            
          </DualSystemWrapper>
          
        </AppProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default VocabularyApp;
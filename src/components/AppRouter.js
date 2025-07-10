// =====================================================
// 📁 src/components/AppRouter.tsx - ROUTER PRINCIPALE CON MIGRAZIONE INTEGRATA
// =====================================================

// ⭐ IMPORT PROTETTO che VS Code NON PUÒ RIMUOVERE
import React, { useEffect, useState } from 'react';
// Questo uso esplicito impedisce la rimozione automatica:
const ReactVersion = React.version;

import { AlertTriangle, Database, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { needsMigration } from '../utils/migrationUtils';
import { MainView } from '../views/MainView';
import { ResultsView } from '../views/ResultsView';
import { StatsView } from '../views/StatsView';
import { TestView } from '../views/TestView';

// ⭐ TEMPORARY BUTTON COMPONENT - sostituisci con il tuo import corretto
const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default', 
  size = 'default', 
  disabled = false, 
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  [key: string]: any;
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ⭐ LAZY IMPORT per MigrationManager (performance)
const MigrationManager = React.lazy(() => import('./migrationManager'));

export const AppRouter = () => {
  const { currentView, testMode, showResults } = useAppContext();
  
  // ⭐ STATE PER MIGRAZIONE
  const [migrationAvailable, setMigrationAvailable] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [showMigrationView, setShowMigrationView] = useState(false);

  // ⭐ CONTROLLO MIGRAZIONE ALL'AVVIO
  useEffect(() => {
    const checkMigration = () => {
      try {
        const needsUpgrade = needsMigration();
        setMigrationAvailable(needsUpgrade);
        setShowMigrationBanner(needsUpgrade);
      } catch (error) {
        console.warn('Errore controllo migrazione:', error);
        // Se ci sono errori, nascondi la migrazione per ora
        setMigrationAvailable(false);
        setShowMigrationBanner(false);
      }
    };

    checkMigration();
  }, []);

  // ⭐ GESTIONE MIGRAZIONE COMPLETATA
  const handleMigrationComplete = () => {
    setMigrationAvailable(false);
    setShowMigrationBanner(false);
    setShowMigrationView(false);
    
    // Ricarica app per applicare le modifiche
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // ⭐ BANNER DI MIGRAZIONE
  const MigrationBanner = () => {
    if (!showMigrationBanner || showMigrationView) return null;

    return (
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">🚀 Aggiornamento Sistema v3.0 Disponibile</div>
              <div className="text-yellow-100 text-xs">
                Migliora l'accuratezza delle statistiche con la nuova struttura dati ottimizzata
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowMigrationView(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 font-medium text-sm h-8 px-3"
              size="sm"
            >
              <Database className="w-3 h-3 mr-1" />
              Aggiorna
            </Button>
            <button
              onClick={() => setShowMigrationBanner(false)}
              className="text-yellow-100 hover:text-white p-1 rounded"
              title="Nascondi (riapparirà al prossimo riavvio)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ⭐ GESTIONE VISTA MIGRAZIONE
  if (showMigrationView) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header della migrazione */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Aggiornamento Sistema Dati v3.0</h1>
              <p className="text-blue-100 text-sm">
                Migrazione alla struttura dati ottimizzata per statistiche più precise
              </p>
            </div>
            <Button
              onClick={() => setShowMigrationView(false)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
              size="sm"
            >
              ← Torna all'App
            </Button>
          </div>
        </div>

        {/* Migration Manager */}
        <div className="p-6">
          <React.Suspense 
            fallback={
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Caricando sistema di migrazione...</p>
                </div>
              </div>
            }
          >
            <MigrationManager onMigrationComplete={handleMigrationComplete} />
          </React.Suspense>
        </div>
      </div>
    );
  }

  // ⭐ COMPONENTE PER RENDERING DELLE VISTE PRINCIPALI
  const renderMainContent = () => {
    // Test in corso
    if (testMode) {
      return <TestView />;
    }
    
    // Risultati test
    if (showResults && !testMode) {
      return <ResultsView />;
    }
    
    // Viste principali (quando non ci sono test attivi o risultati)
    if (!testMode && !showResults) {
      switch (currentView) {
        case 'stats':
          return (
            <StatsView 
              migrationAvailable={migrationAvailable} 
              onShowMigration={() => setShowMigrationView(true)} 
            />
          );
        case 'main':
        default:
          return (
            <MainView 
              migrationAvailable={migrationAvailable} 
              onShowMigration={() => setShowMigrationView(true)} 
            />
          );
      }
    }
    
    return null;
  };

  // ⭐ APP NORMALE con banner migrazione
  return (
    <div>
      {/* Banner migrazione */}
      <MigrationBanner />
      
      {/* Contenuto principale */}
      <div>
        {renderMainContent()}
      </div>
    </div>
  );
};
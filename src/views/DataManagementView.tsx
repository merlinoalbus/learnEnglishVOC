// =====================================================
// DataManagementView.tsx - Dedicated Data Management View
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Database, Shield, ArrowLeft } from 'lucide-react';
import DataManagementPanel from '../components/data-management/DataManagementPanel';
import { useStats } from '../hooks/data/useStats';
import { useAppContext } from '../contexts/AppContext';

interface DataManagementViewProps {
  onGoBack: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ onGoBack }) => {
  const { clearAllStatistics, clearHistoryOnly } = useStats();
  const { clearAllWords } = useAppContext();

  const handleClearAllStatistics = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('⚠️ ATTENZIONE: Questa operazione cancellerà TUTTE le statistiche (performance parole, cronologia test, statistiche).\n\nSei sicuro di voler procedere?')) {
      try {
        await clearAllStatistics();
        alert('✅ Tutte le statistiche sono state cancellate con successo!');
      } catch (error) {
        alert('❌ Errore durante la cancellazione delle statistiche');
        console.error('Clear statistics error:', error);
      }
    }
  };

  const handleClearTestHistory = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('⚠️ Vuoi cancellare solo la cronologia dei test mantenendo le statistiche e performance?')) {
      try {
        await clearHistoryOnly();
        alert('✅ Cronologia test cancellata con successo!');
      } catch (error) {
        alert('❌ Errore durante la cancellazione della cronologia');
        console.error('Clear test history error:', error);
      }
    }
  };

  const handleClearVocabulary = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('⚠️ ATTENZIONE: Questa operazione cancellerà TUTTE le parole del vocabolario.\n\nSei sicuro di voler procedere?')) {
      try {
        await clearAllWords();
        alert('✅ Vocabolario cancellato con successo!');
      } catch (error) {
        alert('❌ Errore durante la cancellazione del vocabolario');
        console.error('Clear vocabulary error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onGoBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna Indietro
            </Button>
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Gestione Dati
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Import, export e gestione completa dei tuoi dati
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Import/Export Panel */}
        <DataManagementPanel />

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <Shield className="w-5 h-5" />
              Zona Pericolosa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Button 
                  onClick={handleClearTestHistory}
                  variant="destructive"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  🗑️ Cancella Solo Cronologia Test
                </Button>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  Mantiene statistiche e performance
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleClearAllStatistics}
                  variant="destructive"
                  className="w-full"
                >
                  🗑️ Cancella Tutte le Statistiche
                </Button>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Cancella tutto: performance, test, statistiche
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleClearVocabulary}
                  variant="destructive"
                  className="w-full bg-red-700 hover:bg-red-800"
                >
                  🗑️ Pulisci Vocabolario
                </Button>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Cancella tutte le parole del dizionario
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/40 rounded-lg border border-red-300 dark:border-red-700">
              <p className="text-sm text-red-800 dark:text-red-200 text-center">
                ⚠️ <strong>ATTENZIONE:</strong> Queste operazioni sono irreversibili. 
                Assicurati di aver fatto un backup dei tuoi dati prima di procedere.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DataManagementView;
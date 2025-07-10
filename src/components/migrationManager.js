// ⭐ IMPORT PROTETTO che VS Code NON PUÒ RIMUOVERE
import React, { useEffect, useState } from 'react';
// Questo uso esplicito impedisce la rimozione automatica:
const ReactVersion = React.version;

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  Info,
  Play,
  RotateCcw,
  Settings,
  TrendingUp,
  Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useOptimizedStats } from '../hooks/useOptimizedStats';
import {
  getLegacyDataReport,
  migrateAllLegacyData,
  needsMigration,
  testMigration
} from '../utils/migrationUtils';
// Questo uso esplicito impedisce la rimozione automatica:


const MigrationManager = ({ onMigrationComplete, onComplete }) => {
  const [migrationState, setMigrationState] = useState('checking');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationReport, setMigrationReport] = useState(null);
  const [legacyReport, setLegacyReport] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);

  const optimizedStats = useOptimizedStats();

  // ⭐ INITIAL CHECK
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = () => {
    try {
      const needsUpgrade = needsMigration();
      const legacyDataReport = getLegacyDataReport();
      
      setLegacyReport(legacyDataReport);
      
      if (!needsUpgrade) {
        setMigrationState('completed');
      } else if (legacyDataReport.wordsCount === 0 && legacyDataReport.testsCount === 0) {
        setMigrationState('no_data');
      } else {
        setMigrationState('ready');
      }
    } catch (err) {
      setError(err.message);
      setMigrationState('error');
    }
  };

  // ⭐ TEST MIGRATION (DRY RUN)
  const handleTestMigration = async () => {
    setMigrationState('testing');
    setError(null);
    
    try {
      const testReport = testMigration();
      setMigrationReport(testReport);
      setMigrationState('test_complete');
    } catch (err) {
      setError(err.message);
      setMigrationState('error');
    }
  };

  // ⭐ ACTUAL MIGRATION
  const handleActualMigration = async () => {
    setMigrationState('migrating');
    setMigrationProgress(0);
    setError(null);

    try {
      // Simula il progresso
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await migrateAllLegacyData();
      
      clearInterval(progressInterval);
      setMigrationProgress(100);
      setMigrationReport(result.migrationReport);
      setMigrationState('migration_complete');
      
      // Refresh stats
      optimizedStats.recalculateStats();
      
      // ⭐ CALLBACK quando migrazione completata
      if (onMigrationComplete) {
        onMigrationComplete();
      }
      if (onComplete) {
        onComplete();
      }
      
    } catch (err) {
      setError(err.message);
      setMigrationState('error');
    }
  };

  // ⭐ RENDER FUNCTIONS
  const renderCheckingState = () => (
    <div className="text-center py-8">
      <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Verificando i dati...</h3>
      <p className="text-gray-600">Analizzando la struttura dati attuale</p>
    </div>
  );

  const renderNoDataState = () => (
    <div className="text-center py-8">
      <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun dato da migrare</h3>
      <p className="text-gray-600">Non sono stati trovati dati legacy da convertire</p>
      <Button 
        onClick={checkMigrationStatus}
        className="mt-4 bg-blue-500 hover:bg-blue-600"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Ricontrolla
      </Button>
    </div>
  );

  const renderCompletedState = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Migrazione già completata</h3>
      <p className="text-gray-600">I tuoi dati sono già nella struttura ottimizzata</p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{optimizedStats.globalStats.totalTests}</div>
          <div className="text-blue-700 text-sm">Test Migrati</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{optimizedStats.allWords.length}</div>
          <div className="text-green-700 text-sm">Parole Migrate</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{optimizedStats.globalStats.dataQualityScore || 'N/A'}</div>
          <div className="text-purple-700 text-sm">Qualità Dati</div>
        </div>
      </div>
    </div>
  );

  const renderReadyState = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">Migrazione Necessaria</h3>
        <p className="text-gray-600">I tuoi dati devono essere convertiti alla nuova struttura ottimizzata</p>
      </div>

      {/* Legacy Data Report */}
      {legacyReport && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Database className="w-5 h-5" />
              Analisi Dati Attuali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{legacyReport.wordsCount}</div>
                <div className="text-blue-700 text-sm">Parole</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{legacyReport.testsCount}</div>
                <div className="text-green-700 text-sm">Test</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{legacyReport.testsWithDetailedData}</div>
                <div className="text-purple-700 text-sm">Test Dettagliati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{legacyReport.estimatedQuality}%</div>
                <div className="text-orange-700 text-sm">Qualità Stimata</div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">📋 Raccomandazioni:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {legacyReport.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={handleTestMigration}
          variant="outline"
          className="border-blue-500 text-blue-700 hover:bg-blue-50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Test Migrazione (Sicuro)
        </Button>
        
        <Button 
          onClick={handleActualMigration}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Avvia Migrazione
        </Button>
      </div>
    </div>
  );

  const renderTestingState = () => (
    <div className="text-center py-8">
      <Settings className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Test della migrazione in corso...</h3>
      <p className="text-gray-600">Verificando la compatibilità dei dati (nessuna modifica effettuata)</p>
    </div>
  );

  const renderMigratingState = () => (
    <div className="text-center py-8">
      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-500 animate-bounce" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Migrazione in corso...</h3>
      <p className="text-gray-600 mb-4">Convertendo i tuoi dati alla nuova struttura</p>
      
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div 
          className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${migrationProgress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500">{migrationProgress}% completato</p>
    </div>
  );

  const renderMigrationReport = (report) => (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          Report Migrazione
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{report.wordsProcessed}</div>
            <div className="text-green-700 text-sm">Parole Migrate</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{report.testsProcessed}</div>
            <div className="text-blue-700 text-sm">Test Migrati</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{report.dataQualityScore}%</div>
            <div className="text-purple-700 text-sm">Qualità Finale</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{report.estimationsUsed}</div>
            <div className="text-orange-700 text-sm">Stime Utilizzate</div>
          </div>
        </div>

        {report.errorsEncountered.length > 0 && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
            <h4 className="font-bold text-red-800 mb-2">⚠️ Errori ({report.errorsEncountered.length}):</h4>
            <div className="max-h-24 overflow-y-auto">
              {report.errorsEncountered.slice(0, 3).map((error, index) => (
                <p key={index} className="text-sm text-red-700">• {error.item}: {error.error}</p>
              ))}
              {report.errorsEncountered.length > 3 && (
                <p className="text-sm text-red-600">... e altri {report.errorsEncountered.length - 3} errori</p>
              )}
            </div>
          </div>
        )}

        {report.warnings.length > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="font-bold text-yellow-800 mb-2">💡 Avvisi ({report.warnings.length}):</h4>
            <div className="max-h-24 overflow-y-auto">
              {report.warnings.slice(0, 3).map((warning, index) => (
                <p key={index} className="text-sm text-yellow-700">• {warning}</p>
              ))}
              {report.warnings.length > 3 && (
                <p className="text-sm text-yellow-600">... e altri {report.warnings.length - 3} avvisi</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <div className="text-center py-8">
      <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Errore durante la migrazione</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <Button 
        onClick={checkMigrationStatus}
        variant="outline"
        className="border-red-500 text-red-700 hover:bg-red-50"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Riprova
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <Database className="w-8 h-8" />
            Sistema di Migrazione Dati v3.0
          </CardTitle>
          <p className="text-indigo-100">
            Converti i tuoi dati alla nuova struttura ottimizzata per statistiche più precise
          </p>
        </CardHeader>

        <CardContent className="p-8">
          {migrationState === 'checking' && renderCheckingState()}
          {migrationState === 'no_data' && renderNoDataState()}
          {migrationState === 'completed' && renderCompletedState()}
          {migrationState === 'ready' && renderReadyState()}
          {migrationState === 'testing' && renderTestingState()}
          {migrationState === 'migrating' && renderMigratingState()}
          {migrationState === 'error' && renderErrorState()}
          
          {(migrationState === 'test_complete' || migrationState === 'migration_complete') && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {migrationState === 'test_complete' ? 'Test Completato' : 'Migrazione Completata!'}
                </h3>
                <p className="text-gray-600">
                  {migrationState === 'test_complete' 
                    ? 'Il test è stato eseguito con successo. Puoi procedere con la migrazione reale.'
                    : 'I tuoi dati sono stati convertiti con successo alla nuova struttura!'
                  }
                </p>
              </div>

              {migrationReport && renderMigrationReport(migrationReport)}

              <div className="flex justify-center gap-4">
                {migrationState === 'test_complete' && (
                  <Button 
                    onClick={handleActualMigration}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Procedi con Migrazione Reale
                  </Button>
                )}
                
                <Button 
                  onClick={checkMigrationStatus}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Verifica Stato
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Opzioni Avanzate
              {showAdvanced ? '▲' : '▼'}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Backup Dati Legacy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Ripristina Backup
                  </Button>
                  <Button variant="outline" size="sm">
                    <Info className="w-4 h-4 mr-2" />
                    Log Dettagliati
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationManager;
// components/StatsManager.js - Versione Sincronizzata
import React, { useState, useRef, useEffect } from 'react';
import { useStats } from '../hooks/useStats';
import './StatsManager.css';

/**
 * ⭐ VERSIONE MIGLIORATA: Gestione completa con sincronizzazione automatica
 * - Import/Export unificato di statistiche + cronologia
 * - Cancellazione sincronizzata
 * - Aggiornamento UI automatico
 * - Gestione errori robusta
 */
const StatsManager = ({ onDataUpdated, forceUpdate }) => {
  const { 
    stats, 
    testHistory,
    calculatedStats, 
    exportStats, 
    importStats, 
    resetStats, 
    clearHistoryOnly,
    forceMigration, 
    isMigrated,
    refreshData,
    isProcessing
  } = useStats();

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  // ⭐ NUOVO: Effetto per aggiornare l'UI quando cambiano i dati
  useEffect(() => {
    if (onDataUpdated) {
      onDataUpdated();
    }
  }, [stats.testsCompleted, testHistory.length, forceUpdate, onDataUpdated]);

  // ⭐ MIGLIORATO: Export con feedback visivo
  const handleExport = async () => {
    if (isExporting || isProcessing) return;
    
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay per UI feedback
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

  // ⭐ MIGLIORATO: Import con sincronizzazione automatica
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Per favore seleziona un file JSON valido');
      return;
    }

    if (isImporting || isProcessing) {
      alert('Operazione già in corso, attendere...');
      return;
    }

    setIsImporting(true);
    
    try {
      console.log('🔄 Inizio importazione file:', file.name);
      
      // Importa i dati
      const result = await importStats(file);
      
      console.log('✅ Importazione completata:', result);
      
      // ⭐ SINCRONIZZAZIONE AUTOMATICA: Refresh multipli per garantire aggiornamento UI
      setTimeout(() => {
        refreshData();
        if (onDataUpdated) onDataUpdated();
        
        // Secondo refresh per sicurezza
        setTimeout(() => {
          refreshData();
          if (onDataUpdated) onDataUpdated();
        }, 300);
      }, 200);
      
    } catch (error) {
      console.error('❌ Errore importazione:', error);
      alert(`Errore durante l'importazione: ${error.message}`);
    } finally {
      setIsImporting(false);
      // Reset input per permettere di selezionare lo stesso file
      event.target.value = '';
    }
  };

  // ⭐ MIGLIORATO: Migrazione forzata con refresh
  const handleForceMigration = async () => {
    if (isProcessing) {
      alert('Operazione già in corso, attendere...');
      return;
    }

    try {
      console.log('🔄 Inizio migrazione forzata...');
      await forceMigration();
      
      // ⭐ REFRESH AUTOMATICO
      setTimeout(() => {
        refreshData();
        if (onDataUpdated) onDataUpdated();
      }, 300);
      
    } catch (error) {
      console.error('❌ Errore migrazione:', error);
      alert(`Errore durante la migrazione: ${error.message}`);
    }
  };

  // ⭐ MIGLIORATO: Reset completo con conferma avanzata
  const handleReset = async () => {
    if (isProcessing) {
      alert('Operazione già in corso, attendere...');
      return;
    }

    const confirmation = window.confirm(
      `⚠️ ATTENZIONE: Conferma cancellazione completa\n\n` +
      `Verranno cancellati:\n` +
      `• ${stats.testsCompleted} test dalle statistiche\n` +
      `• ${testHistory.length} test dalla cronologia\n` +
      `• Tutti i progressi e dati di apprendimento\n\n` +
      `Questa operazione è IRREVERSIBILE.\n\n` +
      `Sei assolutamente sicuro di voler procedere?`
    );

    if (!confirmation) return;

    // Doppia conferma per sicurezza
    const doubleConfirmation = window.confirm(
      '🚨 ULTIMA CONFERMA\n\n' +
      'Stai per ELIMINARE DEFINITIVAMENTE tutti i tuoi dati.\n' +
      'Non sarà possibile recuperarli.\n\n' +
      'Procedi con la cancellazione completa?'
    );

    if (!doubleConfirmation) return;

    try {
      console.log('🗑️ Inizio reset completo...');
      await resetStats();
      
      // ⭐ REFRESH AUTOMATICO
      setTimeout(() => {
        refreshData();
        if (onDataUpdated) onDataUpdated();
      }, 200);
      
    } catch (error) {
      console.error('❌ Errore reset:', error);
      alert(`Errore durante il reset: ${error.message}`);
    }
  };

  // ⭐ NUOVO: Cancella solo cronologia
  const handleClearHistoryOnly = async () => {
    if (isProcessing) {
      alert('Operazione già in corso, attendere...');
      return;
    }

    const confirmation = window.confirm(
      `Vuoi cancellare solo la cronologia dei test?\n\n` +
      `Verranno cancellati ${testHistory.length} test dalla cronologia.\n` +
      `Le statistiche rimarranno invariate.\n\n` +
      `Continuare?`
    );

    if (!confirmation) return;

    try {
      console.log('🗑️ Cancellazione cronologia...');
      await clearHistoryOnly();
      
      // ⭐ REFRESH AUTOMATICO
      setTimeout(() => {
        refreshData();
        if (onDataUpdated) onDataUpdated();
      }, 200);
      
    } catch (error) {
      console.error('❌ Errore cancellazione cronologia:', error);
      alert(`Errore durante la cancellazione: ${error.message}`);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  return (
    <div className="stats-manager">
      <div className="stats-manager__header">
        <h2>📊 Gestione Statistiche Centralizzata</h2>
        <p>Esporta, importa o gestisci le tue statistiche e cronologia in modo sincronizzato</p>
        {isProcessing && (
          <div className="processing-indicator" style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem',
            color: '#1976d2'
          }}>
            ⏳ <strong>Operazione in corso...</strong> Attendere il completamento.
          </div>
        )}
      </div>

      {/* ⭐ AGGIORNATO: Riepilogo con dati real-time */}
      <div className="stats-summary">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.testsCompleted}</h3>
              <p>Test Statistiche</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{testHistory.length}</h3>
              <p>Test Cronologia</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{calculatedStats.accuracyRate}%</h3>
              <p>Precisione Media</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>{stats.streakDays}</h3>
              <p>Giorni Streak</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{formatTime(stats.timeSpent)}</h3>
              <p>Tempo Totale</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{isMigrated ? 'Sync' : 'No'}</h3>
              <p>Stato Sincr.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ AGGIORNATO: Dettagli con stato sincronizzazione */}
      <div className="stats-details">
        <div className="detail-section">
          <h4>📚 Vocabolario</h4>
          <p>Parole totali: <strong>{stats.totalWords}</strong></p>
          <p>Risposte corrette: <strong>{stats.correctAnswers}</strong></p>
          <p>Risposte sbagliate: <strong>{stats.incorrectAnswers}</strong></p>
        </div>

        <div className="detail-section">
          <h4>📅 Attività</h4>
          <p>Ultimo studio: <strong>{formatDate(stats.lastStudyDate)}</strong></p>
          <p>Tempo medio per test: <strong>{calculatedStats.avgTimePerTest}m</strong></p>
          <p>Attivo oggi: <strong>{calculatedStats.isActiveToday ? '✅ Sì' : '❌ No'}</strong></p>
        </div>

        <div className="detail-section">
          <h4>🔄 Sincronizzazione</h4>
          <p>Statistiche: <strong>{stats.testsCompleted} test</strong></p>
          <p>Cronologia: <strong>{testHistory.length} test</strong></p>
          <p>Stato: <strong>{isMigrated ? '✅ Sincronizzato' : '⏳ In attesa'}</strong></p>
          <p>Processing: <strong>{isProcessing ? '🔄 Attivo' : '✅ Pronto'}</strong></p>
        </div>

        {Object.keys(stats.categoriesProgress).length > 0 && (
          <div className="detail-section">
            <h4>🏷️ Progresso per Categoria</h4>
            {Object.entries(stats.categoriesProgress).map(([category, progress]) => (
              <div key={category} className="category-progress">
                <span className="category-name">{category}</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${progress.total > 0 ? (progress.correct / progress.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {progress.correct}/{progress.total} ({progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⭐ MIGLIORATO: Azioni con stato sincronizzazione */}
      <div className="stats-actions">
        <div className="action-section">
          <h3>💾 Backup Completo Sincronizzato</h3>
          <p>Esporta o importa TUTTO in modo sincronizzato: statistiche + cronologia completa</p>
          
          <div className="action-buttons">
            <button 
              className={`btn btn-primary ${isExporting || isProcessing ? 'loading' : ''}`}
              onClick={handleExport}
              disabled={isExporting || isProcessing}
              title="Scarica backup completo: statistiche + cronologia"
            >
              {isExporting ? '⏳ Esportando...' : '📥 Esporta Backup Completo'}
            </button>
            
            <button 
              className={`btn btn-secondary ${isImporting || isProcessing ? 'loading' : ''}`}
              onClick={handleImportClick}
              disabled={isImporting || isProcessing}
              title="Carica backup completo con sincronizzazione automatica"
            >
              {isImporting ? '⏳ Importando...' : '📤 Importa Backup'}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="format-content" style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#e8f5e8', 
            borderRadius: '8px' 
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d5d2d' }}>
              💡 <strong>Backup v2.0 Sincronizzato:</strong> Include {stats.testsCompleted} statistiche + {testHistory.length} cronologia
              {!isMigrated && <span style={{ color: '#d32f2f' }}> (⚠️ Non sincronizzato)</span>}
            </p>
          </div>
        </div>

        {/* ⭐ NUOVO: Sezione Sincronizzazione Avanzata */}
        <div className="action-section">
          <h3>🔄 Sincronizzazione Dati</h3>
          <p>Gestisci la sincronizzazione tra statistiche e cronologia test</p>
          
          <div className="action-buttons">
            <button 
              className={`btn btn-secondary ${isProcessing ? 'loading' : ''}`}
              onClick={handleForceMigration}
              disabled={isProcessing}
              title="Ri-sincronizza i dati dalla cronologia test esistente"
            >
              {isProcessing ? '⏳ Migrando...' : '🔄 Forza Sincronizzazione'}
            </button>
            
            <button 
              className={`btn btn-secondary ${isProcessing ? 'loading' : ''}`}
              onClick={() => {
                refreshData();
                if (onDataUpdated) onDataUpdated();
              }}
              disabled={isProcessing}
              title="Aggiorna manualmente l'interfaccia"
            >
              🔃 Refresh Interface
            </button>
          </div>
          
          <div className="format-content" style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: isMigrated ? '#e8f5e8' : '#fff3e0', 
            borderRadius: '8px' 
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: isMigrated ? '#2d5d2d' : '#e65100' }}>
              {isMigrated 
                ? '✅ Dati sincronizzati correttamente' 
                : '⚠️ Sincronizzazione richiesta - usa "Forza Sincronizzazione"'
              }
            </p>
          </div>
        </div>

        {/* ⭐ MIGLIORATO: Cancellazioni con opzioni separate */}
        <div className="action-section danger-zone">
          <h3>⚠️ Zona Pericolosa</h3>
          <p>Attenzione: queste azioni sono irreversibili</p>
          
          <div className="action-buttons">
            <button 
              className={`btn btn-danger ${isProcessing ? 'loading' : ''}`}
              onClick={handleClearHistoryOnly}
              disabled={isProcessing}
              title="Cancella solo la cronologia (mantiene statistiche)"
            >
              {isProcessing ? '⏳ Cancellando...' : '🗑️ Cancella Solo Cronologia'}
            </button>
            
            <button 
              className={`btn btn-danger ${isProcessing ? 'loading' : ''}`}
              onClick={handleReset}
              disabled={isProcessing}
              title="Cancella tutto: statistiche + cronologia (irreversibile)"
            >
              {isProcessing ? '⏳ Resettando...' : '🗑️ Reset Completo'}
            </button>
          </div>
          
          <div className="format-content" style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#ffebee', 
            borderRadius: '8px',
            border: '1px solid #f44336'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#c62828' }}>
              ⚠️ <strong>Attenzione:</strong> Le operazioni di cancellazione sono permanenti e non possono essere annullate.
              Assicurati di aver fatto un backup prima di procedere.
            </p>
          </div>
        </div>
      </div>

      {/* ⭐ AGGIORNATO: Informazioni sul formato con stato sincronizzazione */}
      <div className="format-info">
        <details>
          <summary>ℹ️ Informazioni sul Sistema Sincronizzato</summary>
          <div className="format-content">
            <p><strong>🎯 Sistema Unificato v2.0 - Sincronizzazione Automatica</strong></p>
            <p>Il sistema gestisce automaticamente:</p>
            <ul>
              <li>📊 <strong>Statistiche Avanzate:</strong> Precisione, streak, tempo, categorie ({stats.testsCompleted} test)</li>
              <li>📅 <strong>Cronologia Completa:</strong> Tutti i test con dettagli ({testHistory.length} test)</li>
              <li>🔄 <strong>Sincronizzazione:</strong> Aggiornamento automatico dell'interfaccia</li>
              <li>⚡ <strong>Performance:</strong> Operazioni ottimizzate e feedback in tempo reale</li>
              <li>🛡️ <strong>Sicurezza:</strong> Validazione dati e conferme multiple</li>
            </ul>
            
            <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>🔄 Stato Sincronizzazione Attuale:</strong><br/>
                ✅ Statistiche: {stats.testsCompleted} test<br/>
                ✅ Cronologia: {testHistory.length} test<br/>
                {isMigrated ? '✅ Sincronizzato' : '⚠️ Richiede sincronizzazione'}<br/>
                {isProcessing ? '🔄 Operazione in corso...' : '✅ Sistema pronto'}
              </p>
            </div>
            
            <div style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>🛡️ Sicurezza e Backup:</strong><br/>
                • Tutti i dati vengono validati durante import/export<br/>
                • Conferme multiple per operazioni distruttive<br/>
                • Backup automatico prima di operazioni critiche<br/>
                • Possibilità di combinare o sostituire dati esistenti
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default StatsManager;
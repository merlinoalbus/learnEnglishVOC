// components/StatsManager.js
import React, { useState, useRef } from 'react';
import { useStats } from '../hooks/useStats';
import { useLocalStorage } from '../hooks/useLocalStorage'; // ⭐ NUOVO per accesso cronologia
import './StatsManager.css';

/**
 * Componente per gestire export/import/reset delle statistiche
 * ⭐ AGGIORNATO: Ora gestisce la sincronizzazione automatica via refreshData
 */
const StatsManager = () => {
  const { 
    stats, 
    calculatedStats, 
    exportStats, 
    importStats, 
    resetStats, 
    forceMigration, 
    isMigrated,
    refreshData // ⭐ NUOVO: Funzione per refresh automatico
  } = useStats();
  const [testHistory] = useLocalStorage('testHistory', []); // ⭐ NUOVO accesso cronologia
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    exportStats();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
      // ⭐ NUOVO: Il refresh è già gestito automaticamente nel hook
      console.log('✅ Import completato, dati sincronizzati');
    } catch (error) {
      console.error('Errore nell\'importazione:', error);
    } finally {
      setIsImporting(false);
      // Reset input per permettere di selezionare lo stesso file
      event.target.value = '';
    }
  };

  const handleForceMigration = () => {
    forceMigration();
    // ⭐ MIGLIORATO: Refresh multipli per essere sicuri
    setTimeout(() => {
      refreshData();
    }, 200);
    setTimeout(() => {
      refreshData();
    }, 500);
  };

  const handleReset = () => {
    resetStats();
    // ⭐ NUOVO: Refresh anche dopo reset
    setTimeout(() => {
      refreshData();
    }, 200);
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
        <h2>📊 Gestione Statistiche</h2>
        <p>Esporta, importa o gestisci le tue statistiche di apprendimento</p>
      </div>

      {/* Riepilogo Statistiche */}
      <div className="stats-summary">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.testsCompleted}</h3>
              <p>Test Completati</p>
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
              <p>Giorni Consecutivi</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{formatTime(stats.timeSpent)}</h3>
              <p>Tempo Totale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dettagli Aggiuntivi */}
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

        {/* ⭐ NUOVA SEZIONE: Info Cronologia */}
        <div className="detail-section">
          <h4>📊 Cronologia & Backup</h4>
          <p>Test nella cronologia: <strong>{testHistory.length}</strong></p>
          <p>Test nelle statistiche: <strong>{stats.testsCompleted}</strong></p>
          <p>Stato migrazione: <strong>{isMigrated ? '✅ Sincronizzato' : '⏳ In attesa'}</strong></p>
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

      {/* Azioni di Gestione */}
      <div className="stats-actions">
        <div className="action-section">
          <h3>💾 Backup Completo</h3>
          <p>Esporta o importa TUTTO: statistiche + cronologia test completa</p>
          
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={handleExport}
              title="Scarica backup completo: statistiche + cronologia"
            >
              📥 Esporta Backup Completo
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleImportClick}
              disabled={isImporting}
              title="Carica backup completo o solo statistiche"
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
          
          <div className="format-content" style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d5d2d' }}>
              💡 <strong>Backup v2.0:</strong> Include {stats.testsCompleted} statistiche avanzate + {testHistory.length} test cronologia
            </p>
          </div>
        </div>

        {/* ⭐ NUOVA SEZIONE: Migrazione Dati */}
        <div className="action-section">
          <h3>🔄 Migrazione Dati</h3>
          <p>Sincronizza le statistiche con la cronologia test esistente</p>
          
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={handleForceMigration}
              title="Ri-migra i dati dalla cronologia test esistente"
            >
              🔄 Aggiorna da Cronologia
            </button>
          </div>
          
          <div className="format-content" style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c7b7d' }}>
              {isMigrated 
                ? '✅ Dati già migrati dalla cronologia esistente' 
                : '⏳ Migrazione automatica in corso...'
              }
            </p>
          </div>
        </div>

        <div className="action-section danger-zone">
          <h3>⚠️ Zona Pericolosa</h3>
          <p>Attenzione: queste azioni non possono essere annullate</p>
          
          <button 
            className="btn btn-danger"
            onClick={handleReset}
            title="Cancella tutte le statistiche (irreversibile)"
          >
            🗑️ Reset Statistiche
          </button>
        </div>
      </div>

      {/* Informazioni sul Formato */}
      <div className="format-info">
        <details>
          <summary>ℹ️ Informazioni sul Backup Completo</summary>
          <div className="format-content">
            <p><strong>🎯 Backup v2.0 - Sistema Unificato</strong></p>
            <p>Il backup completo include:</p>
            <ul>
              <li>📊 <strong>Statistiche Avanzate:</strong> Precisione, streak, tempo, categorie</li>
              <li>📅 <strong>Cronologia Test:</strong> Tutti i test con dettagli completi</li>
              <li>🏷️ <strong>Progresso Categorie:</strong> Performance per capitolo</li>
              <li>⚡ <strong>Difficoltà e Metadata:</strong> Analisi approfondite</li>
              <li>📈 <strong>Andamenti Temporali:</strong> Progresso giornaliero e mensile</li>
            </ul>
            <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>🔄 Compatibilità:</strong><br/>
                ✅ Backup v2.0: Cronologia + Statistiche (completo)<br/>
                ✅ Backup v1.0: Solo statistiche (parziale)<br/>
                ✅ Combina automaticamente dati esistenti<br/>
                ✅ Migrazione sicura senza perdite di dati
              </p>
            </div>
            <p style={{ marginTop: '1rem' }}>
              <strong>🛡️ Sicurezza:</strong> Tutti i dati vengono validati durante l'importazione. 
              Puoi sempre scegliere se sostituire o combinare con i dati esistenti.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default StatsManager;
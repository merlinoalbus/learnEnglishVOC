// =====================================================
// 📁 src/contexts/AppContext.js - CONTEXT PRINCIPALE DELL'APPLICAZIONE
// =====================================================
// 🎯 SCOPO: Context centrale che combina e orchestră tutti gli hook specializzati.
//          Fornisce un'API unificata per accedere a stato globale e funzioni.
//          Segue il pattern "Compound Hook" per aggregare logica complessa.

import React, { createContext, useContext, useReducer, useEffect } from "react";

// 🪝 IMPORT CUSTOM HOOKS SPECIALIZZATI
// Ogni hook gestisce un dominio specifico dell'applicazione
import { useOptimizedWords } from "../hooks/data/useWords"; // 📚 Gestione vocabolario
import { useOptimizedTest } from "../hooks/data/useTest"; // 🎯 Logica quiz e test
import { useEnhancedStats } from "../hooks/data/useStats"; // 📊 Statistiche e cronologia

// =====================================================
// 🏗️ SETUP CONTEXT REACT
// =====================================================

// 🌐 CREAZIONE CONTEXT
// createContext() crea un "canale di comunicazione" che attraversa l'albero React
// senza passare props manualmente attraverso ogni livello (prop drilling)
const AppContext = createContext();

// =====================================================
// 🔄 STATO UI E REDUCER PER INTERFACCIA UTENTE
// =====================================================

// 📊 STATO INIZIALE UI
// Contiene solo stato dell'interfaccia utente, NON i dati business
// I dati business (parole, test, stats) sono gestiti dagli hook specializzati
const initialState = {
  currentView: "main", // 🧭 Vista corrente: 'main' | 'stats'
  showWordsList: true, // 👁️ Se mostrare lista parole nella MainView
  editingWord: null, // ✏️ Parola in modifica (null = nessuna modifica)
  showChapterSelector: false, // 📋 Se mostrare modal selezione capitoli per test
  confirmDelete: null, // 🗑️ Parola in attesa di conferma eliminazione (null = nessuna)
  showConfirmClear: false, // ⚠️ Se mostrare modal conferma pulizia dati
};

// 🔄 REDUCER PER GESTIONE STATO UI
// Reducer pattern: stato è immutabile, cambi solo tramite azioni predefinite
// Garantisce prevedibilità e facilita debugging
const appReducer = (state, action) => {
  switch (action.type) {
    // 🧭 CAMBIO VISTA PRINCIPALE
    case "SET_VIEW":
      // Cambia la vista corrente (main ↔ stats)
      return { ...state, currentView: action.payload };

    // 👁️ TOGGLE VISIBILITÀ LISTA PAROLE
    case "TOGGLE_WORDS_LIST":
      // Mostra/nasconde la lista parole nella MainView
      return { ...state, showWordsList: !state.showWordsList };

    // ✏️ IMPOSTA PAROLA IN MODIFICA
    case "SET_EDITING_WORD":
      // null = nuova parola, oggetto = modifica parola esistente
      return { ...state, editingWord: action.payload };

    // 📋 MOSTRA/NASCONDI SELETTORE CAPITOLI
    case "SET_SHOW_CHAPTER_SELECTOR":
      // Modal per scegliere capitoli prima di iniziare test
      return { ...state, showChapterSelector: action.payload };

    // 🗑️ IMPOSTA CONFERMA ELIMINAZIONE
    case "SET_CONFIRM_DELETE":
      // Oggetto parola da eliminare, null = annulla
      return { ...state, confirmDelete: action.payload };

    // ⚠️ MOSTRA CONFERMA PULIZIA DATI
    case "SET_SHOW_CONFIRM_CLEAR":
      // true = mostra modal conferma, false = nascondi
      return { ...state, showConfirmClear: action.payload };

    // 🔄 RESET TUTTI I MODAL
    case "RESET_MODALS":
      // Chiude tutti i modal aperti (cleanup generale)
      return {
        ...state,
        confirmDelete: null,
        showConfirmClear: false,
        showChapterSelector: false,
      };

    default:
      // ⚠️ AZIONE NON RICONOSCIUTA: ritorna stato immutato
      return state;
  }
};

// =====================================================
// 🏭 APP PROVIDER COMPONENT
// =====================================================
// 🎯 RESPONSABILITÀ:
// 1. Combinare 3 hook specializzati in un'API unificata
// 2. Gestire sincronizzazione tra hook diversi
// 3. Fornire stato e funzioni a tutti i componenti figli
// 4. Ottimizzare re-render tramite memoization

export const AppProvider = ({ children }) => {
  // 🔄 STATO UI LOCALE
  // useReducer per stato UI complesso con logica di transizione
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 🪝 INIZIALIZZAZIONE HOOK SPECIALIZZATI
  // Ogni hook gestisce un dominio specifico e fornisce API specializzata

  // 📚 WORDS API: Gestione completa vocabolario
  // RESPONSABILITÀ: CRUD parole, import/export, categorizzazione, filtri
  const wordsAPI = useOptimizedWords();

  // 📊 STATS API: Statistiche e cronologia
  // RESPONSABILITÀ: Salvataggio risultati, metriche, export/import dati
  const statsAPI = useEnhancedStats();
  // 🎯 TEST API: Logica quiz interattivi
  // RESPONSABILITÀ: Gestione test, timer, hint, risultati
  // ⭐ CALLBACK CRITICO: Quando test termina, salva risultati nelle statistiche

  const testAPI = useOptimizedTest((testStats, testWords, wrongWords) => {
    // 🔗 BRIDGE PATTERN: Collega test API con stats API
    // Quando un test finisce, testAPI chiama questa callback che
    // automaticamente salva i risultati nelle statistiche permanenti
    statsAPI.handleTestComplete(testStats, testWords, wrongWords);
  });

  // =====================================================
  // 🔄 EFFETTI COLLATERALI E SINCRONIZZAZIONE
  // =====================================================

  // 🔗 SINCRONIZZAZIONE EDITING WORD
  // SCOPO: Sincronizza stato UI globale con stato interno del wordsAPI
  // QUANDO: Ogni volta che state.editingWord cambia nel reducer
  useEffect(() => {
    // Propaga cambiamento di editing word all'hook specializzato
    // Questo permette a wordsAPI di gestire la logica di editing internamente
    wordsAPI.setEditingWord(state.editingWord);
  }, [state.editingWord, wordsAPI]); // 📌 Dipendenze: re-esegui solo se cambiano

  // =====================================================
  // 🎁 VALORE CONTEXT - API UNIFICATA
  // =====================================================
  // 🎯 SCOPO: Aggregare tutti gli hook in un'unica API coerente
  //          Fornire interfaccia semplificata ai componenti consumer

  const value = {
    // =====================================================
    // 🖼️ STATO UI E DISPATCH
    // =====================================================
    // Spread dell'intero stato UI per accesso diretto alle proprietà
    ...state, // currentView, showWordsList, editingWord, etc.
    dispatch, // Funzione per inviare azioni al reducer

    // =====================================================
    // 📚 WORDS API - GESTIONE VOCABOLARIO
    // =====================================================
    // ⭐ ENHANCED: Include toggle parole difficili e force refresh
    words: wordsAPI.words, // 📚 Array di tutte le parole
    addWord: wordsAPI.addWord, // ➕ Aggiungi nuova parola
    removeWord: wordsAPI.removeWord, // ❌ Elimina parola esistente
    toggleWordLearned: wordsAPI.toggleWordLearned, // ✅ Toggle stato appreso/non appreso
    toggleWordDifficult: wordsAPI.toggleWordDifficult, // ⚠️ Toggle parola difficile
    clearAllWords: wordsAPI.clearAllWords, // 🗑️ Elimina tutte le parole
    importWords: wordsAPI.importWords, // 📥 Importa parole da JSON
    forceRefresh: wordsAPI.forceRefresh, // 🔄 Forza ricaricamento dati
    getAvailableChapters: wordsAPI.getAvailableChapters, // 📋 Lista capitoli disponibili
    getChapterStats: wordsAPI.getChapterStats, // 📊 Statistiche per capitolo
    wordStats: wordsAPI.wordStats, // 📈 Statistiche generali parole

    // =====================================================
    // 🎯 TEST API - GESTIONE QUIZ
    // =====================================================
    // ⭐ ENHANCED: Include timer e sistema hint
    ...testAPI, // Spread completo: currentWord, testMode, showResults,
    // stats, wrongWords, startTest, handleAnswer, etc.

    // =====================================================
    // 📊 STATS API - STATISTICHE E CRONOLOGIA
    // =====================================================
    // ⭐ FIXED: Mapping corretto alle funzioni useEnhancedStats

    // 📊 DATI STATISTICHE
    stats: statsAPI.stats, // 📈 Statistiche generali
    testHistory: statsAPI.testHistory, // 📚 Cronologia test completati
    wordPerformance: statsAPI.wordPerformance, // 🎯 Performance per singola parola
    calculatedStats: statsAPI.calculatedStats, // 🧮 Statistiche calcolate

    // 🔧 FUNZIONI CORE CORRETTAMENTE MAPPATE
    refreshData: statsAPI.refreshData, // 🔄 Ricarica tutti i dati
    resetStats: statsAPI.resetStats, // ✅ Resetta tutto (mapped to resetStats)
    exportStats: statsAPI.exportData, // ✅ Esporta dati (mapped to exportData)
    importStats: statsAPI.importData, // ✅ Importa dati (mapped to importData)

    // 🔄 FUNZIONI AGGIUNTIVE STATS
    handleTestComplete: statsAPI.handleTestComplete, // 💾 Gestisce completamento test
    clearHistoryOnly: statsAPI.clearHistoryOnly, // ✅ Pulisci solo cronologia test
    addTestToHistory: statsAPI.addTestToHistory, // ➕ Aggiungi test a cronologia

    // ⭐ CRITICAL: FUNZIONI PERFORMANCE PAROLE ESPOSTE
    getAllWordsPerformance: statsAPI.getAllWordsPerformance, // 📊 Performance tutte parole
    getWordAnalysis: statsAPI.getWordAnalysis, // 🔍 Analisi dettagliata parola
    recordWordPerformance: statsAPI.recordWordPerformance, // 📝 Registra nuova performance

    // =====================================================
    // 🔄 STATI DI LOADING E PROCESSING
    // =====================================================
    // ⭐ NEW: Stati per UI responsive durante operazioni pesanti
    isProcessing: statsAPI.isLoading || statsAPI.isProcessing || false, // 🔄 Operazione in corso
    isInitialized: statsAPI.isInitialized, // ✅ Dati inizializzati

    // =====================================================
    // 📊 STATISTICHE COMPUTATE ENHANCED
    // =====================================================
    // ⭐ NEW: Metriche avanzate calcolate automaticamente
    totalTests: statsAPI.totalTests || 0, // 🔢 Numero totale test
    totalAnswers: statsAPI.totalAnswers || 0, // 🔢 Numero totale risposte
    accuracyRate: statsAPI.accuracyRate || 0, // 🎯 Percentuale accuratezza
    hintsRate: statsAPI.hintsRate || 0, // 💡 Percentuale uso hint
    weeklyProgress: statsAPI.weeklyProgress || [], // 📅 Progresso settimanale
    isMigrated: statsAPI.isMigrated || false, // 🔄 Stato migrazione dati
  };

  // =====================================================
  // 🎁 PROVIDER RENDER
  // =====================================================
  // Context.Provider rende il value disponibile a tutti i componenti figli
  // che usano useAppContext() hook
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// =====================================================
// 🪝 CUSTOM HOOK PER CONSUMARE CONTEXT
// =====================================================
// 🎯 SCOPO: Hook personalizzato per accedere al context con error checking
//          Garantisce che il context sia usato solo dentro AppProvider

export const useAppContext = () => {
  // 🔍 OTTIENI CONTEXT VALUE
  const context = useContext(AppContext);

  // ⚠️ ERROR HANDLING: Verifica che hook sia usato correttamente
  if (!context) {
    // 💥 ERRORE CRITICO: Hook usato fuori da Provider
    // Questo previene bug sottili e fornisce messaggio di errore chiaro
    throw new Error("useAppContext must be used within AppProvider");
  }

  // ✅ RETURN CONTEXT: Tutto ok, restituisci API completa
  return context;
};

// =====================================================
// 📋 NOTE ARCHITETTURALI AVANZATE
// =====================================================

// 🤔 PERCHÉ QUESTO PATTERN?
// 1. SEPARATION OF CONCERNS: Ogni hook gestisce un dominio specifico
// 2. REUSABILITY: Hook possono essere testati e riutilizzati indipendentemente
// 3. COMPOSITION: AppContext combina hook senza accoppiarli strettamente
// 4. SINGLE SOURCE OF TRUTH: Un solo punto di accesso per stato globale

// 🔧 OTTIMIZZAZIONI IMPLEMENTATE:
// 1. useReducer per stato UI complesso evita useState multipli
// 2. Callback nel testAPI evita dipendenze circolari tra hook
// 3. Spread operator per API pulita senza wrapper functions
// 4. Memoization negli hook figli previene re-render non necessari

// ⚠️ CONSIDERAZIONI PERFORMANCE:
// - Context re-render tutti i consumer quando value cambia
// - Hook interni hanno ottimizzazioni per minimizzare updates
// - useMemo/useCallback negli hook figli prevengono re-computazioni

// 🔮 FUTURE ENHANCEMENTS:
// - Split context per domini diversi se performance diventa issue
// - Middleware per logging automatico delle azioni
// - Time-travel debugging per stato UI
// - Persistenza automatica stato UI in sessionStorage

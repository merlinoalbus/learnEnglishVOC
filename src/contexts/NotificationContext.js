// =====================================================
// 📁 src/contexts/NotificationContext.js - SISTEMA NOTIFICHE GLOBALI
// =====================================================
// 🎯 SCOPO: Context specializzato per gestire notifiche toast in tutta l'app.
//          Fornisce API semplice per mostrare messaggi di successo, errore, warning.
//          Gestisce automaticamente timing, stacking e cleanup delle notifiche.

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// =====================================================
// 🏗️ SETUP CONTEXT REACT
// =====================================================

// 🌐 CREAZIONE CONTEXT NOTIFICHE
// Context dedicato esclusivamente alla gestione delle notifiche
// Separato da AppContext per evitare re-render non necessari
const NotificationContext = createContext();

// =====================================================
// 🔄 REDUCER PER GESTIONE STATO NOTIFICHE
// =====================================================

// 🎯 REDUCER PATTERN: Gestione stato notifiche immutabile
// VANTAGGI: Prevedibilità, debugging, time-travel, performance
const notificationReducer = (state, action) => {
  switch (action.type) {
    // ➕ AGGIUNGI NUOVA NOTIFICA
    case "ADD_NOTIFICATION":
      // LOGICA: Aggiungi nuova notifica alla fine dell'array
      // IMMUTABILITÀ: Crea nuovo array invece di mutare esistente
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    // ❌ RIMUOVI NOTIFICA SPECIFICA
    case "REMOVE_NOTIFICATION":
      // LOGICA: Filtra array rimuovendo notifica con ID specifico
      // AUTO-DISMISS: Chiamata dopo timeout automatico
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    // 🗑️ PULISCI TUTTE LE NOTIFICHE
    case "CLEAR_ALL":
      // LOGICA: Reset completo array notifiche
      // USO: Cleanup generale o azione utente esplicita
      return { ...state, notifications: [] };

    default:
      // ⚠️ AZIONE NON RICONOSCIUTA: Ritorna stato immutato
      return state;
  }
};

// =====================================================
// 🧠 MAPPING ERRORI USER-FRIENDLY
// =====================================================

// 🎯 FUNZIONE: Converte errori tecnici in messaggi comprensibili
// SCOPO: Migliorare UX nascondendo dettagli tecnici all'utente
// PATTERN: Error mapping con fallback generico
const getUserFriendlyError = (errorMessage, context) => {
  // 📚 DIZIONARIO ERRORI: Mapping errore tecnico → messaggio utente
  const errorMap = {
    JSON: "❌ File JSON non valido", // Errori parsing JSON
    localStorage: "❌ Errore salvataggio dati", // Errori storage browser
    Network: "❌ Errore di connessione", // Errori rete/API
    "Word already exists": "⚠️ Parola già esistente", // Duplicati vocabolario
    "English word and Italian translation are required":
      "⚠️ Campi obbligatori mancanti", // Validazione form
    "All words already exist": "⚠️ Tutte le parole sono già presenti", // Import senza novità
  };

  // 🔍 RICERCA PATTERN: Cerca corrispondenza nel messaggio di errore
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return message; // ✅ TROVATO: Restituisci messaggio user-friendly
    }
  }

  // 🔄 FALLBACK: Se nessun pattern trovato, mostra errore generico
  return `❌ Errore ${context}: ${errorMessage}`;
};

// =====================================================
// 🏭 NOTIFICATION PROVIDER COMPONENT
// =====================================================
// 🎯 RESPONSABILITÀ:
// 1. Gestire stato globale delle notifiche attive
// 2. Fornire API semplice per tutti i tipi di notifica
// 3. Gestire auto-dismiss con timeout personalizzabili
// 4. Convertire errori tecnici in messaggi user-friendly

export const NotificationProvider = ({ children }) => {
  // 🔄 STATO LOCALE CON REDUCER
  // STRUTTURA: { notifications: Array<{id, message, type, timestamp}> }
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [], // 📚 Array vuoto iniziale
  });

  // =====================================================
  // 🔧 FUNZIONE CORE: MOSTRA NOTIFICA GENERICA
  // =====================================================

  // 🎯 FUNZIONE PRINCIPALE per creare qualsiasi tipo di notifica
  // useCallback: Memorizza funzione per evitare re-render figli non necessari
  const showNotification = useCallback(
    (message, type = "success", duration = 3000) => {
      // 🆔 GENERAZIONE ID UNICO
      // Combina timestamp + random per garantire unicità
      // NECESSARIO: Per identificare notifica specifica durante rimozione
      const id = Date.now() + Math.random();

      // 📦 CREAZIONE OGGETTO NOTIFICA
      const notificationObject = {
        id, // 🆔 Identificatore unico
        message, // 📝 Testo da mostrare all'utente
        type, // 🎨 Tipo: 'success' | 'error' | 'warning' | 'info'
        timestamp: Date.now(), // 🕒 Momento creazione (per debugging/analytics)
      };

      // 📤 DISPATCH: Aggiungi notifica allo stato
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notificationObject,
      });

      // ⏰ AUTO-DISMISS: Rimuovi automaticamente dopo timeout
      setTimeout(() => {
        dispatch({
          type: "REMOVE_NOTIFICATION",
          payload: id, // 🎯 Rimuovi questa specifica notifica
        });
      }, duration);

      // 🔄 RETURN ID: Permette rimozione manuale se necessario
      return id;
    },
    []
  ); // 📌 DIPENDENZE VUOTE: Funzione stabile, non cambia mai

  // =====================================================
  // 🔴 FUNZIONE SPECIALIZZATA: MOSTRA ERRORE
  // =====================================================

  // 🎯 WRAPPER per errori con processing automatico
  // FEATURE: Converte errori tecnici in messaggi user-friendly
  const showError = useCallback(
    (error, context = "") => {
      // 🔍 DEBUG LOGGING: Log errore completo per sviluppatori
      console.error(`❌ Error in ${context}:`, error);

      // 📝 ESTRAZIONE MESSAGGIO: Gestisce diversi tipi di errore
      const errorMessage = error.message || error.toString();

      // 🔄 CONVERSIONE USER-FRIENDLY: Usa mapping function
      const userFriendlyMessage = getUserFriendlyError(errorMessage, context);

      // 📤 MOSTRA NOTIFICA: Timeout più lungo per errori (5s vs 3s default)
      return showNotification(userFriendlyMessage, "error", 5000);
    },
    [showNotification]
  ); // 📌 DIPENDENZA: Re-crea solo se showNotification cambia

  // =====================================================
  // 🟢 FUNZIONE SPECIALIZZATA: MOSTRA SUCCESSO
  // =====================================================

  // 🎯 WRAPPER per messaggi di successo
  // USO: Operazioni completate con successo (salvataggio, import, etc.)
  const showSuccess = useCallback(
    (message) => {
      // 📤 DELEGA: Usa funzione generica con tipo 'success'
      return showNotification(message, "success");
    },
    [showNotification]
  ); // 📌 DIPENDENZA: showNotification

  // =====================================================
  // 🟡 FUNZIONE SPECIALIZZATA: MOSTRA WARNING
  // =====================================================

  // 🎯 WRAPPER per avvisi non critici
  // USO: Situazioni che richiedono attenzione ma non bloccanti
  const showWarning = useCallback(
    (message) => {
      // 📤 DELEGA: Timeout intermedio (4s) per warnings
      return showNotification(message, "warning", 4000);
    },
    [showNotification]
  ); // 📌 DIPENDENZA: showNotification

  // =====================================================
  // 🎁 API COMPLETA CONTEXT VALUE
  // =====================================================

  // 📦 OGGETTO VALUE: Tutte le funzioni e stato disponibili ai consumer
  const value = {
    // 📊 STATO: Array di notifiche attive
    notifications: state.notifications,

    // 🔧 FUNZIONI CORE
    showNotification, // 🎯 Funzione generica per qualsiasi notifica
    showError, // 🔴 Funzione specializzata per errori
    showSuccess, // 🟢 Funzione specializzata per successi
    showWarning, // 🟡 Funzione specializzata per warnings

    // 🗑️ FUNZIONE UTILITY: Pulisci tutte le notifiche
    clearAllNotifications: useCallback(() => {
      dispatch({ type: "CLEAR_ALL" });
    }, []), // 📌 NESSUNA DIPENDENZA: Funzione sempre stabile
  };

  // =====================================================
  // 🎁 PROVIDER RENDER
  // =====================================================

  // 🌐 FORNISCI CONTEXT: Rende value disponibile a tutti i componenti figli
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// =====================================================
// 🪝 CUSTOM HOOK PER CONSUMARE CONTEXT
// =====================================================

// 🎯 HOOK PERSONALIZZATO: Accesso sicuro al notification context
export const useNotification = () => {
  // 🔍 OTTIENI CONTEXT VALUE
  const context = useContext(NotificationContext);

  // ⚠️ ERROR HANDLING: Verifica uso corretto
  if (!context) {
    // 💥 ERRORE CRITICO: Hook usato fuori da Provider
    // PREVIENE: Bug sottili da uso scorretto del context
    throw new Error("useNotification must be used within NotificationProvider");
  }

  // ✅ RETURN API: Context valido, restituisci tutte le funzioni
  return context;
};

// =====================================================
// 📋 NOTE ARCHITETTURALI E PATTERN IMPLEMENTATI
// =====================================================

// 🎨 DESIGN PATTERNS UTILIZZATI:
// 1. CONTEXT PATTERN: Stato globale senza prop drilling
// 2. REDUCER PATTERN: Gestione stato immutabile e prevedibile
// 3. FACADE PATTERN: API semplice nasconde complessità interna
// 4. STRATEGY PATTERN: Diverse strategie per tipi di notifica
// 5. ERROR MAPPING PATTERN: Conversione errori tecnici → user-friendly

// 🔧 OTTIMIZZAZIONI PERFORMANCE:
// 1. useCallback su tutte le funzioni per evitare re-render
// 2. Context separato da AppContext per isolamento updates
// 3. Auto-dismiss automatico per evitare memory leaks
// 4. Dipendenze minimali nei useCallback

// 🎯 VANTAGGI ARCHITETTURA:
// 1. SEPARAZIONE: Notifiche isolate da logica business
// 2. RIUSABILITÀ: Hook utilizzabile in qualsiasi componente
// 3. CONSISTENZA: Stile uniforme per tutti i messaggi
// 4. MANUTENIBILITÀ: Mapping errori centralizzato
// 5. UX: Auto-dismiss e timing appropriati per tipo

// 🔮 POSSIBILI MIGLIORAMENTI FUTURI:
// 1. PERSISTENCE: Salva notifiche critiche in sessionStorage
// 2. STACKING: Gestione visuale di notifiche multiple
// 3. POSITIONING: Configurazione posizione toast
// 4. ACTIONS: Notifiche con bottoni di azione
// 5. SOUND: Feedback audio per notifiche importanti
// 6. ANALYTICS: Tracking interazioni utente con notifiche

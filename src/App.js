// =====================================================
// 📁 src/App.js - COMPONENTE PRINCIPALE PULITO E SEMPLIFICATO
// =====================================================

/**
 * **SCOPO DEL FILE:**
 * Questo è il componente React principale che fa da "cervello" di tutta l'applicazione.
 * È il punto di partenza dove vengono orchestrati tutti i provider, layout e routing.
 * Ogni volta che l'app viene avviata, questo componente è il primo ad essere renderizzato.
 *
 * **PERCHÉ È IMPORTANTE:**
 * - Definisce la struttura gerarchica dell'app (chi contiene chi)
 * - Configura i provider globali (stato, notifiche, errori)
 * - È il ponte tra index.js e il resto dell'app
 * - Mantiene l'architettura pulita e organizzata
 *
 * **ARCHITETTURA SCELTA:**
 * Usa il pattern "Provider Wrapper" dove ogni provider avvolge quello sotto:
 * ErrorBoundary → Notifications → AppState → Layout → Router → Components
 *
 * **VERSIONE SEMPLIFICATA:**
 * Rimosso il sistema Emergency Export per mantenere il componente focalizzato
 * sulla sua responsabilità principale: orchestrare i provider e il layout.
 */

// =====================================================
// IMPORT STATEMENT - Importazione Dipendenze
// =====================================================

/**
 * **React Core:**
 * React = libreria principale per creare componenti
 * Non serve useEffect perché abbiamo rimosso l'Emergency Export
 */

/**
 * **Context Providers (State Management):**
 * Questi provider forniscono stato globale a tutta l'app
 */
// AppProvider = fornisce lo stato principale dell'app (parole, test, statistiche)
import React from "react";
import { AppProvider } from "@contexts/AppContext";
// NotificationProvider = gestisce toast e notifiche globali
import { NotificationProvider } from "@contexts/NotificationContext";

/**
 * **Layout e Routing:**
 * Componenti che gestiscono struttura e navigazione
 */
// AppLayout = layout principale (header, navigation, main, footer)
import { AppLayout } from "@layouts/AppLayout";
// AppRouter = routing condizionale tra pagine (MainView, TestView, etc.)
import { AppRouter } from "@/routing/AppRouter";

/**
 * **Error Handling:**
 * Sistema avanzato di gestione errori
 */
// MainAppErrorBoundary = cattura errori React e previene crash
// ErrorTracker = sistema di logging e tracking errori
import {
  ErrorTracker,
  MainAppErrorBoundary,
} from "@components/ErrorBoundaries";

// =====================================================
// COMPONENTE PRINCIPALE - VocabularyApp
// =====================================================

/**
 * **COMPONENTE VocabularyApp:**
 * Questo è il componente React principale che contiene tutta l'applicazione.
 * È una Function Component (moderno) invece di Class Component (vecchio stile).
 *
 * **RESPONSABILITÀ:**
 * 1. Orchestrare i provider nell'ordine corretto
 * 2. Configurare error handling globale
 * 3. Fornire la struttura base dell'app
 * 4. Mantenere l'architettura pulita e scalabile
 *
 * @returns {JSX.Element} - Il JSX che rappresenta tutta l'app
 */
const VocabularyApp = () => {
  // =====================================================
  // JSX RETURN - Struttura Componenti
  // =====================================================

  /**
   * **RETURN JSX:**
   * Questo è ciò che il componente renderizza.
   * La struttura è gerarchica: ogni componente avvolge quello sotto.
   *
   * **PATTERN PROVIDER WRAPPER:**
   * Ogni provider ha accesso ai provider sopra di lui, ma non sotto.
   * L'ordine è CRITICO per il funzionamento corretto.
   */
  return (
    // =====================================================
    // ERROR BOUNDARY - Livello più esterno (Livello 1)
    // =====================================================

    /**
     * **MainAppErrorBoundary:**
     * LIVELLO 1 - Cattura TUTTI gli errori React nell'app.
     * Se qualsiasi componente figlio genera un errore, questo
     * componente lo cattura e previene il crash completo dell'app.
     *
     * **Proprietà onAppError:**
     * Callback chiamata quando viene catturato un errore.
     * Riceve (error, errorInfo) e può processarli.
     *
     * **Perché qui:**
     * Deve essere il livello più esterno per catturare errori
     * da tutti i provider e componenti sottostanti.
     */
    <MainAppErrorBoundary
      onAppError={(error, errorInfo) => {
        /**
         * **ERROR TRACKING:**
         * ErrorTracker.logError salva l'errore per analisi successiva.
         *
         * **Parametri:**
         * - error: l'oggetto Error JavaScript con stack trace
         * - 'Main App': contesto dove è avvenuto l'errore (per debugging)
         * - { errorInfo }: metadati aggiuntivi React (component stack, etc.)
         *
         * **Cosa fa:**
         * - Salva l'errore in localStorage per debugging
         * - Può inviare errori a servizi di monitoring (Sentry, etc.)
         * - Aggiunge timestamp e context per analysis
         */
        ErrorTracker.logError(error, "Main App", { errorInfo });

        /**
         * **DEVELOPMENT LOGGING:**
         * In development mode, logga errori nel console per debugging immediato.
         *
         * **process.env.NODE_ENV:**
         * - 'development': quando usi `npm start`
         * - 'production': quando usi `npm run build`
         * - Viene impostato automaticamente da React Scripts
         *
         * **console.group:**
         * Crea una sezione collassabile nel browser console.
         * Utile per organizzare i log durante il debugging.
         */
        if (process.env.NODE_ENV === "development") {
          console.group("🚨 Main App Error Caught");
          console.error("Error:", error);
          console.error("Error Info:", errorInfo);
          console.groupEnd();
        }
      }}
    >
      {/* =====================================================
          NOTIFICATION PROVIDER - Livello 2
          ===================================================== */}

      {/**
       * **NotificationProvider:**
       * LIVELLO 2 - Gestisce il sistema di notifiche globali.
       *
       * **Cosa fornisce:**
       * - showSuccess(message): Toast verde per operazioni riuscite
       * - showError(message): Toast rosso per errori
       * - showWarning(message): Toast giallo per avvisi
       * - showInfo(message): Toast blu per informazioni
       *
       * **Perché qui:**
       * - Deve essere accessibile da tutti i componenti figli
       * - Dentro ErrorBoundary per catturare eventuali errori delle notifiche
       * - Sopra AppProvider perché AppProvider potrebbe voler mostrare notifiche
       *
       * **Esempi di uso:**
       * - Successo aggiunta parola → showSuccess("Parola aggiunta!")
       * - Errore API → showError("Connessione fallita")
       * - Import completato → showInfo("100 parole importate")
       */}
      <NotificationProvider>
        {/* =====================================================
            APP PROVIDER - Livello 3 (Stato Globale)
            ===================================================== */}

        {/**
         * **AppProvider:**
         * LIVELLO 3 - Il provider più importante, gestisce TUTTO lo stato globale.
         *
         * **Stato gestito:**
         * - words: Array di tutte le parole del vocabolario
         * - currentView: Quale sezione è attiva ('main', 'stats', etc.)
         * - testMode: Se è attivo un test
         * - showResults: Se mostrare i risultati di un test
         * - editingWord: Parola in modalità editing
         * - modal states: Stato di modal e popup
         *
         * **Funzioni fornite:**
         * - addWord(wordData): Aggiunge nuova parola
         * - removeWord(id): Elimina parola
         * - startTest(options): Avvia nuovo test
         * - toggleWordLearned(id): Marca parola come appresa
         * - importWords(data): Importa parole da JSON
         * - exportData(): Esporta tutti i dati
         *
         * **Hook utilizzati internamente:**
         * - useOptimizedWords: Gestione parole con localStorage
         * - useOptimizedTest: Logica test e quiz
         * - useEnhancedStats: Statistiche avanzate e cronologia
         *
         * **Perché qui:**
         * - Ha accesso alle notifiche (può mostrare toast)
         * - Ha accesso a error tracking (errori vengono catturati)
         * - Deve fornire stato a layout e router sottostanti
         */}
        <AppProvider>
          {/* =====================================================
              APP LAYOUT - Livello 4 (Struttura Visiva)
              ===================================================== */}

          {/**
           * **AppLayout:**
           * LIVELLO 4 - Gestisce la struttura visiva dell'app.
           *
           * **Responsabilità:**
           * - Header con titolo e statistiche utente
           * - Navigation menu tra sezioni (Main, Stats, etc.)
           * - Area principale per il contenuto (children)
           * - Footer con informazioni app
           * - Background effects e animazioni
           * - Responsive design per mobile/desktop
           *
           * **Cosa renderizza:**
           * - <AppHeader />: Testata con stats
           * - <AppNavigation />: Menu di navigazione
           * - <main>{children}</main>: Contenuto principale
           * - <AppFooter />: Piè di pagina
           * - <BackgroundParticles />: Effetti visivi
           * - <NotificationToast />: Sistema toast
           * - <GlobalModals />: Modal globali
           *
           * **Logica condizionale:**
           * - Se testMode=true: nasconde header e navigation
           * - Se showResults=true: nasconde header e navigation
           * - Altrimenti: mostra layout completo
           *
           * **Perché dentro i Provider:**
           * - Può accedere allo stato globale per mostrare statistiche
           * - Può accedere alle notifiche per feedback visivo
           * - Può mostrare/nascondere elementi basandosi su stato app
           */}
          <AppLayout>
            {/* =====================================================
                APP ROUTER - Livello 5 (Navigazione)
                ===================================================== */}

            {/**
             * **AppRouter:**
             * LIVELLO 5 - Gestisce quale componente/pagina mostrare.
             *
             * **Routing Logic:**
             * Non usa React Router, ma routing condizionale basato su stato globale.
             *
             * **Logica di routing:**
             * ```javascript
             * if (testMode) return <TestView />;
             * if (showResults) return <ResultsView />;
             * switch (currentView) {
             *   case 'stats': return <StatsView />;
             *   case 'main':
             *   default: return <MainView />;
             * }
             * ```
             *
             * **Pagine/Componenti gestiti:**
             * - **MainView**: Pagina principale con lista parole e form aggiunta
             * - **TestView**: Pagina quiz interattivo con timer e punteggio
             * - **ResultsView**: Pagina risultati test con statistiche dettagliate
             * - **StatsView**: Dashboard con grafici e analisi performance
             *
             * **Perché routing condizionale:**
             * - Più semplice di React Router per app piccole
             * - Stato di routing integrato con stato app
             * - Controllo totale sulla logica di navigazione
             * - Meno dipendenze esterne
             *
             * **Perché qui:**
             * - Deve essere l'ultimo livello per accedere a tutti i provider
             * - I componenti renderizzati vedono tutto lo stato globale
             * - Layout può controllare cosa mostrare (header, nav) basandosi sul router
             */}
            <AppRouter />
          </AppLayout>
        </AppProvider>
      </NotificationProvider>
    </MainAppErrorBoundary>
  );
};

// =====================================================
// EXPORT DEFAULT - Esportazione Componente
// =====================================================

/**
 * **Export Default:**
 * Esporta VocabularyApp come export predefinito del modulo.
 *
 * **Come viene usato:**
 * - index.js importa questo componente: `import App from './App'`
 * - ReactDOM.render(<App />) lo monta sul DOM
 *
 * **Named vs Default Export:**
 * - Default: `import App from './App'` (nome import può essere diverso)
 * - Named: `import { VocabularyApp } from './App'` (nome fisso)
 *
 * **Convenzione:**
 * Per il componente principale si usa sempre default export.
 */
export default VocabularyApp;

// =====================================================
// ARCHITETTURA E PATTERN - SPIEGAZIONE TECNICA COMPLETA
// =====================================================

/**
 * **PATTERN UTILIZZATI:**
 *
 * 1. **Provider Pattern:**
 *    - Ogni provider avvolge i figli e fornisce API via React Context
 *    - Separazione responsabilità: errori, notifiche, stato, layout
 *    - Single Responsibility Principle applicato
 *
 * 2. **Error Boundary Pattern:**
 *    - Cattura errori JavaScript e previene crash dell'app
 *    - Fallback UI quando qualcosa va storto
 *    - Logging centralizzato per debugging
 *
 * 3. **Composition Pattern:**
 *    - Componenti composti invece di ereditarietà
 *    - Ogni livello aggiunge una responsabilità specifica
 *    - Facilita testing e manutenzione
 *
 * 4. **Conditional Routing Pattern:**
 *    - Routing basato su stato invece di URL
 *    - Appropriato per single-page app semplici
 *    - Controllo totale sulla logica di navigazione
 *
 * **VANTAGGI ARCHITETTURA:**
 * - ✅ Separazione responsabilità chiara
 * - ✅ Testing facilitato (ogni livello testabile separatamente)
 * - ✅ Debugging semplificato (errori isolati per livello)
 * - ✅ Scalabilità (facile aggiungere nuovi provider)
 * - ✅ Manutenibilità (modifiche isolate)
 * - ✅ Performance (re-render ottimizzati per provider)
 *
 * **FLUSSO DATI:**
 * ```
 * AppProvider (stato globale)
 *     ↓
 * AppLayout (accede stato per header/nav)
 *     ↓
 * AppRouter (accede stato per routing)
 *     ↓
 * Views (accedono tutto lo stato necessario)
 * ```
 *
 * **ERROR FLOW:**
 * ```
 * Qualsiasi componente genera errore
 *     ↓
 * MainAppErrorBoundary cattura errore
 *     ↓
 * ErrorTracker logga errore
 *     ↓
 * Fallback UI viene mostrato
 *     ↓
 * App continua a funzionare
 * ```
 */

/**
 * **DEBUGGING TIPS:**
 *
 * 1. **React Developer Tools:**
 *    - Installa l'extension per Chrome/Firefox
 *    - Ispeziona la gerarchia dei provider
 *    - Monitora stato e props in tempo reale
 *    - Profiler per performance analysis
 *
 * 2. **Console Debugging:**
 *    - ErrorTracker salva errori in localStorage
 *    - console.log nel development mode
 *    - React StrictMode evidenzia problemi potenziali
 *
 * 3. **State Debugging:**
 *    - Redux DevTools extension compatibile con Context
 *    - Console inspect: React context values
 *    - Breakpoint su provider per flow analysis
 *
 * 4. **Performance Monitoring:**
 *    - React Profiler per bottleneck rendering
 *    - Chrome DevTools per memory leaks
 *    - Lighthouse per overall app performance
 */

/**
 * **SECURITY CONSIDERATIONS:**
 *
 * 1. **Error Information:**
 *    - Production: errori loggati senza stack trace sensibili
 *    - Development: informazioni complete per debugging
 *    - Mai esporre API keys o dati sensibili negli errori
 *
 * 2. **Context Security:**
 *    - Stato globale accessibile a tutti i componenti figli
 *    - Sensitive data isolato in provider specifici
 *    - Validation su tutte le azioni che modificano stato
 *
 * 3. **Error Boundaries:**
 *    - Prevengono leak di informazioni sensibili via error display
 *    - Fallback UI non deve esporre internal state
 *    - Error logging deve essere sanitized in production
 */

/**
 * **POSSIBILI MIGLIORAMENTI FUTURI:**
 *
 * 1. **Performance:**
 *    - React.memo per componenti che re-renderano spesso
 *    - useMemo per calcoli costosi in provider
 *    - Code splitting con React.lazy per views
 *
 * 2. **State Management:**
 *    - Zustand o Redux Toolkit per stato complesso
 *    - React Query per server state management
 *    - Immer per immutable updates più semplici
 *
 * 3. **Routing:**
 *    - React Router se app diventa multi-page
 *    - URL-based routing per deep linking
 *    - History management per back/forward
 *
 * 4. **Monitoring:**
 *    - Sentry per error tracking in production
 *    - Analytics per user behavior tracking
 *    - Performance monitoring con Web Vitals
 *
 * 5. **Testing:**
 *    - React Testing Library per integration tests
 *    - Jest per unit tests di provider
 *    - Cypress per end-to-end testing
 */

// =====================================================
// QUESTO COMPONENTE È COMPLETO E OTTIMIZZATO!
// =====================================================

/**
 * **RIASSUNTO FINALE:**
 *
 * Questo App.js pulito e semplificato rappresenta l'architettura moderna
 * React con:
 *
 * ✅ **Provider Pattern** per stato globale organizzato
 * ✅ **Error Boundaries** per resilienza applicazione
 * ✅ **Composition** per modularity e testability
 * ✅ **Conditional Routing** appropriato per SPA semplici
 * ✅ **Development Experience** ottimizzato con logging
 * ✅ **Production Ready** con error handling robusto
 *
 * L'architettura è:
 * - **Scalabile**: facile aggiungere funzionalità
 * - **Manutenibile**: logica ben organizzata e documentata
 * - **Performante**: re-render ottimizzati e pattern efficienti
 * - **Robusta**: error handling completo e recovery automatico
 * - **Developer Friendly**: debugging tools e documentation complete
 *
 * Questo è un esempio di **React application architecture** moderna
 * e professionale che può servire come template per progetti simili.
 */

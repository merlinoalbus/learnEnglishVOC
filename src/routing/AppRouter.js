// =====================================================
// 📁 src/components/AppRouter.js - ROUTER INTERNO DELL'APPLICAZIONE
// =====================================================
// 🎯 SCOPO: Component router che gestisce la navigazione interna dell'app.
//          Decide quale View renderizzare basandosi sullo stato globale.
//          Implementa routing condizionale senza URL changes.
//
// ❓ POSIZIONE FILE: ❌ DISCUTIBILE - DOVREBBE ESSERE IN src/routing/ ?
//
// 🤔 ANALISI POSIZIONE ATTUALE vs ALTERNATIVE:
//
// ✅ OPZIONE 1: src/components/AppRouter.js (ATTUALE)
//    PRO: È tecnicamente un component React
//    PRO: Semplice per progetti piccoli
//    CONTRO: Non è un "component UI" ma logica di routing
//    CONTRO: Mischia concerns (UI components vs routing logic)
//
// 🎯 OPZIONE 2: src/routing/AppRouter.js (MIGLIORE)
//    PRO: Separazione chiara dei concerns
//    PRO: Scalabilità per routing più complessi
//    PRO: Più facile trovare logica di routing
//    PRO: Standard per applicazioni più grandi
//
// 🔄 OPZIONE 3: src/navigation/AppRouter.js
//    PRO: Nome cartella più specifico
//    CONTRO: Meno standard di "routing"
//
// 💡 RACCOMANDAZIONE: Spostare in src/routing/AppRouter.js
//    per architettura più pulita e scalabile

import React from "react";

// 🧠 IMPORT CONTEXT: Accesso allo stato globale per decisioni di routing
import { useAppContext } from "../contexts/AppContext";

// 📄 IMPORT VIEWS: Tutte le "pagine" dell'applicazione
import { MainView } from "../views/MainView"; // 🏠 Vista principale - gestione vocabolario
import { TestView } from "../views/TestView"; // 🎯 Vista quiz - test interattivo
import { ResultsView } from "../views/ResultsView"; // 📊 Vista risultati - post-test
import { StatsView } from "../views/StatsView"; // 📈 Vista statistiche - analytics

// =====================================================
// 🧭 APP ROUTER COMPONENT
// =====================================================
// 🎯 RESPONSABILITÀ:
// 1. Analizzare stato globale per determinare vista corrente
// 2. Implementare logica di routing basata su stato (no URL)
// 3. Renderizzare la View appropriata con priorità gerarchica
// 4. Mantenere clean separation tra routing logic e view logic

export const AppRouter = () => {
  // =====================================================
  // 🧠 ACCESSO STATO GLOBALE PER ROUTING
  // =====================================================

  // 🔍 ESTRAZIONE STATO: Ottieni tutti i flag necessari per routing
  const { currentView, testMode, showResults } = useAppContext();

  // 📊 SPIEGAZIONE STATO ROUTING:
  // - currentView: 'main' | 'stats' → Vista normale dell'app
  // - testMode: boolean → Se quiz è attivo (priorità ALTA)
  // - showResults: boolean → Se mostra risultati test (priorità MEDIA)
  //
  // 🎯 GERARCHIA PRIORITÀ (dall'alta alla bassa):
  // 1. testMode → TestView (quiz attivo)
  // 2. showResults → ResultsView (risultati test)
  // 3. currentView → MainView | StatsView (navigazione normale)

  // =====================================================
  // 🎯 ROUTING LOGIC CON PRIORITÀ GERARCHICA
  // =====================================================

  // 🥇 PRIORITÀ 1: TEST ATTIVO
  // CONDIZIONE: testMode === true
  // QUANDO: User ha avviato un quiz e sta rispondendo alle domande
  // RAZIONALE: Quiz richiede focus completo, disabilitare navigazione
  // VISTA: TestView con UI minimale (no header, no nav)
  if (testMode) {
    return <TestView />;
  }

  // 🥈 PRIORITÀ 2: RISULTATI TEST
  // CONDIZIONE: showResults === true (e testMode === false)
  // QUANDO: Test completato, mostra risultati e statistiche performance
  // RAZIONALE: Risultati sono temporanei, priorità su navigazione normale
  // VISTA: ResultsView con opzioni "nuovo test" o "torna a main"
  if (showResults) {
    return <ResultsView />;
  }

  // 🥉 PRIORITÀ 3: NAVIGAZIONE NORMALE
  // CONDIZIONE: Né test né risultati attivi
  // QUANDO: User naviga normalmente nell'app
  // LOGICA: Switch basato su currentView da navigazione o stato iniziale
  // CONTROLLO: AppNavigation buttons cambiano currentView tramite dispatch
  switch (currentView) {
    // 📈 VISTA STATISTICHE
    case "stats":
      // CONTENUTO: Dashboard statistiche, cronologia test, analytics
      // NAVIGAZIONE: Da AppNavigation o programmaticamente
      return <StatsView />;

    // 🏠 VISTA PRINCIPALE (DEFAULT)
    case "main":
    default:
      // CONTENUTO: Gestione vocabolario, aggiunta parole, avvio test
      // DEFAULT: Vista mostrata all'avvio dell'app (initialState)
      // FALLBACK: Se currentView ha valore non riconosciuto
      return <MainView />;
  }
};

// =====================================================
// 📋 NOTE ARCHITETTURALI AVANZATE
// =====================================================

// 🎯 ROUTING PATTERN IMPLEMENTATO:
// STATE-BASED ROUTING invece di URL-BASED ROUTING
//
// ✅ VANTAGGI:
// 1. SEMPLICITÀ: No configurazione router complessa
// 2. STATO: Routing integrato con stato globale dell'app
// 3. CONTROLLO: Logica routing completamente controllabile
// 4. PERFORMANCE: No parsing URL o history management
// 5. MOBILE-FIRST: Perfetto per PWA senza URL visibili
//
// ⚠️ SVANTAGGI:
// 1. NO BOOKMARKS: User non può bookmarkare pagine specifiche
// 2. NO BROWSER BACK: Bottone indietro browser non funziona
// 3. NO DEEP LINKS: Impossibile condividere link a pagine specifiche
// 4. NO SEO: Se app fosse server-rendered, SEO problematico

// 🔄 ALTERNATIVE ROUTING CONSIDERATE:
//
// 🅰️ REACT ROUTER:
//    PRO: Standard industry, URL support, history, lazy loading
//    CONTRO: Overhead per app semplice, extra complexity
//    USO: Quando serve URL routing e bookmarking
//
// 🅱️ REACH ROUTER (ora mergiato in React Router):
//    PRO: API più semplice di React Router classico
//    CONTRO: Deprecato, migrato in React Router v6
//
// 🅲️ NEXT.JS ROUTER:
//    PRO: File-based routing, automatic code splitting
//    CONTRO: Richiede Next.js framework
//    USO: Per applicazioni con SSR/SSG requirements

// 🎯 GERARCHIA PRIORITÀ SPIEGATA:
//
// 1️⃣ testMode ha PRIORITÀ MASSIMA perché:
//    - Quiz interrotto accidentalmente = perdita dati
//    - User focus deve essere protetto durante test
//    - Test timing accurato richiede UI stabile
//
// 2️⃣ showResults ha PRIORITÀ MEDIA perché:
//    - Risultati sono temporanei, vanno mostrati subito
//    - User deve vedere performance prima di altre azioni
//    - Transition da test → risultati deve essere fluida
//
// 3️⃣ currentView ha PRIORITÀ BASSA perché:
//    - Navigazione normale, non operazioni critiche
//    - User può sempre navigare tra main ↔ stats
//    - Stato persistente, no perdita dati

// 🔧 OTTIMIZZAZIONI IMPLEMENTATE:
//
// 1. EARLY RETURNS: Evita nested conditionals per leggibilità
// 2. BOOLEAN EVALUATION: testMode e showResults sono boolean puliti
// 3. DEFAULT CASE: Fallback robusto se currentView corrotto
// 4. DIRECT RETURNS: No wrapper components, return diretto per performance

// 🚀 POSSIBILI MIGLIORAMENTI FUTURI:
//
// 1. ROUTE GUARDS: Protezioni per viste che richiedono dati
//    if (!words.length && currentView === 'stats') return <EmptyState />
//
// 2. LAZY LOADING: Import dinamici per viste pesanti
//    const StatsView = lazy(() => import('../views/StatsView'))
//
// 3. TRANSITION ANIMATIONS: Animazioni tra viste
//    return <AnimatedSwitch><FadeIn>{currentView}</FadeIn></AnimatedSwitch>
//
// 4. ROUTE HISTORY: Stack per permettere "back" navigation
//    const [routeHistory, setRouteHistory] = useState(['main'])
//
// 5. URL SYNC: Sync stato con URL per bookmarking
//    useEffect(() => { history.pushState(null, '', `#${currentView}`) }, [currentView])

// 📁 RACCOMANDAZIONE REFACTORING:
//
// 🎯 SPOSTARE FILE IN: src/routing/AppRouter.js
//
// 📂 STRUTTURA SUGGERITA:
// src/
// ├── routing/
// │   ├── AppRouter.js        ← Questo file
// │   ├── routeGuards.js      ← Guards per proteggere route
// │   ├── routeConstants.js   ← Costanti per nomi route
// │   └── routeUtils.js       ← Utility per routing
// ├── views/                  ← Views rimangono dove sono
// └── components/             ← Components UI puri
//
// 💡 BENEFICI:
// 1. Separazione chiara routing vs UI components
// 2. Facilita testing isolato della logica routing
// 3. Scala meglio per routing più complessi
// 4. Segue conventions di progetti enterprise

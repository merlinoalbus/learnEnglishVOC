// =====================================================
// 📁 src/layouts/AppLayout.js - LAYOUT PRINCIPALE DELL'APPLICAZIONE
// =====================================================
// 🎯 SCOPO: Component layout che definisce la struttura visuale di base dell'app.
//          Gestisce elementi UI globali e decide dinamicamente cosa mostrare
//          basandosi sullo stato dell'applicazione (test mode, results, etc.).
//
// 📁 POSIZIONE CORRETTA: ✅ src/layouts/ - Perfetto!
//    I layout components appartengono in layouts/ perché definiscono
//    la struttura generale delle pagine, non logica business specifica.

import React from "react";

// 🧠 IMPORT CONTEXT: Accesso allo stato globale dell'app
import { useAppContext } from "../contexts/AppContext";

// 🎨 IMPORT COMPONENTI LAYOUT: Elementi strutturali dell'interfaccia
import { AppHeader } from "../components/layout/AppHeader"; // 📊 Header con titolo e statistiche
import { AppNavigation } from "../components/layout/AppNavigation"; // 🧭 Menu di navigazione tra viste

// ✨ IMPORT COMPONENTI UI GLOBALI: Elementi che attraversano tutta l'app
import { BackgroundParticles } from "../components/ui/BackgroundParticles"; // 🌟 Effetti di sfondo animati
import { NotificationToast } from "../components/ui/NotificationToast"; // 🔔 Sistema toast per notifiche
import { GlobalModals } from "../components/modals/GlobalModals"; // 📋 Modal globali (conferme, etc.)

// =====================================================
// 🏗️ APP LAYOUT COMPONENT
// =====================================================
// 🎯 RESPONSABILITÀ:
// 1. Fornire struttura HTML di base per l'intera applicazione
// 2. Gestire elementi UI persistenti (sfondo, toast, modal)
// 3. Decidere dinamicamente visibilità di header/navigation
// 4. Applicare styling globale e responsive design
// 5. Fornire container per il contenuto dinamico (children)

export const AppLayout = ({ children }) => {
  // =====================================================
  // 🧠 ACCESSO STATO GLOBALE
  // =====================================================

  // 🔍 ESTRAZIONE STATO: Ottieni informazioni su modalità corrente dell'app
  const { testMode, showResults } = useAppContext();

  // 📊 SPIEGAZIONE STATO:
  // - testMode: true quando utente sta facendo un quiz attivo
  // - showResults: true quando si stanno mostrando risultati di un test completato
  //
  // 🎯 LOGICA UI: Durante test e risultati, nascondi header/nav per focus completo

  // =====================================================
  // 🎨 RENDER LAYOUT STRUCTURE
  // =====================================================

  return (
    // 🏗️ CONTAINER PRINCIPALE
    // CLASSE CSS: min-h-screen = altezza minima 100vh (full viewport height)
    // CLASSE CSS: bg-gradient-to-br = gradiente di sfondo diagonale (top-left → bottom-right)
    // CLASSE CSS: from-indigo-50 via-white to-cyan-50 = colori gradiente (indaco → bianco → ciano)
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* =====================================================
          🌟 LAYER 1: BACKGROUND EFFECTS
          ===================================================== */}

      {/* 🌟 EFFETTI SFONDO ANIMATI */}
      {/* SCOPO: Particelle fluttuanti per visual appeal */}
      {/* POSIZIONE: Z-index basso, dietro tutto il contenuto */}
      <BackgroundParticles />

      {/* =====================================================
          🔔 LAYER 2: GLOBAL UI ELEMENTS  
          ===================================================== */}

      {/* 🔔 SISTEMA NOTIFICHE TOAST */}
      {/* SCOPO: Mostra messaggi temporanei (successo, errore, warning) */}
      {/* POSIZIONE: Fixed, sopra tutto il contenuto per visibilità */}
      {/* CONNESSIONE: Legge da NotificationContext */}
      <NotificationToast />

      {/* 📋 MODAL GLOBALI */}
      {/* SCOPO: Modal che possono apparire da qualsiasi parte dell'app */}
      {/* ESEMPI: Conferma eliminazione, clear data, selettore capitoli */}
      {/* POSIZIONE: Fixed overlay con z-index alto */}
      <GlobalModals />

      {/* =====================================================
          🏗️ LAYER 3: MAIN CONTENT CONTAINER
          ===================================================== */}

      {/* 📦 CONTENITORE CONTENUTO PRINCIPALE */}
      {/* CLASSE CSS: relative z-10 = posizionamento sopra background */}
      {/* CLASSE CSS: max-w-6xl mx-auto = container centrato con larghezza massima */}
      {/* CLASSE CSS: p-6 = padding interno */}
      {/* CLASSE CSS: space-y-8 = spaziatura verticale tra figli */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        {/* =====================================================
            🧭 CONDITIONAL HEADER & NAVIGATION
            ===================================================== */}

        {/* 🎯 LOGICA CONDIZIONALE: Mostra header/nav solo quando appropriato */}
        {/* CONDIZIONE: NOT (testMode OR showResults) */}
        {/* RAZIONALE: Durante test e risultati, UI deve essere minimale per focus */}
        {!testMode && !showResults && (
          <>
            {/* 📊 HEADER DELL'APPLICAZIONE */}
            {/* CONTENUTO: Titolo app, descrizione, statistiche rapide */}
            {/* DATI: Total words, learned, streak da AppContext */}
            <AppHeader />

            {/* 🧭 NAVIGATION MENU */}
            {/* CONTENUTO: Bottoni per passare tra Main View e Stats View */}
            {/* STATO: currentView da AppContext determina quale è attivo */}
            <AppNavigation />
          </>
        )}

        {/* =====================================================
            📄 MAIN CONTENT AREA
            ===================================================== */}

        {/* 🎯 CONTENUTO DINAMICO */}
        {/* SCOPO: Area dove viene renderizzato il contenuto specifico della vista */}
        {/* CHILDREN: Componente fornito da AppRouter basato su stato corrente */}
        {/* POSSIBILI CHILDREN: MainView | TestView | ResultsView | StatsView */}
        <main>{children}</main>
      </div>
    </div>
  );
};

// =====================================================
// 📋 NOTE ARCHITETTURALI IMPORTANTI
// =====================================================

// 🏗️ STRUTTURA Z-INDEX LAYERING:
// Layer 1 (background): BackgroundParticles (z-index: auto/low)
// Layer 2 (content): Main content container (z-index: 10)
// Layer 3 (overlay): NotificationToast (z-index: high/fixed)
// Layer 4 (modal): GlobalModals (z-index: highest/fixed)

// 🎨 RESPONSIVE DESIGN CONSIDERATIONS:
// - max-w-6xl: Limita larghezza su schermi grandi per leggibilità
// - mx-auto: Centra contenuto automaticamente
// - p-6: Padding consistente su tutti i dispositivi
// - space-y-8: Spaziatura verticale fluida tra sezioni

// 🔄 CONDITIONAL RENDERING LOGIC:
// Header/Navigation nascosti durante:
// 1. testMode: true → User sta facendo quiz, serve focus completo
// 2. showResults: true → Mostra risultati test, UI minimale
// Mostrati solo in:
// 1. MainView: Gestione parole, serve navigazione completa
// 2. StatsView: Visualizzazione statistiche, serve navigazione

// 🎯 CHILDREN PROP PATTERN:
// Layout component usa children prop per massima flessibilità
// Permette a AppRouter di decidere quale contenuto renderizzare
// Mantiene separazione tra layout structure e content logic

// ✅ POSIZIONE FILE CORRETTA:
// src/layouts/AppLayout.js è la posizione ideale perché:
// 1. È responsabile della struttura generale, non logica specifica
// 2. Può essere riutilizzato per diverse applicazioni
// 3. Separa concerns: layout vs business logic vs routing
// 4. Facilita testing isolato della struttura UI

// 🔮 POSSIBILI MIGLIORAMENTI FUTURI:
// 1. THEME PROVIDER: Support per dark/light mode
// 2. BREAKPOINT HOOKS: Responsive behavior più sofisticato
// 3. ANIMATION PROVIDER: Transizioni coordinate tra viste
// 4. KEYBOARD SHORTCUTS: Navigazione da tastiera globale
// 5. LOADING STATES: Skeleton loading per viste pesanti

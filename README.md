# 📚 Vocabulary Master - Architettura Sicura e Ottimizzata

## 🎯 Panoramica
**Vocabulary Master** è un'applicazione web modulare e performante per l'apprendimento del vocabolario inglese. Questa versione è stata completamente refattorizzata per garantire massima sicurezza, manutenibilità e scalabilità, introducendo un sistema di configurazione basato su environment variables, statistiche avanzate e una gestione dello stato ottimizzata tramite custom hooks e Context API.

L'architettura separa nettamente la logica di business (hooks), la UI (componenti) e le funzioni di utilità, rendendo l'applicazione robusta e pronta per future espansioni.

---

## 🏗️ Struttura del Progetto e Descrizione dei File

L'applicazione segue una struttura modulare e ben definita per facilitare lo sviluppo e la manutenzione.

### Albero Completo dei File
.
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
├── nginx.conf
├── postcss.config.js
├── tailwind.config.js
├── public/
│   └── index.html
├── scripts/
│   ├── config-status.js
│   └── security-check.js
└── src/
├── App.css
├── App.js
├── index.css
├── index.js
├── components/
│   ├── AppRouter.js
│   ├── AddWordForm.js
│   ├── ChapterTestSelector.js
│   ├── ErrorBoundary.js
│   ├── JSONManager.js
│   ├── TestCard.js
│   ├── TestHistory.js
│   ├── TestResults.js
│   ├── WordsList.js
│   ├── layout/
│   │   ├── AppHeader.js
│   │   └── AppNavigation.js
│   ├── main/
│   │   └── ControlPanel.js
│   ├── modals/
│   │   └── GlobalModals.js
│   ├── stats/
│   │   ├── DataManagementPanel.js
│   │   ├── StatsHeader.js
│   │   ├── StatsNavigation.js
│   │   ├── StatsOverview.js
│   │   ├── components/
│   │   │   ├── EmptyState.js
│   │   │   ├── StatisticCard.js
│   │   │   ├── WordDetailSection.js
│   │   │   └── WordPerformanceCard.js
│   │   ├── hooks/
│   │   │   ├── useDataManagement.js
│   │   │   └── useStatsData.js
│   │   └── sections/
│   │       ├── ChaptersSection.js
│   │       ├── OverviewSection.js
│   │       ├── PerformanceSection.js
│   │       ├── TrendsSection.js
│   │       └── WordsSection.js
│   └── ui/
│       ├── BackgroundParticles.js
│       ├── NotificationToast.js
│       ├── button.js
│       ├── card.js
│       ├── input.js
│       ├── modal.js
│       └── textarea.js
├── config/
│   └── appConfig.js
├── constants/
│   └── appConstants.js
├── contexts/
│   ├── AppContext.js
│   └── NotificationContext.js
├── hooks/
│   ├── useLocalStorage.js
│   ├── useNotification.js
│   ├── useOptimizedStats.js
│   ├── useOptimizedTest.js
│   └── useOptimizedWords.js
├── services/
│   ├── aiService.js
│   └── storageService.js
├── utils/
│   ├── categoryUtils.js
│   ├── index.js
│   ├── performanceUtils.js
│   └── textUtils.js
└── views/
├── MainView.js
├── ResultsView.js
├── StatsView.js
└── TestView.js


### Descrizione Dettagliata

#### 📂 `src/` - Codice Sorgente

-   **`App.js`**: Componente radice che orchestra i provider (Context, Notifiche, Errori) e il layout principale.
-   **`App.css`**: Fogli di stile globali e personalizzati per l'applicazione.
-   **`index.js`**: Entry point dell'applicazione React, renderizza il componente `App`.
-   **`index.css`**: Stili di base e importazioni di Tailwind CSS.

#### 📁 `src/components/` - Componenti Riutilizzabili

-   **`AppRouter.js`**: Gestisce la navigazione tra le viste principali (`MainView`, `TestView`, `StatsView`).
-   **`AddWordForm.js`**: Form avanzato per aggiungere e modificare parole, con integrazione AI per l'autocompilazione.
-   **`ChapterTestSelector.js`**: Modale per selezionare capitoli e modalità di test (normale, solo parole difficili).
-   **`ErrorBoundary.js`**: Componente che cattura errori JavaScript in qualsiasi parte dell'albero dei componenti.
-   **`JSONManager.js`**: Gestisce l'import/export del vocabolario in formato JSON.
-   **`TestCard.js`**: Carta 3D interattiva per la visualizzazione delle parole durante i test.
-   **`TestHistory.js`**: Visualizza la cronologia dettagliata di tutti i test effettuati.
-   **`TestResults.js`**: Mostra i risultati del test con statistiche dettagliate, grafici e analisi.
-   **`WordsList.js`**: Lista interattiva e filtrabile di tutte le parole del vocabolario.
-   **`layout/`**: Componenti per la struttura della pagina.
    -   `AppHeader.js`: Intestazione principale dell'applicazione.
    -   `AppNavigation.js`: Barra di navigazione per passare tra le sezioni "Studio" e "Statistiche".
-   **`main/`**: Componenti specifici della `MainView`.
    -   `ControlPanel.js`: Pannello di controllo per avviare test e visualizzare statistiche rapide.
-   **`modals/`**: Componenti modali globali.
    -   `GlobalModals.js`: Gestisce le modali di conferma (es. eliminazione parola, pulizia vocabolario).
-   **`stats/`**: Componenti dedicati alla visualizzazione delle statistiche.
    -   `DataManagementPanel.js`: Pannello per il backup e il ripristino completo dei dati dell'app.
    -   `StatsHeader.js`: Intestazione della sezione statistiche con dati riassuntivi.
    -   `StatsNavigation.js`: Navigazione a tab per le diverse sezioni delle statistiche.
    -   `StatsOverview.js`: Componente principale che orchestra la vista delle statistiche.
    -   `components/`: Sotto-componenti per le statistiche.
        -   `EmptyState.js`: Messaggio mostrato quando non ci sono ancora test da analizzare.
        -   `StatisticCard.js`: Card riutilizzabile per mostrare una singola metrica.
        -   `WordDetailSection.js`: Sezione che mostra l'andamento temporale di una singola parola.
        -   `WordPerformanceCard.js`: Card che riassume le performance di una singola parola.
    -   `hooks/`: Hooks specifici per la logica delle statistiche.
        -   `useDataManagement.js`: Logica per l'import/export e il reset dei dati.
        -   `useStatsData.js`: Calcola e memoizza le statistiche avanzate dai dati grezzi.
    -   `sections/`: Sezioni specifiche della dashboard delle statistiche.
        -   `ChaptersSection.js`: Analisi delle performance per capitolo.
        -   `OverviewSection.js`: Panoramica generale delle performance.
        -   `PerformanceSection.js`: Analisi avanzata delle metriche di performance.
        -   `TrendsSection.js`: Analisi dei trend di apprendimento nel tempo.
        -   `WordsSection.js`: Analisi dettagliata delle performance per ogni singola parola.
-   **`ui/`**: Componenti UI di base (simili a shadcn/ui).
    -   `BackgroundParticles.js`: Particelle animate per lo sfondo.
    -   `NotificationToast.js`: Sistema di notifiche toast.
    -   `button.js`, `card.js`, `input.js`, `modal.js`, `textarea.js`: Componenti UI atomici.

#### 📁 `src/config/` - Configurazione Sicura

-   **`appConfig.js`**: File centrale per la configurazione dell'app. Legge le variabili d'ambiente in modo sicuro, evitando credenziali hardcodate.

#### 📁 `src/constants/` - Costanti

-   **`appConstants.js`**: Definisce costanti come le categorie delle parole e i loro stili, e riesporta in modo compatibile le configurazioni da `appConfig.js`.

#### 📁 `src/contexts/` - React Context

-   **`AppContext.js`**: Fornisce uno stato globale e le API (per parole, test, statistiche) a tutta l'applicazione, agendo da orchestratore centrale.
-   **`NotificationContext.js`**: Gestisce lo stato e la logica per la visualizzazione delle notifiche.

#### 📁 `src/hooks/` - Hooks Personalizzati

-   **`useLocalStorage.js`**: Hook generico per la gestione persistente dei dati nel localStorage.
-   **`useNotification.js`**: Hook per accedere al contesto delle notifiche (deprecato in favore di `NotificationContext`).
-   **`useOptimizedStats.js`**: Logica complessa per la gestione, il calcolo e la persistenza di tutte le statistiche e della cronologia dei test.
-   **`useOptimizedTest.js`**: Gestisce tutta la logica di un test: selezione parole, timer, risposte e calcolo dei risultati.
-   **`useOptimizedWords.js`**: Gestisce le operazioni CRUD (Create, Read, Update, Delete) per le parole del vocabolario.

#### 📁 `src/services/` - Servizi Esterni

-   **`aiService.js`**: Servizio per l'integrazione con l'API Gemini di Google, gestisce la costruzione delle prompt, le chiamate API e il parsing delle risposte.
-   **`storageService.js`**: Wrapper ottimizzato per il `localStorage` che centralizza tutte le operazioni di lettura e scrittura.

#### 📁 `src/utils/` - Funzioni di Utilità

-   **`categoryUtils.js`**: Funzioni per ottenere stili e informazioni relative alle categorie delle parole.
-   **`index.js`**: Esporta tutte le utilità per un'importazione più pulita in altri file.
-   **`performanceUtils.js`**: Funzioni di utilità per l'ottimizzazione delle performance (es. `memoize`, `debounce`).
-   **`textUtils.js`**: Funzioni per la formattazione di testi, come le note delle parole e i messaggi dei risultati dei test.

#### 📁 `src/views/` - Viste Principali

-   **`MainView.js`**: Vista principale dove l'utente aggiunge parole e avvia i test.
-   **`ResultsView.js`**: Vista che mostra i risultati al termine di un test.
-   **`StatsView.js`**: Vista che contiene la dashboard completa delle statistiche.
-   **`TestView.js`**: Vista interattiva dove si svolge il test.

#### 📂 Altri File di Progetto

-   **`docker-compose.yml`**: Definisce i servizi, le reti e i volumi per l'ambiente di produzione e sviluppo con Docker.
-   **`Dockerfile`**: Istruzioni per costruire l'immagine Docker di produzione dell'applicazione.
-   **`Dockerfile.dev`**: Istruzioni per costruire l'immagine Docker per l'ambiente di sviluppo.
-   **`nginx.conf`**: File di configurazione di Nginx per servire l'applicazione in produzione.
-   **`postcss.config.js`**, **`tailwind.config.js`**: File di configurazione per Tailwind CSS.
-   **`public/index.html`**: Template HTML di base dell'applicazione.
-   **`scripts/`**: Script di utilità per lo sviluppo.
    -   `config-status.js`: Controlla lo stato della configurazione e delle variabili d'ambiente.
    -   `security-check.js`: Esegue un audit di sicurezza per rilevare credenziali hardcodate.

---

## ✨ Principi di Progettazione e Vantaggi

-   **Separazione delle Responsabilità (SoC)**: Hooks per la logica, Componenti per la UI, Servizi per le API esterne.
-   **Single Source of Truth**: `AppContext` agisce come unica fonte di verità, semplificando il flusso dei dati.
-   **Sicurezza**: Le API keys e le configurazioni sensibili sono gestite tramite environment variables, mai hardcodate.
-   **Manutenibilità e Scalabilità**: La struttura modulare permette di modificare o aggiungere funzionalità in modo isolato e sicuro.
-   **Performance**: L'uso estensivo di `useMemo` e `useCallback` riduce i re-render non necessari.

---

## 🚀 Come Utilizzare

### Installazione e Avvio

1.  **Crea il file di configurazione locale:**
    ```bash
    cp .env.example .env.local
    ```
2.  **Aggiungi la tua API Key** al file `.env.local`:
    ```
    REACT_APP_GEMINI_API_KEY=la_tua_api_key_qui
    ```
3.  **Installa le dipendenze e avvia:**
    ```bash
    npm install
    npm start
    ```

### Script Utili

-   **Controlla la configurazione**:
    ```bash
    npm run config:status
    ```
-   **Esegui un audit di sicurezza**:
    ```bash
    npm run security:check
    ```

---

## 🔮 Roadmap Futura

-   [ ] **Test Unitari e di Integrazione** per hooks e componenti critici.
-   [ ] **Sincronizzazione Cloud** tramite un backend (es. Firebase).
-   [ ] **Supporto PWA** per l'utilizzo offline.
-   [ ] **Gamification** avanzata con badge, punti e classifiche.
-   [ ] **Pronuncia Audio** per le parole.

---

**Vocabulary Master** - Il tuo strumento definitivo per padroneggiare il vocabolario inglese! 🚀

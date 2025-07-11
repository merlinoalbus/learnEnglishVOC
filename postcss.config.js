// =====================================================
// 🔧 postcss.config.js - Configurazione PostCSS
// =====================================================
// SCOPO: PostCSS è un tool che trasforma il CSS attraverso plugin JavaScript
// È il "ponte" tra il CSS che scrivi e il CSS finale che va nel browser.
// Pensa a PostCSS come a un processore che prende il CSS grezzo e lo migliora.

// COS'È POSTCSS:
// PostCSS è come un "compilatore CSS" che applica trasformazioni:
// - Risolve import CSS
// - Aggiunge vendor prefixes (-webkit-, -moz-, etc.)
// - Ottimizza e minifica il CSS
// - Trasforma sintassi moderne in sintassi compatibile

module.exports = {
  // ====== PLUGINS CONFIGURATION ======
  // SCOPO: Definisce i plugin PostCSS da applicare in ordine
  plugins: {
    
    // ====== TAILWIND CSS PLUGIN ======
    // SCOPO: Processa e genera il CSS di Tailwind
    tailwindcss: {},
    // COSA FA:
    // 1. Legge la configurazione da tailwind.config.js
    // 2. Scansiona i file specificati in "content" 
    // 3. Trova tutte le classi Tailwind utilizzate (es: "bg-blue-500", "p-4")
    // 4. Genera CSS finale contenente SOLO quelle classi
    // 5. Applica le personalizzazioni (colori custom, animazioni, etc.)
    //
    // ESEMPIO TRASFORMAZIONE:
    // INPUT:  <div className="bg-primary text-white p-4 rounded-lg">
    // OUTPUT: .bg-primary { background-color: hsl(var(--primary)); }
    //         .text-white { color: white; }
    //         .p-4 { padding: 1rem; }
    //         .rounded-lg { border-radius: 0.5rem; }
    
    // ====== AUTOPREFIXER PLUGIN ======
    // SCOPO: Aggiunge automaticamente vendor prefixes per compatibilità browser
    autoprefixer: {},
    // COSA FA:
    // 1. Analizza il CSS generato
    // 2. Consulta database "Can I Use" per compatibilità browser
    // 3. Aggiunge prefixes necessari per target browsers (da package.json)
    // 4. Rimuove prefixes non più necessari
    //
    // ESEMPIO TRASFORMAZIONE:
    // INPUT:  .element { transform: rotate(45deg); }
    // OUTPUT: .element { 
    //           -webkit-transform: rotate(45deg);  /* Safari, Chrome */
    //           -moz-transform: rotate(45deg);     /* Firefox */
    //           -ms-transform: rotate(45deg);      /* IE */
    //           transform: rotate(45deg);          /* Standard */
    //         }
    //
    // BROWSERS TARGET: Configurato in package.json "browserslist"
    // Per questo progetto:
    // - Production: ">0.2%", "not dead", "not op_mini all"
    // - Development: "last 1 chrome version", "last 1 firefox version"
    
  },
  
  // ====== PROCESSO COMPLETO ======
  // 1. SVILUPPO:
  //    - Scrivi componenti React con classi Tailwind
  //    - PostCSS processa CSS in tempo reale (hot reload)
  //    - Vedi risultati immediati nel browser
  //
  // 2. BUILD PRODUCTION:
  //    - Tailwind genera CSS ottimizzato (solo classi usate)
  //    - Autoprefixer aggiunge compatibilità browser
  //    - CSS finale minificato e ottimizzato
  //    - Risultato: CSS leggero e compatibile per tutti i browser
  
  // ====== INTEGRAZIONE CON REACT-SCRIPTS ======
  // React Scripts (Create React App) integra automaticamente PostCSS:
  // - Legge questo file automaticamente
  // - Applica i plugin durante build e development
  // - Supporta hot reload e source maps
  // - Ottimizza per production
  
  // ====== VANTAGGI QUESTO SETUP ======
  // ✅ CSS automaticamente ottimizzato
  // ✅ Compatibilità browser garantita
  // ✅ Bundle size ridotto (tree-shaking CSS)
  // ✅ Development experience fluida
  // ✅ Zero configurazione aggiuntiva richiesta
  
  // ====== POSSIBILI ESTENSIONI ======
  // Potresti aggiungere altri plugin come:
  // - cssnano: {} (minificazione CSS avanzata)
  // - postcss-preset-env: {} (sintassi CSS futura)
  // - postcss-import: {} (gestione @import)
  // Ma per questo progetto, tailwindcss + autoprefixer sono sufficienti
};
// =====================================================
// 🎨 tailwind.config.js - Configurazione Tailwind CSS
// =====================================================
// SCOPO: Questo file configura Tailwind CSS per l'intera applicazione
// Tailwind CSS è un framework CSS utility-first che permette di costruire
// interfacce utente moderne senza scrivere CSS personalizzato.
// Invece di classi predefinite come Bootstrap, Tailwind fornisce utility
// atomiche (es: "text-blue-500", "p-4", "rounded-lg") che si combinano
// per creare design personalizzati.

module.exports = {
  // ====== DARK MODE CONFIGURATION ======
  // SCOPO: Abilita il dark mode basato su classe CSS
  darkMode: 'class', // Usa 'class' invece di 'media' per controllo manuale
  
  // ====== CONTENT CONFIGURATION ======
  // SCOPO: Dice a Tailwind dove cercare le classi CSS utilizzate
  // Tailwind scansiona questi file per creare un CSS finale ottimizzato
  // contenente SOLO le classi effettivamente utilizzate (tree-shaking)
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Tutti i file JavaScript/JSX in src/
    "./public/index.html"          // Il file HTML principale
  ],
  
  // ====== SAFELIST CONFIGURATION ======
  // SCOPO: Forza l'inclusione di classi che potrebbero non essere rilevate durante la scansione
  // Necessario per le classi generate dinamicamente (come i colori dei gruppi di carte)
  safelist: [
    // Gradients per i gruppi di carte
    'bg-gradient-to-br',
    // Colori base
    {
      pattern: /^(from|to|via)-(red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|purple|violet|pink|rose|slate|gray|stone|neutral|lime)-(400|500|600|700|800|900)$/,
    },
    // Background colors
    {
      pattern: /^bg-(red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|purple|violet|pink|rose|slate|gray|stone|neutral|lime)-(400|500|600|700|800|900)$/,
    }
  ],
  // PERCHÉ: Senza questo, Tailwind non saprebbe quali classi includere
  // nel CSS finale, risultando in un bundle vuoto o troppo grande

  // ====== THEME CONFIGURATION ======
  theme: {
    // EXTEND: Aggiunge nuove utilità senza rimuovere quelle default
    // (se usassimo solo "theme" sostituiremmo completamente il tema)
    extend: {
      
      // ====== CUSTOM COLORS ======
      // SCOPO: Definisce un sistema di colori personalizzato per l'app
      // Usa CSS Custom Properties (--variabili) per supportare temi dinamici
      colors: {
        // COLORI BASE DELL'INTERFACCIA
        // Questi seguono il pattern di shadcn/ui per componenti consistenti
        border: "hsl(var(--border))",           // Colore bordi (es: input, card)
        input: "hsl(var(--input))",             // Sfondo campi input
        ring: "hsl(var(--ring))",               // Colore focus ring (accessibilità)
        background: "hsl(var(--background))",   // Sfondo principale app
        foreground: "hsl(var(--foreground))",   // Colore testo principale
        
        // COLORI SEMANTICI
        // Ogni colore ha una variante principale e una per il testo
        primary: {
          DEFAULT: "hsl(var(--primary))",           // Colore primario (bottoni principali)
          foreground: "hsl(var(--primary-foreground))", // Testo su sfondo primario
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",         // Colore secondario (bottoni secondari)
          foreground: "hsl(var(--secondary-foreground))", // Testo su sfondo secondario
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",       // Colore per azioni distruttive (elimina)
          foreground: "hsl(var(--destructive-foreground))", // Testo su sfondo destructive
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",             // Colore attenuato (elementi disabilitati)
          foreground: "hsl(var(--muted-foreground))", // Testo attenuato
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",            // Colore accent (evidenziazioni)
          foreground: "hsl(var(--accent-foreground))", // Testo su sfondo accent
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",           // Sfondo popover/dropdown
          foreground: "hsl(var(--popover-foreground))", // Testo in popover
        },
        card: {
          DEFAULT: "hsl(var(--card))",              // Sfondo card/contenitori
          foreground: "hsl(var(--card-foreground))", // Testo in card
        },
      },
      // PERCHÉ HSL: Permette manipolazione facile di luminosità/saturazione
      // PERCHÉ CSS VARIABLES: Permettono temi dinamici (chiaro/scuro)
      
      // ====== CUSTOM BORDER RADIUS ======
      // SCOPO: Sistema di border radius consistente basato su variabile CSS
      borderRadius: {
        lg: "var(--radius)",                    // Border radius grande
        md: "calc(var(--radius) - 2px)",       // Border radius medio (-2px dal grande)
        sm: "calc(var(--radius) - 4px)",       // Border radius piccolo (-4px dal grande)
      },
      // PERCHÉ: Mantiene consistenza visiva e permette modifiche globali
      // cambiando solo --radius in CSS
      
      // ====== CUSTOM ANIMATIONS ======
      // SCOPO: Definisce animazioni personalizzate per l'app
      keyframes: {
        // ANIMAZIONE ACCORDION (per elementi che si espandono/collassano)
        "accordion-down": {
          from: { height: 0 },                              // Partenza: altezza 0
          to: { height: "var(--radix-accordion-content-height)" }, // Fine: altezza contenuto
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" }, // Partenza: altezza contenuto
          to: { height: 0 },                                // Fine: altezza 0
        },
        // ANIMAZIONE FADE-IN (apparizione graduale)
        "fade-in": {
          "0%": { opacity: 0 },     // Inizio: invisibile
          "100%": { opacity: 1 },   // Fine: completamente visibile
        },
        // ANIMAZIONE SLIDE-IN (entrata dal basso)
        "slide-in": {
          "0%": { 
            transform: "translateY(20px)",  // Partenza: 20px più in basso
            opacity: 0                      // Invisibile
          },
          "100%": { 
            transform: "translateY(0)",     // Fine: posizione normale
            opacity: 1                      // Completamente visibile
          },
        },
      },
      
      // ====== ANIMATION CLASSES ======
      // SCOPO: Crea classi CSS utilizzabili nei componenti
      animation: {
        // Collega keyframes a classi utilizzabili
        "accordion-down": "accordion-down 0.2s ease-out",    // Classe: animate-accordion-down
        "accordion-up": "accordion-up 0.2s ease-out",        // Classe: animate-accordion-up
        "fade-in": "fade-in 0.5s ease-out",                  // Classe: animate-fade-in
        "slide-in": "slide-in 0.3s ease-out",                // Classe: animate-slide-in
      },
      // USO: <div className="animate-fade-in">Contenuto</div>
      
    },
  },
  
  // ====== PLUGINS CONFIGURATION ======
  // SCOPO: Estende Tailwind con funzionalità aggiuntive
  plugins: [],
  // ATTUALMENTE: Vuoto, ma potrebbe contenere plugin come:
  // - @tailwindcss/forms (per styling form)
  // - @tailwindcss/typography (per contenuto testuale)
  // - Plugin personalizzati per componenti specifici
  
  // ====== COME FUNZIONA IL PROCESSO ======
  // 1. Tailwind scansiona i file in "content"
  // 2. Trova tutte le classi utilizzate (es: "bg-primary", "animate-fade-in")
  // 3. Genera CSS finale contenente SOLO quelle classi
  // 4. Il CSS viene processato da PostCSS (vedi postcss.config.js)
  // 5. Risultato: CSS ottimizzato e minificato per production
  
  // ====== VANTAGGI QUESTO APPROCCIO ======
  // ✅ CSS finale molto leggero (solo classi usate)
  // ✅ Consistenza visiva (sistema di design unificato)
  // ✅ Temi dinamici (CSS variables)
  // ✅ Manutenibilità (modifiche centrali)
  // ✅ Performance (no CSS inutilizzato)
}
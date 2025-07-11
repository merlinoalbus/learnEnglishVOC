#!/usr/bin/env node

// =====================================================
// 📁 scripts/config-status.js - DOCUMENTAZIONE COMPLETA
// =====================================================

/**
 * SCOPO DELLO SCRIPT:
 * Questo script controlla se l'app React "Vocabulary Master" è configurata correttamente.
 * Verifica che tutti i file di configurazione esistano e che le variabili d'ambiente
 * necessarie (come l'API key di Gemini) siano impostate.
 *
 * QUANDO USARLO:
 * - Prima di avviare l'app per la prima volta
 * - Quando l'app non funziona e vuoi capire cosa manca
 * - Per verificare che la configurazione sia sicura (senza credenziali hardcoded)
 *
 * COME FUNZIONA:
 * 1. Cerca i file .env (dove sono salvate le chiavi API)
 * 2. Controlla che l'API key di Gemini sia configurata
 * 3. Verifica che non ci siano credenziali nel codice sorgente
 * 4. Mostra un report colorato con tutto lo stato
 */

// Importiamo i moduli Node.js necessari
const fs = require("fs"); // Per leggere/scrivere file dal disco
const path = require("path"); // Per gestire percorsi di file e cartelle

// =====================================================
// SEZIONE COLORI - Per output colorato nel terminale
// =====================================================

/**
 * OGGETTO COLORI:
 * Questi sono codici ANSI che fanno apparire il testo colorato nel terminale.
 * Ogni proprietà contiene un codice che cambia il colore del testo.
 */
const colors = {
  reset: "\x1b[0m", // Resetta tutti i colori al default
  bright: "\x1b[1m", // Rende il testo grassetto/luminoso
  red: "\x1b[31m", // Testo rosso (per errori)
  green: "\x1b[32m", // Testo verde (per successi)
  yellow: "\x1b[33m", // Testo giallo (per avvisi)
  blue: "\x1b[34m", // Testo blu (per informazioni)
  magenta: "\x1b[35m", // Testo magenta (non usato qui)
  cyan: "\x1b[36m", // Testo ciano (per header)
};

/**
 * FUNZIONE colorize:
 * Prende un testo e un colore, e restituisce il testo colorato.
 *
 * @param {string} text - Il testo da colorare
 * @param {string} color - Il nome del colore (dal oggetto colors sopra)
 * @returns {string} - Il testo con i codici colore ANSI
 *
 * ESEMPIO: colorize("Errore!", "red") → "\x1b[31mErrore!\x1b[0m"
 */
function colorize(text, color) {
  // Concatena: codice colore + testo + codice reset
  return `${colors[color]}${text}${colors.reset}`;
}

// =====================================================
// FUNZIONI DI LOGGING - Per stampare messaggi formattati
// =====================================================

/**
 * FUNZIONE logHeader:
 * Stampa un titolo principale con una cornice di "=" colorata.
 *
 * @param {string} text - Il titolo da mostrare
 */
function logHeader(text) {
  // Stampa una riga vuota per spaziare
  console.log("\n" + colorize("=".repeat(60), "cyan"));
  // Stampa il titolo con emoji e colore ciano
  console.log(colorize(`🔧 ${text}`, "cyan"));
  // Stampa un'altra riga di "=" per chiudere la cornice
  console.log(colorize("=".repeat(60), "cyan"));
}

/**
 * FUNZIONE logSection:
 * Stampa un sottotitolo con una cornice di "-" colorata.
 *
 * @param {string} text - Il sottotitolo da mostrare
 */
function logSection(text) {
  // Riga vuota + sottotitolo con emoji blu
  console.log("\n" + colorize(`📋 ${text}`, "blue"));
  // Riga di separazione più corta con "-"
  console.log(colorize("-".repeat(40), "blue"));
}

/**
 * FUNZIONI LOG PER DIVERSI TIPI DI MESSAGGIO:
 * Ogni funzione stampa un messaggio con un colore e emoji specifici.
 */

// Messaggi di successo (verde con ✅)
function logSuccess(text) {
  console.log(colorize(`✅ ${text}`, "green"));
}

// Messaggi di avviso (giallo con ⚠️)
function logWarning(text) {
  console.log(colorize(`⚠️  ${text}`, "yellow"));
}

// Messaggi di errore (rosso con ❌)
function logError(text) {
  console.log(colorize(`❌ ${text}`, "red"));
}

// Messaggi informativi (blu con ℹ️)
function logInfo(text) {
  console.log(colorize(`ℹ️  ${text}`, "blue"));
}

// =====================================================
// FUNZIONI UTILITY - Per operazioni sui file
// =====================================================

/**
 * FUNZIONE fileExists:
 * Controlla se un file esiste sul disco.
 *
 * @param {string} filePath - Il percorso del file da controllare
 * @returns {boolean} - true se il file esiste, false altrimenti
 *
 * PERCHÉ SERVE:
 * Prima di leggere un file, dobbiamo sapere se esiste per evitare errori.
 */
function fileExists(filePath) {
  try {
    // path.resolve() converte un percorso relativo in assoluto
    // fs.existsSync() controlla se il file esiste (sincrono = aspetta il risultato)
    return fs.existsSync(path.resolve(filePath));
  } catch (error) {
    // Se c'è un errore (permessi, etc), consideriamo il file come non esistente
    return false;
  }
}

/**
 * FUNZIONE readEnvFile:
 * Legge un file .env e converte il contenuto in un oggetto JavaScript.
 *
 * @param {string} filePath - Il percorso del file .env
 * @returns {object} - Oggetto con le variabili d'ambiente come proprietà
 *
 * FORMATO FILE .env:
 * REACT_APP_GEMINI_API_KEY=abc123
 * REACT_APP_ENVIRONMENT=development
 * # Questa è un commento
 *
 * RISULTATO:
 * {
 *   REACT_APP_GEMINI_API_KEY: "abc123",
 *   REACT_APP_ENVIRONMENT: "development"
 * }
 */
function readEnvFile(filePath) {
  try {
    // Se il file non esiste, restituisci un oggetto vuoto
    if (!fileExists(filePath)) return {};

    // Leggi tutto il contenuto del file come stringa UTF-8
    const content = fs.readFileSync(path.resolve(filePath), "utf8");
    // Oggetto che conterrà le variabili d'ambiente
    const env = {};

    // Dividi il contenuto in righe e processa ognuna
    content.split("\n").forEach((line) => {
      // Rimuovi spazi all'inizio e alla fine
      line = line.trim();

      // Salta righe vuote e commenti (che iniziano con #)
      if (line && !line.startsWith("#")) {
        // Dividi la riga su "=" - il primo elemento è la chiave
        const [key, ...valueParts] = line.split("=");

        // Se abbiamo sia chiave che valore
        if (key && valueParts.length > 0) {
          // valueParts.join('=') ricombina tutto dopo il primo "="
          // (nel caso il valore contenga altri "=")
          env[key.trim()] = valueParts.join("=").trim();
        }
      }
    });

    return env;
  } catch (error) {
    // In caso di errore, restituisci oggetto vuoto
    return {};
  }
}

/**
 * FUNZIONE getEnvVar:
 * Cerca una variabile d'ambiente in diversi posti, in ordine di priorità.
 *
 * @param {string} key - Nome della variabile (es: "REACT_APP_GEMINI_API_KEY")
 * @param {string[]} envFiles - Array di file .env da controllare (opzionale)
 * @returns {string|undefined} - Il valore della variabile o undefined se non trovata
 *
 * ORDINE DI RICERCA:
 * 1. process.env (variabili d'ambiente del sistema)
 * 2. File .env nell'ordine specificato
 */
function getEnvVar(key, envFiles = []) {
  // PRIORITÀ 1: Controlla le variabili d'ambiente del sistema
  // Queste sono impostate con "export NOME=valore" nel terminale
  if (process.env[key]) {
    return process.env[key];
  }

  // PRIORITÀ 2: Controlla i file .env uno per uno
  for (const envFile of envFiles) {
    // Leggi il file .env e cerca la chiave
    const env = readEnvFile(envFile);
    if (env[key]) {
      return env[key];
    }
  }

  // Se non trovata da nessuna parte, restituisci undefined
  return undefined;
}

/**
 * FUNZIONE validateApiKey:
 * Controlla se una API key ha un formato valido.
 *
 * @param {string} apiKey - La chiave API da validare
 * @returns {object} - Oggetto con valid (boolean) e reason (string)
 *
 * CONTROLLI EFFETTUATI:
 * - Non deve essere vuota
 * - Deve essere lunga almeno 20 caratteri
 * - Non deve essere un valore placeholder
 */
function validateApiKey(apiKey) {
  // Controllo 1: API key mancante
  if (!apiKey) return { valid: false, reason: "Missing" };

  // Controllo 2: API key troppo corta (le vere API key sono lunghe)
  if (apiKey.length < 20) return { valid: false, reason: "Too short" };

  // Controllo 3: Valori placeholder comuni
  if (apiKey === "your_gemini_api_key_here")
    return { valid: false, reason: "Default template value" };
  if (apiKey === "your_api_key_here")
    return { valid: false, reason: "Default template value" };

  // Se passa tutti i controlli, è valida
  return { valid: true, reason: "Valid format" };
}

// =====================================================
// FUNZIONE PRINCIPALE - Controllo completo della configurazione
// =====================================================

/**
 * FUNZIONE checkConfiguration:
 * Esegue tutti i controlli di configurazione e mostra un report completo.
 *
 * FASI DEL CONTROLLO:
 * 1. Controlla file di configurazione (.env)
 * 2. Verifica variabili d'ambiente richieste
 * 3. Valida le API key
 * 4. Controlla la sicurezza (no credenziali hardcoded)
 * 5. Mostra raccomandazioni
 */
function checkConfiguration() {
  // Mostra il titolo principale del report
  logHeader("Vocabulary Master - Configuration Status");

  // =====================================================
  // FASE 1: CONTROLLO FILE DI CONFIGURAZIONE
  // =====================================================

  // File .env da controllare, in ordine di priorità
  const envFiles = [".env.local", ".env.development", ".env"];

  logSection("Environment Files");

  // Flag per sapere se abbiamo trovato almeno un file .env
  let hasEnvFile = false;

  // Controlla ogni file .env
  envFiles.forEach((file) => {
    if (fileExists(file)) {
      logSuccess(`Found: ${file}`);
      hasEnvFile = true;
    } else {
      logInfo(`Not found: ${file}`);
    }
  });

  // Se nessun file .env esiste, avvisa l'utente
  if (!hasEnvFile) {
    logWarning("No environment files found");
    logInfo("Run: npm run setup:env");
  }

  // Controlla se esiste il file template .env.example
  if (fileExists(".env.example")) {
    logSuccess("Template file: .env.example");
  } else {
    logError("Missing: .env.example template");
  }

  // =====================================================
  // FASE 2: CONTROLLO VARIABILI D'AMBIENTE
  // =====================================================

  logSection("Environment Variables");

  // VARIABILI RICHIESTE (obbligatorie per il funzionamento)
  const requiredVars = [
    {
      key: "REACT_APP_GEMINI_API_KEY",
      description: "Gemini AI API Key",
      required: true,
    },
  ];

  // VARIABILI OPZIONALI (hanno valori di default)
  const optionalVars = [
    { key: "REACT_APP_ENVIRONMENT", description: "App Environment" },
    { key: "REACT_APP_DEBUG_LOGGING", description: "Debug Logging" },
    { key: "REACT_APP_ENABLE_AI_FEATURES", description: "AI Features Enabled" },
    { key: "REACT_APP_MOCK_AI_RESPONSES", description: "Mock AI Responses" },
    { key: "REACT_APP_AI_TIMEOUT", description: "AI Request Timeout" },
    { key: "REACT_APP_AI_MAX_RETRIES", description: "AI Max Retries" },
  ];

  // Flag per tracciare se tutto è configurato correttamente
  let allConfigured = true;

  // =====================================================
  // CONTROLLO VARIABILI RICHIESTE
  // =====================================================

  console.log("\n" + colorize("Required Variables:", "bright"));

  requiredVars.forEach(({ key, description, required }) => {
    // Cerca la variabile nei file .env e nell'ambiente di sistema
    const value = getEnvVar(key, envFiles);

    if (value) {
      // Se la variabile è l'API key, validala specificamente
      if (key === "REACT_APP_GEMINI_API_KEY") {
        const validation = validateApiKey(value);
        if (validation.valid) {
          logSuccess(`${key}: Configured (${validation.reason})`);
        } else {
          logError(`${key}: ${validation.reason}`);
          allConfigured = false;
        }
      } else {
        // Per altre variabili, mostra semplicemente il valore
        logSuccess(`${key}: ${value}`);
      }
    } else {
      // Variabile mancante
      if (required) {
        logError(`${key}: Missing (${description})`);
        allConfigured = false;
      } else {
        logWarning(`${key}: Not set (${description})`);
      }
    }
  });

  // =====================================================
  // CONTROLLO VARIABILI OPZIONALI
  // =====================================================

  console.log("\n" + colorize("Optional Variables:", "bright"));

  optionalVars.forEach(({ key, description }) => {
    const value = getEnvVar(key, envFiles);
    if (value) {
      logInfo(`${key}: ${value}`);
    } else {
      logInfo(`${key}: Using default`);
    }
  });

  // =====================================================
  // FASE 3: STATO DELLA CONFIGURAZIONE
  // =====================================================

  logSection("Configuration Status");

  // Riepilogo generale
  if (allConfigured) {
    logSuccess("Configuration is complete!");
    logSuccess("All required variables are properly set");
  } else {
    logError("Configuration is incomplete!");
    logError("Some required variables are missing or invalid");
  }

  // =====================================================
  // FASE 4: DISPONIBILITÀ FUNZIONALITÀ
  // =====================================================

  // Ottieni i valori per controllare quali funzionalità sono disponibili
  const apiKey = getEnvVar("REACT_APP_GEMINI_API_KEY", envFiles);
  const aiEnabled = getEnvVar("REACT_APP_ENABLE_AI_FEATURES", envFiles);
  const mockMode = getEnvVar("REACT_APP_MOCK_AI_RESPONSES", envFiles);

  console.log("\n" + colorize("Feature Availability:", "bright"));

  // Controlla se le funzionalità AI sono disponibili
  if (apiKey && validateApiKey(apiKey).valid) {
    if (aiEnabled === "false") {
      logWarning("AI Features: Disabled by configuration");
    } else {
      logSuccess("AI Features: Available");
    }
  } else {
    if (mockMode === "true") {
      logWarning("AI Features: Mock mode (no real API calls)");
    } else {
      logError("AI Features: Unavailable (no valid API key)");
    }
  }

  // =====================================================
  // FASE 5: CONTROLLO SICUREZZA
  // =====================================================

  logSection("Security Check");

  // File sorgente da controllare per credenziali hardcoded
  const sourceFiles = [
    "src/constants/appConstants.js",
    "src/services/aiService.js",
    "src/config/appConfig.js",
  ];

  let securityIssues = false;

  // Controlla ogni file sorgente
  sourceFiles.forEach((file) => {
    if (fileExists(file)) {
      try {
        // Leggi il contenuto del file
        const content = fs.readFileSync(path.resolve(file), "utf8");

        // Pattern regex per trovare credenziali sospette
        const suspiciousPatterns = [
          {
            pattern: /['"]AIzaSy[0-9A-Za-z-_]{33}['"]/g,
            name: "Google API Key",
          },
          {
            pattern: /apiKey\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/g,
            name: "Hardcoded API Key",
          },
        ];

        let fileHasIssues = false;

        // Controlla ogni pattern
        suspiciousPatterns.forEach(({ pattern, name }) => {
          const matches = content.match(pattern);
          if (matches) {
            // Filtra i falsi positivi (placeholder, commenti, etc.)
            const realMatches = matches.filter((match) => {
              // Salta valori placeholder
              if (
                match.includes("your_api_key") ||
                match.includes("your_key_here") ||
                match.includes("example") ||
                match.includes("placeholder")
              ) {
                return false;
              }

              // Controlla se è in un commento
              const lines = content.split("\n");
              const matchLine = lines.find((line) => line.includes(match));
              if (
                matchLine &&
                (matchLine.trim().startsWith("//") ||
                  matchLine.trim().startsWith("*") ||
                  matchLine.includes("RIMOSSA PER SICUREZZA"))
              ) {
                return false;
              }

              return true;
            });

            if (realMatches.length > 0) {
              fileHasIssues = true;
            }
          }
        });

        // Mostra il risultato per questo file
        if (fileHasIssues) {
          logError(`Real security issues in: ${file}`);
          securityIssues = true;
        } else {
          logSuccess(`Clean: ${file}`);
        }
      } catch (error) {
        logWarning(`Could not check: ${file}`);
      }
    }
  });

  // Riepilogo sicurezza
  if (!securityIssues) {
    logSuccess("No hardcoded credentials detected");
  } else {
    logError("Security issues found! Remove hardcoded credentials");
  }

  // =====================================================
  // FASE 6: RACCOMANDAZIONI
  // =====================================================

  logSection("Recommendations");

  // Raccomandazioni per problemi di configurazione
  if (!allConfigured) {
    console.log("\n" + colorize("To fix configuration issues:", "yellow"));
    console.log(
      "1. Copy template: " + colorize("cp .env.example .env.local", "cyan")
    );
    console.log(
      "2. Get API key: " +
        colorize("https://makersuite.google.com/app/apikey", "cyan")
    );
    console.log("3. Add API key to .env.local");
    console.log("4. Restart development server");
  }

  // Raccomandazioni per problemi di sicurezza
  if (securityIssues) {
    console.log("\n" + colorize("To fix security issues:", "red"));
    console.log("1. Remove hardcoded credentials from source files");
    console.log("2. Use environment variables instead");
    console.log("3. Commit clean code only");
  }

  // Link di aiuto
  console.log("\n" + colorize("For more help:", "blue"));
  console.log("📖 Read: SECURITY_SETUP.md");
  console.log("🔧 Run: npm run setup:env");

  // Titolo di chiusura
  logHeader("Configuration Check Complete");

  // =====================================================
  // USCITA CON CODICE APPROPRIATO
  // =====================================================

  // Exit code 0 = successo, 1 = errore
  // Il processo terminerà con un codice che altri script possono controllare
  process.exit(allConfigured && !securityIssues ? 0 : 1);
}

// =====================================================
// ESECUZIONE DELLO SCRIPT
// =====================================================

/**
 * CONTROLLO ESECUZIONE DIRETTA:
 * require.main === module è true solo quando questo file viene eseguito direttamente
 * (non quando viene importato da un altro file)
 */
if (require.main === module) {
  checkConfiguration();
}

// Esporta la funzione per uso in altri script
module.exports = { checkConfiguration };

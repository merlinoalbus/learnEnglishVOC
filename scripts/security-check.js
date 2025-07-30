#!/usr/bin/env node

// =====================================================
// 📁 scripts/security-check.js - SECURITY AUDIT DOCUMENTATO COMPLETO
// =====================================================

/**
 * **SCOPO DELLO SCRIPT:**
 * Questo script esegue un audit di sicurezza completo dell'app React "Vocabulary Master".
 * Controlla che non ci siano credenziali hardcoded nel codice sorgente, verifica
 * la configurazione di sicurezza e identifica vulnerabilità nelle dipendenze.
 *
 * **PERCHÉ È IMPORTANTE:**
 * - Previene leak di API key e credenziali nel codice
 * - Identifica vulnerabilità di sicurezza nelle librerie
 * - Verifica che i file sensibili non siano tracciati da Git
 * - Assicura best practices di sicurezza prima del deployment
 *
 * **QUANDO USARLO:**
 * - Prima di ogni commit importante
 * - Prima di ogni deployment in produzione
 * - Durante code review
 * - Come parte della CI/CD pipeline
 *
 * **COSA CONTROLLA:**
 * 1. Credenziali hardcoded nei file sorgente
 * 2. Configurazione .gitignore
 * 3. File .env tracciati da Git
 * 4. Vulnerabilità nelle dipendenze npm
 * 5. Storia Git per commit sospetti
 */

// =====================================================
// IMPORT MODULI NODE.JS
// =====================================================

const fs = require("fs"); // File system operations (leggere/scrivere file)
const path = require("path"); // Utilities per gestire percorsi file/cartelle
const { execSync } = require("child_process"); // Eseguire comandi shell sincroni

// =====================================================
// CONFIGURAZIONE COLORI CONSOLE
// =====================================================

/**
 * **CODICI COLORE ANSI:**
 * Questi codici controllano i colori del testo nel terminale.
 * Ogni codice \x1b[XXm cambia l'aspetto del testo che segue.
 */
const colors = {
  reset: "\x1b[0m", // Resetta al colore di default
  bright: "\x1b[1m", // Testo grassetto/luminoso
  red: "\x1b[31m", // Rosso per errori critici
  green: "\x1b[32m", // Verde per successi
  yellow: "\x1b[33m", // Giallo per avvisi
  blue: "\x1b[34m", // Blu per informazioni
  magenta: "\x1b[35m", // Magenta per header di sicurezza
  cyan: "\x1b[36m", // Ciano per risorse/link
};

/**
 * **FUNZIONE colorize:**
 * Applica un colore a una stringa di testo.
 *
 * @param {string} text - Il testo da colorare
 * @param {string} color - Il nome del colore (deve esistere in 'colors')
 * @returns {string} - Testo con codici colore ANSI
 */
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// =====================================================
// FUNZIONI DI LOGGING SPECIALIZZATE
// =====================================================

/**
 * **FUNZIONI LOG:**
 * Ogni funzione stampa messaggi con stili specifici per diversi livelli di gravità.
 */

// Header principale con emoji e cornice magenta
function logHeader(text) {
  console.log("\n" + colorize("=".repeat(60), "magenta"));
  console.log(colorize(`🔐 ${text}`, "magenta"));
  console.log(colorize("=".repeat(60), "magenta"));
}

// Sezione con emoji e sottolineatura blu
function logSection(text) {
  console.log("\n" + colorize(`🔍 ${text}`, "blue"));
  console.log(colorize("-".repeat(40), "blue"));
}

// Messaggio di successo (verde)
function logSuccess(text) {
  console.log(colorize(`✅ ${text}`, "green"));
}

// Avviso (giallo)
function logWarning(text) {
  console.log(colorize(`⚠️  ${text}`, "yellow"));
}

// Errore normale (rosso)
function logError(text) {
  console.log(colorize(`🚨 ${text}`, "red"));
}

// Informazione (blu)
function logInfo(text) {
  console.log(colorize(`ℹ️  ${text}`, "blue"));
}

// Errore critico (rosso lampeggiante)
function logCritical(text) {
  console.log(colorize(`💥 CRITICAL: ${text}`, "red"));
}

// =====================================================
// FUNZIONI UTILITY PER FILE SYSTEM
// =====================================================

/**
 * **FUNZIONE fileExists:**
 * Controlla se un file esiste nel filesystem in modo sicuro.
 *
 * @param {string} filePath - Percorso del file da controllare
 * @returns {boolean} - true se esiste, false altrimenti
 */
function fileExists(filePath) {
  try {
    // path.resolve() converte percorso relativo in assoluto
    // fs.existsSync() controlla esistenza in modo sincrono
    return fs.existsSync(path.resolve(filePath));
  } catch (error) {
    // In caso di errori (permessi, etc.), consideriamo il file non esistente
    return false;
  }
}

/**
 * **FUNZIONE getAllFiles:**
 * Scansiona ricorsivamente una directory e restituisce tutti i file.
 * Esclude automaticamente cartelle non-sorgente per performance.
 *
 * @param {string} dirPath - Cartella da scansionare
 * @param {string[]} arrayOfFiles - Array accumulatore (per ricorsione)
 * @returns {string[]} - Array di percorsi file completi
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  // Leggi tutti gli elementi nella directory
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    // Controlla se è una directory
    if (fs.statSync(fullPath).isDirectory()) {
      // **CARTELLE DA SALTARE:** Non scansionare cartelle che non contengono codice sorgente
      if (
        !["node_modules", "build", ".git", "dist", "coverage"].includes(file)
      ) {
        // Ricorsione: chiama la funzione su questa sottocartella
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // È un file: aggiungilo all'array
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// =====================================================
// DEFINIZIONE PATTERN DI SICUREZZA
// =====================================================

/**
 * **SECURITY_PATTERNS:**
 * Array di oggetti che definiscono cosa cercare nei file per trovare vulnerabilità.
 * Ogni pattern ha regex, severity level e descrizione.
 */
const SECURITY_PATTERNS = [
  {
    name: "Google API Keys",
    // Pattern per Google API keys: AIzaSy + 33 caratteri alfanumerici/underscore/dash
    pattern: /['"]AIzaSy[0-9A-Za-z-_]{33}['"]/g,
    severity: "CRITICAL",
    description: "Google API key detected",
  },
  {
    name: "Hardcoded API Keys",
    // Pattern generico per API keys hardcoded: apiKey = "lunga_stringa"
    pattern: /apiKey\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/g,
    severity: "HIGH",
    description: "Hardcoded API key",
  },
  {
    name: "Environment Variables in Code",
    // Variabili d'ambiente con valori hardcoded nel codice
    pattern: /REACT_APP_[A-Z_]+\s*[:=]\s*['"][^'"]+['"]/g,
    severity: "MEDIUM",
    description: "Environment variable with hardcoded value",
  },
  {
    name: "AWS Keys",
    // AWS Access Keys iniziano sempre con AKIA + 16 caratteri maiuscoli/numeri
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: "CRITICAL",
    description: "AWS access key detected",
  },
  {
    name: "Private Keys",
    // Inizio di chiavi private PEM
    pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
    severity: "CRITICAL",
    description: "Private key detected",
  },
  {
    name: "Database URLs",
    // Connection string di database con credenziali
    pattern: /(mongodb|postgres|mysql):\/\/[^\s'"]+/g,
    severity: "HIGH",
    description: "Database connection string",
  },
  {
    name: "JWT Tokens",
    // JWT tokens hanno formato specifico: header.payload.signature (base64)
    pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    severity: "HIGH",
    description: "JWT token detected",
  },
  {
    name: "Slack Tokens",
    // Slack tokens hanno formato specifico xox[tipo]-[numeri]-[hash]
    pattern: /xox[bpoa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32}/g,
    severity: "HIGH",
    description: "Slack token detected",
  },
];

// =====================================================
// CONFIGURAZIONE CONTROLLI
// =====================================================

// **ESTENSIONI DA CONTROLLARE:** File che possono contenere segreti
const CHECK_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".env",
  ".md",
  ".yml",
  ".yaml",
];

// **FILE CRITICI:** File che NON dovrebbero MAI contenere credenziali
const CRITICAL_FILES = [
  "package.json", // Metadati npm (pubblico)
  "package-lock.json", // Lock file npm (pubblico)
  "yarn.lock", // Lock file Yarn (pubblico)
  "README.md", // Documentazione (spesso pubblica)
  "SECURITY_SETUP.md", // Guida sicurezza (pubblica)
];

// =====================================================
// FUNZIONE SCANSIONE SEGRETI
// =====================================================

/**
 * **FUNZIONE checkFileForSecrets:**
 * Scansiona un singolo file alla ricerca di credenziali hardcoded.
 *
 * @param {string} filePath - Percorso del file da controllare
 * @returns {Array} - Array di problemi di sicurezza trovati
 */
function checkFileForSecrets(filePath) {
  try {
    // Leggi tutto il contenuto del file come stringa UTF-8
    const content = fs.readFileSync(filePath, "utf8");
    const issues = [];

    // **SKIP FILE TEMPLATE:** Non controllare file di esempio/template
    const fileName = path.basename(filePath);
    if (
      fileName.includes(".example") ||
      fileName.includes("template") ||
      fileName.includes("sample")
    ) {
      return issues;
    }

    // **SCANSIONE PATTERN:** Applica ogni pattern di sicurezza al contenuto
    SECURITY_PATTERNS.forEach(({ name, pattern, severity, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        // **FILTRO FALSI POSITIVI:** Rimuovi match che sono solo esempi/commenti
        const realMatches = matches.filter((match) => {
          // Trova la riga che contiene questo match
          const lines = content.split("\n");
          const matchLine = lines.find((line) => line.includes(match));

          // **SKIP COMMENTI:** Se il match è in un commento, non è un problema reale
          if (
            matchLine &&
            (matchLine.trim().startsWith("//") || // Commento JavaScript
              matchLine.trim().startsWith("*") || // Commento JSDoc
              matchLine.includes("example") || // Parola "example"
              matchLine.includes("your_api_key")) // Placeholder
          ) {
            return false;
          }

          // **SKIP PLACEHOLDER:** Valori placeholder comuni
          if (
            match.includes("your_api_key") ||
            match.includes("your_key_here") ||
            match.includes("example") ||
            match.includes("placeholder")
          ) {
            return false;
          }

          return true;
        });

        // **CREAZIONE ISSUE:** Per ogni match reale, crea un oggetto problema
        realMatches.forEach((match) => {
          issues.push({
            file: filePath,
            pattern: name,
            severity,
            description,
            // Tronca il match se è troppo lungo (per leggibilità)
            match: match.substring(0, 50) + (match.length > 50 ? "..." : ""),
            // Calcola numero di riga dove si trova il match
            line: content.substring(0, content.indexOf(match)).split("\n")
              .length,
          });
        });
      }
    });

    return issues;
  } catch (error) {
    // Se non riusciamo a leggere il file, restituisci array vuoto
    return [];
  }
}

// =====================================================
// CONTROLLO .GITIGNORE
// =====================================================

/**
 * **FUNZIONE checkGitignore:**
 * Verifica che .gitignore contenga tutti i pattern necessari per proteggere file sensibili.
 *
 * @returns {boolean} - true se .gitignore è configurato correttamente
 */
function checkGitignore() {
  logSection("Git Ignore Check");

  const gitignorePath = ".gitignore";

  // **PATTERN RICHIESTI:** File/cartelle che devono essere ignorate da Git
  const requiredPatterns = [
    ".env", // File environment principale
    ".env.local", // File environment locale
    ".env.development.local", // File environment sviluppo
    ".env.test.local", // File environment test
    ".env.production.local", // File environment produzione
    "*.backup", // File di backup
    "*.bak", // File di backup alternativi
    "*-secrets.*", // File con "secrets" nel nome
    "*-credentials.*", // File con "credentials" nel nome
  ];

  // Controlla se .gitignore esiste
  if (!fileExists(gitignorePath)) {
    logError("No .gitignore file found");
    return false;
  }

  // Leggi il contenuto di .gitignore
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  const missingPatterns = [];

  // **CONTROLLO PATTERN:** Verifica che ogni pattern richiesto sia presente
  requiredPatterns.forEach((pattern) => {
    if (!gitignoreContent.includes(pattern)) {
      missingPatterns.push(pattern);
    }
  });

  // **RISULTATO:** Successo se tutti i pattern sono presenti
  if (missingPatterns.length === 0) {
    logSuccess("Git ignore properly configured");
    return true;
  } else {
    logWarning(`Missing patterns in .gitignore: ${missingPatterns.join(", ")}`);
    return false;
  }
}

// =====================================================
// CONTROLLO FILE ENVIRONMENT
// =====================================================

/**
 * **FUNZIONE checkEnvironmentFiles:**
 * Controlla che i file .env non siano tracciati da Git.
 *
 * @returns {boolean} - true se non ci sono problemi
 */
function checkEnvironmentFiles() {
  logSection("Environment Files Check");

  // File .env da controllare
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];
  let hasIssues = false;

  envFiles.forEach((file) => {
    if (fileExists(file)) {
      if (file === ".env.example") {
        // File template: OK
        logSuccess(`Template file found: ${file}`);
      } else {
        logWarning(`Environment file detected: ${file}`);
        logInfo(
          "Ensure this file is in .gitignore and contains no real credentials"
        );

        // **CONTROLLO GIT TRACKING:** Verifica se il file è tracciato da Git
        try {
          // git ls-files --error-unmatch restituisce 0 se il file è tracciato
          execSync(`git ls-files --error-unmatch ${file}`, { stdio: "ignore" });
          // Se arriviamo qui, il file È tracciato (PROBLEMA CRITICO!)
          logCritical(`Environment file ${file} is tracked by Git!`);
          hasIssues = true;
        } catch (error) {
          // Se il comando fallisce, il file NON è tracciato (OK)
          logSuccess(`Environment file ${file} is not tracked by Git`);
        }
      }
    }
  });

  return !hasIssues;
}

// =====================================================
// CONTROLLO STORIA GIT
// =====================================================

/**
 * **FUNZIONE checkCommitHistory:**
 * Cerca nella storia Git commit che potrebbero contenere leak di credenziali.
 *
 * @returns {boolean} - true se non ci sono commit sospetti
 */
function checkCommitHistory() {
  logSection("Git History Check");

  try {
    // **RICERCA COMMIT SOSPETTI:** Cerca negli ultimi 10 commit messaggi che contengono parole-chiave
    const recentCommits = execSync(
      'git log --oneline -10 --grep="key\\|secret\\|password\\|token" -i',
      {
        encoding: "utf8",
        stdio: "pipe", // Cattura output invece di mostrarlo
      }
    );

    if (recentCommits.trim()) {
      logWarning("Found commits with potential credential-related messages:");
      console.log(recentCommits);
    } else {
      logSuccess("No suspicious commit messages found");
    }

    return true;
  } catch (error) {
    // Se non c'è repository Git o non ci sono commit
    logInfo("Could not check git history (no git repository or no commits)");
    return true;
  }
}

// =====================================================
// AUDIT NPM DEPENDENCIES
// =====================================================

/**
 * **FUNZIONE runNpmAudit:**
 * Esegue npm audit per trovare vulnerabilità nelle dipendenze.
 *
 * @returns {boolean} - true se non ci sono vulnerabilità critiche
 */
function runNpmAudit() {
  logSection("NPM Security Audit");

  try {
    // **NPM AUDIT:** Controlla vulnerabilità con livello moderate+ in formato JSON
    const auditResult = execSync("npm audit --audit-level=moderate --json", {
      encoding: "utf8",
      stdio: "pipe",
    });

    const audit = JSON.parse(auditResult);

    // **NESSUNA VULNERABILITÀ:** Caso ideale
    if (audit.metadata.vulnerabilities.total === 0) {
      logSuccess("No security vulnerabilities found in dependencies");
      return true;
    } else {
      // **VULNERABILITÀ TROVATE:** Mostra il breakdown per severità
      const { info, low, moderate, high, critical } =
        audit.metadata.vulnerabilities;

      // Mostra ogni livello con colore appropriato
      if (critical > 0) {
        logCritical(`${critical} critical vulnerabilities found`);
      }
      if (high > 0) {
        logError(`${high} high vulnerabilities found`);
      }
      if (moderate > 0) {
        logWarning(`${moderate} moderate vulnerabilities found`);
      }
      if (low > 0) {
        logInfo(`${low} low vulnerabilities found`);
      }
      if (info > 0) {
        logInfo(`${info} info vulnerabilities found`);
      }

      logInfo('Run "npm audit fix" to attempt automatic fixes');

      // **SOGLIA ACCETTABILITÀ:** Accettiamo moderate e low, blocchiamo critical e high
      return critical === 0 && high === 0;
    }
  } catch (error) {
    try {
      // **FALLBACK:** Prova senza flag JSON per versioni npm più vecchie
      execSync("npm audit", { stdio: "inherit" });
      return true;
    } catch (error2) {
      logWarning("Could not run npm audit");
      return true;
    }
  }
}

// =====================================================
// FUNZIONE PRINCIPALE
// =====================================================

/**
 * **FUNZIONE main:**
 * Esegue tutti i controlli di sicurezza e genera il report finale.
 */
function main() {
  logHeader("Security Audit - Vocabulary Master");

  // **CONTATORI PROBLEMI:** Traccia problemi per livello di severità
  let overallSecure = true;
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;

  // =====================================================
  // SCANSIONE CODICE SORGENTE
  // =====================================================

  logSection("Source Code Secret Scan");

  try {
    // **OTTENIMENTO FILE:** Scansiona tutti i file nella cartella src
    const allFiles = getAllFiles("./src");

    // **FILTRO ESTENSIONI:** Controlla solo file che possono contenere segreti
    const sourceFiles = allFiles.filter((file) =>
      CHECK_EXTENSIONS.some((ext) => file.endsWith(ext))
    );

    let totalIssues = 0;

    // **SCANSIONE FILE:** Controlla ogni file sorgente
    sourceFiles.forEach((file) => {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        issues.forEach((issue) => {
          totalIssues++;

          // **EMOJI SEVERITÀ:** Icona basata su gravità problema
          const icon =
            issue.severity === "CRITICAL"
              ? "💥"
              : issue.severity === "HIGH"
              ? "🚨"
              : "⚠️";

          // **OUTPUT PROBLEMA:** Mostra file, linea e descrizione
          console.log(
            `${icon} ${colorize(issue.severity, "red")} in ${colorize(
              issue.file,
              "yellow"
            )}:${issue.line}`
          );
          console.log(
            `   ${issue.description}: ${colorize(issue.match, "red")}`
          );

          // **CONTEGGIO SEVERITÀ:**
          if (issue.severity === "CRITICAL") criticalIssues++;
          else if (issue.severity === "HIGH") highIssues++;
          else mediumIssues++;
        });
      }
    });

    // **RISULTATO SCANSIONE:**
    if (totalIssues === 0) {
      logSuccess("No secrets detected in source code");
    } else {
      logError(`Found ${totalIssues} potential security issues`);
      overallSecure = false;
    }
  } catch (error) {
    logWarning("Could not scan source files");
  }

  // =====================================================
  // CONTROLLO FILE CRITICI
  // =====================================================

  logSection("Critical Files Check");

  // **SCANSIONE FILE CRITICI:** File che devono essere sempre puliti
  CRITICAL_FILES.forEach((file) => {
    if (fileExists(file)) {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        logCritical(`Secrets found in critical file: ${file}`);
        criticalIssues += issues.length;
        overallSecure = false;
      } else {
        logSuccess(`Clean: ${file}`);
      }
    }
  });

  // =====================================================
  // ESECUZIONE ALTRI CONTROLLI
  // =====================================================

  const gitignoreOk = checkGitignore();
  const envFilesOk = checkEnvironmentFiles();
  const commitHistoryOk = checkCommitHistory();
  const npmAuditOk = runNpmAudit();

  // **VALUTAZIONE COMPLESSIVA:**
  overallSecure =
    overallSecure && gitignoreOk && envFilesOk && commitHistoryOk && npmAuditOk;

  // =====================================================
  // ASSESSMENT FINALE
  // =====================================================

  logSection("Security Assessment");

  // **RIEPILOGO PROBLEMI:**
  if (criticalIssues > 0) {
    logCritical(`${criticalIssues} critical security issues found`);
  }
  if (highIssues > 0) {
    logError(`${highIssues} high-severity issues found`);
  }
  if (mediumIssues > 0) {
    logWarning(`${mediumIssues} medium-severity issues found`);
  }

  // **VERDETTO FINALE:**
  if (overallSecure && criticalIssues === 0) {
    logSuccess("Security audit passed!");
    logSuccess("No critical security issues detected");
  } else {
    logError("Security audit failed!");
    logError("Critical security issues must be addressed");
  }

  // =====================================================
  // RACCOMANDAZIONI
  // =====================================================

  logSection("Security Recommendations");

  // **AZIONI IMMEDIATE:** Se ci sono problemi critici
  if (criticalIssues > 0 || highIssues > 0) {
    console.log("\n" + colorize("🔥 IMMEDIATE ACTIONS REQUIRED:", "red"));
    console.log("1. Remove all hardcoded credentials from source code");
    console.log("2. Move credentials to environment variables");
    console.log("3. Add .env* files to .gitignore");
    console.log("4. Review git history for leaked credentials");
    console.log("5. Regenerate any exposed API keys");
  }

  // **BEST PRACTICES GENERALI:**
  console.log("\n" + colorize("🔐 General Security Best Practices:", "blue"));
  console.log("• Use environment variables for all secrets");
  console.log("• Keep .env files out of version control");
  console.log("• Regularly rotate API keys and credentials");
  console.log("• Run security audits before each deployment");
  console.log("• Use HTTPS for all external API calls");
  console.log("• Keep dependencies updated");

  // **RISORSE UTILI:**
  console.log("\n" + colorize("📚 Resources:", "cyan"));
  console.log("• Security Setup Guide: SECURITY_SETUP.md");
  console.log("• Environment Config: npm run config:status");
  console.log("• Git Secrets Tool: https://github.com/awslabs/git-secrets");

  logHeader("Security Audit Complete");

  // =====================================================
  // EXIT CODE
  // =====================================================

  // **EXIT CODE:** 0 = successo, 1 = fallimento
  // Altri script/CI possono controllare questo valore
  const exitCode = criticalIssues === 0 && overallSecure ? 0 : 1;
  if (exitCode !== 0) {
    logError("Security audit failed - fix issues before deployment");
  }

  // Termina il processo con il codice appropriato
  process.exit(exitCode);
}

// =====================================================
// ESECUZIONE SCRIPT
// =====================================================

/**
 * **CONTROLLO ESECUZIONE DIRETTA:**
 * require.main === module è true solo quando questo file viene eseguito direttamente
 */
if (require.main === module) {
  main();
}

// **EXPORT:** Rende la funzione disponibile per import in altri script
module.exports = { main };

// =====================================================
// ESEMPI DI UTILIZZO:
// =====================================================

/**
 * **ESECUZIONE MANUALE:**
 * node scripts/security-check.js
 *
 * **IN PACKAGE.JSON:**
 * "scripts": {
 *   "security:check": "node scripts/security-check.js"
 * }
 *
 * **IN CI/CD PIPELINE:**
 * npm run security:check && npm run deploy
 *
 * **CONTROLLO PRE-COMMIT:**
 * git add . && npm run security:check && git commit -m "feat: new feature"
 */

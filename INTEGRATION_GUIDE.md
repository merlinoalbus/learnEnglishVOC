# 🔄 Integration Guide - Security Configuration

## Overview

Questa guida ti aiuterà a integrare il nuovo sistema di configurazione sicura nella tua app Vocabulary Master esistente. La migrazione sposta tutte le credenziali da file hardcodati a environment variables.

---

## 📋 Pre-Migration Checklist

### Before Starting
- [ ] **Backup dei dati utente** (esporta vocabolario dall'app)
- [ ] **Backup del repository** (`git checkout -b backup-before-security-update`)
- [ ] **Nota la tua API key attuale** (se presente in `appConstants.js`)
- [ ] **Test dell'app corrente** per verificare funzionalità

### Required Tools
- [ ] Node.js >= 16.0.0
- [ ] npm >= 8.0.0
- [ ] Git (per version control)
- [ ] Editor di testo

---

## 🚀 Step-by-Step Integration

### Step 1: Backup e Preparazione

```bash
# Crea branch di backup
git checkout -b backup-before-security-update
git push origin backup-before-security-update

# Torna al branch principale
git checkout main

# Aggiorna le dipendenze
npm install
```

### Step 2: Integra i Nuovi File

1. **Crea la directory `config/`:**
   ```bash
   mkdir -p src/config
   ```

2. **Crea la directory `scripts/`:**
   ```bash
   mkdir -p scripts
   ```

3. **Aggiungi i nuovi file:**
   - Copia `src/config/appConfig.js` ✅
   - Copia `scripts/config-status.js` ✅
   - Copia `scripts/security-check.js` ✅
   - Copia `.env.example` ✅
   - Aggiorna `.gitignore` ✅

### Step 3: Migra la Configurazione

1. **Salva la tua API key attuale:**
   - Apri `src/constants/appConstants.js`
   - Copia il valore di `apiKey` dalla configurazione `AI_CONFIG`
   - Conserva temporaneamente questo valore

2. **Sostituisci i file esistenti:**
   - Sostituisci `src/constants/appConstants.js` con la versione aggiornata ✅
   - Sostituisci `src/services/aiService.js` con la versione aggiornata ✅

3. **Crea il file environment:**
   ```bash
   npm run setup:env
   ```

4. **Configura la tua API key:**
   ```bash
   # Modifica .env.local
   nano .env.local
   ```
   
   Aggiungi:
   ```bash
   REACT_APP_GEMINI_API_KEY=la_tua_api_key_qui
   REACT_APP_ENVIRONMENT=development
   REACT_APP_DEBUG_LOGGING=true
   ```

### Step 4: Aggiorna package.json

Aggiungi i nuovi script al tuo `package.json`:

```json
{
  "scripts": {
    "setup:env": "cp .env.example .env.local && echo 'Created .env.local - Please add your API keys!'",
    "check:env": "node scripts/check-env.js",
    "security:check": "npm audit && node scripts/security-check.js",
    "config:status": "node scripts/config-status.js"
  }
}
```

### Step 5: Test della Migrazione

1. **Verifica la configurazione:**
   ```bash
   npm run config:status
   ```

2. **Test di sicurezza:**
   ```bash
   npm run security:check
   ```

3. **Avvia l'app:**
   ```bash
   npm start
   ```

4. **Verifica funzionalità AI:**
   - Prova ad aggiungere una nuova parola
   - Verifica che l'AI assistant funzioni
   - Controlla la console per messaggi di debug

---

## 🔧 Troubleshooting

### Problema: "AI Service not configured"

**Causa:** API key non trovata

**Soluzione:**
```bash
# Verifica configurazione
npm run config:status

# Se .env.local è vuoto:
echo "REACT_APP_GEMINI_API_KEY=la_tua_api_key" >> .env.local

# Riavvia il server
npm start
```

### Problema: Import errors dopo l'aggiornamento

**Causa:** Cambiamenti nei path di import

**Soluzione:**
```javascript
// VECCHIO (potrebbe non funzionare più)
import { AI_CONFIG } from '../constants/appConstants';

// NUOVO (raccomandato)
import AppConfig from '../config/appConfig';
// Use: AppConfig.ai instead of AI_CONFIG

// COMPATIBILITY (funziona ma deprecated)
import { AI_CONFIG } from '../constants/appConstants';
// Continua a funzionare grazie ai re-exports
```

### Problema: Build fails in production

**Causa:** Environment variables non configurate nel hosting

**Soluzione:**

**Per Vercel:**
```bash
# Nel dashboard Vercel:
# Settings → Environment Variables
# Aggiungi: REACT_APP_GEMINI_API_KEY = your_api_key
```

**Per Netlify:**
```bash
# Nel dashboard Netlify:
# Site Settings → Environment Variables
# Aggiungi: REACT_APP_GEMINI_API_KEY = your_api_key
```

### Problema: Security check fails

**Causa:** API key ancora hardcodata nel codice

**Soluzione:**
```bash
# Trova API keys nel codice
grep -r "AIzaSy" src/

# Rimuovi manualmente ogni occorrenza trovata
# Le API keys devono essere solo in .env.local
```

---

## 🔄 Migrazione di Componenti Esistenti

### Se hai componenti che usano le vecchie configurazioni:

**Prima (Deprecated):**
```javascript
import { AI_CONFIG, ERROR_MESSAGES } from '../constants/appConstants';

const apiKey = AI_CONFIG.apiKey;
const timeout = AI_CONFIG.timeout;
```

**Dopo (Recommended):**
```javascript
import AppConfig, { ERROR_MESSAGES, isAIAvailable } from '../config/appConfig';

const apiKey = AppConfig.ai.apiKey;
const timeout = AppConfig.ai.timeout;
const canUseAI = isAIAvailable();
```

### Per componenti che controllano disponibilità AI:

**Prima:**
```javascript
const aiEnabled = !!AI_CONFIG.apiKey;
```

**Dopo:**
```javascript
import { isAIAvailable } from '../config/appConfig';
const aiEnabled = isAIAvailable();
```

---

## 📦 Deployment Checklist

### Before Deploying

- [ ] **Configurazione testata localmente**
- [ ] **Security check passato**: `npm run security:check`
- [ ] **No API keys nel codice sorgente**
- [ ] **Environment variables configurate nel hosting**
- [ ] **Build di test**: `npm run build`

### Hosting Configuration

**Vercel:**
```bash
# Environment Variables:
REACT_APP_GEMINI_API_KEY=your_production_api_key
REACT_APP_ENVIRONMENT=production
```

**Netlify:**
```bash
# Environment Variables:
REACT_APP_GEMINI_API_KEY=your_production_api_key
REACT_APP_ENVIRONMENT=production
```

**Other Platforms:**
- Consulta la documentazione del tuo provider
- Assicurati che tutte le variabili inizino con `REACT_APP_`

---

## 🔍 Validation Steps

### Post-Migration Testing

1. **Functionality Test:**
   ```bash
   npm start
   # Test: Add new word with AI assistance
   # Test: All existing features work
   # Test: Statistics and data export
   ```

2. **Security Validation:**
   ```bash
   npm run security:check
   # Should pass with no critical issues
   ```

3. **Configuration Check:**
   ```bash
   npm run config:status
   # Should show all green checkmarks
   ```

4. **Build Test:**
   ```bash
   npm run build
   # Should complete without errors
   ```

### Rollback Plan

Se qualcosa va storto:

```bash
# Torna al backup
git checkout backup-before-security-update

# Se necessario, ripristina i dati utente
# dall'export fatto prima della migrazione
```

---

## 🎯 Success Criteria

La migrazione è completata con successo quando:

- ✅ App starts without errors
- ✅ AI features work with environment variables
- ✅ Security check passes
- ✅ No hardcoded credentials in source code
- ✅ Production build works
- ✅ All existing features functional
- ✅ User data preserved

---

## 📞 Support

Se incontri problemi durante la migrazione:

1. **Check console errors** per messaggi specifici
2. **Run diagnostic tools**: `npm run config:status`
3. **Review security guide**: `SECURITY_SETUP.md`
4. **Check environment variables** sono configurate correttamente

**Common Issues:**
- API key format incorrect
- Environment variables not reloaded
- Import paths changed
- Production environment not configured

Seguendo questa guida passo-passo, dovresti riuscire a migrare la tua app esistente al nuovo sistema di configurazione sicura senza perdita di funzionalità! 🚀
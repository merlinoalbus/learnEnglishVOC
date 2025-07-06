# 🔐 Security Setup Guide - Vocabulary Master

## Overview

Questa guida spiega come configurare in modo sicuro le credenziali e le variabili d'ambiente per l'app Vocabulary Master. L'app utilizza l'API Gemini di Google per le funzionalità AI.

## ⚠️ Principi di Sicurezza

### ❌ Non Fare Mai
- **Non committare API keys** nel codice sorgente
- **Non condividere** file `.env` con credenziali reali
- **Non hardcodare** credenziali nei file JavaScript
- **Non utilizzare** credenziali di produzione in development

### ✅ Best Practices
- Utilizzare environment variables per tutte le credenziali
- Mantenere separati i file di configurazione per dev/staging/production
- Utilizzare `.env.local` per development (ignorato da git)
- Rigenerare le API keys se compromesse

---

## 🚀 Setup Development

### 1. Ottieni una API Key Gemini

1. Vai su [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Accedi con il tuo account Google
3. Clicca su "Create API Key"
4. Copia la chiave generata

### 2. Configura Environment Variables

1. **Copia il template delle variabili:**
   ```bash
   cp .env.example .env.local
   ```

2. **Modifica `.env.local`** e aggiungi la tua API key:
   ```bash
   # Sostituisci con la tua vera API key
   REACT_APP_GEMINI_API_KEY=tu_chiave_api_qui
   
   # Configurazione per development
   REACT_APP_ENVIRONMENT=development
   REACT_APP_DEBUG_LOGGING=true
   ```

3. **Verifica che `.env.local` sia nel `.gitignore`** (già incluso)

### 3. Avvia l'App

```bash
npm start
```

L'app dovrebbe ora funzionare con le funzionalità AI abilitate.

---

## 🔧 Variabili d'Ambiente Disponibili

### Required (Obbligatorie)
```bash
# API Key per Gemini AI (obbligatoria per funzionalità AI)
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

### Optional (Opzionali)
```bash
# Configurazione AI Service
REACT_APP_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
REACT_APP_AI_TIMEOUT=15000
REACT_APP_AI_MAX_RETRIES=3
REACT_APP_AI_RETRY_DELAY=1000

# App Environment
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG_LOGGING=true

# Feature Flags
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_STATISTICS=true
REACT_APP_ENABLE_DATA_MANAGEMENT=true

# Development
REACT_APP_MOCK_AI_RESPONSES=false
REACT_APP_MOCK_DELAY=1500
```

---

## 🌐 Setup Production

### Vercel Deployment

1. **Nel dashboard Vercel:**
   - Vai su Project Settings → Environment Variables
   - Aggiungi: `REACT_APP_GEMINI_API_KEY` = `la_tua_api_key`
   - Aggiungi: `REACT_APP_ENVIRONMENT` = `production`

2. **Rideploy il progetto** per applicare le nuove variabili

### Netlify Deployment

1. **Nel dashboard Netlify:**
   - Vai su Site Settings → Environment Variables
   - Aggiungi le variabili necessarie
   - Rebuilda il sito

### Altri Hosting Providers

Consulta la documentazione del tuo provider per aggiungere environment variables:
- **Heroku:** `heroku config:set REACT_APP_GEMINI_API_KEY=your_key`
- **Railway:** Dashboard → Variables
- **DigitalOcean App Platform:** Settings → Environment Variables

---

## 🛠️ Configurazione Avanzata

### Mock Mode per Development

Se non hai una API key o vuoi testare senza fare chiamate API:

```bash
# In .env.local
REACT_APP_MOCK_AI_RESPONSES=true
REACT_APP_MOCK_DELAY=1500
```

### Debug e Logging

Per debug esteso in development:

```bash
# In .env.local
REACT_APP_DEBUG_LOGGING=true
REACT_APP_ENVIRONMENT=development
```

### Feature Flags

Disabilita funzionalità specifiche se necessario:

```bash
# Disabilita funzionalità AI
REACT_APP_ENABLE_AI_FEATURES=false

# Disabilita statistiche
REACT_APP_ENABLE_STATISTICS=false
```

---

## 🐛 Troubleshooting

### App non trova l'API Key

**Sintomi:**
- Messaggio "AI Service not configured"
- Funzionalità AI disabilitate

**Soluzioni:**
1. Verifica che `.env.local` esista e contenga `REACT_APP_GEMINI_API_KEY`
2. Riavvia il server development (`npm start`)
3. Controlla la console per errori di configurazione

### API Key non valida

**Sintomi:**
- Errori "API Error 400" o "Invalid API key"

**Soluzioni:**
1. Verifica che l'API key sia corretta
2. Controlla che l'API key sia abilitata su Google AI Studio
3. Rigenera una nuova API key se necessario

### Funzionalità AI non disponibili

**Sintomi:**
- Bottoni AI disabilitati
- Modalità mock attiva

**Soluzioni:**
1. Controlla `REACT_APP_ENABLE_AI_FEATURES=true`
2. Verifica che `REACT_APP_MOCK_AI_RESPONSES=false`
3. Controlla la console per errori di configurazione

---

## 🔄 Migration da Versione Precedente

Se stai migrando da una versione con API key hardcoddata:

### 1. Backup dei Dati
```bash
# Esporta i tuoi dati dall'app prima della migrazione
```

### 2. Update del Codice
```bash
git pull origin main
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env.local
# Aggiungi la tua API key a .env.local
```

### 4. Rimuovi API Key dal Codice (se presente)
- ⚠️ Non lasciare API keys nel codice sorgente
- Le credenziali ora vengono caricate da environment variables

---

## 📋 Checklist Sicurezza

### Prima del Deploy
- [ ] Nessuna API key nel codice sorgente
- [ ] File `.env.local` non committato
- [ ] Variabili d'ambiente configurate nel hosting provider
- [ ] API key valida e funzionante
- [ ] Test delle funzionalità AI in production

### Manutenzione Periodica
- [ ] Rotazione delle API keys ogni 6-12 mesi
- [ ] Monitoring dell'uso delle API
- [ ] Review dei permessi e accessi
- [ ] Backup delle configurazioni

---

## 🆘 Supporto

### Documentation
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

### In caso di problemi di sicurezza
1. **Rimuovi immediatamente** credenziali compromesse dal codice
2. **Rigenera** tutte le API keys interessate
3. **Forza push** del repository pulito
4. **Verifica** che nessuna credenziale sia esposta

---

**⚠️ Ricorda: La sicurezza è responsabilità di tutti. Mai committare credenziali!**
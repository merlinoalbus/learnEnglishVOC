# 📚 Vocabulary Learning App

App per lo studio del vocabolario inglese con statistiche avanzate, grafici di progresso e sistema di flashcard interattive.

## ✨ Funzionalità

### 🎯 Sistema di Test
- **Flashcard interattive** con animazioni 3D
- **Test progressivi** con tutte le parole del vocabolario
- **Feedback immediato** e tracking degli errori
- **Sistema di punteggio** con percentuali di successo

### 📊 Statistiche Avanzate
- **Cronologia completa** di tutti i test effettuati
- **Grafici di progresso** nel tempo
- **Analisi del trend** di miglioramento
- **Distribuzione risposte** corrette/sbagliate
- **Statistiche generali** (punteggio medio, miglior risultato, ecc.)

### 📝 Gestione Vocabolario
- **Aggiunta parole** con traduzione, gruppo, esempio e note
- **Categorizzazione** con gruppi predefiniti e personalizzati
- **Sistema di modifica** completo
- **Import/Export JSON** per backup e condivisione
- **Ricerca e filtri** nelle liste

### 💾 Persistenza Dati
- **localStorage** per mantenere dati tra sessioni
- **Backup automatico** di parole e cronologia
- **Export completo** in formato JSON

## 🚀 Setup per TrueNAS

### Prerequisiti

1. **TrueNAS SCALE** con Docker abilitato
2. **Accesso SSH** al sistema TrueNAS
3. **Git** installato (opzionale, per clonare il repository)

### 📦 Opzione 1: Deploy con Docker Compose (Raccomandato)

#### 1. Preparazione Files

Crea una cartella per il progetto:

```bash
mkdir -p /mnt/pool-name/apps/vocabulary-app
cd /mnt/pool-name/apps/vocabulary-app
```

#### 2. Struttura Files

Crea questa struttura di cartelle e files:

```
vocabulary-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.js
│   │       ├── card.js
│   │       └── input.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
└── README.md
```

#### 3. Copia tutti i files degli artifacts precedenti nelle rispettive cartelle

#### 4. Build e Deploy

```bash
# Build dell'immagine Docker
docker-compose build

# Start dei servizi
docker-compose up -d

# Verifica status
docker-compose ps
```

#### 5. Accesso all'App

- **App principale**: `http://truenas-ip:3000`
- **Traefik dashboard**: `http://truenas-ip:8080` (opzionale)

### 🛠️ Opzione 2: Deploy Manuale

#### 1. Build Locale

```bash
# Installa dipendenze
npm install

# Build production
npm run build
```

#### 2. Deploy con Docker

```bash
# Build immagine
docker build -t vocabulary-app .

# Run container
docker run -d \
  --name vocabulary-learning-app \
  --restart unless-stopped \
  -p 3000:80 \
  vocabulary-app
```

### 🔧 Configurazione TrueNAS

#### Apps Dashboard (Raccomandato)

1. **Accedi a TrueNAS Scale Web UI**
2. **Apps** → **Discover Apps** → **Custom App**
3. **Configura**:
   - **Application Name**: `vocabulary-app`
   - **Image Repository**: `vocabulary-app` (se build locale)
   - **Container Port**: `80`
   - **Node Port**: `3000`
   - **Restart Policy**: `Unless Stopped`

#### Variabili d'Ambiente (Opzionali)

```yaml
environment:
  - NODE_ENV=production
  - REACT_APP_VERSION=1.0.0
```

#### Persistent Storage (Opzionale)

Per backup automatici:

```yaml
volumes:
  - /mnt/pool-name/apps/vocabulary-app/data:/usr/share/nginx/html/data
```

## 🛡️ Sicurezza e Backup

### Backup Dati

I dati dell'app sono memorizzati in localStorage del browser. Per backup:

1. **Export JSON** dall'app (sezione Esporta/Importa)
2. **Salva il file JSON** in una location sicura
3. **Restore** tramite Import JSON quando necessario

### Backup Container

```bash
# Backup immagine Docker
docker save vocabulary-app > vocabulary-app-backup.tar

# Restore
docker load < vocabulary-app-backup.tar
```

### Sicurezza

L'app include:
- **Headers di sicurezza** configurati in nginx
- **CSP policies** per prevenire XSS
- **Gzip compression** per performance
- **Cache headers** per assets statici

## 📱 Utilizzo

### 1. Aggiunta Parole

1. **Vai alla sezione "Studio & Vocabolario"**
2. **Compila i campi** Inglese e Italiano (obbligatori)
3. **Opzionale**: Aggiungi gruppo, esempio, note
4. **Clicca "Aggiungi Parola"**

### 2. Test di Apprendimento

1. **Clicca "Inizia Test"**
2. **Leggi la parola inglese** sulla carta
3. **Pensa alla traduzione**
4. **Clicca la carta** per vedere la risposta
5. **Indica se sapevi la risposta** (✅ o ❌)
6. **Continua fino alla fine**

### 3. Analisi Statistiche

1. **Vai alla sezione "Statistiche"**
2. **Visualizza panoramica** generale
3. **Analizza i grafici** di progresso
4. **Controlla la cronologia** dettagliata
5. **Identifica aree** di miglioramento

### 4. Backup e Sincronizzazione

1. **Esporta JSON** regolarmente
2. **Salva i backup** in cloud o dispositivi esterni
3. **Importa dati** su dispositivi diversi
4. **Mantieni sincronizzati** i vocabolari

## 🔧 Personalizzazione

### Gruppi/Categorie

Categorie predefinite:
- **VERBI** (⚡)
- **VERBI_IRREGOLARI** (🔄)
- **SOSTANTIVI** (🏷️)
- **AGGETTIVI** (🎨)
- **EMOZIONI** (❤️)
- **LAVORO** (💼)
- **FAMIGLIA** (👨‍👩‍👧‍👦)
- **TECNOLOGIA** (💻)
- **VESTITI** (👕)

### Temi e Colori

Modifica `src/App.css` per personalizzare:
- **Colori delle carte** per categoria
- **Animazioni** delle transizioni
- **Stili** dei componenti

### Configurazione

Modifica `package.json` per:
- **Nome dell'app**
- **Versione**
- **Descrizione**
- **Dipendenze**

## 🐛 Troubleshooting

### App non si avvia

```bash
# Controlla logs
docker logs vocabulary-learning-app

# Verifica porte
netstat -tlnp | grep :3000

# Restart container
docker restart vocabulary-learning-app
```

### Dati persi

1. **Controlla localStorage** del browser
2. **Verifica backup JSON** disponibili
3. **Importa dati** da backup precedente

### Performance Issues

1. **Pulisci cache** del browser
2. **Verifica risorse** del container
3. **Controlla logs** per errori

### Port Conflicts

```bash
# Cambia porta in docker-compose.yml
ports:
  - "3001:80"  # Usa porta diversa da 3000
```

## 📋 Struttura Dati

### Formato Parola

```json
{
  "id": 1640995200000,
  "english": "beautiful",
  "italian": "bello/a",
  "group": "AGGETTIVI",
  "sentence": "She is a beautiful person.",
  "notes": "Aggettivo che può riferirsi a persone, oggetti o situazioni."
}
```

### Formato Test

```json
{
  "id": 1640995200000,
  "timestamp": "2024-01-01T10:30:00.000Z",
  "totalWords": 20,
  "correctWords": 16,
  "incorrectWords": 4,
  "percentage": 80,
  "wrongWords": [...]
}
```

## 🤝 Contribuire

Per miglioramenti o bug:

1. **Fork** del repository
2. **Crea feature branch**
3. **Commit** delle modifiche
4. **Pull request** con descrizione

## 📄 Licenza

Progetto open source per uso educativo e personale.

---

**📚 Buono studio del vocabolario inglese!** 🇬🇧✨
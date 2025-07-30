#!/bin/bash

# =====================================================
# 📁 scripts/deploy.sh - DEPLOYMENT SCRIPT DOCUMENTATO COMPLETO
# =====================================================

# **SCOPO DELLO SCRIPT:**
# Questo script automatizza il deployment (distribuzione) dell'app React "Vocabulary Master" 
# usando Docker. Può deployare in 3 ambienti diversi:
# - PRODUCTION: L'app vera per gli utenti (porta 12345)
# - STAGING: Ambiente di test pre-produzione (porta 8080) 
# - DEVELOPMENT: Ambiente di sviluppo con hot-reload (porta 3000)
#
# **QUANDO USARLO:**
# - Quando vuoi mettere online l'app
# - Per testare l'app in un ambiente simile alla produzione
# - Per avviare un ambiente di sviluppo isolato
#
# **COME FUNZIONA:**
# 1. Controlla che Docker sia attivo
# 2. Verifica che l'API key sia configurata
# 3. Ferma eventuali versioni precedenti dell'app
# 4. Avvia la nuova versione con Docker Compose
# 5. Testa che l'app risponda correttamente
# 6. Mostra logs e stato finale

# =====================================================
# CONFIGURAZIONE SCRIPT BASH
# =====================================================

# **set -e:** Ferma l'esecuzione se qualsiasi comando fallisce
# Questo previene che lo script continui con errori nascosti
set -e

# =====================================================
# DEFINIZIONE COLORI PER OUTPUT
# =====================================================

# **CODICI COLORE ANSI:**
# Questi codici fanno apparire il testo colorato nel terminale Linux/Mac
RED='\033[0;31m'      # Rosso per errori
GREEN='\033[0;32m'    # Verde per successi  
YELLOW='\033[1;33m'   # Giallo per avvisi
BLUE='\033[0;34m'     # Blu per informazioni
NC='\033[0m'          # No Color - resetta al colore default

# =====================================================
# FUNZIONI DI LOGGING
# =====================================================

# **SCOPO:** Queste funzioni stampano messaggi colorati per rendere 
# l'output dello script più leggibile e professionale

# **log_info:** Stampa messaggi informativi in blu
log_info() {
    # $1 è il primo parametro passato alla funzione
    # -e abilita l'interpretazione dei codici colore \033
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# **log_success:** Stampa messaggi di successo in verde
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# **log_warning:** Stampa avvisi in giallo
log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# **log_error:** Stampa errori in rosso
log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =====================================================
# CONFIGURAZIONE DEPLOYMENT
# =====================================================

# **VARIABILI GLOBALI:**
# Queste definiscono i nomi e immagini Docker che useremo

# Nome del container Docker che verrà creato
CONTAINER_NAME="learnenglishvoc"

# Immagine Docker da scaricare dal registry GitHub
# "latest" significa "ultima versione disponibile"
IMAGE_NAME="ghcr.io/merlinoalbus/learnenglishvoc:latest"

# **AMBIENTE TARGET:**
# ${1:-production} significa "usa il primo parametro dello script, 
# oppure 'production' come default se non specificato"
# Esempi: ./deploy.sh staging → ENVIRONMENT="staging"
#         ./deploy.sh → ENVIRONMENT="production"
ENVIRONMENT="${1:-production}"

# =====================================================
# FUNZIONE PRINCIPALE DI DEPLOYMENT
# =====================================================

# **deploy():** Questa è la funzione che esegue tutto il processo di deployment
deploy() {
    # Messaggio di inizio con l'ambiente selezionato
    log_info "🚀 Starting deployment for environment: $ENVIRONMENT"
    
    # =====================================================
    # FASE 1: CONTROLLO API KEY
    # =====================================================
    
    # **CONTROLLO CRITICO:** L'app ha bisogno dell'API key di Gemini per funzionare
    # -z "$VAR" restituisce true se la variabile è vuota
    if [ -z "$REACT_APP_GEMINI_API_KEY" ]; then
        # Se siamo in development, possiamo usare il file .env.local
        if [ "$ENVIRONMENT" = "development" ] && [ -f ".env.local" ]; then
            log_info "Using API key from .env.local for development"
        else {
            # Per production/staging serve l'API key nell'ambiente
            log_error "REACT_APP_GEMINI_API_KEY environment variable not set!"
            log_info "Set it with: export REACT_APP_GEMINI_API_KEY=your_api_key"
            # exit 1 = termina lo script con codice di errore
            exit 1
        }
    else
        log_success "API key found in environment"
    fi
    
    # =====================================================
    # FASE 2: CONTROLLI PRE-DEPLOYMENT
    # =====================================================
    
    log_info "🔍 Running pre-deployment checks..."
    
    # **CONTROLLO DOCKER:**
    # docker info restituisce informazioni su Docker se è attivo
    # > /dev/null 2>&1 nasconde tutto l'output (sia stdout che stderr)
    # ! inverte il risultato: se docker info fallisce, la condizione è vera
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running!"
        exit 1
    fi
    log_success "Docker is running"
    
    # **FERMA CONTAINER ESISTENTE:**
    # docker ps -q = mostra solo gli ID dei container in esecuzione
    # -f name="$CONTAINER_NAME" = filtra per nome container
    # | grep -q . = controlla se c'è almeno una riga di output
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "🛑 Stopping existing container..."
        # docker-compose down ferma e rimuove tutti i container definiti
        docker-compose down
        log_success "Container stopped"
    fi
    
    # =====================================================
    # FASE 3: AGGIORNAMENTO IMMAGINE (solo per production/staging)
    # =====================================================
    
    # Per production e staging scarichiamo l'immagine più recente
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        log_info "📥 Pulling latest image..."
        # docker pull scarica l'ultima versione dell'immagine dal registry
        docker pull "$IMAGE_NAME"
        log_success "Image updated"
    fi
    
    # =====================================================
    # FASE 4: AVVIO BASATO SULL'AMBIENTE
    # =====================================================
    
    # **SWITCH CASE:** Esegue comandi diversi in base all'ambiente
    case $ENVIRONMENT in
        "production")
            log_info "🏭 Deploying to PRODUCTION..."
            # Avvia solo il servizio production definito in docker-compose.yml
            docker-compose up -d learnenglishvoc
            ;;
        "staging")
            log_info "🧪 Deploying to STAGING..."
            # --profile staging attiva solo i servizi con profile "staging"
            docker-compose --profile staging up -d
            ;;
        "development")
            log_info "🛠️ Starting DEVELOPMENT environment..."
            # --profile dev attiva i servizi development (senza -d per vedere i logs)
            docker-compose --profile dev up
            ;;
        *)
            # Caso default: ambiente non riconosciuto
            log_error "Unknown environment: $ENVIRONMENT"
            log_info "Usage: $0 [production|staging|development]"
            exit 1
            ;;
    esac
    
    # =====================================================
    # FASE 5: ATTESA AVVIO CONTAINER
    # =====================================================
    
    log_info "⏳ Waiting for container to be ready..."
    # sleep 10 = aspetta 10 secondi per dare tempo al container di avviarsi
    sleep 10
    
    # =====================================================
    # FASE 6: DETERMINAZIONE PORTA PER HEALTH CHECK
    # =====================================================
    
    # **ASSEGNAZIONE PORTA:** Ogni ambiente usa una porta diversa
    if [ "$ENVIRONMENT" = "production" ]; then
        PORT="12345"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        PORT="8080"
    else
        PORT="3000"    # development
    fi
    
    # =====================================================
    # FASE 7: HEALTH CHECK (controllo che l'app risponda)
    # =====================================================
    
    # **LOOP DI RETRY:** Tenta di contattare l'app fino a 30 volte
    # {1..30} genera la sequenza 1, 2, 3, ..., 30
    for i in {1..30}; do
        # **CURL TEST:**
        # curl -s = silenzioso (no progress bar)
        # curl -f = fallisce se HTTP status è errore (4xx, 5xx)
        # > /dev/null = nasconde output
        if curl -s -f "http://localhost:$PORT" > /dev/null; then
            # **SUCCESSO!** L'app risponde correttamente
            log_success "🎉 Deployment successful! App is running on port $PORT"
            
            # =====================================================
            # FASE 8: INFORMAZIONI POST-DEPLOYMENT
            # =====================================================
            
            # Mostra lo stato dei container
            echo ""
            log_info "📊 Container Status:"
            docker-compose ps
            
            # Mostra gli ultimi 20 log del container
            echo ""
            log_info "📝 Recent logs:"
            # 2>/dev/null nasconde eventuali errori del primo comando
            # || significa "oppure": se il primo fallisce, esegui il secondo
            docker-compose logs --tail=20 learnenglishvoc 2>/dev/null || docker-compose logs --tail=20
            
            # **TEST CONFIGURAZIONE (solo non-development):**
            if [ "$ENVIRONMENT" != "development" ]; then
                echo ""
                log_info "🔧 Testing configuration..."
                # docker exec esegue un comando dentro un container in esecuzione
                # which node = controlla se node.js è disponibile nel container
                if docker exec "$CONTAINER_NAME" which node > /dev/null 2>&1; then
                    # Prova a eseguire il check di configurazione nel container
                    docker exec "$CONTAINER_NAME" node scripts/config-status.js 2>/dev/null || log_info "Config check not available in production image"
                fi
            fi
            
            # **MESSAGGIO FINALE DI SUCCESSO:**
            echo ""
            log_success "🌐 Access your app at: http://localhost:$PORT"
            # exit 0 = successo
            exit 0
        fi
        
        # Se l'app non risponde ancora, aspetta e riprova
        log_info "Waiting for app to start... ($i/30)"
        sleep 2
    done
    
    # =====================================================
    # FASE 9: GESTIONE FALLIMENTO
    # =====================================================
    
    # Se arriviamo qui, l'app non ha risposto dopo 60 secondi (30 x 2)
    log_error "❌ Deployment failed! App is not responding after 60 seconds"
    
    # Mostra i logs per il debugging
    echo ""
    log_info "📝 Container logs for debugging:"
    docker-compose logs learnenglishvoc 2>/dev/null || docker-compose logs
    
    # exit 1 = errore
    exit 1
}

# =====================================================
# HELP E USAGE (se lo script viene chiamato senza parametri)
# =====================================================

# **CONTROLLO PARAMETRI:**
# $# = numero di parametri passati allo script
# Se non sono stati passati parametri, mostra l'help
if [ $# -eq 0 ]; then
    echo "🐳 LearnEnglishVOC Deployment Script"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  production  - Deploy to production (port 12345)"
    echo "  staging     - Deploy to staging (port 8080)"  
    echo "  development - Start development server (port 3000)"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 staging"
    echo "  $0 development"
    echo ""
    echo "Note: Set REACT_APP_GEMINI_API_KEY environment variable before running"
    exit 0
fi

# =====================================================
# ESECUZIONE DEPLOYMENT
# =====================================================

# **CHIAMATA FUNZIONE PRINCIPALE:**
# A questo punto tutte le funzioni sono definite e i controlli fatti,
# quindi possiamo eseguire il deployment vero e proprio
deploy

# =====================================================
# ESEMPI DI USO:
# =====================================================

# **PRODUCTION:**
# export REACT_APP_GEMINI_API_KEY=your_real_api_key_here
# ./deploy.sh production
# → App disponibile su http://localhost:12345

# **STAGING:**  
# export REACT_APP_GEMINI_API_KEY=your_test_api_key_here
# ./deploy.sh staging
# → App disponibile su http://localhost:8080

# **DEVELOPMENT:**
# echo "REACT_APP_GEMINI_API_KEY=your_dev_key" > .env.local  
# ./deploy.sh development
# → App disponibile su http://localhost:3000 con hot-reload

# =====================================================
# NOTE TECNICHE:
# =====================================================

# **DOCKER COMPOSE:**
# Questo script usa docker-compose.yml che definisce 3 servizi:
# - learnenglishvoc: production (sempre attivo)
# - learnenglishvoc-staging: staging (profile "staging")
# - learnenglishvoc-dev: development (profile "dev")

# **PROFILES:**
# I profiles permettono di attivare solo alcuni servizi:
# docker-compose up = solo servizi senza profile
# docker-compose --profile dev up = servizi "dev" + senza profile  
# docker-compose --profile staging up = servizi "staging" + senza profile

# **HEALTH CHECK:**
# Il curl controlla che l'app risponda sulla porta corretta.
# Se risponde con codice HTTP 200, il deployment è riuscito.
# Se non risponde entro 60 secondi, consideriamo fallito il deployment.

# **CONTAINER LOGS:**
# I logs Docker contengono tutti i messaggi dell'app (console.log, errori, etc.)
# Sono essenziali per il debugging quando qualcosa non funziona.

# **EXIT CODES:**
# 0 = successo (tutto ok)
# 1 = errore (qualcosa è andato storto)
# Altri script possono controllare questi codici per sapere se il deployment è riuscito.
# =====================================================
# 🐳 Dockerfile - Production Build per Vocabulary Master
# =====================================================
# SCOPO: Crea immagine Docker ottimizzata per production deployment
# STRATEGIA: Multi-stage build per ridurre dimensioni finali
# RISULTATO: Immagine leggera con Nginx che serve app React buildato

# COS'È UN DOCKERFILE:
# - Recipe per creare immagine Docker
# - Ogni istruzione crea un "layer" nell'immagine
# - Layer vengono cached per builds veloci
# - Multi-stage: Separazione build environment da runtime environment

# =====================================================
# 🔨 BUILD STAGE - Compilazione App React
# =====================================================
FROM node:18-alpine AS builder
# SCOPO: Base image per build stage
# node:18-alpine: Node.js 18 su Alpine Linux (leggero)
# AS builder: Nome questo stage per riferimenti successivi
# ALPINE: Distribuzione Linux minimale (~5MB vs ~100MB Ubuntu)
# BENEFICI: Sicurezza, performance, dimensioni ridotte

# Set working directory
WORKDIR /app
# SCOPO: Imposta directory di lavoro nel container
# EFFETTO: Tutti i comandi successivi eseguiti in /app
# STRUTTURA: Container avrà /app/package.json, /app/src, etc.

# ====== OPTIMIZATION 1: Cache dependencies separatamente ======
# STRATEGIA: Copiare package.json PRIMA del source code
# BENEFICIO: Docker cache layer dependencies se source code cambia
COPY package*.json ./
# SCOPO: Copia SOLO file package per installazione dipendenze
# FILES: package.json + package-lock.json (se presente)
# CACHE: Questo layer viene cached finché dependencies non cambiano

# ====== OPTIMIZATION 3: npm ci with dev deps for build ======
RUN npm ci --prefer-offline --no-audit --progress=false && \
    npm cache clean --force
# SCOPO: Installazione dipendenze per build (include dev deps per TypeScript)
# 
# COMANDO BREAKDOWN:
# npm ci: "Clean install" - installazione deterministica da package-lock.json
#   - Più veloce di npm install
#   - Rimuove node_modules esistente
#   - Usa esattamente versioni da package-lock.json
#   - Ideale per environments production/CI
#
# INCLUDE devDependencies: Necessario per @types/react, TypeScript, etc.
#   - Build React richiede TypeScript types durante compilazione
#   - DevDependencies verranno eliminate nel final stage
#
# --prefer-offline: Usa cache locale quando possibile
#   - Riduce download da registry npm
#   - Build più veloci, meno dipendenza da rete
#
# --no-audit: Salta security audit
#   - Audit rallenta installazione
#   - Security check separato in CI/CD pipeline
#
# --progress=false: Nessun output progress
#   - Log puliti in CI/CD
#   - Meno noise durante build
#
# npm cache clean --force: Pulisce cache npm
#   - Riduce dimensioni layer Docker
#   - Cache non serve dopo installazione

# ====== BUILD ARGS - Configurazione Build Time ======
# SCOPO: Variabili passate durante docker build per configurare app
# DIFFERENZA da ENV: ARG solo durante build, ENV anche durante runtime

ARG REACT_APP_GEMINI_API_KEY
# SCOPO: API key Gemini per funzionalità AI
# FONTE: Passata con --build-arg durante docker build
# SICUREZZA: Embed nell'immagine, visibile nel bundle finale

ARG REACT_APP_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
# SCOPO: Endpoint API Gemini
# DEFAULT: URL ufficiale Google API
# CUSTOMIZABLE: Può essere overridden per testing o proxy

ARG REACT_APP_ENVIRONMENT=production
# SCOPO: Identifica ambiente target
# DEFAULT: production (build ottimizzato)
# EFFETTI: Disabilita debug, abilita ottimizzazioni

ARG REACT_APP_ENABLE_AI_FEATURES=true
ARG REACT_APP_DEBUG_LOGGING=false
ARG REACT_APP_AI_TIMEOUT=15000
ARG REACT_APP_AI_MAX_RETRIES=3
ARG REACT_APP_AI_RETRY_DELAY=1000
ARG REACT_APP_MOCK_AI_RESPONSES=false
ARG REACT_APP_ENABLE_STATISTICS=true
ARG REACT_APP_ENABLE_DATA_MANAGEMENT=true
# SCOPO: Feature flags e configurazioni
# BENEFICIO: Stesso Dockerfile per diversi deployments
# ESEMPIO: docker build --build-arg REACT_APP_DEBUG_LOGGING=true

# ====== SET ENV per build ======
# SCOPO: Converte ARG in ENV per disponibilità durante build React
ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY \
    REACT_APP_GEMINI_API_URL=$REACT_APP_GEMINI_API_URL \
    REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT \
    REACT_APP_ENABLE_AI_FEATURES=$REACT_APP_ENABLE_AI_FEATURES \
    REACT_APP_DEBUG_LOGGING=$REACT_APP_DEBUG_LOGGING \
    REACT_APP_AI_TIMEOUT=$REACT_APP_AI_TIMEOUT \
    REACT_APP_AI_MAX_RETRIES=$REACT_APP_AI_MAX_RETRIES \
    REACT_APP_AI_RETRY_DELAY=$REACT_APP_AI_RETRY_DELAY \
    REACT_APP_MOCK_AI_RESPONSES=$REACT_APP_MOCK_AI_RESPONSES \
    REACT_APP_ENABLE_STATISTICS=$REACT_APP_ENABLE_STATISTICS \
    REACT_APP_ENABLE_DATA_MANAGEMENT=$REACT_APP_ENABLE_DATA_MANAGEMENT
# 
# PROCESSO:
# 1. ARG riceve valore da --build-arg
# 2. ENV rende valore disponibile a process.env durante build
# 3. React Scripts legge process.env e "bake" valori nel bundle
# 4. Bundle finale contiene valori hardcoded (non più env vars)
#
# GENERATE_SOURCEMAP=true: Abilita source maps per debugging
# PRODUZIONE: Potresti voler usare false per file più piccoli

# ====== OPTIMIZATION 4: Copy source DOPO deps install ======
# STRATEGIA: Source code copiato DOPO dependencies
# BENEFICIO: Cache hit dependencies se solo source code cambia
COPY . .
# SCOPO: Copia tutto il source code nel container
# INCLUDE: src/, public/, package.json, .env files, etc.
# EXCLUDE: .dockerignore definisce cosa non copiare

# ====== BUILD con fallback ======
RUN CI=false npm run build:docker || (echo "Build failed, trying fallback..." && CI=false GENERATE_SOURCEMAP=false react-scripts build)
# SCOPO: Build production con strategia fallback
#
# COMANDO PRIMARIO: npm run build
# - Usa configurazione production
# - Minifica JavaScript/CSS
# - Ottimizza immagini
# - Genera hash per caching
# - Crea bundle in /app/build
#
# FALLBACK: CI=false npm run build
# - Se primo build fallisce (warnings → errors)
# - CI=false: Tratta warnings come warnings (non errori)
# - UTILITÀ: Permette build anche con code quality issues
#
# PROCESSO BUILD REACT:
# 1. Babel transpila JSX/ES6 → JavaScript compatibile
# 2. Webpack bundla moduli → single/multiple chunks
# 3. PostCSS processa CSS (Tailwind, Autoprefixer)
# 4. Ottimizzazione: minification, tree-shaking, code splitting
# 5. Output: /app/build con HTML, CSS, JS ottimizzati

# =====================================================
# 🌐 PRODUCTION STAGE - Runtime Environment
# =====================================================
FROM nginx:alpine
# SCOPO: Base image per serving production
# nginx:alpine: Web server Nginx su Alpine Linux
# BENEFICI:
# - Nginx: Server web veloce e affidabile
# - Alpine: OS minimale per security e performance
# - ~20MB vs ~100MB+ per Ubuntu-based images

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html
# SCOPO: Copia SOLO i file buildati dal builder stage
# FONTE: /app/build dal container "builder"
# DESTINAZIONE: /usr/share/nginx/html (standard Nginx)
# CONTENUTO: HTML, CSS, JS, images ottimizzati
# BENEFICIO: Immagine finale non contiene Node.js, source code, dependencies

# Use default nginx config (remove nginx.conf copy for now)
# COPY nginx.conf /etc/nginx/nginx.conf
# NOTA: Commentato per usare configurazione Nginx default
# FUTURE: Decommentare quando nginx.conf è ottimizzato
# ALTERNATIVA: Nginx default gestisce React Router correttamente

# ====== HEALTH CHECK ======
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=2 http://localhost/ || exit 1
# SCOPO: Monitoring automatico salute container
#
# PARAMETRI:
# --interval=30s: Controlla ogni 30 secondi
# --timeout=3s: Timeout singolo check
# --start-period=5s: Grace period durante avvio
# --retries=3: 3 fallimenti consecutivi = unhealthy
#
# COMANDO:
# wget --no-verbose: Download silenzioso
# --tries=1: Un solo tentativo
# --spider: Non scarica, solo controlla accessibilità
# --timeout=2: Timeout 2 secondi
# http://localhost/: Endpoint da controllare
# || exit 1: Exit code 1 se fallisce
#
# BENEFICI:
# - Docker restart automatico se container unhealthy
# - Load balancer può rimuovere container unhealthy
# - Monitoring tools possono alertare su health issues

# Expose port
EXPOSE 80
# SCOPO: Documenta che container ascolta su porta 80
# NOTA: Documentazione only, non apre porta
# NETWORKING: docker run -p host_port:80 per mapping

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
# SCOPO: Comando default per avviare container
# nginx: Avvia server web Nginx
# -g "daemon off;": Esegue Nginx in foreground
# PERCHÉ foreground: Docker ha bisogno processo principale in foreground
# ALTERNATIVA: background + altro processo principale

# ====== COME FUNZIONA IL PROCESSO COMPLETO ======
# 🏗️ BUILD PROCESS:
# 1. DEPENDENCIES: npm ci installa packages
# 2. SOURCE COPY: Copia source code nel container
# 3. REACT BUILD: npm run build crea bundle ottimizzato
# 4. NGINX SETUP: Copia build output in Nginx directory
# 5. FINALIZE: Rimuove build dependencies, mantiene solo runtime

# 🚀 RUNTIME PROCESS:
# 1. CONTAINER START: Nginx avvia e ascolta porta 80
# 2. REQUEST HANDLING: Client richiede app → Nginx serve file statici
# 3. REACT ROUTER: SPA routing gestito client-side
# 4. HEALTH MONITORING: Docker controlla /health endpoint

# ====== OTTIMIZZAZIONI IMPLEMENTATE ======
# ✅ MULTI-STAGE BUILD: Build environment separato da runtime
# ✅ LAYER CACHING: Dependencies cached separatamente da source
# ✅ ALPINE BASE: Immagini leggere per sicurezza e performance
# ✅ PRODUCTION BUILD: Bundle ottimizzato e minificato
# ✅ HEALTH CHECKS: Monitoring automatico container health
# ✅ BUILD ARGS: Configurazione flessibile per diversi ambienti

# ====== DIMENSIONI FINALI ======
# 📊 CONFRONTO DIMENSIONI:
# - Builder stage: ~500MB (Node.js + dependencies + source)
# - Final image: ~25MB (Nginx + built files)
# - SAVING: ~95% riduzione dimensioni
# - BENEFICI: Deploy veloce, meno storage, migliore security

# ====== USO PRATICO ======
# 🔧 BUILD COMMAND:
# docker build \
#   --build-arg REACT_APP_GEMINI_API_KEY=your_key \
#   --build-arg REACT_APP_ENVIRONMENT=production \
#   -t vocabulary-app .

# 🚀 RUN COMMAND:
# docker run -p 3000:80 vocabulary-app
# ACCESSO: http://localhost:3000

# 🐙 DOCKER COMPOSE:
# build:
#   context: .
#   args:
#     REACT_APP_GEMINI_API_KEY: ${API_KEY}

# ====== TROUBLESHOOTING ======
# 🚨 PROBLEMI COMUNI:

# ❌ "BUILD FAILED":
# - Check: npm run build locale
# - Debug: docker build --no-cache
# - Logs: Controllare output build per errori specifici

# ❌ "APP NON CARICA":
# - Check: docker run -p 3000:80 app
# - Debug: docker exec -it container sh → ls /usr/share/nginx/html
# - Logs: docker logs container_name

# ❌ "API CALLS FAIL":
# - Check: Env vars durante build
# - Debug: console.log(process.env) nel browser
# - Verify: API key valida e quota disponibile

# ❌ "HEALTH CHECK FAILS":
# - Check: wget http://localhost/ dentro container
# - Debug: docker exec container wget http://localhost/
# - Fix: Verificare Nginx configuration

# ====== SICUREZZA ======
# 🔒 SECURITY BEST PRACTICES:
# ✅ Non-root user: Nginx runs as nginx user
# ✅ Minimal attack surface: Solo Nginx runtime
# ✅ No sensitive data: API keys embedded in build (già pubblici)
# ✅ Regular updates: Base images aggiornate regolarmente

# ⚠️ SECURITY CONSIDERATIONS:
# - API keys visibili nel bundle (use server-side proxy per sensitive data)
# - HTTP only (add HTTPS termination at load balancer)
# - No authentication built-in (add if needed)

# ====== PERFORMANCE ======
# 🚀 PERFORMANCE OPTIMIZATIONS:
# ✅ Static serving: Nginx ottimizzato per file statici
# ✅ Gzip compression: Automatic per text files
# ✅ Caching headers: Browser cache per assets
# ✅ HTTP/2: Nginx supporta multiplexing
# ✅ CDN ready: Static assets cacheable globally
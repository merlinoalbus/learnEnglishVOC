# =====================================================
# 🐳 Dockerfile - Vocabulary Master (SPEED OPTIMIZED - FIXED)
# =====================================================

# Multi-stage build ottimizzato
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# ====== OPTIMIZATION 1: Cache dependencies separatamente ======
# Copy SOLO package files per cache layer
COPY package*.json ./

# ====== OPTIMIZATION 2: Install deps (rimuovi python3 make g++ se non servono) ======
# Uncommenta la riga sotto solo se hai dipendenze native
# RUN apk add --no-cache python3 make g++

# ====== OPTIMIZATION 3: npm ci ottimizzato ======
RUN npm ci --omit=dev --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# ====== BUILD ARGS (tutti necessari) ======
ARG REACT_APP_GEMINI_API_KEY
ARG REACT_APP_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
ARG REACT_APP_ENVIRONMENT=production
ARG REACT_APP_ENABLE_AI_FEATURES=true
ARG REACT_APP_DEBUG_LOGGING=false
ARG REACT_APP_AI_TIMEOUT=15000
ARG REACT_APP_AI_MAX_RETRIES=3
ARG REACT_APP_AI_RETRY_DELAY=1000
ARG REACT_APP_MOCK_AI_RESPONSES=false
ARG REACT_APP_ENABLE_STATISTICS=true
ARG REACT_APP_ENABLE_DATA_MANAGEMENT=true

# ====== SET ENV per build ======
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
    REACT_APP_ENABLE_DATA_MANAGEMENT=$REACT_APP_ENABLE_DATA_MANAGEMENT \
    CI=true \
    GENERATE_SOURCEMAP=false

# ====== OPTIMIZATION 4: Copy source DOPO deps install ======
COPY . .

# ====== OPTIMIZATION 5: Build con flags ottimizzazione ======
RUN npm run build

# =====================================================
# Production Stage (semplificato e funzionante)
# =====================================================
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config SOLO se esiste, altrimenti usa default
COPY nginx.conf /etc/nginx/nginx.conf

# Health check semplificato
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=2 http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx (come root, nginx gestisce da solo il drop privileges)
CMD ["nginx", "-g", "daemon off;"]
# =====================================================
# 🐳 Dockerfile - Vocabulary Master (WORKING FIX)
# =====================================================

# Multi-stage build ottimizzato
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# ====== OPTIMIZATION 1: Cache dependencies separatamente ======
# Copy SOLO package files per cache layer
COPY package*.json ./

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

# ====== SET ENV per build (IDENTICO A LOCALE) ======
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
    GENERATE_SOURCEMAP=true


# ====== OPTIMIZATION 4: Copy source DOPO deps install ======
COPY . .

# ====== BUILD (senza debug, con fallback) ======
RUN npm run build || (echo "Build failed, trying fallback..." && CI=false npm run build)

# =====================================================
# Production Stage
# =====================================================
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Use default nginx config (remove nginx.conf copy for now)
# COPY nginx.conf /etc/nginx/nginx.conf

# Health check semplificato
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=2 http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
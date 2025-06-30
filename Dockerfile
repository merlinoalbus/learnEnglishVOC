# Multi-stage build per ottimizzare dimensioni e sicurezza
FROM node:18-alpine AS builder

# Imposta working directory
WORKDIR /app

# Installa git per clonare il repository (se necessario)
RUN apk add --no-cache git

# Copia package files per sfruttare cache Docker
COPY package*.json ./

# Installa dipendenze (solo production + dev per build)
RUN npm ci --only=production --silent && \
    npm ci --only=dev --silent && \
    npm cache clean --force

# Copia tutto il codice sorgente
COPY . .

# Build dell'applicazione React
RUN npm run build

# ==========================================
# Stage 2: Production con Nginx
# ==========================================
FROM nginx:alpine AS production

# Copia i file build dalla stage precedente
COPY --from=builder /app/build /usr/share/nginx/html

# Copia configurazione Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crea utente non-root per sicurezza
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Esponi porta 80
EXPOSE 80

# Health check per verificare che l'app funzioni
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"]
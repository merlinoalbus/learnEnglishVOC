# Multi-stage build per ottimizzare dimensioni e sicurezza
FROM node:18-alpine AS builder

# Imposta working directory
WORKDIR /app

# Installa dipendenze di sistema necessarie
RUN apk add --no-cache git python3 make g++

# Copia package files per sfruttare cache Docker
COPY package*.json ./

# Installa dipendenze in modo più robusto
RUN npm install --silent && npm cache clean --force

# Copia tutto il codice sorgente
COPY . .

# Build dell'applicazione React
RUN npm run build

# ==========================================
# Stage 2: Production con Nginx
# ==========================================
FROM nginx:alpine AS production

# Installa wget per health check
RUN apk add --no-cache wget

# Copia i file build dalla stage precedente
COPY --from=builder /app/build /usr/share/nginx/html

# Copia configurazione Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crea cartella per logs
RUN mkdir -p /var/log/nginx

# Esponi porta 80
EXPOSE 80

# Health check per verificare che l'app funzioni
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"]
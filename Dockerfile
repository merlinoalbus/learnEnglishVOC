# Build stage
FROM node:18-alpine AS builder

# Installa git per clonare il repository
RUN apk add --no-cache git

# Imposta directory di lavoro
WORKDIR /app

# Clona il repository
RUN git clone https://github.com/merlinoalbus/learnEnglishVOC.git .

# Installa dipendenze
RUN npm ci --only=production

# Build dell'applicazione
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Installa serve e curl per healthcheck
RUN npm install -g serve && \
    apk add --no-cache curl

# Crea utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Imposta directory di lavoro
WORKDIR /app

# Copia i file build dal stage precedente
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

# Cambia ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Comando per avviare l'applicazione
CMD ["serve", "-s", "build", "-l", "3000"]
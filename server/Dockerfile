# =====================================================
# 🐳 server/Dockerfile - Gemini AI proxy backend
# =====================================================
# Immagine leggera Node che espone il proxy AI su :3001.
# La GEMINI_API_KEY NON viene mai messa qui: è iniettata SOLO a runtime
# (docker-compose environment / secret di deploy).

FROM node:18-alpine

WORKDIR /app

# Cache dependencies: copia prima i manifest
COPY package*.json ./

# Installazione solo dipendenze di produzione.
# Fallback a npm install se manca il lockfile.
RUN npm ci --omit=dev --no-audit --progress=false || npm install --omit=dev --no-audit --progress=false

# Codice applicativo
COPY index.js ./

ENV PORT=3001
EXPOSE 3001

# Esecuzione non-root
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "index.js"]

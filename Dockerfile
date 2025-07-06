# =====================================================
# 🐳 Dockerfile - Vocabulary Master (Secure Build)
# =====================================================

# Multi-stage build per ottimizzazione
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Prima di npm ci
RUN apk add --no-cache python3 make g++

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Build args per environment variables (opzionali per build-time)
ARG REACT_APP_ENVIRONMENT=production
ARG REACT_APP_ENABLE_AI_FEATURES=true
ARG REACT_APP_DEBUG_LOGGING=false

# Set environment variables per build
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV REACT_APP_ENABLE_AI_FEATURES=$REACT_APP_ENABLE_AI_FEATURES
ENV REACT_APP_DEBUG_LOGGING=$REACT_APP_DEBUG_LOGGING

# IMPORTANTE: NON includere REACT_APP_GEMINI_API_KEY qui!
# Sarà passata a runtime tramite docker run o docker-compose

# Build the app
RUN npm run build

# =====================================================
# Production Stage
# =====================================================
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
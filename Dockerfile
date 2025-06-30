# Dockerfile
# This Dockerfile sets up a multi-stage build for a React application using Node.js and Nginx.
# It builds the application in a Node.js environment and serves it using Nginx in production.
# Use Node.js as the base image for the build stage

## Multi-stage build per ottimizzare dimensioni
FROM node:18-alpine AS builder

# Metadata
LABEL maintainer="merlinoalbus"
LABEL description="Vocabulary Learning App - English Study Tool"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (solo production + dev per build)
RUN npm ci --include=dev && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S reactjs -u 1001 -G nodejs

# Set permissions
RUN chown -R reactjs:nodejs /usr/share/nginx/html && \
    chown -R reactjs:nodejs /var/cache/nginx && \
    chown -R reactjs:nodejs /var/log/nginx && \
    chown -R reactjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R reactjs:nodejs /var/run/nginx.pid

# Create directory for custom data persistence
RUN mkdir -p /app/data && chown -R reactjs:nodejs /app/data

# Switch to non-root user
USER reactjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
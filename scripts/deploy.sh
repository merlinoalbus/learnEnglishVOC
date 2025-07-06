#!/bin/bash

# =====================================================
# 📁 scripts/deploy.sh - Deployment Script per LearnEnglishVOC
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
CONTAINER_NAME="learnenglishvoc"
IMAGE_NAME="ghcr.io/merlinoalbus/learnenglishvoc:latest"
ENVIRONMENT="${1:-production}"

# Main deployment function
deploy() {
    log_info "🚀 Starting deployment for environment: $ENVIRONMENT"
    
    # Check if API key is set
    if [ -z "$REACT_APP_GEMINI_API_KEY" ]; then
        if [ "$ENVIRONMENT" = "development" ] && [ -f ".env.local" ]; then
            log_info "Using API key from .env.local for development"
        else
            log_error "REACT_APP_GEMINI_API_KEY environment variable not set!"
            log_info "Set it with: export REACT_APP_GEMINI_API_KEY=your_api_key"
            exit 1
        fi
    else
        log_success "API key found in environment"
    fi
    
    # Pre-deployment checks
    log_info "🔍 Running pre-deployment checks..."
    
    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running!"
        exit 1
    fi
    log_success "Docker is running"
    
    # Check if container exists and stop it
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "🛑 Stopping existing container..."
        docker-compose down
        log_success "Container stopped"
    fi
    
    # Pull latest image (for production)
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        log_info "📥 Pulling latest image..."
        docker pull "$IMAGE_NAME"
        log_success "Image updated"
    fi
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "production")
            log_info "🏭 Deploying to PRODUCTION..."
            docker-compose up -d learnenglishvoc
            ;;
        "staging")
            log_info "🧪 Deploying to STAGING..."
            docker-compose --profile staging up -d
            ;;
        "development")
            log_info "🛠️ Starting DEVELOPMENT environment..."
            docker-compose --profile dev up
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_info "Usage: $0 [production|staging|development]"
            exit 1
            ;;
    esac
    
    # Wait for container to be ready
    log_info "⏳ Waiting for container to be ready..."
    sleep 10
    
    # Health check
    if [ "$ENVIRONMENT" = "production" ]; then
        PORT="12345"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        PORT="8080"
    else
        PORT="3000"
    fi
    
    # Test if app is responding
    for i in {1..30}; do
        if curl -s -f "http://localhost:$PORT" > /dev/null; then
            log_success "🎉 Deployment successful! App is running on port $PORT"
            
            # Show container status
            echo ""
            log_info "📊 Container Status:"
            docker-compose ps
            
            # Show logs
            echo ""
            log_info "📝 Recent logs:"
            docker-compose logs --tail=20 learnenglishvoc 2>/dev/null || docker-compose logs --tail=20
            
            # Configuration check (if in production/staging)
            if [ "$ENVIRONMENT" != "development" ]; then
                echo ""
                log_info "🔧 Testing configuration..."
                if docker exec "$CONTAINER_NAME" which node > /dev/null 2>&1; then
                    # If Node.js is available in container, run config check
                    docker exec "$CONTAINER_NAME" node scripts/config-status.js 2>/dev/null || log_info "Config check not available in production image"
                fi
            fi
            
            echo ""
            log_success "🌐 Access your app at: http://localhost:$PORT"
            exit 0
        fi
        
        log_info "Waiting for app to start... ($i/30)"
        sleep 2
    done
    
    log_error "❌ Deployment failed! App is not responding after 60 seconds"
    
    # Show logs for debugging
    echo ""
    log_info "📝 Container logs for debugging:"
    docker-compose logs learnenglishvoc 2>/dev/null || docker-compose logs
    
    exit 1
}

# Show usage if no arguments
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

# Run deployment
deploy
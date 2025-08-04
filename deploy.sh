#!/bin/bash

# FreeSWITCH PBX Deployment Script
# Supports both development and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before continuing."
        print_warning "For production, set NODE_ENV=production and update security values."
        exit 1
    fi
}

# Load environment variables
load_env() {
    print_status "Loading environment variables..."
    set -a

    # Load environment files in priority order
    if [ -f ".env.production.local" ]; then
        print_status "Loading .env.production.local..."
        source .env.production.local
    elif [ -f ".env.production" ]; then
        print_status "Loading .env.production..."
        source .env.production
    fi

    # Load base .env as fallback
    if [ -f ".env" ]; then
        print_status "Loading .env as fallback..."
        source .env
    fi

    set +a
}

# Validate required environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "FREESWITCH_ESL_PASSWORD")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check for default/insecure values in production
    if [ "${NODE_ENV}" = "production" ]; then
        insecure_vars=()
        
        if [ "${POSTGRES_PASSWORD}" = "pbx_password" ]; then
            insecure_vars+=("POSTGRES_PASSWORD")
        fi
        
        if [ "${JWT_SECRET}" = "your-super-secret-jwt-key-change-this-in-production" ]; then
            insecure_vars+=("JWT_SECRET")
        fi
        
        if [ "${FREESWITCH_ESL_PASSWORD}" = "ClueCon" ]; then
            insecure_vars+=("FREESWITCH_ESL_PASSWORD")
        fi
        
        if [ ${#insecure_vars[@]} -gt 0 ]; then
            print_error "Production deployment detected with insecure default values:"
            for var in "${insecure_vars[@]}"; do
                print_error "  - $var"
            done
            print_error "Please update these values in .env file before deploying to production"
            exit 1
        fi
    fi
    
    print_success "Environment validation passed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=(
        "configs/freeswitch"
        "configs/freeswitch-logs"
        "configs/freeswitch-sounds"
        "recordings"
        "database/init"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    # Set proper permissions
    chmod 755 recordings
    chmod 755 configs/freeswitch-logs
    
    print_success "Directories created successfully"
}

# Deploy services
deploy_services() {
    print_status "Deploying FreeSWITCH PBX System..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose pull
    
    # Build custom images
    print_status "Building custom images..."
    docker-compose build
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Check service health
check_health() {
    print_status "Waiting for services to be ready..."
    sleep 30
    
    print_status "Checking service health..."
    
    services=("postgres" "redis" "rabbitmq" "freeswitch" "nestjs-api" "frontend")
    all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up.*healthy\|$service.*Up[^(]"; then
            print_success "$service is running"
        else
            print_warning "$service is not healthy yet"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        print_success "All services are running!"
    else
        print_warning "Some services are not healthy yet. Check logs with: docker-compose logs"
    fi
}

# Display service information
show_info() {
    print_status "Service Information:"
    echo "=================================="
    echo "Environment: ${NODE_ENV}"
    echo "Frontend:     http://localhost:3002"
    echo "Backend API:  http://localhost:3000"
    echo "Health Check: http://localhost:3000/api/v1/health"
    echo "Grafana:      http://localhost:3001"
    echo "RabbitMQ:     http://localhost:15672"
    echo "=================================="
    
    if [ "${NODE_ENV}" = "production" ]; then
        print_warning "Production deployment completed!"
        print_warning "Remember to:"
        print_warning "1. Configure your reverse proxy/load balancer"
        print_warning "2. Set up SSL certificates"
        print_warning "3. Configure firewall rules"
        print_warning "4. Set up monitoring and backups"
    fi
}

# Main deployment function
main() {
    print_status "Starting FreeSWITCH PBX deployment..."
    
    check_env_file
    load_env
    validate_env
    create_directories
    deploy_services
    check_health
    show_info
    
    print_success "Deployment completed successfully!"
    
    print_status "Useful Commands:"
    echo "- View logs: docker-compose logs -f"
    echo "- Check status: docker-compose ps"
    echo "- Stop services: docker-compose down"
    echo "- Restart services: docker-compose restart"
}

# Run main function
main "$@"

#!/bin/bash

# 🔧 Development Environment Startup Script for MacOS
# This script helps manage the development environment easily

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start development environment"
    echo "  stop      - Stop development environment"
    echo "  restart   - Restart development environment"
    echo "  rebuild   - Rebuild and start development environment"
    echo "  logs      - Show logs from all services"
    echo "  clean     - Stop and remove all containers and volumes"
    echo "  status    - Show status of all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 rebuild"
}

# Start development environment
start_dev() {
    print_status "Starting development environment..."
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    print_success "Development environment started!"
    print_status "Services available at:"
    echo "  - Frontend: http://localhost:3002"
    echo "  - API: http://localhost:3000"
    echo "  - API Docs: http://localhost:3000/api/docs"
    echo "  - Grafana: http://localhost:3001 (admin/admin123)"
    echo "  - RabbitMQ: http://localhost:15672 (admin/admin123)"
    echo "  - Prometheus: http://localhost:9090"
}

# Stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml --env-file .env.dev down
    print_success "Development environment stopped!"
}

# Restart development environment
restart_dev() {
    print_status "Restarting development environment..."
    docker-compose -f docker-compose.dev.yml --env-file .env.dev down
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    print_success "Development environment restarted!"
}

# Rebuild development environment
rebuild_dev() {
    print_status "Rebuilding development environment..."
    docker-compose -f docker-compose.dev.yml --env-file .env.dev down
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up --build -d
    print_success "Development environment rebuilt and started!"
}

# Show logs
show_logs() {
    print_status "Showing logs from all services..."
    docker-compose -f docker-compose.dev.yml --env-file .env.dev logs -f
}

# Clean everything
clean_dev() {
    print_warning "This will remove all containers and volumes. All data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning development environment..."
        docker-compose -f docker-compose.dev.yml --env-file .env.dev down -v --remove-orphans
        docker system prune -f
        print_success "Development environment cleaned!"
    else
        print_status "Clean operation cancelled."
    fi
}

# Show status
show_status() {
    print_status "Development environment status:"
    docker-compose -f docker-compose.dev.yml --env-file .env.dev ps
}

# Main script logic
case "${1:-help}" in
    start)
        check_docker
        start_dev
        ;;
    stop)
        check_docker
        stop_dev
        ;;
    restart)
        check_docker
        restart_dev
        ;;
    rebuild)
        check_docker
        rebuild_dev
        ;;
    logs)
        check_docker
        show_logs
        ;;
    clean)
        check_docker
        clean_dev
        ;;
    status)
        check_docker
        show_status
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

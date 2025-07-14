#!/bin/bash

# FreeSWITCH PBX System - Stop Script
# Safely stops all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Stopping FreeSWITCH PBX System..."

# Check if docker-compose.production.yml exists
if [ ! -f "docker-compose.production.yml" ]; then
    print_error "docker-compose.production.yml not found!"
    exit 1
fi

# Stop services gracefully
print_status "Stopping services gracefully..."
docker-compose -f docker-compose.production.yml stop

# Remove containers
if [ "$1" = "--remove" ]; then
    print_warning "Removing containers..."
    docker-compose -f docker-compose.production.yml down
    print_success "Containers removed"
elif [ "$1" = "--remove-all" ]; then
    print_warning "Removing containers and volumes..."
    docker-compose -f docker-compose.production.yml down -v
    print_warning "All data has been removed!"
else
    print_status "Services stopped. Use --remove to remove containers or --remove-all to remove everything including data"
fi

print_success "FreeSWITCH PBX System stopped successfully!"

# Show usage
echo ""
print_status "Usage:"
echo "./stop.sh                 - Stop services only"
echo "./stop.sh --remove        - Stop and remove containers"
echo "./stop.sh --remove-all    - Stop and remove containers + volumes (WARNING: deletes all data)"

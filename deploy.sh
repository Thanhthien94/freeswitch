#!/bin/bash

# FreeSWITCH PBX System - Production Deployment Script
# This script deploys the FreeSWITCH system without internal Nginx
# Designed for servers with existing Nginx Proxy Manager

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Starting FreeSWITCH PBX System deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Creating from template..."
    cp .env.production.example .env.production 2>/dev/null || {
        print_error "No .env.production template found. Please create .env.production file manually."
        exit 1
    }
    print_warning "Please edit .env.production with your production values before continuing."
    read -p "Press Enter to continue after editing .env.production..."
fi

# Load environment variables
set -a
source .env.production
set +a

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "RABBITMQ_PASSWORD" "JWT_SECRET" "FREESWITCH_ESL_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_secure_*_password_here" ]; then
        print_error "Please set $var in .env.production file"
        exit 1
    fi
done

print_status "Environment variables validated successfully"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p configs/freeswitch
mkdir -p configs/freeswitch-logs
mkdir -p configs/freeswitch-sounds
mkdir -p recordings
mkdir -p database/init

# Set proper permissions
print_status "Setting directory permissions..."
chmod 755 recordings
chmod 755 configs/freeswitch-logs

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull

# Build custom images
print_status "Building custom images..."
docker-compose -f docker-compose.production.yml build

# Start services
print_status "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
services=("postgres-db" "redis-cache" "rabbitmq-queue" "freeswitch-core" "nestjs-api" "frontend-ui")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.production.yml ps | grep -q "$service.*Up.*healthy"; then
        print_success "$service is healthy"
    else
        print_warning "$service is not healthy yet"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All services are healthy!"
else
    print_warning "Some services are not healthy yet. Check logs with: docker-compose -f docker-compose.production.yml logs"
fi

# Display service information
print_status "Service Information:"
echo "=================================="
echo "Frontend:     http://localhost:3002"
echo "Backend API:  http://localhost:3000"
echo "Health Check: http://localhost:3000/api/v1/health"
echo "=================================="

print_status "Nginx Proxy Manager Configuration:"
echo "1. Frontend: Point your domain to localhost:3002"
echo "2. API: Create custom location /api/ pointing to localhost:3000"
echo "3. Enable SSL with Let's Encrypt"
echo "4. Configure WebSocket support"

# Display next steps
print_success "Deployment completed successfully!"
echo ""
print_status "Next Steps:"
echo "1. Configure Nginx Proxy Manager with the information above"
echo "2. Test the health endpoint: curl http://localhost:3000/api/v1/health"
echo "3. Access the frontend at your configured domain"
echo "4. Configure SIP clients to connect to your domain:5060"
echo ""
print_status "Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "- Check status: docker-compose -f docker-compose.production.yml ps"
echo "- Stop services: docker-compose -f docker-compose.production.yml down"
echo "- Restart services: docker-compose -f docker-compose.production.yml restart"
echo ""
print_warning "Remember to:"
echo "- Configure your firewall to allow ports 5060/udp and 16384-16484/udp for SIP"
echo "- Set up regular backups for your database and recordings"
echo "- Monitor your system logs regularly"

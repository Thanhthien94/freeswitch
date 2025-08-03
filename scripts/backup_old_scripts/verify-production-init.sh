#!/bin/bash

# Production Initialization Verification Script
# This script verifies that production deployment and data initialization completed successfully

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

print_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
DB_USER="pbx_user"
DB_NAME="pbx_production"

print_header "PRODUCTION INITIALIZATION VERIFICATION"

# Check if running in production directory
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Production docker-compose file not found: $COMPOSE_FILE"
    print_error "Please run this script from the project root directory"
    exit 1
fi

# 1. Container Health Check
print_header "1. CONTAINER HEALTH CHECK"

CONTAINERS=("postgres-db" "redis-cache" "rabbitmq-queue" "freeswitch-core" "nestjs-api" "frontend-ui")
all_healthy=true

for container in "${CONTAINERS[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up.*healthy"; then
        print_success "$container is running and healthy"
    elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
        print_warning "$container is running but health check not available"
    else
        print_error "$container is not running or unhealthy"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    print_error "Some containers are not healthy. Check with: docker-compose -f $COMPOSE_FILE ps"
fi

# 2. Database Connection Test
print_header "2. DATABASE CONNECTION TEST"

if docker exec postgres-db pg_isready -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database"
    exit 1
fi

# 3. Database Schema Verification
print_header "3. DATABASE SCHEMA VERIFICATION"

REQUIRED_TABLES=(
    "domains"
    "users" 
    "roles"
    "permissions"
    "user_roles"
    "role_permissions"
    "call_detail_records"
    "call_recordings"
    "audit_logs"
)

schema_ok=true
for table in "${REQUIRED_TABLES[@]}"; do
    if docker exec postgres-db psql -U $DB_USER -d $DB_NAME -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        print_success "Table exists: $table"
    else
        print_error "Table missing: $table"
        schema_ok=false
    fi
done

if [ "$schema_ok" = false ]; then
    print_error "Database schema is incomplete"
    exit 1
fi

# 4. Default Data Verification
print_header "4. DEFAULT DATA VERIFICATION"

# Check domains
domain_count=$(docker exec postgres-db psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM domains;" | tr -d ' ')
if [ "$domain_count" -gt 0 ]; then
    print_success "Domains initialized ($domain_count domains)"
else
    print_error "No domains found"
fi

# Check roles
role_count=$(docker exec postgres-db psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM roles;" | tr -d ' ')
if [ "$role_count" -ge 5 ]; then
    print_success "Roles initialized ($role_count roles)"
else
    print_warning "Expected at least 5 roles, found $role_count"
fi

# Check permissions
permission_count=$(docker exec postgres-db psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM permissions;" | tr -d ' ')
if [ "$permission_count" -ge 10 ]; then
    print_success "Permissions initialized ($permission_count permissions)"
else
    print_warning "Expected at least 10 permissions, found $permission_count"
fi

# Check users
user_count=$(docker exec postgres-db psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
if [ "$user_count" -gt 0 ]; then
    print_success "Users initialized ($user_count users)"
    
    # List users
    print_status "Available users:"
    docker exec postgres-db psql -U $DB_USER -d $DB_NAME -c "SELECT username, email FROM users;" | grep -v "^-" | grep -v "username" | grep -v "rows)"
else
    print_error "No users found"
fi

# 5. API Health Check
print_header "5. API HEALTH CHECK"

if curl -f -s http://localhost:3000/api/v1/health >/dev/null 2>&1; then
    print_success "API health check passed"
    
    # Get API info
    api_info=$(curl -s http://localhost:3000/api/v1/health)
    print_status "API Response: $api_info"
else
    print_error "API health check failed"
    print_status "Check API logs: docker-compose -f $COMPOSE_FILE logs nestjs-api"
fi

# 6. Frontend Accessibility
print_header "6. FRONTEND ACCESSIBILITY"

if curl -f -s -I http://localhost:3002 >/dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    print_status "Check frontend logs: docker-compose -f $COMPOSE_FILE logs frontend-ui"
fi

# 7. FreeSWITCH Status
print_header "7. FREESWITCH STATUS"

if docker exec freeswitch-core fs_cli -x "status" >/dev/null 2>&1; then
    print_success "FreeSWITCH is running"
    
    # Get FreeSWITCH info
    fs_status=$(docker exec freeswitch-core fs_cli -x "status" | head -3)
    print_status "FreeSWITCH Status:"
    echo "$fs_status"
else
    print_error "FreeSWITCH is not responding"
    print_status "Check FreeSWITCH logs: docker-compose -f $COMPOSE_FILE logs freeswitch-core"
fi

# 8. File Permissions Check
print_header "8. FILE PERMISSIONS CHECK"

if [ -d "recordings" ]; then
    if [ -w "recordings" ]; then
        print_success "Recordings directory is writable"
    else
        print_warning "Recordings directory is not writable"
        print_status "Fix with: sudo chown -R 1000:1000 recordings/ && chmod -R 755 recordings/"
    fi
else
    print_warning "Recordings directory does not exist"
fi

# 9. Network Connectivity
print_header "9. NETWORK CONNECTIVITY"

# Test internal container communication
if docker exec nestjs-api curl -f -s http://postgres-db:5432 >/dev/null 2>&1; then
    print_success "Backend can reach database"
else
    print_warning "Backend cannot reach database (this might be normal if PostgreSQL doesn't respond to HTTP)"
fi

if docker exec nestjs-api curl -f -s http://freeswitch-core:8021 >/dev/null 2>&1; then
    print_success "Backend can reach FreeSWITCH ESL"
else
    print_warning "Backend cannot reach FreeSWITCH ESL"
fi

# 10. Summary
print_header "10. VERIFICATION SUMMARY"

print_status "Production initialization verification completed!"
echo ""
print_status "Next steps:"
echo "1. Configure Nginx Proxy Manager for your domain"
echo "2. Test SIP client connectivity"
echo "3. Verify call recording functionality"
echo "4. Set up monitoring (optional)"
echo "5. Configure production backups"
echo ""
print_status "Access URLs:"
echo "- Frontend: http://localhost:3002"
echo "- Backend API: http://localhost:3000/api/v1"
echo "- Health Check: http://localhost:3000/api/v1/health"
echo ""
print_status "Default login credentials:"
echo "- Username: admin"
echo "- Password: admin"
echo ""
print_warning "Remember to change default passwords in production!"

print_success "Production system verification completed!"

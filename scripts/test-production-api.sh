#!/bin/bash

# Test Production API Connectivity
# Tests API calls from office.finstar.vn to api.finstar.vn

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

# Test configuration
FRONTEND_URL="https://office.finstar.vn"
API_URL="https://api.finstar.vn/api/v1"

print_status "Testing Production API Connectivity..."
echo "Frontend: $FRONTEND_URL"
echo "API: $API_URL"
echo ""

# Test 1: Basic API health check
print_status "1. Testing API health endpoint..."
if curl -s -f "$API_URL/health" > /dev/null; then
    print_success "API health endpoint is accessible"
else
    print_error "API health endpoint is not accessible"
    exit 1
fi

# Test 2: Test CORS preflight
print_status "2. Testing CORS preflight request..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$API_URL/auth/profile" | grep -i "access-control-allow-origin" || echo "")

if [[ -n "$CORS_RESPONSE" ]]; then
    print_success "CORS preflight successful"
    echo "Response: $CORS_RESPONSE"
else
    print_warning "CORS preflight may have issues"
fi

# Test 3: Test API endpoints
print_status "3. Testing public API endpoints..."

# Test auth endpoints
endpoints=(
    "/auth/profile"
    "/users"
    "/extensions"
    "/cdr"
)

for endpoint in "${endpoints[@]}"; do
    print_status "Testing $endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: $FRONTEND_URL" \
        "$API_URL$endpoint")
    
    if [[ "$HTTP_CODE" == "401" ]]; then
        print_success "$endpoint returns 401 (expected for protected endpoints)"
    elif [[ "$HTTP_CODE" == "200" ]]; then
        print_success "$endpoint returns 200 (accessible)"
    else
        print_warning "$endpoint returns $HTTP_CODE"
    fi
done

# Test 4: Check environment variables
print_status "4. Checking environment configuration..."

if [[ -f ".env.production.local" ]]; then
    print_success "Found .env.production.local"
    
    # Check critical variables
    if grep -q "NEXT_PUBLIC_API_URL=https://api.finstar.vn" .env.production.local; then
        print_success "NEXT_PUBLIC_API_URL is correctly configured"
    else
        print_error "NEXT_PUBLIC_API_URL is not correctly configured"
    fi
    
    if grep -q "CORS_ORIGIN=https://office.finstar.vn" .env.production.local; then
        print_success "CORS_ORIGIN is correctly configured"
    else
        print_error "CORS_ORIGIN is not correctly configured"
    fi
else
    print_error ".env.production.local not found"
fi

# Test 5: Check Docker containers
print_status "5. Checking Docker containers status..."
if command -v docker-compose &> /dev/null; then
    CONTAINERS=$(docker-compose ps --services --filter "status=running" 2>/dev/null || echo "")
    if [[ -n "$CONTAINERS" ]]; then
        print_success "Docker containers are running:"
        echo "$CONTAINERS"
    else
        print_warning "No running Docker containers found"
    fi
else
    print_warning "docker-compose not available"
fi

print_status "Production API connectivity test completed!"
echo ""
print_status "Next steps if issues found:"
echo "1. Check Nginx Proxy Manager configuration"
echo "2. Verify SSL certificates for both domains"
echo "3. Check firewall rules on server 42.96.20.37"
echo "4. Review Docker container logs: docker-compose logs -f"

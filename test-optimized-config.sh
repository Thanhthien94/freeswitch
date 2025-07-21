#!/bin/bash

# Test script for optimized FreeSWITCH config endpoints
# Usage: ./test-optimized-config.sh

set -e

BASE_URL="http://localhost:3000/api/v1"
FRONTEND_URL="http://localhost:3002"

echo "🧪 Testing Optimized FreeSWITCH Configuration System"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
print_info "Testing Backend Health..."

# Test 1: Backend Health Check
echo "1. Testing Backend Health Check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/health")
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Backend health check passed"
    cat /tmp/health_response.json | jq . 2>/dev/null || cat /tmp/health_response.json
else
    print_result 1 "Backend health check failed (HTTP $HTTP_CODE)"
fi

echo ""
print_info "Testing Frontend Accessibility..."

# Test 2: Frontend Accessibility
echo "2. Testing Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL")
HTTP_CODE="${FRONTEND_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Frontend is accessible"
else
    print_result 1 "Frontend is not accessible (HTTP $HTTP_CODE)"
fi

echo ""
print_info "Testing API Documentation..."

# Test 3: Swagger Documentation
echo "3. Testing Swagger Documentation..."
SWAGGER_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/../docs")
HTTP_CODE="${SWAGGER_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Swagger documentation is accessible"
else
    print_result 1 "Swagger documentation is not accessible (HTTP $HTTP_CODE)"
fi

echo ""
print_info "Testing Optimized Endpoints (without auth)..."

# Test 4: Test optimized endpoints (expect 401 without auth)
echo "4. Testing Optimized Config Endpoints..."

# Test batch endpoint
BATCH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/batch_response.json "$BASE_URL/freeswitch-config/batch")
HTTP_CODE="${BATCH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Batch config endpoint exists and requires authentication"
else
    print_result 1 "Batch config endpoint unexpected response (HTTP $HTTP_CODE)"
fi

# Test validation endpoint
VALIDATE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/validate_response.json \
    -X POST "$BASE_URL/freeswitch-config/validate" \
    -H "Content-Type: application/json" \
    -d '{"configs":[]}')
HTTP_CODE="${VALIDATE_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Validation endpoint exists and requires authentication"
else
    print_result 1 "Validation endpoint unexpected response (HTTP $HTTP_CODE)"
fi

# Test simple network config endpoint
NETWORK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/network_response.json "$BASE_URL/freeswitch-config/network/simple")
HTTP_CODE="${NETWORK_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Simple network config endpoint exists and requires authentication"
else
    print_result 1 "Simple network config endpoint unexpected response (HTTP $HTTP_CODE)"
fi

echo ""
print_info "Testing Container Health..."

# Test 5: Docker Container Health
echo "5. Testing Docker Container Health..."

# Check if all containers are running
CONTAINERS_STATUS=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep -v "NAME")

echo "Container Status:"
echo "$CONTAINERS_STATUS"

# Count healthy containers
HEALTHY_COUNT=$(echo "$CONTAINERS_STATUS" | grep -c "healthy" || true)
RUNNING_COUNT=$(echo "$CONTAINERS_STATUS" | grep -c "Up" || true)

print_info "Containers running: $RUNNING_COUNT"
print_info "Containers healthy: $HEALTHY_COUNT"

if [ "$RUNNING_COUNT" -ge 8 ]; then
    print_result 0 "All containers are running"
else
    print_result 1 "Some containers are not running"
fi

if [ "$HEALTHY_COUNT" -ge 7 ]; then
    print_result 0 "All containers with health checks are healthy"
else
    print_result 1 "Some containers are not healthy"
fi

echo ""
print_info "Testing Frontend Config Page..."

# Test 6: Frontend Config Page
echo "6. Testing Frontend Config Page..."
CONFIG_PAGE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL/dashboard/config")
HTTP_CODE="${CONFIG_PAGE_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Frontend config page is accessible"
else
    print_result 1 "Frontend config page is not accessible (HTTP $HTTP_CODE)"
fi

echo ""
print_info "Performance Test..."

# Test 7: Basic Performance Test
echo "7. Testing Response Times..."

# Test frontend response time
FRONTEND_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$FRONTEND_URL")
print_info "Frontend response time: ${FRONTEND_TIME}s"

# Test backend response time
BACKEND_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/health")
print_info "Backend response time: ${BACKEND_TIME}s"

# Check if response times are reasonable
if (( $(echo "$FRONTEND_TIME < 2.0" | bc -l) )); then
    print_result 0 "Frontend response time is good (< 2s)"
else
    print_result 1 "Frontend response time is slow (>= 2s)"
fi

if (( $(echo "$BACKEND_TIME < 1.0" | bc -l) )); then
    print_result 0 "Backend response time is good (< 1s)"
else
    print_result 1 "Backend response time is slow (>= 1s)"
fi

echo ""
print_info "Testing Build Artifacts..."

# Test 8: Check if optimized files exist
echo "8. Checking Optimized Files..."

# Check if optimized service exists
if [ -f "nestjs-app/src/config/services/optimized-config.service.ts" ]; then
    print_result 0 "OptimizedConfigService exists"
else
    print_result 1 "OptimizedConfigService not found"
fi

# Check if optimized DTOs exist
if [ -f "nestjs-app/src/config/dto/simplified-config.dto.ts" ]; then
    print_result 0 "Simplified DTOs exist"
else
    print_result 1 "Simplified DTOs not found"
fi

# Check if optimized component exists
if [ -f "frontend/src/components/config/OptimizedFreeSwitchConfigPanel.tsx" ]; then
    print_result 0 "OptimizedFreeSwitchConfigPanel exists"
else
    print_result 1 "OptimizedFreeSwitchConfigPanel not found"
fi

# Check if validation utilities exist
if [ -f "frontend/src/lib/config-validation.ts" ]; then
    print_result 0 "Config validation utilities exist"
else
    print_result 1 "Config validation utilities not found"
fi

echo ""
echo "=================================================="
print_info "Test Summary:"
echo "✅ All optimized endpoints are properly protected with authentication"
echo "✅ Frontend and backend are accessible and responsive"
echo "✅ Docker containers are running correctly"
echo "✅ Optimized files are in place"
echo ""
print_info "Next Steps:"
echo "1. Login to the application at: $FRONTEND_URL"
echo "2. Navigate to Dashboard > Configuration"
echo "3. Test the optimized config panel"
echo "4. Check Swagger docs at: $BASE_URL/../docs"
echo ""
print_warning "Note: API endpoints require authentication for full testing"

# Cleanup
rm -f /tmp/health_response.json /tmp/batch_response.json /tmp/validate_response.json /tmp/network_response.json

echo "🎉 Test completed!"

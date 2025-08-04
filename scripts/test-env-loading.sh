#!/bin/bash

# Test Environment Loading Script
# Tests that environment variables are loaded correctly in different scenarios

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

print_status "🧪 Testing Environment Loading"
echo "==============================="

# Test 1: Check which env files exist
print_status "1. Checking available environment files..."
ENV_FILES=(".env.production.local" ".env.production" ".env.local" ".env")

for file in "${ENV_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "✅ $file exists"
        # Show key variables from each file
        echo "   Key variables:"
        if grep -q "NEXT_PUBLIC_API_URL" "$file"; then
            API_URL=$(grep "NEXT_PUBLIC_API_URL" "$file" | cut -d'=' -f2)
            echo "   - NEXT_PUBLIC_API_URL=$API_URL"
        fi
        if grep -q "CORS_ORIGIN" "$file"; then
            CORS=$(grep "CORS_ORIGIN" "$file" | cut -d'=' -f2)
            echo "   - CORS_ORIGIN=$CORS"
        fi
        if grep -q "NODE_ENV" "$file"; then
            NODE_ENV_VAL=$(grep "NODE_ENV" "$file" | cut -d'=' -f2)
            echo "   - NODE_ENV=$NODE_ENV_VAL"
        fi
        echo ""
    else
        print_warning "❌ $file not found"
    fi
done

# Test 2: Simulate deploy.sh loading logic
print_status "2. Testing deploy.sh loading logic..."

unset NEXT_PUBLIC_API_URL CORS_ORIGIN DOMAIN NODE_ENV

if [[ -f ".env.production.local" ]]; then
    print_status "Loading .env.production.local..."
    set -a
    source .env.production.local
    set +a
    LOADED_FROM=".env.production.local"
elif [[ -f ".env.production" ]]; then
    print_status "Loading .env.production..."
    set -a
    source .env.production
    set +a
    LOADED_FROM=".env.production"
elif [[ -f ".env" ]]; then
    print_status "Loading .env..."
    set -a
    source .env
    set +a
    LOADED_FROM=".env"
fi

print_success "Environment loaded from: $LOADED_FROM"

# Test 3: Check critical variables after loading
print_status "3. Checking loaded variables..."

CRITICAL_VARS=("NEXT_PUBLIC_API_URL" "CORS_ORIGIN" "DOMAIN" "NODE_ENV")

for var in "${CRITICAL_VARS[@]}"; do
    if [[ -n "${!var}" ]]; then
        print_success "✅ $var = ${!var}"
    else
        print_error "❌ $var is not set"
    fi
done

# Test 4: Validate production configuration
print_status "4. Validating production configuration..."

if [[ "$NODE_ENV" == "production" ]]; then
    print_success "NODE_ENV is set to production"
    
    # Check if using production domains
    if [[ "$NEXT_PUBLIC_API_URL" == *"api.finstar.vn"* ]]; then
        print_success "✅ Using production API domain"
    else
        print_warning "⚠️  Not using production API domain: $NEXT_PUBLIC_API_URL"
    fi
    
    if [[ "$CORS_ORIGIN" == *"office.finstar.vn"* ]]; then
        print_success "✅ Using production frontend domain in CORS"
    else
        print_warning "⚠️  Not using production frontend domain in CORS: $CORS_ORIGIN"
    fi
    
    if [[ "$DOMAIN" == *"office.finstar.vn"* ]]; then
        print_success "✅ Using production domain"
    else
        print_warning "⚠️  Not using production domain: $DOMAIN"
    fi
else
    print_warning "NODE_ENV is not set to production: $NODE_ENV"
fi

# Test 5: Test Docker environment variable passing
print_status "5. Testing Docker environment variable passing..."

if command -v docker-compose &> /dev/null; then
    print_status "Checking docker-compose environment variables..."
    
    # Check if docker-compose can resolve variables
    DOCKER_API_URL=$(docker-compose config | grep "NEXT_PUBLIC_API_URL" | head -1 | cut -d'=' -f2 || echo "")
    if [[ -n "$DOCKER_API_URL" ]]; then
        print_success "Docker can resolve NEXT_PUBLIC_API_URL: $DOCKER_API_URL"
    else
        print_warning "Docker cannot resolve NEXT_PUBLIC_API_URL"
    fi
    
    DOCKER_CORS=$(docker-compose config | grep "CORS_ORIGIN" | head -1 | cut -d'=' -f2 || echo "")
    if [[ -n "$DOCKER_CORS" ]]; then
        print_success "Docker can resolve CORS_ORIGIN: $DOCKER_CORS"
    else
        print_warning "Docker cannot resolve CORS_ORIGIN"
    fi
else
    print_warning "docker-compose not available for testing"
fi

# Test 6: Check frontend environment
print_status "6. Checking frontend environment files..."

FRONTEND_ENV_FILES=("frontend/.env.docker" "frontend/.env.local")

for file in "${FRONTEND_ENV_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "✅ $file exists"
        if grep -q "NEXT_PUBLIC_API_URL" "$file"; then
            FE_API_URL=$(grep "NEXT_PUBLIC_API_URL" "$file" | cut -d'=' -f2)
            echo "   - NEXT_PUBLIC_API_URL=$FE_API_URL"
        fi
    else
        print_warning "❌ $file not found"
    fi
done

print_status "Environment loading test completed!"
echo ""
print_status "Summary:"
echo "- Environment loaded from: $LOADED_FROM"
echo "- NODE_ENV: ${NODE_ENV:-'not set'}"
echo "- NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-'not set'}"
echo "- CORS_ORIGIN: ${CORS_ORIGIN:-'not set'}"
echo "- DOMAIN: ${DOMAIN:-'not set'}"

#!/bin/bash

# Environment Variables Validation Script
# Validates that all required environment variables are properly configured

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

print_status "🔍 Environment Variables Validation"
echo "===================================="

# Check which environment files exist
ENV_FILES=(".env.production.local" ".env.production" ".env.local" ".env")
FOUND_FILES=()

for file in "${ENV_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        FOUND_FILES+=("$file")
        print_success "Found: $file"
    else
        print_warning "Missing: $file"
    fi
done

if [[ ${#FOUND_FILES[@]} -eq 0 ]]; then
    print_error "No environment files found!"
    exit 1
fi

# Load environment variables (same logic as deploy.sh)
print_status "Loading environment variables..."

if [[ -f ".env.production.local" ]]; then
    print_status "Loading .env.production.local..."
    set -a
    source .env.production.local
    set +a
    ACTIVE_ENV_FILE=".env.production.local"
elif [[ -f ".env.production" ]]; then
    print_status "Loading .env.production..."
    set -a
    source .env.production
    set +a
    ACTIVE_ENV_FILE=".env.production"
elif [[ -f ".env" ]]; then
    print_status "Loading .env..."
    set -a
    source .env
    set +a
    ACTIVE_ENV_FILE=".env"
fi

print_success "Active environment file: $ACTIVE_ENV_FILE"

# Critical variables for production
CRITICAL_VARS=(
    "NODE_ENV"
    "NEXT_PUBLIC_API_URL"
    "CORS_ORIGIN"
    "DOMAIN"
    "JWT_SECRET"
    "POSTGRES_PASSWORD"
    "FREESWITCH_ESL_PASSWORD"
)

# Optional but important variables
IMPORTANT_VARS=(
    "FRONTEND_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "SESSION_SECRET"
    "FREESWITCH_DOMAIN"
    "EXTERNAL_IP"
)

print_status "Checking critical variables..."
MISSING_CRITICAL=()

for var in "${CRITICAL_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_CRITICAL+=("$var")
        print_error "❌ $var is not set"
    else
        print_success "✅ $var is set"
        # Show value for non-sensitive vars
        if [[ "$var" != *"PASSWORD"* && "$var" != *"SECRET"* ]]; then
            echo "   Value: ${!var}"
        else
            echo "   Value: [HIDDEN]"
        fi
    fi
done

print_status "Checking important variables..."
MISSING_IMPORTANT=()

for var in "${IMPORTANT_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_IMPORTANT+=("$var")
        print_warning "⚠️  $var is not set"
    else
        print_success "✅ $var is set"
        if [[ "$var" != *"PASSWORD"* && "$var" != *"SECRET"* ]]; then
            echo "   Value: ${!var}"
        else
            echo "   Value: [HIDDEN]"
        fi
    fi
done

# Validate specific configurations
print_status "Validating specific configurations..."

# Check if NEXT_PUBLIC_API_URL matches expected pattern
if [[ -n "$NEXT_PUBLIC_API_URL" ]]; then
    if [[ "$NEXT_PUBLIC_API_URL" == *"api.finstar.vn"* ]]; then
        print_success "NEXT_PUBLIC_API_URL uses production domain"
    elif [[ "$NEXT_PUBLIC_API_URL" == *"localhost"* ]]; then
        print_warning "NEXT_PUBLIC_API_URL uses localhost (development mode)"
    else
        print_warning "NEXT_PUBLIC_API_URL uses custom domain: $NEXT_PUBLIC_API_URL"
    fi
fi

# Check CORS_ORIGIN
if [[ -n "$CORS_ORIGIN" ]]; then
    if [[ "$CORS_ORIGIN" == *"office.finstar.vn"* ]]; then
        print_success "CORS_ORIGIN includes production frontend domain"
    elif [[ "$CORS_ORIGIN" == *"localhost"* ]]; then
        print_warning "CORS_ORIGIN uses localhost (development mode)"
    fi
fi

# Summary
echo ""
print_status "Validation Summary:"
echo "==================="

if [[ ${#MISSING_CRITICAL[@]} -eq 0 ]]; then
    print_success "All critical variables are set"
else
    print_error "Missing ${#MISSING_CRITICAL[@]} critical variables: ${MISSING_CRITICAL[*]}"
fi

if [[ ${#MISSING_IMPORTANT[@]} -eq 0 ]]; then
    print_success "All important variables are set"
else
    print_warning "Missing ${#MISSING_IMPORTANT[@]} important variables: ${MISSING_IMPORTANT[*]}"
fi

# Exit with error if critical variables are missing
if [[ ${#MISSING_CRITICAL[@]} -gt 0 ]]; then
    print_error "Cannot proceed with missing critical variables"
    exit 1
fi

print_success "Environment validation completed successfully!"

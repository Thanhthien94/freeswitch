#!/bin/bash

# Cleanup Unused Scripts and Verify Production Init
# This script identifies unused scripts and ensures production deployment works

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

print_status "Analyzing scripts and database init files..."

# Check current scripts
echo ""
print_status "Current scripts in scripts/ directory:"
ls -la scripts/

echo ""
print_status "Current database init files:"
ls -la database/init/

echo ""
print_status "=== SCRIPT ANALYSIS ==="

# Scripts that are still useful
echo ""
print_success "✅ USEFUL SCRIPTS (keep these):"
echo "  - backup-current-data.sh     : Essential for migration"
echo "  - run-migrations.sh          : Database migration tool"
echo "  - test-sip-clients.sh        : SIP testing utility"
echo "  - hash-passwords.js          : Password hashing utility"

echo ""
print_warning "⚠️  POTENTIALLY UNUSED SCRIPTS:"
echo "  - apply-production-fixes.sh  : May be outdated"
echo "  - restart-frontend.sh        : Simple docker-compose restart"
echo "  - capture-call-logs.sh       : Debugging tool"
echo "  - recording_management.sh    : May be replaced by API"
echo "  - security-monitor.sh        : Monitoring tool"
echo "  - test-call.sh               : Testing utility"
echo "  - create-simple-migration.sql: One-time migration"

echo ""
print_status "=== DATABASE INIT ANALYSIS ==="

# Check database init files
echo ""
print_success "✅ ESSENTIAL DATABASE INIT FILES:"
echo "  - 01-init-pbx-db.sql         : Main database schema and data"
echo "  - 002_create_cdr_system.sql  : CDR system tables"
echo "  - 003_create_call_recordings.sql : Recording tables"

echo ""
print_warning "⚠️  PRODUCTION BACKUP FILES (excluded from Git):"
echo "  - 00-current-schema.sql      : Production schema backup"
echo "  - 00-full-database-backup.sql: Full production backup"
echo "  - 01-current-data.sql        : Production data backup"

echo ""
print_status "=== PRODUCTION INIT VERIFICATION ==="

# Check if main init file has all required tables
print_status "Checking main init file completeness..."

INIT_FILE="database/init/01-init-pbx-db.sql"
if [ -f "$INIT_FILE" ]; then
    print_success "Main init file exists: $INIT_FILE"
    
    # Check for essential tables
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
    
    echo ""
    print_status "Checking for required tables in init file:"
    for table in "${REQUIRED_TABLES[@]}"; do
        if grep -q "CREATE TABLE.*$table" "$INIT_FILE"; then
            echo "  ✅ $table"
        else
            echo "  ❌ $table - MISSING!"
        fi
    done
    
    # Check for default data
    echo ""
    print_status "Checking for default data initialization:"
    if grep -q "INSERT INTO domains" "$INIT_FILE"; then
        echo "  ✅ Default domains"
    else
        echo "  ❌ Default domains - MISSING!"
    fi
    
    if grep -q "INSERT INTO roles" "$INIT_FILE"; then
        echo "  ✅ Default roles"
    else
        echo "  ❌ Default roles - MISSING!"
    fi
    
    if grep -q "INSERT INTO users" "$INIT_FILE"; then
        echo "  ✅ Default users"
    else
        echo "  ❌ Default users - MISSING!"
    fi
    
else
    print_error "Main init file missing: $INIT_FILE"
fi

echo ""
print_status "=== RECOMMENDATIONS ==="

echo ""
print_success "✅ KEEP THESE SCRIPTS:"
cat << EOF
  - scripts/backup-current-data.sh
  - scripts/run-migrations.sh  
  - scripts/test-sip-clients.sh
  - scripts/hash-passwords.js
EOF

echo ""
print_warning "🗑️  CONSIDER REMOVING (create archive first):"
cat << EOF
  - scripts/apply-production-fixes.sh (outdated)
  - scripts/restart-frontend.sh (use docker-compose restart)
  - scripts/capture-call-logs.sh (debugging only)
  - scripts/recording_management.sh (replaced by API)
  - scripts/security-monitor.sh (monitoring tool)
  - scripts/test-call.sh (testing only)
  - scripts/create-simple-migration.sql (one-time use)
EOF

echo ""
print_status "=== PRODUCTION DEPLOYMENT CHECK ==="

# Test if production deployment would work
print_status "Testing production deployment readiness..."

# Check docker-compose files
if [ -f "docker-compose.production.yml" ]; then
    print_success "Production docker-compose file exists"
else
    print_error "Production docker-compose file missing!"
fi

# Check deployment script
if [ -f "deploy.sh" ]; then
    print_success "Deployment script exists"
else
    print_error "Deployment script missing!"
fi

# Check environment template
if [ -f ".env.production" ]; then
    print_success "Production environment template exists"
else
    print_error "Production environment template missing!"
fi

echo ""
print_status "=== NEXT STEPS ==="

echo ""
print_success "To clean up unused scripts:"
echo "  1. Create archive: mkdir -p archive/scripts && mv scripts/unused-* archive/scripts/"
echo "  2. Remove unused scripts: rm scripts/apply-production-fixes.sh scripts/restart-frontend.sh"
echo "  3. Update documentation"

echo ""
print_success "To verify production deployment:"
echo "  1. Test with: docker-compose -f docker-compose.production.yml config"
echo "  2. Check init file: psql -f database/init/01-init-pbx-db.sql"
echo "  3. Run deployment test on staging environment"

echo ""
print_warning "IMPORTANT: Before removing any scripts, ensure they're not referenced in:"
echo "  - Documentation files"
echo "  - Other scripts"
echo "  - CI/CD pipelines"
echo "  - Deployment procedures"

print_success "Script analysis completed!"

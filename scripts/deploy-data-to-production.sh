#!/bin/bash

# Deploy Data to Production Script
# Copies exported data to production server and imports it

set -e

# Configuration
PRODUCTION_SERVER="42.96.20.37"
PRODUCTION_USER="root"
LATEST_EXPORT=$(ls -t ./backups/production-sync/ | head -n1)
EXPORT_DIR="./backups/production-sync/$LATEST_EXPORT"

echo "🚀 FreeSWITCH PBX - Deploy Data to Production"
echo "============================================"
echo "Production Server: $PRODUCTION_USER@$PRODUCTION_SERVER"
echo "Export Directory: $EXPORT_DIR"
echo ""

# Check if export directory exists
if [[ ! -d "$EXPORT_DIR" ]]; then
    echo "❌ Error: Export directory not found: $EXPORT_DIR"
    echo "Please run ./scripts/export-data-for-production.sh first"
    exit 1
fi

# Check if SSH key is available
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$PRODUCTION_USER@$PRODUCTION_SERVER" exit 2>/dev/null; then
    echo "❌ Error: Cannot connect to production server"
    echo "Please ensure SSH key is configured for $PRODUCTION_USER@$PRODUCTION_SERVER"
    exit 1
fi

echo "✅ SSH connection to production server verified"

# Ask for production database password
echo ""
echo "🔐 Production Database Configuration"
echo "==================================="
read -s -p "Enter production database password: " PROD_DB_PASSWORD
echo ""

if [[ -z "$PROD_DB_PASSWORD" ]]; then
    echo "❌ Error: Database password is required"
    exit 1
fi

echo ""
echo "📦 Copying data to production server..."
echo "======================================"

# Copy export directory to production server
scp -r "$EXPORT_DIR" "$PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/" || {
    echo "❌ Error: Failed to copy data to production server"
    exit 1
}

echo "✅ Data copied successfully"

echo ""
echo "📥 Importing data on production server..."
echo "======================================="

# Import data on production server
ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" << EOF
set -e

cd /tmp/$(basename $EXPORT_DIR)

echo "🔍 Verifying files on production server..."
ls -la *.sql

echo ""
echo "📊 Running data verification..."
./verify-data.sh

echo ""
echo "🚀 Starting data import..."
POSTGRES_PASSWORD="$PROD_DB_PASSWORD" ./import-to-production.sh

echo ""
echo "✅ Data import completed on production server!"
EOF

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Production deployment completed successfully!"
    echo "============================================="
    echo ""
    echo "📋 What was deployed:"
    echo "- Configuration data (categories, items, network configs)"
    echo "- Domain and user management data"
    echo "- FreeSWITCH configuration (profiles, gateways, extensions)"
    echo "- System data (permissions, migrations)"
    echo ""
    echo "📝 Next steps:"
    echo "1. Verify data in production database"
    echo "2. Test application connectivity"
    echo "3. Update production environment variables if needed"
    echo "4. Test FreeSWITCH functionality"
    echo "5. Monitor system logs"
    echo ""
    echo "🔗 Production server access:"
    echo "ssh $PRODUCTION_USER@$PRODUCTION_SERVER"
else
    echo ""
    echo "❌ Production deployment failed!"
    echo "==============================="
    echo ""
    echo "📋 Troubleshooting steps:"
    echo "1. Check SSH connection to production server"
    echo "2. Verify database credentials"
    echo "3. Check production database schema (run migrations)"
    echo "4. Review error logs on production server"
    echo ""
    echo "🔗 Access production server to investigate:"
    echo "ssh $PRODUCTION_USER@$PRODUCTION_SERVER"
    echo "cd /tmp/$(basename $EXPORT_DIR)"
    exit 1
fi

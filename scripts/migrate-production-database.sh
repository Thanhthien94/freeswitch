#!/bin/bash

# Migrate Production Database Script
# Runs database migrations on production server

set -e

# Configuration
PRODUCTION_SERVER="42.96.20.37"
PRODUCTION_USER="root"

echo "🚀 FreeSWITCH PBX - Migrate Production Database"
echo "=============================================="
echo "Production Server: $PRODUCTION_USER@$PRODUCTION_SERVER"
echo ""

# Check if SSH connection is available
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$PRODUCTION_USER@$PRODUCTION_SERVER" exit 2>/dev/null; then
    echo "❌ Error: Cannot connect to production server"
    echo "Please ensure SSH key is configured for $PRODUCTION_USER@$PRODUCTION_SERVER"
    exit 1
fi

echo "✅ SSH connection to production server verified"

echo ""
echo "🔍 Checking production environment..."
echo "===================================="

# Check production environment
ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" << 'EOF'
set -e

echo "📋 Production environment status:"
echo "- Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|nestjs)"

echo ""
echo "- Database connectivity:"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT version();" | head -1

echo ""
echo "- Current database schema:"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "- Migration status:"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) as migration_count FROM migrations;" 2>/dev/null || echo "Migrations table not found or empty"
EOF

echo ""
echo "⚠️  IMPORTANT: This will update the production database schema"
echo "============================================================"
echo "This operation will:"
echo "1. Backup current database"
echo "2. Run pending migrations"
echo "3. Update schema to latest version"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled by user"
    exit 1
fi

echo ""
echo "📦 Copying migration files to production..."
echo "=========================================="

# Create temporary directory for migration files
TEMP_DIR="/tmp/freeswitch-migrations-$(date +%Y%m%d_%H%M%S)"

# Create directory on production server first
ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" "mkdir -p $TEMP_DIR"

# Copy necessary files to production
scp -r nestjs-app/src/database "$PRODUCTION_USER@$PRODUCTION_SERVER:$TEMP_DIR/" || {
    echo "❌ Error: Failed to copy migration files to production server"
    exit 1
}

scp nestjs-app/package.json "$PRODUCTION_USER@$PRODUCTION_SERVER:$TEMP_DIR/" || {
    echo "❌ Error: Failed to copy package.json to production server"
    exit 1
}

scp nestjs-app/tsconfig.json "$PRODUCTION_USER@$PRODUCTION_SERVER:$TEMP_DIR/" || {
    echo "❌ Error: Failed to copy tsconfig.json to production server"
    exit 1
}

echo "✅ Migration files copied successfully"

echo ""
echo "🗄️  Running database migrations on production..."
echo "==============================================="

# Run migrations on production server
ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" << EOF
set -e

cd $TEMP_DIR

echo "📋 Backup current database before migration..."
docker exec postgres-db pg_dump -U pbx_user -d pbx_db > /tmp/backup_before_migration_\$(date +%Y%m%d_%H%M%S).sql
echo "✅ Database backup completed"

echo ""
echo "📦 Installing dependencies..."
npm install --only=production typeorm ts-node typescript @types/node

echo ""
echo "🔍 Checking current migration status..."
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=pbx_user
export POSTGRES_PASSWORD=pbx_password
export POSTGRES_DB=pbx_db

# Show current migrations
npx typeorm-ts-node-commonjs migration:show -d database/data-source.ts 2>/dev/null || echo "No migrations found"

echo ""
echo "🚀 Running pending migrations..."
npx typeorm-ts-node-commonjs migration:run -d database/data-source.ts

echo ""
echo "📊 Checking updated schema..."
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo ""
echo "🔍 Verifying migration status..."
npx typeorm-ts-node-commonjs migration:show -d database/data-source.ts

echo ""
echo "✅ Database migration completed successfully!"

# Cleanup
rm -rf $TEMP_DIR
echo "🧹 Temporary files cleaned up"
EOF

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Production database migration completed successfully!"
    echo "===================================================="
    echo ""
    echo "📋 What was updated:"
    echo "- Database schema migrated to latest version"
    echo "- New FreeSWITCH configuration tables created"
    echo "- Old obsolete tables cleaned up"
    echo "- Global network configuration table added"
    echo ""
    echo "📝 Next steps:"
    echo "1. Verify new schema on production"
    echo "2. Run data sync script to import development data"
    echo "3. Test application functionality"
    echo "4. Monitor system logs"
    echo ""
    echo "🔗 Verify migration:"
    echo "ssh $PRODUCTION_USER@$PRODUCTION_SERVER"
    echo "docker exec postgres-db psql -U pbx_user -d pbx_db -c \"\\dt\""
else
    echo ""
    echo "❌ Production database migration failed!"
    echo "======================================"
    echo ""
    echo "📋 Troubleshooting steps:"
    echo "1. Check SSH connection to production server"
    echo "2. Verify database is running and accessible"
    echo "3. Check migration file syntax"
    echo "4. Review error logs on production server"
    echo ""
    echo "🔗 Access production server to investigate:"
    echo "ssh $PRODUCTION_USER@$PRODUCTION_SERVER"
    echo "docker logs nestjs-app"
    exit 1
fi

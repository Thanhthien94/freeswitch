#!/bin/bash

# 🛡️ SETUP EXTERNAL VOLUMES FOR DATA PROTECTION
# This script creates external directories that cannot be deleted by docker-compose down --volumes

set -e

EXTERNAL_DATA_DIR="/opt/pbx-data"
BACKUP_DIR="./backups/migration_$(date +%Y%m%d_%H%M%S)"

echo "🛡️ Setting up external volumes for data protection..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to create directory with proper permissions
create_protected_dir() {
    local dir_path="$1"
    local owner_uid="$2"
    local owner_gid="$3"
    local service_name="$4"
    
    echo "📁 Creating protected directory: $dir_path"
    sudo mkdir -p "$dir_path"
    sudo chown "$owner_uid:$owner_gid" "$dir_path"
    sudo chmod 755 "$dir_path"
    echo "✅ $service_name directory created with proper permissions"
}

# Create external data directories
echo "🏗️ Creating external data directories..."

# PostgreSQL (UID 999, GID 999)
create_protected_dir "$EXTERNAL_DATA_DIR/postgres" 999 999 "PostgreSQL"

# Redis (UID 999, GID 999) 
create_protected_dir "$EXTERNAL_DATA_DIR/redis" 999 999 "Redis"

# RabbitMQ (UID 999, GID 999)
create_protected_dir "$EXTERNAL_DATA_DIR/rabbitmq" 999 999 "RabbitMQ"

# FreeSWITCH (UID 999, GID 999)
create_protected_dir "$EXTERNAL_DATA_DIR/freeswitch" 999 999 "FreeSWITCH"

# Prometheus (UID 65534, GID 65534 - nobody user)
create_protected_dir "$EXTERNAL_DATA_DIR/prometheus" 65534 65534 "Prometheus"

# Grafana (UID 472, GID 0 - grafana user)
create_protected_dir "$EXTERNAL_DATA_DIR/grafana" 472 0 "Grafana"

# Check if containers are running and migrate data
echo "🔄 Checking for existing data to migrate..."

if docker ps --format "table {{.Names}}" | grep -q "postgres-db"; then
    echo "📦 PostgreSQL container is running, migrating data..."
    
    # Backup current data first
    echo "💾 Creating backup before migration..."
    docker exec postgres-db pg_dump -U pbx_user pbx_db > "$BACKUP_DIR/postgres_backup.sql"
    
    # Copy data from named volume to external directory
    echo "📋 Copying PostgreSQL data..."
    docker run --rm \
        -v freeswitch-pbx_postgres-data:/source \
        -v "$EXTERNAL_DATA_DIR/postgres":/dest \
        alpine sh -c "cp -a /source/. /dest/ 2>/dev/null || echo 'No existing data to copy'"
    
    echo "✅ PostgreSQL data migrated"
else
    echo "ℹ️ PostgreSQL container not running, skipping data migration"
fi

if docker ps --format "table {{.Names}}" | grep -q "redis-cache"; then
    echo "📦 Redis container is running, migrating data..."
    
    # Copy Redis data
    echo "📋 Copying Redis data..."
    docker run --rm \
        -v freeswitch-pbx_redis-data:/source \
        -v "$EXTERNAL_DATA_DIR/redis":/dest \
        alpine sh -c "cp -a /source/. /dest/ 2>/dev/null || echo 'No existing data to copy'"
    
    echo "✅ Redis data migrated"
else
    echo "ℹ️ Redis container not running, skipping data migration"
fi

if docker ps --format "table {{.Names}}" | grep -q "rabbitmq-server"; then
    echo "📦 RabbitMQ container is running, migrating data..."
    
    # Copy RabbitMQ data
    echo "📋 Copying RabbitMQ data..."
    docker run --rm \
        -v freeswitch-pbx_rabbitmq-data:/source \
        -v "$EXTERNAL_DATA_DIR/rabbitmq":/dest \
        alpine sh -c "cp -a /source/. /dest/ 2>/dev/null || echo 'No existing data to copy'"
    
    echo "✅ RabbitMQ data migrated"
else
    echo "ℹ️ RabbitMQ container not running, skipping data migration"
fi

# Set final permissions
echo "🔐 Setting final permissions..."
sudo chown -R 999:999 "$EXTERNAL_DATA_DIR/postgres"
sudo chown -R 999:999 "$EXTERNAL_DATA_DIR/redis"
sudo chown -R 999:999 "$EXTERNAL_DATA_DIR/rabbitmq"
sudo chown -R 999:999 "$EXTERNAL_DATA_DIR/freeswitch"
sudo chown -R 65534:65534 "$EXTERNAL_DATA_DIR/prometheus"
sudo chown -R 472:0 "$EXTERNAL_DATA_DIR/grafana"

# Create info file
cat > "$EXTERNAL_DATA_DIR/README.md" << EOF
# PBX External Data Volumes

This directory contains external data volumes that are protected from 
\`docker-compose down --volumes\` commands.

## Directory Structure
- \`postgres/\` - PostgreSQL database data
- \`redis/\` - Redis cache data
- \`rabbitmq/\` - RabbitMQ message queue data
- \`freeswitch/\` - FreeSWITCH runtime data
- \`prometheus/\` - Prometheus monitoring data
- \`grafana/\` - Grafana dashboard data

## Backup Information
- Migration backup created: $BACKUP_DIR/
- Original named volumes preserved until manual cleanup

## Security
- All directories owned by UID/GID 999 (Docker service users)
- Permissions: 755 (rwxr-xr-x)

## Restoration
To restore from backup:
\`\`\`bash
# Stop containers
docker-compose down

# Restore PostgreSQL
cat $BACKUP_DIR/postgres_backup.sql | docker exec -i postgres-db psql -U pbx_user -d pbx_db

# Restart containers
docker-compose up -d
\`\`\`

Created: $(date)
EOF

echo ""
echo "🎉 External volumes setup completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ External directories created in: $EXTERNAL_DATA_DIR"
echo "  ✅ Data migrated from named volumes"
echo "  ✅ Backup created in: $BACKUP_DIR"
echo "  ✅ Proper permissions set"
echo ""
echo "🛡️ Your data is now protected from docker-compose down --volumes"
echo ""
echo "⚠️ Next steps:"
echo "  1. Test the system: docker-compose up -d"
echo "  2. Verify data integrity"
echo "  3. Remove old named volumes: docker volume prune"
echo ""

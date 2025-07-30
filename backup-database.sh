#!/bin/bash

# EMERGENCY DATABASE BACKUP SCRIPT
# Tạo backup trước khi thao tác nguy hiểm

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"

echo "🔄 Creating database backup..."
mkdir -p $BACKUP_DIR

# Backup database
docker exec postgres-db pg_dump -U pbx_user pbx_db > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    echo "📁 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Keep only last 10 backups
ls -t $BACKUP_DIR/database_backup_*.sql | tail -n +11 | xargs -r rm

echo "🎯 ALWAYS RUN THIS BEFORE:"
echo "   - docker-compose down --volumes"
echo "   - Database migrations"
echo "   - Major updates"

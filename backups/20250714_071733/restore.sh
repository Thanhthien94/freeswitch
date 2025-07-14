#!/bin/bash

# Database Restore Script
# Run this script on the new host to restore the database

set -e

BACKUP_DIR="$(dirname "$0")"

echo "Starting database restore process..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec postgres-db pg_isready -U pbx_user -d pbx_db; do
    echo "PostgreSQL is not ready yet, waiting..."
    sleep 2
done

echo "Restoring full database..."
docker exec -i postgres-db psql -U pbx_user -d pbx_db < "$BACKUP_DIR/full_database.sql"

echo "Database restore completed successfully!"

# Restore recordings if backup exists
if [ -f "$BACKUP_DIR/recordings_backup.tar.gz" ]; then
    echo "Restoring recordings..."
    tar -xzf "$BACKUP_DIR/recordings_backup.tar.gz"
    echo "Recordings restored"
fi

# Restore configs if backup exists
if [ -f "$BACKUP_DIR/configs_backup.tar.gz" ]; then
    echo "Restoring configurations..."
    tar -xzf "$BACKUP_DIR/configs_backup.tar.gz"
    echo "Configurations restored"
fi

echo "Full restore completed!"

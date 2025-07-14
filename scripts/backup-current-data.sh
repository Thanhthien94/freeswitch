#!/bin/bash

# Backup Current Database Data
# This script creates a backup of current database data for migration to new host

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

# Check if Docker is running
if ! docker ps &> /dev/null; then
    print_error "Docker is not running or not accessible"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q "postgres-db"; then
    print_error "PostgreSQL container (postgres-db) is not running"
    exit 1
fi

print_status "Starting database backup process..."

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_status "Backup directory: $BACKUP_DIR"

# 1. Full database backup
print_status "Creating full database backup..."
docker exec postgres-db pg_dump -U pbx_user -d pbx_db > "$BACKUP_DIR/full_database.sql"
print_success "Full database backup completed"

# 2. Schema only backup
print_status "Creating schema-only backup..."
docker exec postgres-db pg_dump -U pbx_user -d pbx_db --schema-only > "$BACKUP_DIR/schema_only.sql"
print_success "Schema backup completed"

# 3. Data only backup (with proper handling of foreign keys)
print_status "Creating data-only backup..."
docker exec postgres-db pg_dump -U pbx_user -d pbx_db --data-only --disable-triggers --inserts > "$BACKUP_DIR/data_only.sql"
print_success "Data backup completed"

# 4. Backup specific tables with data
print_status "Creating table-specific backups..."

# Users data
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/users.csv"

# CDR data
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM call_detail_records) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/call_detail_records.csv"

# Recordings data
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM call_recordings) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/call_recordings.csv"

# Roles and permissions
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM roles) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/roles.csv"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM permissions) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/permissions.csv"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM role_permissions) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/role_permissions.csv"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "COPY (SELECT * FROM user_roles) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/user_roles.csv"

print_success "Table-specific backups completed"

# 5. Create database statistics
print_status "Generating database statistics..."
cat > "$BACKUP_DIR/database_stats.txt" << EOF
Database Backup Statistics
Generated: $(date)
Host: $(hostname)
Docker Container: postgres-db

Table Row Counts:
EOF

docker exec postgres-db psql -U pbx_user -d pbx_db -c "
SELECT
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY relname;
" >> "$BACKUP_DIR/database_stats.txt"

# 6. Backup recordings directory
if [ -d "recordings" ]; then
    print_status "Backing up recordings directory..."
    tar -czf "$BACKUP_DIR/recordings_backup.tar.gz" recordings/
    print_success "Recordings backup completed"
else
    print_warning "Recordings directory not found"
fi

# 7. Backup configuration files
print_status "Backing up configuration files..."
tar -czf "$BACKUP_DIR/configs_backup.tar.gz" configs/ 2>/dev/null || print_warning "Configs directory not found"

# 8. Create restore script
print_status "Creating restore script..."
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
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
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# 9. Create backup summary
print_status "Creating backup summary..."
cat > "$BACKUP_DIR/README.md" << EOF
# Database Backup Summary

**Created:** $(date)
**Source Host:** $(hostname)
**Database:** pbx_db
**User:** pbx_user

## Files Included:

- \`full_database.sql\` - Complete database dump (schema + data)
- \`schema_only.sql\` - Database schema only
- \`data_only.sql\` - Data only with disabled triggers
- \`*.csv\` - Individual table exports
- \`recordings_backup.tar.gz\` - Call recordings backup
- \`configs_backup.tar.gz\` - Configuration files backup
- \`database_stats.txt\` - Database statistics
- \`restore.sh\` - Automated restore script

## Restore Instructions:

1. Copy this entire backup directory to the new host
2. Ensure Docker and PostgreSQL container are running
3. Run: \`./restore.sh\`

## Manual Restore (if needed):

\`\`\`bash
# Restore full database
docker exec -i postgres-db psql -U pbx_user -d pbx_db < full_database.sql

# Or restore schema first, then data
docker exec -i postgres-db psql -U pbx_user -d pbx_db < schema_only.sql
docker exec -i postgres-db psql -U pbx_user -d pbx_db < data_only.sql
\`\`\`

## Verification:

After restore, verify data:
\`\`\`bash
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM users;"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_detail_records;"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_recordings;"
\`\`\`
EOF

print_success "Backup completed successfully!"
print_status "Backup location: $BACKUP_DIR"
print_status "To restore on new host:"
print_status "1. Copy the backup directory to new host"
print_status "2. Run: cd $BACKUP_DIR && ./restore.sh"

# Display backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
print_status "Total backup size: $BACKUP_SIZE"

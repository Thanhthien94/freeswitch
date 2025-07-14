#!/bin/bash

# Cleanup Old Backups Script
# This script manages backup retention and cleanup

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

# Configuration
BACKUP_DIR="backups"
RETENTION_DAYS=${1:-7}  # Default: keep backups for 7 days

print_status "Starting backup cleanup process..."
print_status "Retention period: $RETENTION_DAYS days"

# Check if backups directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backups directory not found: $BACKUP_DIR"
    exit 1
fi

# List current backups
print_status "Current backups:"
ls -la "$BACKUP_DIR"/ | grep "^d" | grep -E "[0-9]{8}_[0-9]{6}" || echo "No timestamped backup directories found"

# Find backups older than retention period
print_status "Finding backups older than $RETENTION_DAYS days..."

OLD_BACKUPS=()
CURRENT_BACKUPS=()

for backup_dir in "$BACKUP_DIR"/*/; do
    if [ -d "$backup_dir" ]; then
        backup_name=$(basename "$backup_dir")
        
        # Skip if not a timestamped backup directory
        if [[ ! "$backup_name" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
            continue
        fi
        
        # Extract date from backup name (YYYYMMDD_HHMMSS)
        backup_date=$(echo "$backup_name" | cut -d'_' -f1)
        
        # Convert to seconds since epoch for comparison
        backup_timestamp=$(date -j -f "%Y%m%d" "$backup_date" "+%s" 2>/dev/null || echo "0")
        current_timestamp=$(date "+%s")
        retention_seconds=$((RETENTION_DAYS * 24 * 3600))
        
        if [ "$backup_timestamp" -gt 0 ]; then
            age_seconds=$((current_timestamp - backup_timestamp))
            
            if [ "$age_seconds" -gt "$retention_seconds" ]; then
                OLD_BACKUPS+=("$backup_dir")
                print_warning "Old backup: $backup_name ($(($age_seconds / 86400)) days old)"
            else
                CURRENT_BACKUPS+=("$backup_dir")
                print_success "Current backup: $backup_name ($(($age_seconds / 86400)) days old)"
            fi
        fi
    fi
done

# Show summary
echo ""
print_status "=== BACKUP SUMMARY ==="
echo "Current backups to keep: ${#CURRENT_BACKUPS[@]}"
echo "Old backups to remove: ${#OLD_BACKUPS[@]}"

if [ ${#CURRENT_BACKUPS[@]} -eq 0 ]; then
    print_warning "No current backups found!"
fi

if [ ${#OLD_BACKUPS[@]} -eq 0 ]; then
    print_success "No old backups to clean up"
    exit 0
fi

# List old backups
echo ""
print_warning "Old backups to be removed:"
for backup in "${OLD_BACKUPS[@]}"; do
    backup_name=$(basename "$backup")
    backup_size=$(du -sh "$backup" | cut -f1)
    echo "  - $backup_name ($backup_size)"
done

# Calculate total size to be freed
total_size=$(du -sh "${OLD_BACKUPS[@]}" 2>/dev/null | tail -1 | cut -f1 || echo "unknown")
echo ""
print_status "Total space to be freed: $total_size"

# Confirm deletion
echo ""
read -p "Do you want to delete these old backups? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleanup cancelled by user"
    exit 0
fi

# Delete old backups
print_status "Removing old backups..."
for backup in "${OLD_BACKUPS[@]}"; do
    backup_name=$(basename "$backup")
    print_status "Removing $backup_name..."
    rm -rf "$backup"
    print_success "Removed $backup_name"
done

print_success "Backup cleanup completed!"

# Show final status
echo ""
print_status "=== FINAL STATUS ==="
remaining_backups=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "[0-9]*_[0-9]*" | wc -l)
total_backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
print_success "Remaining backups: $remaining_backups"
print_success "Total backup directory size: $total_backup_size"

# Recommendations
echo ""
print_status "=== RECOMMENDATIONS ==="
if [ "$remaining_backups" -gt 5 ]; then
    print_warning "You have $remaining_backups backups. Consider reducing retention period."
elif [ "$remaining_backups" -lt 2 ]; then
    print_warning "You have only $remaining_backups backups. Consider creating more frequent backups."
else
    print_success "Backup retention looks good ($remaining_backups backups)"
fi

echo ""
print_status "Usage: $0 [retention_days]"
print_status "Example: $0 3  # Keep backups for 3 days"
print_status "Default: $0    # Keep backups for 7 days"

#!/bin/bash

# Export Data for Production Sync Script
# Exports essential data from development database for production import

set -e

# Configuration
BACKUP_DIR="./backups/production-sync"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="$BACKUP_DIR/$TIMESTAMP"

echo "🚀 FreeSWITCH PBX - Export Data for Production Sync"
echo "=================================================="
echo "Export Directory: $EXPORT_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"

# Function to export full database schema
export_schema() {
    echo "🏗️  Exporting database schema..."

    docker-compose exec -T postgres pg_dump \
        -h localhost -p 5432 -U pbx_user -d pbx_db \
        --schema-only --clean --if-exists --no-owner --no-privileges \
        > "$EXPORT_DIR/00_schema.sql" 2>/dev/null

    echo "✅ Database schema exported to 00_schema.sql"
}

# Function to export table schema and data
export_table() {
    local table_name=$1
    local description=$2

    echo "📋 Exporting $description ($table_name)..."

    # Check if table exists and has data
    local count=$(docker-compose exec -T postgres psql -U pbx_user -d pbx_db -t -c "SELECT COUNT(*) FROM $table_name;" 2>/dev/null | tr -d ' \n' || echo "0")

    if [[ "$count" -gt 0 ]]; then
        # Export only data (schema is in 00_schema.sql)
        docker-compose exec -T postgres pg_dump \
            -h localhost -p 5432 -U pbx_user -d pbx_db \
            --data-only --inserts --table="$table_name" \
            > "$EXPORT_DIR/${table_name}.sql" 2>/dev/null
        echo "✅ Exported $count records from $table_name"
    else
        echo "⚠️  Skipping $table_name (empty table)"
        touch "$EXPORT_DIR/${table_name}.sql"
    fi
}

# Essential tables for production sync
ESSENTIAL_TABLES=(
    # Core configuration
    "config_categories:Configuration Categories"
    "config_items:Configuration Items"
    "config_history:Configuration History"
    "global_network_configs:Global Network Configuration"

    # Domain and user management
    "domains:Legacy Domains"
    "freeswitch_domains:FreeSWITCH Domains"
    "users:Users"
    "permissions:Permissions"
    "roles:Roles"
    "role_permissions:Role Permissions"
    "user_roles:User Roles"
    "user_attributes:User Attributes"
    "policies:Policies"

    # FreeSWITCH configuration
    "freeswitch_sip_profiles:SIP Profiles"
    "freeswitch_gateways:Gateways"
    "freeswitch_dialplans:Dialplans"
    "freeswitch_extensions:Extensions"
    "freeswitch_config_versions:FreeSWITCH Config Versions"
    "freeswitch_config_deployments:FreeSWITCH Config Deployments"

    # System data
    "migrations:Database Migrations"
)

echo "📊 Exporting Database Schema and Data for Production..."
echo "===================================================="

# Export full database schema first
export_schema

echo ""
echo "📋 Exporting Essential Data..."
echo "============================="

# Export essential tables
for table_info in "${ESSENTIAL_TABLES[@]}"; do
    IFS=':' read -r table_name description <<< "$table_info"
    export_table "$table_name" "$description"
done

echo ""
echo "📦 Creating Production Import Script..."
echo "====================================="

# Create production import script
cat > "$EXPORT_DIR/import-to-production.sh" << 'EOF'
#!/bin/bash

# Production Import Script
# Imports exported data into production database

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Production database configuration (update these for your production environment)
PROD_DB_HOST="${POSTGRES_HOST:-42.96.20.37}"
PROD_DB_PORT="${POSTGRES_PORT:-5432}"
PROD_DB_NAME="${POSTGRES_DB:-pbx_production}"
PROD_DB_USER="${POSTGRES_USER:-pbx_user}"

echo "🚀 Importing data to production database..."
echo "Database: $PROD_DB_NAME"
echo "Host: $PROD_DB_HOST:$PROD_DB_PORT"
echo ""

# Check if password is provided
if [[ -z "$POSTGRES_PASSWORD" ]]; then
    echo "⚠️  Please set POSTGRES_PASSWORD environment variable"
    echo "Example: POSTGRES_PASSWORD=your_password ./import-to-production.sh"
    exit 1
fi

# Function to import data
import_data() {
    local file=$1
    local description=$2

    if [[ -f "$SCRIPT_DIR/$file" && -s "$SCRIPT_DIR/$file" ]]; then
        echo "📥 Importing $description..."
        PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" \
            -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
            -f "$SCRIPT_DIR/$file" > /dev/null 2>&1
        echo "✅ $description imported successfully"
    else
        echo "⚠️  Skipping $description (file empty or not found)"
    fi
}

# Import schema first, then data in correct order
echo "🏗️  Importing Database Schema..."
import_data "00_schema.sql" "Database Schema"

echo ""
echo "📊 Importing Essential Data..."

# Core configuration first
import_data "config_categories.sql" "Configuration Categories"
import_data "config_items.sql" "Configuration Items"
import_data "config_history.sql" "Configuration History"
import_data "global_network_configs.sql" "Global Network Configuration"

# Domain and user management
import_data "domains.sql" "Legacy Domains"
import_data "freeswitch_domains.sql" "FreeSWITCH Domains"
import_data "permissions.sql" "Permissions"
import_data "roles.sql" "Roles"
import_data "users.sql" "Users"
import_data "role_permissions.sql" "Role Permissions"
import_data "user_roles.sql" "User Roles"
import_data "user_attributes.sql" "User Attributes"
import_data "policies.sql" "Policies"

# FreeSWITCH configuration
import_data "freeswitch_sip_profiles.sql" "SIP Profiles"
import_data "freeswitch_gateways.sql" "Gateways"
import_data "freeswitch_dialplans.sql" "Dialplans"
import_data "freeswitch_extensions.sql" "Extensions"
import_data "freeswitch_config_versions.sql" "FreeSWITCH Config Versions"
import_data "freeswitch_config_deployments.sql" "FreeSWITCH Config Deployments"

# System data
import_data "migrations.sql" "Database Migrations"

echo ""
echo "✅ Production import completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Verify imported data in production database"
echo "2. Test application connectivity"
echo "3. Update production environment variables if needed"
echo "4. Test FreeSWITCH functionality"
EOF

chmod +x "$EXPORT_DIR/import-to-production.sh"

# Create data verification script
cat > "$EXPORT_DIR/verify-data.sh" << 'EOF'
#!/bin/bash

# Data Verification Script
# Verifies exported data integrity

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Verifying exported data..."
echo "============================="

# Check file sizes
echo "📊 File sizes:"
ls -lh "$SCRIPT_DIR"/*.sql 2>/dev/null | awk '{print $9 ": " $5}' || echo "No SQL files found"

echo ""
echo "📋 Data summary:"

# Count lines in each file
total_lines=0
for file in "$SCRIPT_DIR"/*.sql; do
    if [[ -f "$file" && -s "$file" ]]; then
        filename=$(basename "$file")
        lines=$(wc -l < "$file")
        inserts=$(grep -c "INSERT INTO" "$file" 2>/dev/null || echo "0")
        echo "$filename: $lines lines, $inserts INSERT statements"
        total_lines=$((total_lines + lines))
    fi
done

echo ""
echo "📊 Total: $total_lines lines across all files"
echo "✅ Data verification completed"
EOF

chmod +x "$EXPORT_DIR/verify-data.sh"

echo ""
echo "📄 Creating Documentation..."
echo "============================"

# Create README for the export
cat > "$EXPORT_DIR/README.md" << EOF
# FreeSWITCH PBX - Production Data Sync

**Export Date:** $(date)
**Export Directory:** $EXPORT_DIR

## 🎯 Purpose

This export contains complete database schema and essential data from development database for syncing to production database.
The export includes both schema creation and data insertion, so it can be imported to an empty database.

## 📦 Contents

### Schema File
- \`00_schema.sql\` - Complete database schema (tables, indexes, constraints)

### Essential Data Files
- \`config_categories.sql\` - Configuration categories
- \`config_items.sql\` - Configuration items
- \`global_network_configs.sql\` - Global network settings
- \`freeswitch_domains.sql\` - FreeSWITCH domains
- \`users.sql\` - User accounts
- \`permissions.sql\` - User permissions
- \`freeswitch_sip_profiles.sql\` - SIP profiles
- \`freeswitch_gateways.sql\` - SIP gateways
- \`freeswitch_dialplans.sql\` - Dialplan rules
- \`freeswitch_extensions.sql\` - Extensions
- \`migrations.sql\` - Database migrations

### Scripts
- \`import-to-production.sh\` - Import data to production
- \`verify-data.sh\` - Verify exported data

## 🚀 Usage

### 1. Copy to Production Server
\`\`\`bash
scp -r $EXPORT_DIR root@42.96.20.37:/tmp/
\`\`\`

### 2. Import to Production
\`\`\`bash
cd /tmp/$(basename $EXPORT_DIR)
POSTGRES_PASSWORD=your_production_password ./import-to-production.sh
\`\`\`

### 3. Verify Data
\`\`\`bash
./verify-data.sh
\`\`\`

## ⚠️ Important Notes

1. **Empty Database**: This export can be imported to an empty production database
2. **Schema Included**: No need to run migrations first - schema is included
3. **Password**: Set POSTGRES_PASSWORD environment variable
4. **Network**: Update production IP in import script if needed
5. **Clean Import**: Use \`--clean\` flag to drop existing objects if needed

## 🔧 Configuration

Update these in production after import:
- User passwords (currently from development)
- Domain configurations for production
- Gateway credentials for production
- Network settings for production environment

## 📞 Support

For issues, check the main project documentation or contact the development team.
EOF

echo ""
echo "🔍 Running Data Verification..."
echo "=============================="

"$EXPORT_DIR/verify-data.sh"

echo ""
echo "✅ Export completed successfully!"
echo "================================="
echo ""
echo "📁 Export location: $EXPORT_DIR"
echo "📄 Documentation: $EXPORT_DIR/README.md"
echo "🚀 Import script: $EXPORT_DIR/import-to-production.sh"
echo "🔍 Verify script: $EXPORT_DIR/verify-data.sh"
echo ""
echo "📝 Next steps:"
echo "1. Review exported data: $EXPORT_DIR"
echo "2. Copy to production server:"
echo "   scp -r $EXPORT_DIR root@42.96.20.37:/tmp/"
echo "3. Import on production:"
echo "   cd /tmp/$(basename $EXPORT_DIR)"
echo "   POSTGRES_PASSWORD=your_password ./import-to-production.sh"
echo "4. Verify data integrity"
echo ""
echo "✅ Schema included: No need to run migrations first - complete schema is exported!"

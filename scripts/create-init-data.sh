#!/bin/bash

# Create Complete Init Data Script
# Combines all essential data from latest backup into single init file

set -e

BACKUP_DIR="./backups/production-sync/20250803_194829"
OUTPUT_FILE="./database/init/01-complete-data.sql"

echo "🔄 Creating complete init data file..."

# Create header
cat > "$OUTPUT_FILE" << 'EOF'
--
-- FreeSWITCH PBX Complete Data Initialization
-- Generated from production-sync backup: 20250803_194829
-- This file contains all essential data for FreeSWITCH PBX system
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

EOF

# Essential data files in correct order
DATA_FILES=(
    "config_categories.sql"
    "config_items.sql" 
    "global_network_configs.sql"
    "domains.sql"
    "freeswitch_domains.sql"
    "permissions.sql"
    "roles.sql"
    "users.sql"
    "role_permissions.sql"
    "user_roles.sql"
    "user_attributes.sql"
    "policies.sql"
    "freeswitch_sip_profiles.sql"
    "freeswitch_gateways.sql"
    "freeswitch_dialplans.sql"
    "freeswitch_extensions.sql"
    "freeswitch_config_versions.sql"
    "freeswitch_config_deployments.sql"
    "migrations.sql"
)

# Add each data file
for file in "${DATA_FILES[@]}"; do
    if [[ -f "$BACKUP_DIR/$file" && -s "$BACKUP_DIR/$file" ]]; then
        echo "📋 Adding $file..."
        
        # Add section header
        section_name=$(echo "$file" | sed 's/.sql$//' | tr '_' ' ' | tr '[:lower:]' '[:upper:]')
        cat >> "$OUTPUT_FILE" << EOF

-- ============================================================================
-- $section_name
-- ============================================================================

EOF
        
        # Add data (skip PostgreSQL headers)
        tail -n +19 "$BACKUP_DIR/$file" >> "$OUTPUT_FILE"
    else
        echo "⚠️  Skipping $file (empty or not found)"
    fi
done

echo ""
echo "✅ Complete init data file created: $OUTPUT_FILE"
echo "📊 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "📋 Lines: $(wc -l < "$OUTPUT_FILE")"

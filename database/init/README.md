# FreeSWITCH PBX Database Initialization

## 📋 **OVERVIEW**

This directory contains the **ONLY** initialization scripts needed for FreeSWITCH PBX database setup.

## 🎯 **CURRENT STRUCTURE (SIMPLIFIED)**

### **Active Files:**
- `00-init-freeswitch-pbx.sql` - **MAIN INIT SCRIPT** (calls other files)
- `00-complete-schema.sql` - Complete database schema
- `01-complete-data.sql` - Essential data (users, extensions, domains)

### **Backup Files:**
- `backup_old_scripts/` - Old initialization scripts (kept for reference)

## 🚀 **USAGE**

### **Automatic (Docker)**
Files are automatically executed by PostgreSQL Docker container in alphabetical order:
1. `00-init-freeswitch-pbx.sql` (main script)
2. Calls `00-complete-schema.sql` (schema)
3. Calls `01-complete-data.sql` (data)

### **Manual**
```bash
# Full initialization
psql -U pbx_user -d pbx_db -f database/init/00-init-freeswitch-pbx.sql

# Schema only
psql -U pbx_user -d pbx_db -f database/init/00-complete-schema.sql

# Data only (requires schema first)
psql -U pbx_user -d pbx_db -f database/init/01-complete-data.sql
```

## 📊 **WHAT'S INCLUDED**

### **Schema (`00-complete-schema.sql`):**
- All tables, indexes, constraints
- FreeSWITCH configuration tables
- User management tables
- CDR and recording tables
- Audit and security tables

### **Data (`01-complete-data.sql`):**
- **Users:** admin, manager, agent (with roles)
- **Extensions:** 1001, 1002, 1003
- **Domains:** localhost, finstar.vn
- **Permissions:** Complete RBAC system
- **Configuration:** Essential FreeSWITCH settings

## 🔐 **DEFAULT CREDENTIALS**

| Username | Password | Email | Role |
|----------|----------|-------|------|
| admin | admin123 | admin@localhost | superadmin |
| manager | manager123 | manager@localhost | manager |
| agent | agent123 | agent@localhost | agent |

## 📞 **DEFAULT EXTENSIONS**

| Extension | Name | Domain | Password |
|-----------|------|--------|----------|
| 1001 | John Doe | finstar.vn | admin123 |
| 1002 | Jane Smith | finstar.vn | sales123 |
| 1003 | Bob Wilson | N/A | support123 |

## 🔄 **MAINTENANCE**

### **Update Data:**
1. Export latest data: `./scripts/export-data-for-production.sh`
2. Update init files: `./scripts/create-init-data.sh`
3. Test with fresh database

### **Backup:**
- Old scripts are in `backup_old_scripts/`
- Production backups are in `backups/production-sync/`

## ⚠️ **IMPORTANT NOTES**

1. **Single Source of Truth:** Only use files in this directory for initialization
2. **No Manual Edits:** Update via export scripts, not manual editing
3. **Docker Volumes:** Clear volumes when testing: `docker-compose down -v`
4. **Production Sync:** Use `export-data-for-production.sh` for production deployment

## 🧹 **CLEANUP COMPLETED**

✅ **Removed old scripts:**
- `00-current-schema.sql` → `backup_old_scripts/`
- `01-current-data.sql` → `backup_old_scripts/`
- `002_create_cdr_system.sql` → `backup_old_scripts/`
- `003_create_call_recordings.sql` → `backup_old_scripts/`
- Multiple migration scripts → `scripts/backup_old_scripts/`

✅ **New simplified structure:**
- 1 main script calls 2 sub-scripts
- Clear separation of schema vs data
- Easy to maintain and update

# Backups Directory

This directory is used for storing database and system backups during migration.

## ⚠️ Important Security Notice

**This directory is excluded from Git repository for security reasons:**
- Contains production database dumps with sensitive data
- Includes user passwords, call records, and system configurations
- Should never be committed to version control

## 📁 Directory Structure

When you run the backup script, it creates timestamped directories:

```
backups/
├── YYYYMMDD_HHMMSS/
│   ├── full_database.sql          # Complete database dump
│   ├── schema_only.sql           # Database schema only
│   ├── data_only.sql            # Data only (with triggers disabled)
│   ├── *.csv                    # Individual table exports
│   ├── recordings_backup.tar.gz # Call recordings archive
│   ├── configs_backup.tar.gz    # FreeSWITCH configurations
│   ├── database_stats.txt       # Database statistics
│   ├── restore.sh              # Automated restore script
│   └── README.md               # Backup documentation
└── README.md                   # This file
```

## 🔄 Usage

### Create Backup
```bash
# Run backup script (creates timestamped directory)
./scripts/backup-current-data.sh
```

### Transfer to New Host
```bash
# Copy backup to new host
scp -r backups/YYYYMMDD_HHMMSS user@new-host:/path/to/freeswitch/backups/

# Or use rsync for large backups
rsync -av --progress backups/YYYYMMDD_HHMMSS/ user@new-host:/path/to/freeswitch/backups/YYYYMMDD_HHMMSS/
```

### Restore on New Host
```bash
# Navigate to backup directory
cd backups/YYYYMMDD_HHMMSS

# Run automated restore
./restore.sh

# Or manual restore
docker exec -i postgres-db psql -U pbx_user -d pbx_db < full_database.sql
```

## 🛡️ Security Best Practices

1. **Never commit backups to Git**
   - Backups contain sensitive production data
   - Use secure transfer methods (SCP, SFTP, encrypted storage)

2. **Secure backup storage**
   - Store backups in secure, encrypted locations
   - Limit access to authorized personnel only
   - Use strong passwords for backup archives

3. **Regular cleanup**
   - Remove old backups after successful migration
   - Don't leave backups on shared systems
   - Securely delete backup files when no longer needed

## 📋 Backup Contents

### Database Dumps
- **full_database.sql**: Complete database with schema and data
- **schema_only.sql**: Database structure without data
- **data_only.sql**: Data only with foreign key constraints handled

### Individual Tables (CSV)
- **users.csv**: User accounts and profiles
- **call_detail_records.csv**: Call history and CDR data
- **call_recordings.csv**: Recording metadata
- **roles.csv**: User roles and permissions
- **permissions.csv**: System permissions
- **role_permissions.csv**: Role-permission mappings
- **user_roles.csv**: User-role assignments

### System Files
- **recordings_backup.tar.gz**: All call recording audio files
- **configs_backup.tar.gz**: FreeSWITCH configuration files
- **database_stats.txt**: Database performance statistics

## 🔍 Verification

After restore, verify data integrity:

```bash
# Check user count
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM users;"

# Check CDR records
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_detail_records;"

# Check recordings
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_recordings;"

# Verify recordings files exist
ls -la recordings/
```

## 🚨 Troubleshooting

### Common Issues

1. **Foreign key constraint errors**
   - Use full_database.sql instead of data_only.sql
   - Ensure PostgreSQL container is fully initialized

2. **Permission denied errors**
   - Check file permissions on backup files
   - Ensure Docker has access to backup directory

3. **Large backup transfer**
   - Use compression: `tar -czf backup.tar.gz backups/YYYYMMDD_HHMMSS/`
   - Use rsync with progress: `rsync -av --progress`

### Recovery Commands

```bash
# If restore fails, reset database
docker exec postgres-db psql -U pbx_user -d pbx_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then restore schema first
docker exec -i postgres-db psql -U pbx_user -d pbx_db < schema_only.sql

# Then restore data
docker exec -i postgres-db psql -U pbx_user -d pbx_db < data_only.sql
```

---

**Remember: Backups contain sensitive production data. Handle with care and follow security best practices.**

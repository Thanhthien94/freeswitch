# Database Backup Summary

**Created:** Mon Jul 14 07:17:34 +07 2025
**Source Host:** Thiens-MacBook-Pro.local
**Database:** pbx_db
**User:** pbx_user

## Files Included:

- `full_database.sql` - Complete database dump (schema + data)
- `schema_only.sql` - Database schema only
- `data_only.sql` - Data only with disabled triggers
- `*.csv` - Individual table exports
- `recordings_backup.tar.gz` - Call recordings backup
- `configs_backup.tar.gz` - Configuration files backup
- `database_stats.txt` - Database statistics
- `restore.sh` - Automated restore script

## Restore Instructions:

1. Copy this entire backup directory to the new host
2. Ensure Docker and PostgreSQL container are running
3. Run: `./restore.sh`

## Manual Restore (if needed):

```bash
# Restore full database
docker exec -i postgres-db psql -U pbx_user -d pbx_db < full_database.sql

# Or restore schema first, then data
docker exec -i postgres-db psql -U pbx_user -d pbx_db < schema_only.sql
docker exec -i postgres-db psql -U pbx_user -d pbx_db < data_only.sql
```

## Verification:

After restore, verify data:
```bash
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM users;"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_detail_records;"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM call_recordings;"
```

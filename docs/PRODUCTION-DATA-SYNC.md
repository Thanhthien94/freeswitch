# Production Data Sync Guide

## Tổng quan

Hướng dẫn này mô tả cách đồng bộ data từ development database sang production database trống.

## Quy trình

### 1. Export Data từ Development

```bash
# Export data từ development database
./scripts/export-data-for-production.sh
```

**Kết quả:**
- Tạo thư mục export với timestamp: `./backups/production-sync/YYYYMMDD_HHMMSS/`
- Chứa các file SQL với data từ các bảng quan trọng
- Bao gồm script import và documentation

### 2. Deploy Data lên Production

#### Option A: Tự động (Khuyến nghị)
```bash
# Deploy tự động lên production server
./scripts/deploy-data-to-production.sh
```

#### Option B: Thủ công
```bash
# 1. Copy data lên production server
EXPORT_DIR=$(ls -t ./backups/production-sync/ | head -n1)
scp -r ./backups/production-sync/$EXPORT_DIR root@42.96.20.37:/tmp/

# 2. SSH vào production server
ssh root@42.96.20.37

# 3. Import data
cd /tmp/$EXPORT_DIR
POSTGRES_PASSWORD=your_password ./import-to-production.sh
```

## Data được đồng bộ

### ✅ Essential Data
- **Configuration**: Categories, items, network configs
- **Domains**: FreeSWITCH domains
- **Users**: User accounts và permissions
- **FreeSWITCH Config**: SIP profiles, gateways, extensions
- **System**: Database migrations

### ❌ Data không đồng bộ
- **Logs**: Authentication logs, audit logs
- **CDR**: Call detail records
- **Recordings**: Call recordings
- **Temporary data**: Sessions, cache

## Yêu cầu

### Production Database
- ✅ **Schema đã có**: Database đã chạy migrations
- ✅ **Database trống**: Không có data cũ
- ✅ **Connectivity**: Có thể kết nối từ script

### Network
- ✅ **SSH Access**: Có thể SSH vào production server
- ✅ **Database Access**: Production database accessible

## Troubleshooting

### Lỗi Export
```bash
# Kiểm tra database connection
docker-compose ps postgres

# Kiểm tra database data
docker-compose exec postgres psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) FROM users;"
```

### Lỗi Import
```bash
# Kiểm tra production database
ssh root@42.96.20.37
psql -h localhost -U pbx_user -d pbx_production -c "\dt"

# Kiểm tra schema
psql -h localhost -U pbx_user -d pbx_production -c "SELECT * FROM migrations;"
```

### Lỗi SSH
```bash
# Test SSH connection
ssh -o BatchMode=yes -o ConnectTimeout=5 root@42.96.20.37 exit

# Kiểm tra SSH key
ssh-add -l
```

## Verification

### Sau khi import
```bash
# Kiểm tra data đã import
ssh root@42.96.20.37
psql -h localhost -U pbx_user -d pbx_production

# Kiểm tra số lượng records
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'freeswitch_domains', COUNT(*) FROM freeswitch_domains
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions;
```

### Test application
```bash
# Test API health
curl http://42.96.20.37:3000/api/v1/health

# Test login
curl -X POST http://42.96.20.37:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Security Notes

### ⚠️ Passwords
- Development passwords được copy sang production
- **Phải đổi passwords sau khi import**
- Update JWT secrets trong production environment

### ⚠️ Domain Configuration
- Domain names có thể cần update cho production
- Update CORS origins
- Update network configurations

### ⚠️ Gateway Credentials
- Gateway passwords từ development
- **Phải update credentials cho production**

## Best Practices

### 1. Backup trước khi import
```bash
# Backup production database trước khi import
ssh root@42.96.20.37
pg_dump -h localhost -U pbx_user pbx_production > backup_before_sync.sql
```

### 2. Test import trên staging
```bash
# Test trên staging environment trước
# Đảm bảo process hoạt động đúng
```

### 3. Monitor sau import
```bash
# Monitor logs sau khi import
ssh root@42.96.20.37
docker-compose logs -f nestjs-app
```

## Scripts Reference

### Export Script
- **File**: `scripts/export-data-for-production.sh`
- **Purpose**: Export essential data từ development
- **Output**: `./backups/production-sync/TIMESTAMP/`

### Deploy Script  
- **File**: `scripts/deploy-data-to-production.sh`
- **Purpose**: Copy và import data lên production
- **Requirements**: SSH access, database password

### Import Script (Generated)
- **File**: `import-to-production.sh` (trong export directory)
- **Purpose**: Import data vào production database
- **Usage**: `POSTGRES_PASSWORD=pass ./import-to-production.sh`

### Verify Script (Generated)
- **File**: `verify-data.sh` (trong export directory)
- **Purpose**: Verify exported data integrity
- **Usage**: `./verify-data.sh`

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong export directory
2. Verify database connectivity
3. Check SSH access
4. Review error messages
5. Contact development team

## Example Workflow

```bash
# 1. Export data từ development
./scripts/export-data-for-production.sh

# 2. Review exported data
ls -la ./backups/production-sync/$(ls -t ./backups/production-sync/ | head -n1)/

# 3. Deploy lên production
./scripts/deploy-data-to-production.sh

# 4. Verify trên production
ssh root@42.96.20.37
psql -h localhost -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM users;"

# 5. Test application
curl http://42.96.20.37:3000/api/v1/health
```

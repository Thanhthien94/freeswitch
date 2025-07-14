# Production Server Data Initialization Guide

## 🎯 Overview

Có 2 scenarios chính để init data trên production server:

1. **Fresh Installation** - Server mới hoàn toàn
2. **Migration** - Chuyển từ server hiện tại sang server mới

---

## 📋 SCENARIO 1: Fresh Production Server

### Step 1: Clone Repository
```bash
git clone https://github.com/Thanhthien94/freeswitch.git
cd freeswitch
```

### Step 2: Configure Environment
```bash
# Copy production environment template
cp .env.production .env.production.local

# Edit với production values
nano .env.production.local
```

**Required Environment Variables:**
```env
POSTGRES_DB=pbx_production
POSTGRES_USER=pbx_user
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
RABBITMQ_PASSWORD=your_rabbitmq_password
JWT_SECRET=your_super_secure_jwt_secret
FREESWITCH_ESL_PASSWORD=your_esl_password
DOMAIN=your-domain.com
```

### Step 3: Deploy System
```bash
# Run automated deployment
./deploy.sh
```

### Step 4: Automatic Database Initialization

**PostgreSQL container sẽ tự động:**
1. Tạo database `pbx_production`
2. Chạy `database/init/01-init-pbx-db.sql`
3. Tạo tất cả tables và relationships
4. Insert default data

**Default Data Được Tạo:**
- **Domain**: `localhost` (default domain)
- **Roles**: superadmin, admin, manager, agent, user
- **Permissions**: Complete RBAC permission set
- **Users**: 
  - `admin` (superadmin role)
  - `manager` (manager role) 
  - `agent` (agent role)
- **Role Assignments**: Users được assign roles tương ứng

### Step 5: Verification
```bash
# Check containers
docker-compose -f docker-compose.production.yml ps

# Check database
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM users;"
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT username, email FROM users;"

# Check roles and permissions
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM roles;"
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM permissions;"

# Test login
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## 🔄 SCENARIO 2: Migration từ Server Hiện Tại

### Step 1: Backup Data trên Server Hiện Tại
```bash
# Trên server cũ
./scripts/backup-current-data.sh

# Kết quả: backups/YYYYMMDD_HHMMSS/
```

### Step 2: Transfer Backup sang Server Mới
```bash
# Copy backup directory
scp -r backups/YYYYMMDD_HHMMSS user@new-server:/path/to/freeswitch/backups/

# Hoặc dùng rsync cho file lớn
rsync -av --progress backups/YYYYMMDD_HHMMSS/ user@new-server:/path/to/freeswitch/backups/YYYYMMDD_HHMMSS/
```

### Step 3: Deploy System trên Server Mới
```bash
# Trên server mới
git clone https://github.com/Thanhthien94/freeswitch.git
cd freeswitch

# Configure environment
cp .env.production .env.production.local
nano .env.production.local

# Deploy (sẽ tạo empty database)
./deploy.sh
```

### Step 4: Restore Production Data
```bash
# Navigate to backup directory
cd backups/YYYYMMDD_HHMMSS

# Run automated restore
./restore.sh

# Hoặc manual restore
docker exec -i postgres-db psql -U pbx_user -d pbx_production < full_database.sql
```

### Step 5: Restore Files
```bash
# Restore recordings (nếu có)
tar -xzf recordings_backup.tar.gz

# Restore configs (nếu có)
tar -xzf configs_backup.tar.gz

# Set permissions
chmod -R 755 recordings/
```

### Step 6: Verification
```bash
# Check data integrity
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM users;"
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM call_detail_records;"
docker exec postgres-db psql -U pbx_user -d pbx_production -c "SELECT COUNT(*) FROM call_recordings;"

# Check recordings files
ls -la recordings/

# Test system
curl -I https://your-domain.com/api/v1/health
```

---

## 🔧 Database Init Details

### Automatic Initialization Process

**Docker PostgreSQL Container:**
1. Mounts `database/init/` → `/docker-entrypoint-initdb.d/`
2. Chạy tất cả `.sql` files theo alphabetical order
3. Chỉ chạy khi database chưa tồn tại

**Init Script Order:**
1. `01-init-pbx-db.sql` - Main schema và default data
2. `002_create_cdr_system.sql` - CDR system tables
3. `003_create_call_recordings.sql` - Recording tables

### Schema Created:
- **Core Tables**: domains, users, roles, permissions
- **RBAC Tables**: user_roles, role_permissions, user_attributes
- **CDR Tables**: call_detail_records, call_recordings, call_events
- **Audit Tables**: audit_logs, recording_access_logs
- **System Tables**: policies, recording_tags

### Default Data:
- **1 Domain**: localhost
- **5 Roles**: superadmin, admin, manager, agent, user
- **17 Permissions**: Complete RBAC permission set
- **3 Users**: admin, manager, agent với proper role assignments

---

## 🚨 Troubleshooting

### Database Init Issues:
```bash
# Check init logs
docker-compose logs postgres-db

# Manual init (if needed)
docker exec -i postgres-db psql -U pbx_user -d pbx_production < database/init/01-init-pbx-db.sql
```

### Permission Issues:
```bash
# Fix file permissions
sudo chown -R 1000:1000 recordings/
sudo chmod -R 755 recordings/
```

### Connection Issues:
```bash
# Test database connection
docker exec postgres-db pg_isready -U pbx_user -d pbx_production

# Test API health
curl -f http://localhost:3000/api/v1/health
```

---

## ✅ Success Criteria

**Fresh Installation:**
- [ ] All containers running healthy
- [ ] Database initialized with default data
- [ ] Admin user can login
- [ ] API health check passes
- [ ] Frontend accessible

**Migration:**
- [ ] All original data restored
- [ ] CDR records preserved
- [ ] Recording files accessible
- [ ] User accounts working
- [ ] System functionality intact

---

## 🎯 Next Steps After Init

1. **Configure Nginx Proxy Manager** với domain
2. **Test SIP connectivity** với FreeSWITCH
3. **Verify recording functionality**
4. **Set up monitoring** (optional)
5. **Configure backups** cho production

**🏆 Production server sẽ có đầy đủ data và functionality sau khi hoàn thành init process!**

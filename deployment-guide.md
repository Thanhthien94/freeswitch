# FreeSWITCH PBX System - Production Deployment Guide

## 🚀 Production Server Setup

### Prerequisites
- Ubuntu/CentOS server with Docker & Docker Compose
- Nginx Proxy Manager already installed
- Domain name pointed to server IP
- SSL certificate (Let's Encrypt via NPM)

### 1. Clone Repository
```bash
git clone https://github.com/Thanhthien94/freeswitch.git
cd freeswitch
```

### 1.5. Backup Current Data (If Migrating)
If you're migrating from an existing host, backup your current data first:

```bash
# On current host - backup data
./scripts/backup-current-data.sh

# Copy backup to new host
scp -r backups/YYYYMMDD_HHMMSS user@new-host:/path/to/freeswitch/

# On new host - restore data after deployment
cd backups/YYYYMMDD_HHMMSS
./restore.sh
```

### 2. Environment Configuration
```bash
# Copy and edit environment file
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

### 3. Production Environment Variables
```env
# Database
POSTGRES_DB=pbx_production
POSTGRES_USER=pbx_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_USER=pbx_user
RABBITMQ_PASSWORD=your_rabbitmq_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key

# FreeSWITCH
FREESWITCH_ESL_PASSWORD=your_esl_password

# Domain
DOMAIN=your-domain.com
```

### 4. Deploy with Docker Compose
```bash
# For DEVELOPMENT (with monitoring, internal nginx):
docker-compose up -d

# For PRODUCTION (clean, no internal nginx):
docker-compose -f docker-compose.production.yml up -d

# Check services status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 5. Nginx Proxy Manager Configuration

#### Main Proxy Host:
- **Domain Names**: `your-domain.com`
- **Scheme**: `http`
- **Forward Hostname/IP**: `server-ip`
- **Forward Port**: `3002`
- **Block Common Exploits**: ✅
- **Websockets Support**: ✅
- **Access List**: None (or create if needed)

#### Custom Locations:
1. **API Location**:
   - **Location**: `/api/`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `server-ip`
   - **Forward Port**: `3000`
   - **Forward Path**: `/api/`

#### SSL Configuration:
- **SSL Certificate**: Request new SSL Certificate
- **Force SSL**: ✅
- **HTTP/2 Support**: ✅
- **HSTS Enabled**: ✅

#### Advanced Configuration:
Copy content from `nginx-proxy-manager-config.txt` to "Custom Nginx Configuration"

### 6. Firewall Configuration
```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SIP (FreeSWITCH)
ufw allow 5060/udp
ufw allow 5080/udp

# Allow RTP (FreeSWITCH)
ufw allow 16384:16484/udp

# Enable firewall
ufw enable
```

### 7. Health Checks
```bash
# Check frontend
curl -I https://your-domain.com

# Check backend API
curl -I https://your-domain.com/api/v1/health

# Check FreeSWITCH
docker exec freeswitch-core fs_cli -x "status"
```

### 8. Monitoring & Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nestjs-api
docker-compose logs -f frontend-ui
docker-compose logs -f freeswitch-core

# Monitor resources
docker stats
```

## 🔧 Service Endpoints

### Public URLs (via Nginx Proxy Manager):
- **Frontend**: https://your-domain.com
- **API**: https://your-domain.com/api/v1
- **Health Check**: https://your-domain.com/api/v1/health

### Internal Docker Network:
- **Frontend**: http://frontend:3000 (exposed on host port 3002)
- **Backend**: http://nestjs-api:3000 (exposed on host port 3000)
- **FreeSWITCH ESL**: freeswitch:8021 (internal only)
- **PostgreSQL**: postgres:5432 (internal only - no external port)
- **Redis**: redis:6379 (internal only - no external port)
- **RabbitMQ**: rabbitmq:5672 (internal only - no external port)

### SIP Configuration:
- **SIP Port**: 5060/udp
- **RTP Range**: 16384-16484/udp
- **Domain**: your-domain.com

## 🛡️ Security Considerations

### 1. Database Security:
- Use strong passwords
- Limit database access to Docker network only
- Regular backups

### 2. API Security:
- JWT tokens with secure secrets
- Rate limiting configured
- CORS properly configured

### 3. FreeSWITCH Security:
- Change default ESL password
- Use SIP authentication
- Limit SIP access by IP if possible

### 4. SSL/TLS:
- Force HTTPS redirect
- Use strong SSL ciphers
- Enable HSTS

## 📊 Performance Optimization

### 1. Docker Resources:
```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### 2. Database Optimization:
- Configure PostgreSQL for production
- Set up connection pooling
- Regular VACUUM and ANALYZE

### 3. Caching:
- Redis for session storage
- Nginx caching for static assets
- CDN for global distribution

## 🔄 Backup Strategy

### 1. Database Backup:
```bash
# Create backup
docker exec postgres-db pg_dump -U pbx_user pbx_production > backup.sql

# Restore backup
docker exec -i postgres-db psql -U pbx_user pbx_production < backup.sql
```

### 2. Recordings Backup:
```bash
# Backup recordings
tar -czf recordings-backup.tar.gz freeswitch/recordings/

# Sync to remote storage
rsync -av freeswitch/recordings/ user@backup-server:/backups/recordings/
```

### 3. Configuration Backup:
```bash
# Backup entire configuration
tar -czf freeswitch-config-backup.tar.gz freeswitch/conf/
```

## 🚨 Troubleshooting

### Common Issues:
1. **503 Service Unavailable**: Check if backend is running
2. **Audio Issues**: Verify RTP port range in firewall
3. **Database Connection**: Check credentials and network
4. **SSL Issues**: Verify certificate in Nginx Proxy Manager

### Debug Commands:
```bash
# Check service health
docker-compose ps
docker-compose logs service-name

# Test internal connectivity
docker exec nestjs-api curl http://postgres-db:5432
docker exec nestjs-api curl http://freeswitch-core:8021

# FreeSWITCH CLI
docker exec -it freeswitch-core fs_cli
```

## 📞 Testing Deployment

### 1. Web Interface:
- Access https://your-domain.com
- Login with admin credentials
- Test CDR page and audio player

### 2. SIP Testing:
- Configure SIP client with domain
- Test registration and calls
- Verify recording functionality

### 3. API Testing:
```bash
# Health check
curl https://your-domain.com/api/v1/health

# Authentication
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Firewall rules applied
- [ ] Database secured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] SIP testing completed
- [ ] Web interface accessible
- [ ] Audio player functional
- [ ] CDR system working

**🏆 Your FreeSWITCH PBX system is ready for production!**

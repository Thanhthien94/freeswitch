# ABAC/RBAC Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### 1. Environment Setup

Create `.env` file in `nestjs-app/`:
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=pbx_user
POSTGRES_PASSWORD=pbx_password
POSTGRES_DB=pbx_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=3600
JWT_EXTENDED_EXPIRY=604800
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Application
NODE_ENV=development
PORT=3000

# Database Pool
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000
```

### 2. Database Setup

```bash
# Create database
createdb pbx_db

# Install dependencies
cd nestjs-app
npm install

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 3. Start Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📋 Default Accounts

After seeding, these accounts are available:

| Role | Username | Email | Password | Permissions |
|------|----------|-------|----------|-------------|
| SuperAdmin | admin | admin@localhost | admin123 | All permissions |
| Manager | manager | manager@localhost | manager123 | Department management |
| Supervisor | supervisor | supervisor@localhost | supervisor123 | Team oversight |
| Agent | agent | agent@localhost | agent123 | Basic call operations |
| Operator | operator | operator@localhost | operator123 | Call handling |

## 🔧 Configuration

### Database Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Revert last migration
npm run db:migrate:revert

# Generate new migration
npm run db:migrate:generate -- MigrationName

# Reset database (drop + migrate + seed)
npm run db:reset

# Fresh database (drop + create + migrate + seed)
npm run db:fresh
```

### Environment Variables

#### Required Variables
- `POSTGRES_HOST` - Database host
- `POSTGRES_PORT` - Database port
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `JWT_SECRET` - JWT signing secret

#### Optional Variables
- `JWT_EXPIRY` - Access token expiry (default: 3600s)
- `JWT_EXTENDED_EXPIRY` - Extended token expiry (default: 604800s)
- `JWT_REFRESH_SECRET` - Refresh token secret
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)

## 🏗️ Production Deployment

### 1. Security Hardening

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Set secure environment
NODE_ENV=production
```

### 2. Database Configuration

```bash
# Production database with SSL
POSTGRES_HOST=your-prod-db-host
POSTGRES_PORT=5432
POSTGRES_USER=pbx_prod_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=pbx_production
POSTGRES_SSL=true
```

### 3. Docker Deployment

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  app:
    build: 
      context: ./nestjs-app
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - POSTGRES_HOST=db
      - POSTGRES_USER=pbx_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=pbx_db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=pbx_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=pbx_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Health Checks

The application provides health check endpoints:
- `GET /health` - Application health
- `GET /health/db` - Database connectivity
- `GET /health/auth` - Authentication system

### 5. Monitoring

Enable application monitoring:
```bash
# Install monitoring dependencies
npm install @nestjs/terminus @nestjs/prometheus

# Environment variables
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 🔐 Security Configuration

### 1. JWT Security

```bash
# Rotate JWT secrets regularly
JWT_SECRET=new-secret-key
JWT_REFRESH_SECRET=new-refresh-secret

# Adjust token expiry
JWT_EXPIRY=1800  # 30 minutes
JWT_EXTENDED_EXPIRY=86400  # 24 hours
```

### 2. Database Security

```bash
# Use connection pooling
DB_POOL_MAX=20
DB_POOL_MIN=5

# Enable SSL
POSTGRES_SSL=true
POSTGRES_SSL_REJECT_UNAUTHORIZED=false
```

### 3. Rate Limiting

Add to environment:
```bash
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test auth.service.spec.ts
```

### Integration Tests
```bash
# Run integration tests
npm run test:e2e

# Test specific endpoints
npm run test:e2e -- --grep "auth"
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 📊 Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_domain_active ON users(domain_id, is_active);
CREATE INDEX CONCURRENTLY idx_user_roles_user_active ON user_roles(user_id, is_active);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY idx_policies_status_priority ON policies(status, priority);
```

### 2. Application Optimization

```bash
# Enable caching
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300

# Connection pooling
DB_POOL_MAX=50
DB_POOL_MIN=10
```

### 3. Memory Management

```bash
# Node.js memory settings
NODE_OPTIONS="--max-old-space-size=2048"
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U pbx_user pbx_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U pbx_user pbx_db < backup_20231201_120000.sql
```

### Application Backup
```bash
# Backup configuration
tar -czf config_backup.tar.gz .env docker-compose.yml

# Backup logs
tar -czf logs_backup.tar.gz logs/
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   pg_isready -h localhost -p 5432
   
   # Check credentials
   psql -h localhost -U pbx_user pbx_db
   ```

2. **JWT Token Invalid**
   ```bash
   # Verify JWT secret
   echo $JWT_SECRET
   
   # Check token expiry
   node -e "console.log(new Date(Date.now() + 3600*1000))"
   ```

3. **Permission Denied**
   ```bash
   # Check user roles
   psql -c "SELECT u.username, r.name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username = 'admin';"
   ```

4. **Migration Failed**
   ```bash
   # Check migration status
   npm run typeorm migration:show
   
   # Revert and retry
   npm run db:migrate:revert
   npm run db:migrate
   ```

### Logs

Application logs are available at:
- Development: Console output
- Production: `logs/application.log`
- Error logs: `logs/error.log`
- Audit logs: Database `audit_logs` table

### Support

For technical support:
1. Check logs for error details
2. Verify environment configuration
3. Test database connectivity
4. Review security policies
5. Contact system administrator

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  app:
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Database Scaling
- Read replicas for reporting
- Connection pooling with PgBouncer
- Database partitioning for audit logs

### Caching Strategy
- Redis for session storage
- Application-level caching for permissions
- CDN for static assets

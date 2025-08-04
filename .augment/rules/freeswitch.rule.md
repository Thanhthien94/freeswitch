---
type: "always_apply"
---

# FreeSWITCH PBX Project Rules

## 🚨 CRITICAL PRODUCTION DEPLOYMENT RULES

### 1. **NEVER EDIT CODE DIRECTLY ON PRODUCTION SERVER**
- ❌ **FORBIDDEN**: Sửa code trực tiếp trên server production (42.96.20.37)
- ✅ **CORRECT WORKFLOW**:
  1. Edit code locally
  2. Test locally
  3. Commit and push to remote repository
  4. SSH to production server
  5. Pull latest code from remote
  6. Deploy using proper scripts

### 2. **Environment Configuration Management**
- **Production server path**: `/root/finstar/freeswitch`
- **Environment loading priority**:
  1. `.env.production.local` (highest priority)
  2. `.env.production`
  3. `.env.local`
  4. `.env` (fallback)

### 3. **Critical Environment Variables for Production**
```bash
# MUST be correctly configured for office.finstar.vn ↔ api.finstar.vn
NEXT_PUBLIC_API_URL=https://api.finstar.vn/api/v1  # Frontend API calls
CORS_ORIGIN=https://office.finstar.vn              # Backend CORS
DOMAIN=https://office.finstar.vn                   # Main domain
NEXTAUTH_URL=https://office.finstar.vn             # Auth redirect
NODE_ENV=production                                # Environment
```

### 4. **Deployment Workflow**
```bash
# On local machine:
git add .
git commit -m "Description"
git push origin master

# On production server (42.96.20.37):
cd /root/finstar/freeswitch
git pull origin master
./scripts/validate-env.sh  # Validate environment
./deploy.sh                # Deploy with proper env loading
```

### 5. **Environment Validation Commands**
```bash
# Always run these before deployment:
chmod +x scripts/validate-env.sh scripts/test-env-loading.sh
./scripts/validate-env.sh      # Check all env vars
./scripts/test-env-loading.sh  # Test env loading logic
./scripts/test-production-api.sh  # Test API connectivity
```

### 6. **Docker Compose Issues to Watch**
- Check for duplicate environment variables in docker-compose.yml
- Ensure all required env vars are passed to containers
- Use `docker-compose down && docker-compose up --build -d` for code changes

### 7. **Common Production Issues Fixed**
- ✅ NestJS now loads `.env.production.local` first (app.module.ts, config.module.ts)
- ✅ Deploy script loads production env files correctly
- ✅ API client gets correct `NEXT_PUBLIC_API_URL`
- ✅ CORS allows office.finstar.vn → api.finstar.vn calls
- ✅ Environment validation scripts added

### 8. **File Structure on Production**
```
/root/finstar/freeswitch/
├── .env.production.local    # Main production config
├── .env.production         # Production template
├── docker-compose.yml      # Container orchestration
├── deploy.sh              # Deployment script
└── scripts/
    ├── validate-env.sh     # Environment validation
    ├── test-env-loading.sh # Test env loading
    └── test-production-api.sh # API connectivity test
```

### 9. **Emergency Rollback**
If deployment fails:
```bash
# Revert to previous working commit
git log --oneline -5
git reset --hard <previous-commit-hash>
docker-compose down && docker-compose up --build -d
```

### 10. **Monitoring and Logs**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f nestjs-api
docker-compose logs -f frontend-ui
docker-compose logs -f freeswitch-core

# Check environment loading
./scripts/validate-env.sh
```

## 🔧 TECHNICAL SPECIFICATIONS

### Domain Architecture
- **Frontend**: https://office.finstar.vn (Next.js 15)
- **Backend API**: https://api.finstar.vn (NestJS)
- **FreeSWITCH**: SIP/RTP on server IP
- **Database**: PostgreSQL (internal)

### Environment Loading Logic
1. NestJS ConfigModule loads env files in priority order
2. Deploy script sources production env files first
3. Docker compose passes env vars to containers
4. Frontend receives NEXT_PUBLIC_API_URL at build time

### Key Files Modified for Environment Fix
- `nestjs-app/src/app.module.ts`: Added production env loading
- `nestjs-app/src/config/config.module.ts`: Added production env loading
- `deploy.sh`: Enhanced env loading logic
- `docker-compose.yml`: Added missing env vars
- `scripts/`: Added validation and testing scripts

## 📋 DEPLOYMENT CHECKLIST

Before every production deployment:
- [ ] Code tested locally
- [ ] Environment variables validated
- [ ] No direct server edits
- [ ] Code committed and pushed
- [ ] Production server pulls latest code
- [ ] Environment validation passes
- [ ] Deployment script runs successfully
- [ ] API connectivity tested
- [ ] All containers healthy

**REMEMBER**: Always follow the proper workflow. Never edit production code directly!

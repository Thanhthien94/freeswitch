# Archive Directory

This directory contains scripts and files that are no longer actively used but kept for reference.

## 📁 Archived Scripts

### scripts/
- **apply-production-fixes.sh** - Outdated production fixes (replaced by updated configs)
- **restart-frontend.sh** - Simple restart script (use `docker-compose restart frontend` instead)
- **capture-call-logs.sh** - Debugging tool (use `docker-compose logs` instead)
- **recording_management.sh** - Recording management (replaced by API endpoints)
- **security-monitor.sh** - Security monitoring tool (use proper monitoring stack)
- **test-call.sh** - Call testing utility (use SIP client testing instead)
- **create-simple-migration.sql** - One-time migration script (already applied)

## 🔄 Replacement Commands

### Instead of archived scripts, use:

**Frontend restart:**
```bash
# Old: ./scripts/restart-frontend.sh
# New:
docker-compose restart frontend
```

**View logs:**
```bash
# Old: ./scripts/capture-call-logs.sh
# New:
docker-compose logs -f freeswitch-core
docker-compose logs -f nestjs-api
```

**Recording management:**
```bash
# Old: ./scripts/recording_management.sh
# New: Use API endpoints
curl -X GET http://localhost:3000/api/v1/recordings
```

**Security monitoring:**
```bash
# Old: ./scripts/security-monitor.sh
# New: Use proper monitoring stack (Prometheus/Grafana)
docker-compose logs -f  # For basic monitoring
```

## 📋 Why These Were Archived

1. **Outdated functionality** - Replaced by better solutions
2. **Redundant with Docker Compose** - Native commands are simpler
3. **Replaced by API** - Backend provides better interfaces
4. **One-time use** - Migration scripts no longer needed
5. **Better alternatives** - Modern monitoring/logging solutions

## 🗂️ Active Scripts (Still in use)

Located in `scripts/` directory:
- **backup-current-data.sh** - Essential for data migration
- **run-migrations.sh** - Database migration tool
- **test-sip-clients.sh** - SIP connectivity testing
- **hash-passwords.js** - Password hashing utility
- **cleanup-unused-scripts.sh** - Script maintenance tool

## 🔄 Recovery

If you need to restore any archived script:
```bash
# Copy back to scripts directory
cp archive/scripts/script-name.sh scripts/
chmod +x scripts/script-name.sh
```

## 🗑️ Future Cleanup

These archived files can be safely deleted after:
1. Confirming no dependencies exist
2. Verifying replacement solutions work
3. Team approval for permanent removal

---

**Note: These files are kept for reference only. Use modern alternatives for production systems.**

# Docker Safety Rules

## CRITICAL: DESTRUCTIVE COMMANDS PROHIBITION

**NEVER run these commands without EXPLICIT user permission:**

### Absolutely Forbidden Commands:
- `docker system prune -f`
- `docker rm -f $(docker ps -aq)` 
- `docker volume rm`
- `docker network rm` (unless specifically requested)
- `docker-compose down -v` (removes volumes)
- Any command that removes containers, volumes, or networks in bulk

### User History:
- User has been burned MULTIPLE TIMES by AI assistants running destructive Docker commands
- User specifically mentioned this issue happened "2 days ago" and is frustrated by repeated mistakes
- User correctly points out that AI promises are meaningless due to context resets

### Safe Alternatives:
- For code changes in FE/BE: `docker-compose up --build -d <service-name>` (REBUILD required, not restart)
- For config changes only: `docker-compose restart <service-name>`
- For single container: `docker restart <container-name>`

### Code Change Protocol:
- **Frontend code changes**: Require rebuild - `docker-compose up --build -d frontend`
- **Backend code changes**: Require rebuild - `docker-compose up --build -d nestjs-api`
- **Configuration changes**: Can use restart - `docker-compose restart <service-name>`
- **Never use just restart for code changes** - changes won't be applied

### Required Process:
1. **ALWAYS ASK** before running any Docker command that could affect data
2. **EXPLAIN** what the command will do
3. **WAIT** for explicit permission
4. **Use minimal impact** commands when possible

### Emergency Protocol:
If system is broken and needs reset:
1. Explain the situation
2. List exactly what will be lost
3. Ask for explicit permission for each destructive command
4. Offer alternatives if possible

## Rationale:
User has production data and configurations that are valuable. Losing this data causes significant setbacks and frustration. The user's trust has been damaged by previous incidents.

#!/bin/bash

# FreeSWITCH Security Monitoring Script

CONTAINER="freeswitch-core"
LOG_FILE="logs/security-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p logs

# Check for authentication failures
AUTH_FAILURES=$(docker logs $CONTAINER --since="1m" 2>/dev/null | grep -c "SIP auth failure" || echo "0")
if [[ $AUTH_FAILURES -gt 5 ]]; then
    echo "[$DATE] WARNING: High authentication failures: $AUTH_FAILURES in last minute" >> $LOG_FILE
fi

# Check for registration attempts
REG_ATTEMPTS=$(docker logs $CONTAINER --since="1m" 2>/dev/null | grep -c "REGISTER" || echo "0")
if [[ $REG_ATTEMPTS -gt 20 ]]; then
    echo "[$DATE] WARNING: High registration attempts: $REG_ATTEMPTS in last minute" >> $LOG_FILE
fi

# Check current registrations
CURRENT_REGS=$(docker exec $CONTAINER fs_cli -x "sofia status profile internal reg" 2>/dev/null | grep "Total items returned" | awk '{print $4}' || echo "0")
echo "[$DATE] INFO: Current registrations: $CURRENT_REGS" >> $LOG_FILE

# Check for unknown auth users (security issue)
UNKNOWN_AUTH=$(docker exec $CONTAINER fs_cli -x "sofia status profile internal reg" 2>/dev/null | grep -c "Auth-User: unknown" || echo "0")
if [[ $UNKNOWN_AUTH -gt 0 ]]; then
    echo "[$DATE] CRITICAL: Found $UNKNOWN_AUTH registrations with unknown auth - SECURITY ISSUE!" >> $LOG_FILE
fi

echo "[$DATE] Security check completed" >> $LOG_FILE

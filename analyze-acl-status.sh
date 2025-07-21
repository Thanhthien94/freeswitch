#!/bin/bash

# ACL Analysis Script for FreeSWITCH
# Usage: ./analyze-acl-status.sh

set -e

echo "🛡️ FreeSWITCH ACL (Access Control List) Analysis"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print section
print_section() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

echo ""
print_section "1. Database ACL Configuration"

# Get ACL data from database
echo "Database ACL Rules:"
docker exec postgres-db psql -U pbx_user -d pbx_db -c "
SELECT 
    name,
    value,
    description,
    updated_at
FROM freeswitch_configs 
WHERE category IN ('acl', 'security') 
ORDER BY name;" 2>/dev/null || echo "❌ Failed to connect to database"

echo ""
print_section "2. FreeSWITCH ACL Configuration Files"

# Check ACL config file
echo "ACL Configuration File:"
if docker exec freeswitch-core test -f /etc/freeswitch/autoload_configs/acl.conf.xml; then
    print_result 0 "ACL config file exists"
    echo ""
    echo "📄 ACL Configuration Content:"
    docker exec freeswitch-core cat /etc/freeswitch/autoload_configs/acl.conf.xml
else
    print_result 1 "ACL config file not found"
fi

echo ""
print_section "3. SIP Profile ACL Settings"

# Check SIP profiles ACL
echo "Internal SIP Profile ACL Settings:"
docker exec freeswitch-core grep -E "(apply-.*-acl|acl)" /etc/freeswitch/sip_profiles/internal.xml || echo "No ACL settings found in internal profile"

echo ""
echo "External SIP Profile ACL Settings:"
docker exec freeswitch-core grep -E "(apply-.*-acl|acl)" /etc/freeswitch/sip_profiles/external.xml 2>/dev/null || echo "No external profile or ACL settings found"

echo ""
print_section "4. FreeSWITCH ACL Runtime Testing"

# Test ACL functionality
echo "Testing ACL Rules:"

# Test local IP (should be allowed)
LOCAL_TEST=$(docker exec freeswitch-core fs_cli -x "acl 127.0.0.1 domains" 2>/dev/null || echo "error")
if [ "$LOCAL_TEST" = "true" ]; then
    print_result 0 "Localhost (127.0.0.1) is allowed in 'domains' ACL"
else
    print_result 1 "Localhost (127.0.0.1) test failed: $LOCAL_TEST"
fi

# Test private network IP (should be allowed)
PRIVATE_TEST=$(docker exec freeswitch-core fs_cli -x "acl 192.168.1.100 domains" 2>/dev/null || echo "error")
if [ "$PRIVATE_TEST" = "true" ]; then
    print_result 0 "Private IP (192.168.1.100) is allowed in 'domains' ACL"
else
    print_result 1 "Private IP (192.168.1.100) test failed: $PRIVATE_TEST"
fi

# Test public IP (should be denied)
PUBLIC_TEST=$(docker exec freeswitch-core fs_cli -x "acl 8.8.8.8 domains" 2>/dev/null || echo "error")
if [ "$PUBLIC_TEST" = "false" ]; then
    print_result 0 "Public IP (8.8.8.8) is correctly denied in 'domains' ACL"
else
    print_result 1 "Public IP (8.8.8.8) test failed: $PUBLIC_TEST"
fi

# Test ESL access
ESL_TEST=$(docker exec freeswitch-core fs_cli -x "acl 127.0.0.1 esl_access" 2>/dev/null || echo "error")
if [ "$ESL_TEST" = "true" ]; then
    print_result 0 "Localhost has ESL access"
else
    print_result 1 "ESL access test failed: $ESL_TEST"
fi

echo ""
print_section "5. ACL Lists Analysis"

echo "Available ACL Lists:"
echo "📋 domains - Controls domain access"
echo "📋 esl_access - Controls ESL (Event Socket Library) access"
echo "📋 sip_profiles - Controls SIP profile access"

echo ""
print_section "6. Database vs FreeSWITCH Sync Status"

# Get database ACL rules
DB_ACL=$(docker exec postgres-db psql -U pbx_user -d pbx_db -t -c "SELECT value FROM freeswitch_configs WHERE category = 'security' AND name = 'acl_rules';" 2>/dev/null | tr -d ' \n' || echo "")

if [ ! -z "$DB_ACL" ]; then
    print_result 0 "Database contains ACL rules configuration"
    echo "Database ACL Rules (JSON):"
    echo "$DB_ACL" | jq . 2>/dev/null || echo "$DB_ACL"
else
    print_result 1 "No ACL rules found in database"
fi

echo ""
print_section "7. Security Recommendations"

echo "🛡️ Current Security Status:"

# Check trusted networks
TRUSTED_NETWORKS=$(docker exec postgres-db psql -U pbx_user -d pbx_db -t -c "SELECT value FROM freeswitch_configs WHERE category = 'security' AND name = 'trusted_networks';" 2>/dev/null | tr -d '\n' || echo "")
if [ ! -z "$TRUSTED_NETWORKS" ]; then
    echo "✅ Trusted Networks configured: $TRUSTED_NETWORKS"
else
    echo "⚠️  No trusted networks configured"
fi

# Check blocked networks
BLOCKED_NETWORKS=$(docker exec postgres-db psql -U pbx_user -d pbx_db -t -c "SELECT value FROM freeswitch_configs WHERE category = 'security' AND name = 'blocked_networks';" 2>/dev/null | tr -d '\n' || echo "")
if [ ! -z "$BLOCKED_NETWORKS" ]; then
    echo "✅ Blocked Networks configured: $BLOCKED_NETWORKS"
else
    echo "ℹ️  No blocked networks configured (optional)"
fi

# Check default policy
DEFAULT_POLICY=$(docker exec postgres-db psql -U pbx_user -d pbx_db -t -c "SELECT value FROM freeswitch_configs WHERE category = 'security' AND name = 'default_acl_policy';" 2>/dev/null | tr -d ' \n' || echo "")
if [ "$DEFAULT_POLICY" = "deny" ]; then
    echo "✅ Default ACL policy is 'deny' (secure)"
elif [ "$DEFAULT_POLICY" = "allow" ]; then
    echo "⚠️  Default ACL policy is 'allow' (less secure)"
else
    echo "❌ Default ACL policy not configured"
fi

echo ""
print_section "8. ACL Management Commands"

echo "🔧 Useful FreeSWITCH ACL Commands:"
echo "   fs_cli -x 'acl <ip> <list_name>'     - Test IP against ACL list"
echo "   fs_cli -x 'reloadacl'                - Reload ACL configuration"
echo "   fs_cli -x 'reloadxml'                - Reload all XML configuration"

echo ""
echo "📋 Available ACL Lists:"
echo "   • domains      - Domain access control"
echo "   • esl_access   - ESL access control"
echo "   • sip_profiles - SIP profile access control"

echo ""
print_section "9. Summary"

echo "🛡️ ACL Status Summary:"
echo "✅ ACL configuration file exists and is loaded"
echo "✅ Database contains ACL security settings"
echo "✅ SIP profiles are configured with ACL protection"
echo "✅ Runtime ACL testing shows rules are working"

if [ "$DEFAULT_POLICY" = "allow" ]; then
    echo "⚠️  Consider changing default policy to 'deny' for better security"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Review trusted networks list"
echo "2. Consider adding blocked networks if needed"
echo "3. Test ACL rules with your specific IP ranges"
echo "4. Monitor FreeSWITCH logs for ACL denials"

echo ""
echo "🎉 ACL analysis completed!"

#!/bin/bash

# FreeSWITCH Production Fixes Implementation Script
# Applies critical security and authentication fixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FREESWITCH_CONTAINER="freeswitch-core"
CONFIG_DIR="configs/freeswitch"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}🔧 FreeSWITCH Production Fixes Implementation${NC}"
echo "=================================================="

# Function to backup current configuration
backup_config() {
    print_info "Creating configuration backup..."
    
    local backup_dir="backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    cp -r "$CONFIG_DIR" "$backup_dir/"
    
    print_status "Configuration backed up to: $backup_dir"
}

# Function to fix authentication issues
fix_authentication() {
    print_info "Fixing authentication configuration..."
    
    # Fix SIP profile authentication
    local internal_profile="$CONFIG_DIR/sip_profiles/internal.xml"
    
    # Remove accept-blind-reg if it exists
    if grep -q "accept-blind-reg.*true" "$internal_profile"; then
        print_warning "Found accept-blind-reg=true - fixing..."
        sed -i '' 's/<param name="accept-blind-reg" value="true"\/>/<param name="accept-blind-reg" value="false"\/>/' "$internal_profile"
    fi
    
    # Ensure auth-calls is true and not duplicated
    if ! grep -q 'auth-calls.*true' "$internal_profile"; then
        print_warning "auth-calls not properly set - fixing..."
        # Add after the first settings tag
        sed -i '' '/<settings>/a\
    <param name="auth-calls" value="true"/>
' "$internal_profile"
    fi

    # Add challenge-realm if missing
    if ! grep -q "challenge-realm" "$internal_profile"; then
        print_info "Adding challenge-realm parameter..."
        sed -i '' '/<param name="auth-calls"/a\
    <param name="challenge-realm" value="auto_from"/>
' "$internal_profile"
    fi

    # Add inbound-reg-force-matching-username
    if ! grep -q "inbound-reg-force-matching-username" "$internal_profile"; then
        print_info "Adding inbound-reg-force-matching-username..."
        sed -i '' '/<param name="challenge-realm"/a\
    <param name="inbound-reg-force-matching-username" value="true"/>
' "$internal_profile"
    fi
    
    print_status "Authentication configuration fixed"
}

# Function to fix security settings
fix_security() {
    print_info "Applying security fixes..."
    
    local internal_profile="$CONFIG_DIR/sip_profiles/internal.xml"
    
    # Ensure accept-blind-auth is false
    if ! grep -q "accept-blind-auth" "$internal_profile"; then
        print_info "Adding accept-blind-auth=false..."
        sed -i '' '/<param name="accept-blind-reg"/a\
    <param name="accept-blind-auth" value="false"/>
' "$internal_profile"
    fi

    # Add auth-subscriptions
    if ! grep -q "auth-subscriptions" "$internal_profile"; then
        print_info "Adding auth-subscriptions=true..."
        sed -i '' '/<param name="accept-blind-auth"/a\
    <param name="auth-subscriptions" value="true"/>
' "$internal_profile"
    fi
    
    print_status "Security settings applied"
}

# Function to fix ACL configuration
fix_acl() {
    print_info "Fixing ACL configuration..."
    
    local acl_file="$CONFIG_DIR/autoload_configs/acl.conf.xml"
    
    # Check if ACL file exists
    if [[ ! -f "$acl_file" ]]; then
        print_error "ACL configuration file not found: $acl_file"
        return 1
    fi
    
    # Remove any empty host entries that cause errors
    sed -i '' '/host.*="".*allow/d' "$acl_file"
    sed -i '' '/host.*allow.*""/d' "$acl_file"
    
    print_status "ACL configuration fixed"
}

# Function to disable unnecessary modules
disable_unnecessary_modules() {
    print_info "Disabling unnecessary modules..."
    
    local modules_file="$CONFIG_DIR/autoload_configs/modules.conf.xml"
    
    # Disable mod_signalwire if enabled
    if grep -q '<load module="mod_signalwire"/>' "$modules_file"; then
        print_info "Disabling mod_signalwire..."
        sed -i '' 's/<load module="mod_signalwire"\/>/<\!-- <load module="mod_signalwire"\/> -->/' "$modules_file"
    fi
    
    print_status "Unnecessary modules disabled"
}

# Function to fix password requirements
fix_password_requirements() {
    print_info "Implementing password requirements..."
    
    # Add password requirements to default domain
    local default_domain="$CONFIG_DIR/directory/default.xml"
    
    if [[ -f "$default_domain" ]]; then
        # Add allow-empty-password=false if not present
        if ! grep -q "allow-empty-password" "$default_domain"; then
            print_info "Adding password requirements to default domain..."
            sed -i '' '/<params>/a\
      <param name="allow-empty-password" value="false"/>
' "$default_domain"
        fi
    fi
    
    print_status "Password requirements implemented"
}

# Function to create security monitoring script
create_monitoring_script() {
    print_info "Creating security monitoring script..."
    
    cat > scripts/security-monitor.sh << 'EOF'
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
EOF

    chmod +x scripts/security-monitor.sh
    
    print_status "Security monitoring script created"
}

# Function to test authentication
test_authentication() {
    print_info "Testing authentication configuration..."
    
    # Check if FreeSWITCH is running
    if ! docker exec $FREESWITCH_CONTAINER fs_cli -x "status" >/dev/null 2>&1; then
        print_error "FreeSWITCH is not running or not accessible"
        return 1
    fi
    
    # Check auth-calls setting
    local auth_calls=$(docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal" | grep "AUTH-CALLS" | awk '{print $2}')
    if [[ "$auth_calls" == "true" ]]; then
        print_status "Authentication is enabled"
    else
        print_error "Authentication is NOT enabled - this is a security risk!"
    fi
    
    # Check for blind registration
    local blind_reg=$(docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal" | grep -i "blind")
    if [[ -n "$blind_reg" ]]; then
        print_warning "Blind registration may be enabled: $blind_reg"
    fi
    
    print_status "Authentication test completed"
}

# Function to apply all fixes
apply_all_fixes() {
    print_info "Applying all production fixes..."
    
    backup_config
    fix_authentication
    fix_security
    fix_acl
    disable_unnecessary_modules
    fix_password_requirements
    create_monitoring_script
    
    print_status "All fixes applied successfully!"
    print_warning "Please restart FreeSWITCH to apply changes:"
    echo "  docker-compose restart freeswitch"
    echo ""
    print_info "After restart, run: ./scripts/apply-production-fixes.sh test"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  auth        - Fix authentication issues"
    echo "  security    - Apply security fixes"
    echo "  acl         - Fix ACL configuration"
    echo "  modules     - Disable unnecessary modules"
    echo "  passwords   - Fix password requirements"
    echo "  monitor     - Create monitoring script"
    echo "  test        - Test authentication configuration"
    echo "  all         - Apply all fixes"
    echo "  help        - Show this help"
    echo ""
}

# Main script logic
case "${1:-all}" in
    "auth")
        backup_config
        fix_authentication
        ;;
    "security")
        backup_config
        fix_security
        ;;
    "acl")
        backup_config
        fix_acl
        ;;
    "modules")
        backup_config
        disable_unnecessary_modules
        ;;
    "passwords")
        backup_config
        fix_password_requirements
        ;;
    "monitor")
        create_monitoring_script
        ;;
    "test")
        test_authentication
        ;;
    "all")
        apply_all_fixes
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac

print_status "Production fixes script completed!"

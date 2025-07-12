#!/bin/bash

# Simple Authentication Fix Script
# Fixes the critical authentication bypass issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🔒 FreeSWITCH Authentication Fix${NC}"
echo "=================================="

# Function to fix the critical authentication issue
fix_authentication() {
    print_info "Fixing authentication bypass issue..."
    
    local internal_profile="configs/freeswitch/sip_profiles/internal.xml"
    
    # Check if file exists
    if [[ ! -f "$internal_profile" ]]; then
        print_error "Internal profile not found: $internal_profile"
        return 1
    fi
    
    # Create backup
    cp "$internal_profile" "$internal_profile.backup.$(date +%s)"
    
    # The critical fix: ensure accept-blind-reg is false
    if grep -q 'accept-blind-reg.*true' "$internal_profile"; then
        print_warning "Found accept-blind-reg=true - this is the security vulnerability!"
        print_info "Fixing accept-blind-reg to false..."
        
        # Use perl for more reliable replacement
        perl -i -pe 's/<param name="accept-blind-reg" value="true"\/>/<param name="accept-blind-reg" value="false"\/>/' "$internal_profile"
        
        print_status "accept-blind-reg fixed to false"
    else
        print_info "accept-blind-reg is already false or not found"
    fi
    
    # Ensure auth-calls is true
    if ! grep -q 'auth-calls.*true' "$internal_profile"; then
        print_warning "auth-calls not set to true - adding it"
        
        # Find the settings section and add auth-calls
        perl -i -pe 's/(<settings>)/$1\n    <param name="auth-calls" value="true"\/>/' "$internal_profile"
        
        print_status "auth-calls set to true"
    else
        print_info "auth-calls is already true"
    fi
    
    # Verify the changes
    print_info "Verifying changes..."
    
    if grep -q 'accept-blind-reg.*false' "$internal_profile"; then
        print_status "✓ accept-blind-reg is false"
    else
        print_error "✗ accept-blind-reg is not false"
    fi
    
    if grep -q 'auth-calls.*true' "$internal_profile"; then
        print_status "✓ auth-calls is true"
    else
        print_error "✗ auth-calls is not true"
    fi
    
    print_status "Authentication fix completed"
}

# Function to restart FreeSWITCH
restart_freeswitch() {
    print_info "Restarting FreeSWITCH to apply changes..."
    
    docker-compose restart freeswitch
    
    print_status "FreeSWITCH restarted"
    
    print_info "Waiting for FreeSWITCH to start..."
    sleep 20
}

# Function to test authentication
test_authentication() {
    print_info "Testing authentication..."
    
    # Check if FreeSWITCH is running
    if ! docker exec freeswitch-core fs_cli -x "status" >/dev/null 2>&1; then
        print_error "FreeSWITCH is not running"
        return 1
    fi
    
    # Check SIP profile settings
    print_info "Checking SIP profile configuration..."
    
    local profile_output=$(docker exec freeswitch-core fs_cli -x "sofia status profile internal" 2>/dev/null)
    
    if echo "$profile_output" | grep -q "Challenge Realm"; then
        print_status "Challenge Realm is configured"
    else
        print_warning "Challenge Realm not found in profile"
    fi
    
    # Check current registrations
    print_info "Checking current registrations..."
    
    local reg_output=$(docker exec freeswitch-core fs_cli -x "sofia status profile internal reg" 2>/dev/null)
    local reg_count=$(echo "$reg_output" | grep "Total items returned" | awk '{print $4}' || echo "0")
    
    print_info "Current registrations: $reg_count"
    
    if [[ "$reg_count" -gt 0 ]]; then
        print_warning "There are existing registrations. Please test with a fresh registration."
        print_info "To test properly:"
        echo "  1. Unregister all SIP clients"
        echo "  2. Try to register with empty password"
        echo "  3. Registration should FAIL"
        echo "  4. Try to register with correct password"
        echo "  5. Registration should SUCCEED"
    fi
    
    print_status "Authentication test completed"
}

# Function to show current configuration
show_config() {
    print_info "Current authentication configuration:"
    
    local internal_profile="configs/freeswitch/sip_profiles/internal.xml"
    
    echo "accept-blind-reg setting:"
    grep -n "accept-blind-reg" "$internal_profile" || echo "  Not found"
    
    echo ""
    echo "auth-calls setting:"
    grep -n "auth-calls" "$internal_profile" || echo "  Not found"
    
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  fix         - Fix authentication bypass issue"
    echo "  restart     - Restart FreeSWITCH"
    echo "  test        - Test authentication"
    echo "  config      - Show current configuration"
    echo "  all         - Fix, restart, and test"
    echo "  help        - Show this help"
    echo ""
}

# Main script logic
case "${1:-all}" in
    "fix")
        fix_authentication
        ;;
    "restart")
        restart_freeswitch
        ;;
    "test")
        test_authentication
        ;;
    "config")
        show_config
        ;;
    "all")
        show_config
        fix_authentication
        restart_freeswitch
        test_authentication
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

print_status "Authentication fix script completed!"

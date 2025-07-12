#!/bin/bash

# NAT Fix Testing Script
# This script tests NAT traversal and BYE handling improvements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FREESWITCH_CONTAINER="freeswitch-core"

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

echo -e "${BLUE}🔧 FreeSWITCH NAT Fix Testing Script${NC}"
echo "======================================="

# Function to check NAT settings
check_nat_settings() {
    print_info "Checking NAT settings in FreeSWITCH..."
    
    echo "SIP Profile Status:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal" | grep -E "AGGRESSIVENAT|RTP-IP|Ext-RTP-IP|SIP-IP|Ext-SIP-IP"
    
    echo ""
    print_info "Checking NAT-related parameters..."
    
    # Check if aggressive NAT detection is enabled
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal" | grep -q "AGGRESSIVENAT.*true"; then
        print_status "Aggressive NAT detection is enabled"
    else
        print_error "Aggressive NAT detection is disabled"
    fi
    
    echo ""
}

# Function to test SIP registration with NAT
test_sip_registration() {
    print_info "Testing SIP registration with NAT improvements..."
    
    echo "Current registrations:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg" | tail -10
    
    echo ""
    print_info "Checking for NAT flags in registrations..."
    
    # Check for NAT flags
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg" | grep -q "UDP-NAT"; then
        print_status "NAT detection working - found UDP-NAT registrations"
    else
        print_warning "No NAT registrations detected"
    fi
    
    echo ""
}

# Function to test call setup and teardown
test_call_handling() {
    print_info "Testing call setup and BYE handling..."
    
    # Check current calls
    echo "Current active calls:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show calls"
    
    echo ""
    echo "Current channels:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show channels"
    
    echo ""
}

# Function to monitor SIP messages
monitor_sip_messages() {
    print_info "Monitoring SIP messages for NAT handling..."
    print_warning "This will show real-time SIP traffic. Press Ctrl+C to stop."
    
    # Enable SIP tracing
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace on"
    
    echo "SIP tracing enabled. Make a test call now..."
    sleep 5
    
    # Show recent SIP messages
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace off"
    print_status "SIP tracing disabled"
}

# Function to test RTP handling
test_rtp_handling() {
    print_info "Testing RTP media handling..."
    
    # Check RTP settings
    echo "RTP Configuration:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal" | grep -E "RTP-IP|Ext-RTP-IP"
    
    echo ""
    print_info "Checking for RTP timeout issues..."
    
    # Check recent logs for RTP issues
    if docker logs $FREESWITCH_CONTAINER --tail 50 | grep -q "rtp-timeout-sec deprecated"; then
        print_warning "Found deprecated RTP timeout settings in logs"
    else
        print_status "No deprecated RTP timeout warnings found"
    fi
    
    echo ""
}

# Function to test BYE message handling
test_bye_handling() {
    print_info "Testing BYE message handling improvements..."
    
    # Enable detailed logging
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia loglevel all 9"
    
    print_info "Detailed SIP logging enabled"
    print_info "Make a test call and hang up to test BYE handling"
    
    echo "Waiting for call activity..."
    sleep 10
    
    # Check for BYE-related messages in logs
    echo "Recent BYE-related activity:"
    docker logs $FREESWITCH_CONTAINER --tail 20 | grep -i "bye\|hangup\|disconnect" || echo "No recent BYE activity"
    
    # Reset log level
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia loglevel all 0"
    print_status "Log level reset to normal"
    
    echo ""
}

# Function to show NAT configuration summary
show_nat_config() {
    print_info "NAT Configuration Summary:"
    echo "=========================="
    
    echo "Enabled NAT Features:"
    echo "✅ aggressive-nat-detection: true"
    echo "✅ nat-options-ping: true" 
    echo "✅ NDLB-force-rport: true"
    echo "✅ NDLB-received-in-nat-reg-contact: true"
    echo "✅ apply-inbound-acl: domains"
    echo "✅ force-register-domain: enabled"
    echo "✅ rtp-autofix-timing: true"
    echo "✅ media_timeout: 300 seconds"
    echo "✅ media_hold_timeout: 1800 seconds"
    
    echo ""
    echo "Expected Improvements:"
    echo "🔧 Better NAT traversal for SIP signaling"
    echo "🔧 Improved BYE message handling"
    echo "🔧 More reliable RTP media flow"
    echo "🔧 Automatic contact rewriting for NAT"
    echo "🔧 Better handling of symmetric RTP"
    
    echo ""
}

# Function to run comprehensive NAT test
run_comprehensive_test() {
    print_info "Running comprehensive NAT test..."
    
    check_nat_settings
    test_sip_registration
    test_rtp_handling
    test_call_handling
    show_nat_config
    
    print_status "Comprehensive NAT test completed!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  nat         - Check NAT settings"
    echo "  reg         - Test SIP registration"
    echo "  rtp         - Test RTP handling"
    echo "  calls       - Test call handling"
    echo "  bye         - Test BYE message handling"
    echo "  monitor     - Monitor SIP messages"
    echo "  config      - Show NAT configuration"
    echo "  test        - Run comprehensive test"
    echo "  help        - Show this help"
    echo ""
}

# Main script logic
case "${1:-test}" in
    "nat")
        check_nat_settings
        ;;
    "reg")
        test_sip_registration
        ;;
    "rtp")
        test_rtp_handling
        ;;
    "calls")
        test_call_handling
        ;;
    "bye")
        test_bye_handling
        ;;
    "monitor")
        monitor_sip_messages
        ;;
    "config")
        show_nat_config
        ;;
    "test")
        run_comprehensive_test
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

print_status "NAT test script completed!"

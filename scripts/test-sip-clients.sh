#!/bin/bash

# SIP Client Testing Script
# This script helps test SIP client connectivity and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOST_IP="192.168.1.6"
SIP_PORT="5060"
FREESWITCH_CONTAINER="freeswitch-core"
API_BASE="http://localhost:3000/api/v1"

echo -e "${BLUE}🔧 FreeSWITCH SIP Client Testing Script${NC}"
echo "=================================================="

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

# Function to check if FreeSWITCH is running
check_freeswitch() {
    print_info "Checking FreeSWITCH status..."
    
    if docker ps | grep -q "$FREESWITCH_CONTAINER"; then
        print_status "FreeSWITCH container is running"
    else
        print_error "FreeSWITCH container is not running"
        exit 1
    fi
    
    # Check FreeSWITCH health via API
    if curl -s "$API_BASE/health/freeswitch" > /dev/null; then
        print_status "FreeSWITCH API is responding"
    else
        print_error "FreeSWITCH API is not responding"
        exit 1
    fi
}

# Function to show SIP configuration
show_sip_config() {
    print_info "SIP Server Configuration:"
    echo "=========================="
    echo "SIP Server IP: $HOST_IP"
    echo "SIP Port: $SIP_PORT"
    echo "Domain: $HOST_IP"
    echo "Transport: UDP"
    echo ""
    
    print_info "Test Users Available:"
    echo "===================="
    echo "Extensions: 1000-1019"
    echo "Password: d-d5kjaQMM6_"
    echo "Example:"
    echo "  Username: 1000"
    echo "  Password: d-d5kjaQMM6_"
    echo "  Domain: $HOST_IP"
    echo ""
}

# Function to check current registrations
check_registrations() {
    print_info "Checking current SIP registrations..."
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x 'sofia status profile internal reg'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg" || {
        print_error "Failed to check registrations"
        return 1
    }
    echo ""
}

# Function to show active calls
show_active_calls() {
    print_info "Checking active calls..."
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x 'show calls'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show calls" || {
        print_error "Failed to check active calls"
        return 1
    }
    echo ""
}

# Function to show channels
show_channels() {
    print_info "Checking active channels..."
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x 'show channels'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show channels" || {
        print_error "Failed to check channels"
        return 1
    }
    echo ""
}

# Function to test API endpoints
test_api_endpoints() {
    print_info "Testing API endpoints..."
    
    # Test health endpoint
    if curl -s "$API_BASE/health" > /dev/null; then
        print_status "Health endpoint working"
    else
        print_error "Health endpoint failed"
    fi
    
    # Test FreeSWITCH health
    if curl -s "$API_BASE/health/freeswitch" > /dev/null; then
        print_status "FreeSWITCH health endpoint working"
    else
        print_error "FreeSWITCH health endpoint failed"
    fi
    
    # Test metrics endpoint
    if curl -s "$API_BASE/metrics" > /dev/null; then
        print_status "Metrics endpoint working"
    else
        print_error "Metrics endpoint failed"
    fi
    
    echo ""
}

# Function to show network information
show_network_info() {
    print_info "Network Information:"
    echo "==================="
    echo "Host IP: $HOST_IP"
    echo "Required ports:"
    echo "  - SIP Signaling: 5060 (UDP/TCP)"
    echo "  - RTP Media: 16384-16394 (UDP)"
    echo "  - TLS (optional): 5061 (TCP)"
    echo ""
    
    print_info "Testing port connectivity..."
    
    # Test SIP port
    if nc -z -u $HOST_IP $SIP_PORT 2>/dev/null; then
        print_status "SIP port $SIP_PORT is accessible"
    else
        print_warning "SIP port $SIP_PORT may not be accessible"
    fi
    
    echo ""
}

# Function to monitor real-time events
monitor_events() {
    print_info "Starting real-time event monitoring..."
    print_warning "Press Ctrl+C to stop monitoring"
    echo ""
    
    docker exec -it $FREESWITCH_CONTAINER fs_cli -x "/events plain all"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  config      - Show SIP configuration"
    echo "  check       - Check FreeSWITCH status"
    echo "  reg         - Show current registrations"
    echo "  calls       - Show active calls"
    echo "  channels    - Show active channels"
    echo "  api         - Test API endpoints"
    echo "  network     - Show network information"
    echo "  monitor     - Monitor real-time events"
    echo "  all         - Run all checks"
    echo "  help        - Show this help"
    echo ""
}

# Main script logic
case "${1:-all}" in
    "config")
        show_sip_config
        ;;
    "check")
        check_freeswitch
        ;;
    "reg")
        check_registrations
        ;;
    "calls")
        show_active_calls
        ;;
    "channels")
        show_channels
        ;;
    "api")
        test_api_endpoints
        ;;
    "network")
        show_network_info
        ;;
    "monitor")
        monitor_events
        ;;
    "all")
        check_freeswitch
        show_sip_config
        show_network_info
        test_api_endpoints
        check_registrations
        show_active_calls
        show_channels
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

print_status "Script completed successfully!"

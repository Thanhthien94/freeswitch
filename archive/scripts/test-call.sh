#!/bin/bash

# Test Call Script
# This script helps test calls between extensions

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

echo -e "${BLUE}📞 FreeSWITCH Call Testing Script${NC}"
echo "=================================="

# Function to originate a test call
originate_call() {
    local from_ext="$1"
    local to_ext="$2"
    local duration="${3:-10}"
    
    if [[ -z "$from_ext" || -z "$to_ext" ]]; then
        print_error "Usage: originate_call <from_extension> <to_extension> [duration_seconds]"
        return 1
    fi
    
    print_info "Originating call from $from_ext to $to_ext (duration: ${duration}s)"
    
    # Use FreeSWITCH originate command
    local cmd="originate user/$from_ext &echo() user/$to_ext"
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x '$cmd'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "$cmd" || {
        print_error "Failed to originate call"
        return 1
    }
    
    print_status "Call originated successfully"
}

# Function to test echo application
test_echo() {
    local ext="$1"
    
    if [[ -z "$ext" ]]; then
        print_error "Usage: test_echo <extension>"
        return 1
    fi
    
    print_info "Testing echo application for extension $ext"
    
    local cmd="originate user/$ext &echo()"
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x '$cmd'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "$cmd" || {
        print_error "Failed to test echo"
        return 1
    }
    
    print_status "Echo test initiated"
}

# Function to test conference
test_conference() {
    local ext="$1"
    local conf_room="${2:-3000}"
    
    if [[ -z "$ext" ]]; then
        print_error "Usage: test_conference <extension> [conference_room]"
        return 1
    fi
    
    print_info "Testing conference for extension $ext to room $conf_room"
    
    local cmd="originate user/$ext &conference($conf_room)"
    
    echo "Executing: docker exec $FREESWITCH_CONTAINER fs_cli -x '$cmd'"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "$cmd" || {
        print_error "Failed to test conference"
        return 1
    }
    
    print_status "Conference test initiated"
}

# Function to hangup all calls
hangup_all() {
    print_info "Hanging up all active calls..."
    
    docker exec $FREESWITCH_CONTAINER fs_cli -x "hupall" || {
        print_error "Failed to hangup calls"
        return 1
    }
    
    print_status "All calls hung up"
}

# Function to show call status
show_call_status() {
    print_info "Current call status:"
    echo "==================="
    
    echo "Active calls:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show calls"
    
    echo ""
    echo "Active channels:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "show channels"
    
    echo ""
    echo "Registrations:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg"
}

# Function to test basic call scenarios
test_basic_scenarios() {
    print_info "Running basic call test scenarios..."
    
    # Check if we have registered users
    local reg_count=$(docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg" | grep "Total items returned:" | awk '{print $4}')
    
    if [[ "$reg_count" -lt 2 ]]; then
        print_warning "Need at least 2 registered SIP clients to test calls"
        print_info "Please register SIP clients with extensions 1000 and 1001"
        return 1
    fi
    
    print_status "Found $reg_count registered clients"
    
    # Test scenarios
    print_info "Test 1: Extension to extension call"
    originate_call "1000" "1001"
    
    sleep 5
    
    print_info "Test 2: Echo test"
    test_echo "1000"
    
    sleep 5
    
    print_info "Test 3: Conference test"
    test_conference "1000" "3000"
    
    sleep 5
    
    print_info "Cleaning up..."
    hangup_all
}

# Function to monitor calls in real-time
monitor_calls() {
    print_info "Starting real-time call monitoring..."
    print_warning "Press Ctrl+C to stop monitoring"
    echo ""
    
    while true; do
        clear
        echo -e "${BLUE}📞 Real-time Call Monitor${NC}"
        echo "========================"
        date
        echo ""
        
        echo "Active Calls:"
        docker exec $FREESWITCH_CONTAINER fs_cli -x "show calls" 2>/dev/null || echo "No active calls"
        
        echo ""
        echo "Active Channels:"
        docker exec $FREESWITCH_CONTAINER fs_cli -x "show channels" 2>/dev/null || echo "No active channels"
        
        echo ""
        echo "Registrations:"
        docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg" 2>/dev/null | tail -5
        
        sleep 2
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [ARGS...]"
    echo ""
    echo "Commands:"
    echo "  call <from> <to> [duration]  - Originate call between extensions"
    echo "  echo <ext>                   - Test echo application"
    echo "  conference <ext> [room]      - Test conference"
    echo "  hangup                       - Hangup all calls"
    echo "  status                       - Show call status"
    echo "  test                         - Run basic test scenarios"
    echo "  monitor                      - Monitor calls in real-time"
    echo "  help                         - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 call 1000 1001           - Call from 1000 to 1001"
    echo "  $0 echo 1000                - Test echo with extension 1000"
    echo "  $0 conference 1000 3000     - Join extension 1000 to conference 3000"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "call")
        originate_call "$2" "$3" "$4"
        ;;
    "echo")
        test_echo "$2"
        ;;
    "conference")
        test_conference "$2" "$3"
        ;;
    "hangup")
        hangup_all
        ;;
    "status")
        show_call_status
        ;;
    "test")
        test_basic_scenarios
        ;;
    "monitor")
        monitor_calls
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

print_status "Call test completed!"

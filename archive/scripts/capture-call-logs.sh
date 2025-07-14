#!/bin/bash

# Call Logging Script
# Captures detailed logs for call debugging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FREESWITCH_CONTAINER="freeswitch-core"
LOG_DIR="logs/call-debug"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

echo -e "${BLUE}📞 FreeSWITCH Call Debug Logging${NC}"
echo "=================================="

# Create log directory
mkdir -p "$LOG_DIR"

# Function to enable debug logging
enable_debug_logging() {
    print_info "Enabling debug logging..."
    
    # Set Sofia log level to maximum
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia loglevel all 9"
    
    # Set console log level to debug
    docker exec $FREESWITCH_CONTAINER fs_cli -x "console loglevel debug"
    
    # Enable SIP tracing
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace on"
    
    # Enable detailed call logging
    docker exec $FREESWITCH_CONTAINER fs_cli -x "fsctl loglevel debug"
    
    print_status "Debug logging enabled"
    print_warning "Make your test call now!"
}

# Function to capture logs during call
capture_call_logs() {
    local duration="${1:-60}"
    
    print_info "Capturing call logs for $duration seconds..."
    print_warning "Start your test call NOW!"
    
    # Capture logs to file
    local log_file="$LOG_DIR/call_debug_${TIMESTAMP}.log"
    
    # Start log capture in background
    docker logs -f $FREESWITCH_CONTAINER > "$log_file" 2>&1 &
    local docker_logs_pid=$!
    
    # Also capture real-time FreeSWITCH CLI output
    local cli_log_file="$LOG_DIR/cli_debug_${TIMESTAMP}.log"
    timeout $duration docker exec $FREESWITCH_CONTAINER fs_cli -x "/events plain all" > "$cli_log_file" 2>&1 &
    local cli_pid=$!
    
    # Wait for specified duration
    echo "Logging for $duration seconds..."
    for i in $(seq 1 $duration); do
        echo -ne "\rTime remaining: $((duration - i)) seconds"
        sleep 1
    done
    echo ""
    
    # Stop log capture
    kill $docker_logs_pid 2>/dev/null || true
    kill $cli_pid 2>/dev/null || true
    
    print_status "Logs captured to:"
    echo "  - Container logs: $log_file"
    echo "  - CLI events: $cli_log_file"
}

# Function to analyze captured logs
analyze_logs() {
    local log_file="$1"
    
    if [[ ! -f "$log_file" ]]; then
        print_error "Log file not found: $log_file"
        return 1
    fi
    
    print_info "Analyzing logs for call issues..."
    
    local analysis_file="${log_file%.log}_analysis.txt"
    
    echo "=== CALL LOG ANALYSIS ===" > "$analysis_file"
    echo "Generated: $(date)" >> "$analysis_file"
    echo "Log file: $log_file" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for INVITE messages
    echo "=== INVITE MESSAGES ===" >> "$analysis_file"
    grep -n "INVITE" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No INVITE messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for BYE messages
    echo "=== BYE MESSAGES ===" >> "$analysis_file"
    grep -n "BYE" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No BYE messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for NAT-related messages
    echo "=== NAT MESSAGES ===" >> "$analysis_file"
    grep -n -i "nat\|rport\|received" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No NAT messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for RTP messages
    echo "=== RTP MESSAGES ===" >> "$analysis_file"
    grep -n -i "rtp\|media\|audio" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No RTP messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for errors
    echo "=== ERROR MESSAGES ===" >> "$analysis_file"
    grep -n -i "error\|failed\|timeout" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No error messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Look for hangup causes
    echo "=== HANGUP CAUSES ===" >> "$analysis_file"
    grep -n -i "hangup\|cause\|disconnect" "$log_file" | head -10 >> "$analysis_file" 2>/dev/null || echo "No hangup messages found" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    print_status "Analysis saved to: $analysis_file"
    
    # Show quick summary
    print_info "Quick Summary:"
    echo "INVITE count: $(grep -c "INVITE" "$log_file" 2>/dev/null || echo 0)"
    echo "BYE count: $(grep -c "BYE" "$log_file" 2>/dev/null || echo 0)"
    echo "Error count: $(grep -c -i "error" "$log_file" 2>/dev/null || echo 0)"
    echo "NAT mentions: $(grep -c -i "nat" "$log_file" 2>/dev/null || echo 0)"
}

# Function to disable debug logging
disable_debug_logging() {
    print_info "Disabling debug logging..."
    
    # Reset Sofia log level
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia loglevel all 0"
    
    # Reset console log level
    docker exec $FREESWITCH_CONTAINER fs_cli -x "console loglevel info"
    
    # Disable SIP tracing
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace off"
    
    # Reset FreeSWITCH log level
    docker exec $FREESWITCH_CONTAINER fs_cli -x "fsctl loglevel info"
    
    print_status "Debug logging disabled"
}

# Function to monitor real-time
monitor_realtime() {
    print_info "Starting real-time call monitoring..."
    print_warning "Press Ctrl+C to stop monitoring"
    
    # Enable debug logging first
    enable_debug_logging
    
    echo ""
    echo "=== REAL-TIME CALL MONITORING ==="
    echo "Make your test call now..."
    echo ""
    
    # Monitor in real-time
    docker logs -f $FREESWITCH_CONTAINER | grep -E "(INVITE|BYE|RTP|NAT|ERROR|HANGUP)" --line-buffered --color=always
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  enable      - Enable debug logging"
    echo "  capture     - Capture logs for specified duration (default: 60s)"
    echo "  analyze     - Analyze captured log file"
    echo "  disable     - Disable debug logging"
    echo "  monitor     - Real-time monitoring"
    echo "  help        - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 enable                           # Enable debug logging"
    echo "  $0 capture 30                       # Capture for 30 seconds"
    echo "  $0 analyze logs/call-debug/file.log # Analyze specific log file"
    echo "  $0 monitor                          # Real-time monitoring"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "enable")
        enable_debug_logging
        ;;
    "capture")
        duration="${2:-60}"
        enable_debug_logging
        sleep 2
        capture_call_logs "$duration"
        disable_debug_logging
        ;;
    "analyze")
        if [[ -z "$2" ]]; then
            # Find latest log file
            latest_log=$(ls -t "$LOG_DIR"/call_debug_*.log 2>/dev/null | head -1)
            if [[ -n "$latest_log" ]]; then
                analyze_logs "$latest_log"
            else
                print_error "No log files found. Run capture first."
            fi
        else
            analyze_logs "$2"
        fi
        ;;
    "disable")
        disable_debug_logging
        ;;
    "monitor")
        monitor_realtime
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

print_status "Call logging script completed!"

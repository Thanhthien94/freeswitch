#!/bin/bash

# FreeSWITCH Recording Management Script
# Manages recording configuration, cleanup, and optimization

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FREESWITCH_CONFIG_DIR="$PROJECT_DIR/configs/freeswitch"
RECORDINGS_DIR="/usr/local/freeswitch/recordings"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to enable global recording (testing mode)
enable_global_recording() {
    log "Enabling global recording (testing mode)..."
    
    # Update vars.xml
    sed -i.bak 's/global_recording_enabled=false/global_recording_enabled=true/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    sed -i.bak 's/selective_recording_enabled=true/selective_recording_enabled=false/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    
    # Restart FreeSWITCH
    docker restart freeswitch-server
    
    log "Global recording enabled. All calls will be recorded automatically."
    warning "This is for TESTING only. Use selective recording in production."
}

# Function to enable selective recording (production mode)
enable_selective_recording() {
    log "Enabling selective recording (production mode)..."
    
    # Update vars.xml
    sed -i.bak 's/global_recording_enabled=true/global_recording_enabled=false/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    sed -i.bak 's/selective_recording_enabled=false/selective_recording_enabled=true/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    
    # Restart FreeSWITCH
    docker restart freeswitch-server
    
    log "Selective recording enabled. Only specific calls will be recorded."
    info "Configure recording rules in 02_selective_recording.xml"
}

# Function to disable all recording
disable_recording() {
    log "Disabling all recording..."
    
    # Update vars.xml
    sed -i.bak 's/global_recording_enabled=true/global_recording_enabled=false/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    sed -i.bak 's/selective_recording_enabled=true/selective_recording_enabled=false/g' "$FREESWITCH_CONFIG_DIR/vars.xml"
    
    # Restart FreeSWITCH
    docker restart freeswitch-server
    
    log "All recording disabled."
}

# Function to check recording status
check_recording_status() {
    log "Checking recording status..."
    
    # Check configuration
    global_enabled=$(grep "global_recording_enabled" "$FREESWITCH_CONFIG_DIR/vars.xml" | grep -o "true\|false")
    selective_enabled=$(grep "selective_recording_enabled" "$FREESWITCH_CONFIG_DIR/vars.xml" | grep -o "true\|false")
    
    echo "Recording Configuration:"
    echo "  Global Recording: $global_enabled"
    echo "  Selective Recording: $selective_enabled"
    
    # Check recordings directory
    if [ -d "$RECORDINGS_DIR" ]; then
        recording_count=$(find "$RECORDINGS_DIR" -name "*.wav" -type f | wc -l)
        total_size=$(du -sh "$RECORDINGS_DIR" 2>/dev/null | cut -f1)
        echo "  Total Recordings: $recording_count files"
        echo "  Storage Used: $total_size"
    else
        warning "Recordings directory not found: $RECORDINGS_DIR"
    fi
}

# Function to cleanup old recordings
cleanup_recordings() {
    local days=${1:-90}
    log "Cleaning up recordings older than $days days..."
    
    if [ -d "$RECORDINGS_DIR" ]; then
        # Find and delete old recordings
        old_files=$(find "$RECORDINGS_DIR" -name "*.wav" -type f -mtime +$days)
        if [ -n "$old_files" ]; then
            echo "$old_files" | wc -l
            echo "$old_files" | xargs rm -f
            log "Cleanup completed."
        else
            info "No old recordings found."
        fi
    else
        error "Recordings directory not found: $RECORDINGS_DIR"
    fi
}

# Function to optimize recording configuration
optimize_recording() {
    log "Optimizing recording configuration..."
    
    # Create recordings directory if it doesn't exist
    docker exec freeswitch-server mkdir -p /usr/local/freeswitch/recordings/archive
    docker exec freeswitch-server mkdir -p /usr/local/freeswitch/temp/recordings
    
    # Set proper permissions
    docker exec freeswitch-server chown -R freeswitch:freeswitch /usr/local/freeswitch/recordings
    docker exec freeswitch-server chmod -R 755 /usr/local/freeswitch/recordings
    
    log "Recording optimization completed."
}

# Function to show recording statistics
show_recording_stats() {
    log "Recording Statistics:"
    
    # Get stats from API
    curl -s "http://localhost:3000/api/v1/recordings/stats" | jq . 2>/dev/null || echo "API not available"
    
    # Get file system stats
    if [ -d "$RECORDINGS_DIR" ]; then
        echo ""
        echo "File System Statistics:"
        echo "  Directory: $RECORDINGS_DIR"
        find "$RECORDINGS_DIR" -name "*.wav" -type f -exec ls -lh {} \; | awk '{total+=$5; count++} END {print "  Total Files: " count; print "  Average Size: " total/count " bytes"}'
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "FreeSWITCH Recording Management"
    echo "==============================="
    echo "1. Enable Global Recording (Testing)"
    echo "2. Enable Selective Recording (Production)"
    echo "3. Disable All Recording"
    echo "4. Check Recording Status"
    echo "5. Cleanup Old Recordings"
    echo "6. Optimize Recording Configuration"
    echo "7. Show Recording Statistics"
    echo "8. Exit"
    echo ""
}

# Main script
case "$1" in
    "global")
        enable_global_recording
        ;;
    "selective")
        enable_selective_recording
        ;;
    "disable")
        disable_recording
        ;;
    "status")
        check_recording_status
        ;;
    "cleanup")
        cleanup_recordings "$2"
        ;;
    "optimize")
        optimize_recording
        ;;
    "stats")
        show_recording_stats
        ;;
    *)
        show_menu
        read -p "Select option (1-8): " choice
        case $choice in
            1) enable_global_recording ;;
            2) enable_selective_recording ;;
            3) disable_recording ;;
            4) check_recording_status ;;
            5) 
                read -p "Enter retention days (default 90): " days
                cleanup_recordings "${days:-90}"
                ;;
            6) optimize_recording ;;
            7) show_recording_stats ;;
            8) exit 0 ;;
            *) error "Invalid option" ;;
        esac
        ;;
esac

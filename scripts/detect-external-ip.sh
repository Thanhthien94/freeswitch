#!/bin/bash

# FreeSWITCH External IP Detection Script
# This script automatically detects the appropriate external IP for FreeSWITCH
# based on the deployment environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 FreeSWITCH External IP Detection${NC}"
echo "=================================="

# Read EXTERNAL_IP from .env file
if [ -f ".env" ]; then
    EXTERNAL_IP=$(grep "^EXTERNAL_IP=" .env | cut -d'=' -f2)
    echo -e "${BLUE}📄 Found EXTERNAL_IP in .env: ${YELLOW}$EXTERNAL_IP${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Function to detect external IP
detect_external_ip() {
    echo -e "${BLUE}🔍 Detecting external IP...${NC}"
    
    # Try multiple methods to get external IP
    DETECTED_IP=""
    
    # Method 1: Using curl with ipify
    if [ -z "$DETECTED_IP" ]; then
        DETECTED_IP=$(curl -s --connect-timeout 5 https://api.ipify.org 2>/dev/null || echo "")
        if [ ! -z "$DETECTED_IP" ]; then
            echo -e "${GREEN}✅ Detected via ipify: $DETECTED_IP${NC}"
        fi
    fi
    
    # Method 2: Using curl with icanhazip
    if [ -z "$DETECTED_IP" ]; then
        DETECTED_IP=$(curl -s --connect-timeout 5 https://icanhazip.com 2>/dev/null | tr -d '\n' || echo "")
        if [ ! -z "$DETECTED_IP" ]; then
            echo -e "${GREEN}✅ Detected via icanhazip: $DETECTED_IP${NC}"
        fi
    fi
    
    # Method 3: Using dig with OpenDNS
    if [ -z "$DETECTED_IP" ]; then
        DETECTED_IP=$(dig +short myip.opendns.com @resolver1.opendns.com 2>/dev/null || echo "")
        if [ ! -z "$DETECTED_IP" ]; then
            echo -e "${GREEN}✅ Detected via OpenDNS: $DETECTED_IP${NC}"
        fi
    fi
    
    # Method 4: Fallback to local IP
    if [ -z "$DETECTED_IP" ]; then
        DETECTED_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
        if [ ! -z "$DETECTED_IP" ]; then
            echo -e "${YELLOW}⚠️  Using local IP as fallback: $DETECTED_IP${NC}"
        fi
    fi
    
    echo "$DETECTED_IP"
}

# Function to update FreeSWITCH configuration
update_freeswitch_config() {
    local ip=$1
    local config_file="configs/freeswitch/vars.xml"
    
    echo -e "${BLUE}📝 Updating FreeSWITCH configuration...${NC}"
    
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}❌ FreeSWITCH config file not found: $config_file${NC}"
        return 1
    fi
    
    # Create backup
    cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Created backup of vars.xml${NC}"
    
    # Update external_rtp_ip and external_sip_ip
    sed -i.tmp "s/external_rtp_ip=.*\"/external_rtp_ip=$ip\"/g" "$config_file"
    sed -i.tmp "s/external_sip_ip=.*\"/external_sip_ip=$ip\"/g" "$config_file"
    
    # Also change from stun-set to set for specific IP
    sed -i.tmp 's/cmd="stun-set" data="external_rtp_ip=/cmd="set" data="external_rtp_ip=/g' "$config_file"
    sed -i.tmp 's/cmd="stun-set" data="external_sip_ip=/cmd="set" data="external_sip_ip=/g' "$config_file"
    
    rm -f "$config_file.tmp"
    
    echo -e "${GREEN}✅ Updated FreeSWITCH configuration with IP: $ip${NC}"
}

# Main logic
case "$EXTERNAL_IP" in
    "auto")
        echo -e "${BLUE}🔄 Auto-detecting external IP...${NC}"
        DETECTED_IP=$(detect_external_ip)
        
        if [ -z "$DETECTED_IP" ]; then
            echo -e "${RED}❌ Failed to detect external IP${NC}"
            echo -e "${YELLOW}💡 Using STUN server as fallback${NC}"
            # Keep STUN configuration as is
            exit 0
        else
            echo -e "${GREEN}🎯 Detected external IP: $DETECTED_IP${NC}"
            update_freeswitch_config "$DETECTED_IP"
        fi
        ;;
    "stun")
        echo -e "${BLUE}🌐 Using STUN server for IP detection${NC}"
        echo -e "${GREEN}✅ STUN configuration already in place${NC}"
        ;;
    *)
        # Specific IP provided
        if [[ $EXTERNAL_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo -e "${BLUE}🎯 Using specified IP: $EXTERNAL_IP${NC}"
            update_freeswitch_config "$EXTERNAL_IP"
        else
            echo -e "${RED}❌ Invalid IP format: $EXTERNAL_IP${NC}"
            exit 1
        fi
        ;;
esac

echo -e "${GREEN}🎉 FreeSWITCH IP configuration completed!${NC}"

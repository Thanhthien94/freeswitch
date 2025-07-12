#!/bin/bash

# Domain-Specific Registration Testing Script
# Tests multi-domain authentication and registration

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

echo -e "${BLUE}🏢 FreeSWITCH Domain-Specific Registration Test${NC}"
echo "================================================="

# Function to test domain availability
test_domains() {
    print_info "Testing available domains..."
    
    echo "Sofia Status:"
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status" | grep -E "(alias|ALIASED)"
    
    echo ""
    print_info "Testing domain lookups..."
    
    # Test localhost domain
    echo "Testing localhost domain:"
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "xml_locate directory domain name localhost" | grep -q "domain name=\"localhost\""; then
        print_status "localhost domain: AVAILABLE"
    else
        print_error "localhost domain: NOT FOUND"
    fi
    
    # Test pbx.local domain
    echo "Testing pbx.local domain:"
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "xml_locate directory domain name pbx.local" | grep -q "domain name=\"pbx.local\""; then
        print_status "pbx.local domain: AVAILABLE"
    else
        print_error "pbx.local domain: NOT FOUND"
    fi
    
    # Test IP domain
    echo "Testing IP domain (172.25.0.3):"
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "xml_locate directory domain name 172.25.0.3" | grep -q "domain name=\"172.25.0.3\""; then
        print_status "172.25.0.3 domain: AVAILABLE"
    else
        print_error "172.25.0.3 domain: NOT FOUND"
    fi
    
    echo ""
}

# Function to test users in domains
test_domain_users() {
    local domain="$1"
    
    if [[ -z "$domain" ]]; then
        print_error "Usage: test_domain_users <domain>"
        return 1
    fi
    
    print_info "Testing users in domain: $domain"
    
    # Test if domain has users
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "xml_locate directory domain name $domain" | grep -q "user id=\"1001\""; then
        print_status "User 1001 found in $domain"
    else
        print_error "User 1001 NOT found in $domain"
    fi
    
    if docker exec $FREESWITCH_CONTAINER fs_cli -x "xml_locate directory domain name $domain" | grep -q "user id=\"1002\""; then
        print_status "User 1002 found in $domain"
    else
        print_error "User 1002 NOT found in $domain"
    fi
    
    echo ""
}

# Function to show SIP client configuration
show_sip_config() {
    local domain="$1"
    local extension="${2:-1001}"
    
    if [[ -z "$domain" ]]; then
        print_error "Usage: show_sip_config <domain> [extension]"
        return 1
    fi
    
    print_info "SIP Client Configuration for $extension@$domain:"
    echo "=============================================="
    echo "Account Name: Extension $extension ($domain)"
    echo "SIP Server: 192.168.1.6"
    echo "Port: 5060"
    echo "Username: $extension"
    echo "Password: d-d5kjaQMM6_"
    echo "Domain: $domain"
    echo "Realm: $domain"
    echo "Transport: UDP (preferred) or TCP"
    echo "Display Name: Extension $extension ($domain)"
    echo ""
}

# Function to monitor registrations by domain
monitor_registrations() {
    print_info "Current registrations by domain:"
    echo "================================"
    
    local reg_output=$(docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia status profile internal reg")
    
    echo "All registrations:"
    echo "$reg_output" | grep -E "(User:|Auth-Realm:)" || echo "No registrations found"
    
    echo ""
    echo "Domain breakdown:"
    
    # Count by domain
    local localhost_count=$(echo "$reg_output" | grep -c "Auth-Realm.*localhost" || echo "0")
    local pbx_count=$(echo "$reg_output" | grep -c "Auth-Realm.*pbx.local" || echo "0")
    local ip_count=$(echo "$reg_output" | grep -c "Auth-Realm.*172.25.0.3" || echo "0")
    
    echo "localhost domain: $localhost_count registrations"
    echo "pbx.local domain: $pbx_count registrations"
    echo "172.25.0.3 domain: $ip_count registrations"
    
    echo ""
}

# Function to test authentication for specific domain
test_domain_auth() {
    local domain="$1"
    
    if [[ -z "$domain" ]]; then
        print_error "Usage: test_domain_auth <domain>"
        return 1
    fi
    
    print_info "Testing authentication for domain: $domain"
    
    # Enable SIP debugging
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace on" > /dev/null
    
    print_warning "Please register a SIP client with domain '$domain' now..."
    print_info "Use configuration:"
    show_sip_config "$domain" "1001"
    
    print_info "Monitoring for 30 seconds..."
    sleep 30
    
    # Disable SIP debugging
    docker exec $FREESWITCH_CONTAINER fs_cli -x "sofia profile internal siptrace off" > /dev/null
    
    # Check if registration appeared
    monitor_registrations
}

# Function to run comprehensive domain test
run_comprehensive_test() {
    print_info "Running comprehensive domain test..."
    
    test_domains
    
    print_info "Testing users in each domain..."
    test_domain_users "localhost"
    test_domain_users "pbx.local"
    test_domain_users "172.25.0.3"
    
    print_info "Current registration status:"
    monitor_registrations
    
    print_info "SIP client configurations:"
    show_sip_config "localhost" "1001"
    show_sip_config "pbx.local" "1001"
    show_sip_config "172.25.0.3" "1001"
    
    print_status "Comprehensive domain test completed!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  domains                    - Test domain availability"
    echo "  users <domain>             - Test users in specific domain"
    echo "  config <domain> [ext]      - Show SIP client config for domain"
    echo "  registrations              - Monitor current registrations"
    echo "  auth <domain>              - Test authentication for domain"
    echo "  test                       - Run comprehensive test"
    echo "  help                       - Show this help"
    echo ""
    echo "Available domains:"
    echo "  localhost"
    echo "  pbx.local"
    echo "  172.25.0.3"
    echo ""
    echo "Examples:"
    echo "  $0 domains                 # Test all domains"
    echo "  $0 users localhost         # Test users in localhost domain"
    echo "  $0 config pbx.local 1002   # Show config for 1002@pbx.local"
    echo "  $0 auth localhost          # Test auth for localhost domain"
    echo ""
}

# Main script logic
case "${1:-test}" in
    "domains")
        test_domains
        ;;
    "users")
        test_domain_users "$2"
        ;;
    "config")
        show_sip_config "$2" "$3"
        ;;
    "registrations")
        monitor_registrations
        ;;
    "auth")
        test_domain_auth "$2"
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

print_status "Domain registration test completed!"

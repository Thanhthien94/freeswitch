#!/bin/bash

# CORS Configuration Test Script
# Tests CORS configuration using curl commands

set -e

API_URL="${API_URL:-http://localhost:3000/api/v1}"
HEALTH_ENDPOINT="$API_URL/health"

echo "🧪 Testing CORS Configuration for FreeSWITCH PBX Backend"
echo "API URL: $API_URL"
echo ""

# Test origins
ALLOWED_ORIGINS=(
    "http://localhost:3000"
    "http://localhost:3001" 
    "http://localhost:3002"
    "http://127.0.0.1:3000"
    "http://127.0.0.1:3001"
    "http://127.0.0.1:3002"
)

BLOCKED_ORIGINS=(
    "https://example.com"
    "http://malicious-site.com"
    "https://unauthorized.domain.com"
)

echo "✅ Testing ALLOWED origins:"
echo "================================"

for origin in "${ALLOWED_ORIGINS[@]}"; do
    echo "Testing origin: $origin"
    
    # Test preflight request
    echo "  📋 Preflight (OPTIONS):"
    response=$(curl -s -I -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        "$HEALTH_ENDPOINT" 2>/dev/null || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        echo "    ❌ Preflight request failed"
    else
        echo "    ✅ Preflight successful"
        echo "$response" | grep -i "access-control" | sed 's/^/      /'
    fi
    
    # Test actual request
    echo "  📋 Actual request (GET):"
    response=$(curl -s -I -X GET \
        -H "Origin: $origin" \
        "$HEALTH_ENDPOINT" 2>/dev/null || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        echo "    ❌ Actual request failed"
    else
        echo "    ✅ Actual request successful"
        echo "$response" | grep -i "access-control" | sed 's/^/      /'
    fi
    
    echo ""
done

echo "❌ Testing BLOCKED origins (should fail or not return CORS headers):"
echo "=================================================================="

for origin in "${BLOCKED_ORIGINS[@]}"; do
    echo "Testing origin: $origin"
    
    # Test preflight request
    echo "  📋 Preflight (OPTIONS):"
    response=$(curl -s -I -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        "$HEALTH_ENDPOINT" 2>/dev/null || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        echo "    ✅ Preflight blocked (expected)"
    else
        cors_headers=$(echo "$response" | grep -i "access-control" || echo "")
        if [[ -z "$cors_headers" ]]; then
            echo "    ✅ No CORS headers (blocked as expected)"
        else
            echo "    ⚠️  CORS headers present (might be misconfigured):"
            echo "$cors_headers" | sed 's/^/      /'
        fi
    fi
    
    echo ""
done

echo "🔌 WebSocket CORS Testing:"
echo "========================="
echo "WebSocket CORS testing requires a WebSocket client."
echo "To manually test WebSocket CORS:"
echo "1. Open browser console on different origins"
echo "2. Try connecting to:"
echo "   - ws://localhost:3000/dashboard"
echo "   - ws://localhost:3000/realtime"
echo ""

echo "📝 CORS Configuration Summary:"
echo "=============================="
echo "✅ Allowed origins should return 'Access-Control-Allow-Origin' header"
echo "✅ Credentials should be enabled (Access-Control-Allow-Credentials: true)"
echo "✅ Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS"
echo "✅ Allowed headers: Content-Type, Authorization, X-Requested-With, X-Query-Params"
echo "❌ Blocked origins should not receive CORS headers or fail entirely"
echo ""

echo "✨ CORS testing completed!"

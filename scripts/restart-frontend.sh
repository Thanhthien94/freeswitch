#!/bin/bash

# Restart Frontend with API Configuration
echo "🔄 Restarting Frontend with updated API configuration..."

# Stop frontend container
echo "⏹️  Stopping frontend container..."
docker-compose stop frontend

# Remove frontend container to force rebuild
echo "🗑️  Removing frontend container..."
docker-compose rm -f frontend

# Rebuild and start frontend
echo "🏗️  Rebuilding and starting frontend..."
docker-compose up -d frontend

# Wait for container to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps frontend

# Check logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 frontend

# Test API connectivity
echo "🔍 Testing API connectivity..."
echo "Frontend: http://localhost:3002"
echo "Backend API: http://localhost:3000"

# Test endpoints
echo "Testing backend health endpoint..."
curl -s http://localhost:3000/health || echo "❌ Backend health check failed"

echo "Testing backend auth endpoint..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test","password":"test"}' || echo "❌ Backend auth endpoint failed"

echo "✅ Frontend restart complete!"
echo "🌐 Access frontend at: http://localhost:3002"
echo "🔧 Access backend at: http://localhost:3000"

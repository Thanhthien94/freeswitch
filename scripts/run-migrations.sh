#!/bin/bash

# Run ABAC/RBAC Database Migrations
echo "🗄️  Running ABAC/RBAC Database Migrations..."

# Change to nestjs-app directory
cd nestjs-app

# Check if TypeORM CLI is available
if ! npm list typeorm > /dev/null 2>&1; then
    echo "📦 Installing TypeORM CLI..."
    npm install typeorm --save-dev
fi

# Set environment variables for database connection
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=pbx_user
export POSTGRES_PASSWORD=pbx_password
export POSTGRES_DB=pbx_db

echo "🔍 Checking current migration status..."
npm run typeorm migration:show

echo "🚀 Running pending migrations..."
npm run typeorm migration:run

echo "📊 Checking tables after migration..."
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo "👥 Checking if users table exists..."
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null || echo "Users table not found"

echo "🔐 Checking if roles table exists..."
docker exec postgres-db psql -U pbx_user -d pbx_db -c "SELECT COUNT(*) as role_count FROM roles;" 2>/dev/null || echo "Roles table not found"

echo "✅ Migration process complete!"
echo "🌐 Backend API available at: http://localhost:3000/api/v1"
echo "🔐 Auth endpoints: http://localhost:3000/api/v1/auth/login"

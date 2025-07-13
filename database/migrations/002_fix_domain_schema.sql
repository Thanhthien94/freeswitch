-- Migration: Fix Domain Schema
-- Add missing columns to domains table

-- Add missing columns to domains table
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS max_extensions INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS billing_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100),
ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Update created_at and updated_at to use timestamptz
ALTER TABLE domains 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON domains(is_active);
CREATE INDEX IF NOT EXISTS idx_domains_billing_plan ON domains(billing_plan);
CREATE INDEX IF NOT EXISTS idx_domains_created_by ON domains(created_by);

-- Update existing domain with proper values
UPDATE domains
SET
  max_users = 1000,
  max_extensions = 1000,
  billing_plan = 'enterprise',
  admin_email = 'admin@localhost'
WHERE name = 'localhost';

-- Fix roles table schema
-- Add missing columns to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Update type column to use enum (if not already)
-- Note: PostgreSQL will handle this gracefully if enum already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type_enum') THEN
        CREATE TYPE role_type_enum AS ENUM ('global', 'domain', 'department', 'team');
    END IF;
END $$;

-- Update type column to use enum
ALTER TABLE roles ALTER COLUMN type TYPE role_type_enum USING type::role_type_enum;

-- Update created_at and updated_at to use timestamptz
ALTER TABLE roles
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(type);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_domain_id ON roles(domain_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON roles(created_by);

-- Fix permissions table schema
-- Add missing columns to permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conditions JSONB,
ADD COLUMN IF NOT EXISTS constraints JSONB;

-- Create enums for permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_action_enum') THEN
        CREATE TYPE permission_action_enum AS ENUM ('read', 'create', 'update', 'delete', 'execute', 'manage');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_category_enum') THEN
        CREATE TYPE permission_category_enum AS ENUM ('system', 'domain', 'users', 'calls', 'extensions', 'cdr', 'recordings', 'billing', 'reports', 'analytics', 'config', 'security', 'monitoring');
    END IF;
END $$;

-- Update action column to use enum
ALTER TABLE permissions ALTER COLUMN action TYPE permission_action_enum USING action::permission_action_enum;

-- Update category column to use enum (set default first)
UPDATE permissions SET category = 'system' WHERE category IS NULL;
ALTER TABLE permissions ALTER COLUMN category TYPE permission_category_enum USING category::permission_category_enum;

-- Update created_at and updated_at to use timestamptz
ALTER TABLE permissions
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_is_system ON permissions(is_system);

-- Fix user_roles table schema
-- First, change id to UUID (this is complex, so we'll keep integer for now)
-- Add missing columns to user_roles table
ALTER TABLE user_roles
ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS granted_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS grant_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS constraints JSONB,
ADD COLUMN IF NOT EXISTS context JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS revoke_reason VARCHAR(255);

-- Rename assigned_at to granted_at if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'assigned_at') THEN
        UPDATE user_roles SET granted_at = assigned_at WHERE granted_at IS NULL;
        ALTER TABLE user_roles DROP COLUMN assigned_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'assigned_by') THEN
        UPDATE user_roles SET granted_by = assigned_by WHERE granted_by IS NULL;
        ALTER TABLE user_roles DROP COLUMN assigned_by;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_at ON user_roles(granted_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_revoked_at ON user_roles(revoked_at);

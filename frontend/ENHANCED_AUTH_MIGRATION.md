# Enhanced Authentication Migration Guide

## 🎯 Overview

This guide helps migrate from the current authentication system to the enhanced authentication system with JWT validation, auto-refresh, and performance optimizations.

## 📋 Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard, ProtectedPage } from '@/components/auth/AuthGuard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { usePermissions } from '@/hooks/usePermissions';
```

**After:**
```typescript
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { UnifiedAuthGuard, ProtectedPage, AdminPage } from '@/components/auth/UnifiedAuthGuard';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
```

### Step 2: Update Auth Hook Usage

**Before:**
```typescript
const { user, login, logout, isAuthenticated, isLoading, error } = useAuth();
```

**After:**
```typescript
const { 
  user, 
  login, 
  logout, 
  isAuthenticated, 
  isLoading, 
  error,
  tokenValidation,
  ensureValidToken 
} = useEnhancedAuth();
```

### Step 3: Update Permission Hook Usage

**Before:**
```typescript
const permissions = usePermissions();
const canRead = permissions.hasPermission('users:read');
```

**After:**
```typescript
const permissions = useEnhancedPermissions();
const canRead = permissions.canReadUsers; // More specific and cached
```

### Step 4: Update Route Protection

**Before:**
```typescript
<ProtectedRoute 
  requireRoles={['SuperAdmin']}
  requirePermissions={['users:manage']}
  requireMinimumClearance="HIGH"
>
  <AdminPanel />
</ProtectedRoute>
```

**After:**
```typescript
<UnifiedAuthGuard 
  requireAnyRole={['SuperAdmin']}
  requirePermissions={['users:manage']}
  requireMinimumClearance="HIGH"
>
  <AdminPanel />
</UnifiedAuthGuard>

// Or use convenience component
<AdminPage>
  <AdminPanel />
</AdminPage>
```

### Step 5: Update Layout Components

**Before:**
```typescript
// dashboard/layout.tsx
import { ProtectedPage } from '@/components/auth/AuthGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedPage>
  );
}
```

**After:**
```typescript
// dashboard/layout.tsx
import { ProtectedPage } from '@/components/auth/UnifiedAuthGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedPage>
  );
}
```

## 🔄 Component Mapping

| Old Component | New Component | Notes |
|---------------|---------------|-------|
| `AuthGuard` | `UnifiedAuthGuard` | Enhanced with JWT validation |
| `ProtectedRoute` | `UnifiedAuthGuard` | Merged functionality |
| `ProtectedPage` | `ProtectedPage` | Same API, enhanced backend |
| `PublicPage` | `PublicPage` | Same API, enhanced backend |
| N/A | `AdminPage` | New convenience component |

## 🚀 New Features

### 1. JWT Validation
```typescript
const { tokenValidation } = useEnhancedAuth();

if (tokenValidation) {
  console.log('Token expires in:', tokenValidation.expiresIn, 'seconds');
  console.log('Token is valid:', tokenValidation.isValid);
}
```

### 2. Auto Token Refresh
```typescript
// Automatically handled, but you can manually ensure valid token
const { ensureValidToken } = useEnhancedAuth();

const makeAPICall = async () => {
  const token = await ensureValidToken();
  if (token) {
    // Make API call with fresh token
  }
};
```

### 3. Enhanced Permissions
```typescript
const permissions = useEnhancedPermissions();

// More specific permission checks
if (permissions.canManageUsers) {
  // Show user management UI
}

// Security clearance checks
if (permissions.hasMinimumClearance('HIGH')) {
  // Show sensitive data
}

// Business hours checks
if (permissions.canAccessDuringBusinessHours) {
  // Allow access
}
```

### 4. Better Error Handling
```typescript
<UnifiedAuthGuard 
  requirePermissions={['admin:access']}
  showError={true}
  onUnauthorized={() => {
    // Custom handling for unauthorized access
    toast.error('Access denied');
  }}
>
  <AdminPanel />
</UnifiedAuthGuard>
```

## ⚡ Performance Improvements

### 1. Memoization
- All permission checks are memoized
- Reduced re-renders with useMemo
- Cached token validation

### 2. Token-based Checks
- Permission checks use JWT payload when possible
- Reduced API calls for user data
- Faster authorization decisions

### 3. Auto-refresh
- Prevents unnecessary logouts
- Seamless user experience
- Background token renewal

## 🔒 Security Enhancements

### 1. JWT Validation
- Proper token expiry checking
- Payload validation
- Automatic cleanup of invalid tokens

### 2. Multi-tab Support
- Storage event listeners
- Synchronized auth state
- Consistent behavior across tabs

### 3. Secure Token Storage
- Enhanced localStorage handling
- Error recovery mechanisms
- Cleanup on logout

## 🧪 Testing

### Unit Tests
```typescript
import { renderHook } from '@testing-library/react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

test('should validate token correctly', () => {
  const { result } = renderHook(() => useEnhancedAuth());
  
  // Test token validation
  expect(result.current.tokenValidation?.isValid).toBe(true);
});
```

### Integration Tests
```typescript
import { render, screen } from '@testing-library/react';
import { UnifiedAuthGuard } from '@/components/auth/UnifiedAuthGuard';

test('should show error for insufficient permissions', () => {
  render(
    <UnifiedAuthGuard requirePermissions={['admin:access']}>
      <div>Admin Content</div>
    </UnifiedAuthGuard>
  );
  
  expect(screen.getByText('Access Denied')).toBeInTheDocument();
});
```

## 📝 Rollback Plan

If issues occur, you can rollback by:

1. Reverting import statements
2. Using old components temporarily
3. Keeping both systems parallel during transition

## 🎉 Benefits

✅ **Enhanced Security** - JWT validation, auto-refresh, secure storage
✅ **Better Performance** - Memoization, caching, reduced re-renders  
✅ **Improved UX** - Seamless token refresh, better error handling
✅ **Simplified API** - Unified components, cleaner code
✅ **Future-proof** - Extensible architecture, modern patterns

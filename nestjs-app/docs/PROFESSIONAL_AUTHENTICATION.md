# 🔐 Professional Authentication System

## 📋 **Tổng Quan**

Hệ thống xác thực chuyên nghiệp thống nhất cho toàn bộ dự án FreeSWITCH, thay thế hoàn toàn các luồng xác thực rời rạc trước đây.

## 🏗️ **Kiến Trúc Hệ Thống**

### **Core Components**

```
┌─────────────────────────────────────────────────────────────┐
│                Professional Auth System                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              ProfessionalAuthGuard                      │ │
│ │  ┌─────────┬─────────┬─────────────┬─────────────────┐  │ │
│ │  │   JWT   │  RBAC   │ Rate Limit  │    Security     │  │ │
│ │  │ Validation│ Check │   Check     │   Validation    │  │ │
│ │  └─────────┴─────────┴─────────────┴─────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                  Support Services                      │ │
│ │  ┌─────────────┬─────────────┬─────────────────────────┐ │ │
│ │  │ JWT Strategy│ Auth Service│    Event Logging        │ │ │
│ │  │             │             │                         │ │ │
│ │  └─────────────┴─────────────┴─────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Key Features**

1. **Unified Authentication**: Một guard duy nhất cho toàn bộ ứng dụng
2. **Hierarchical RBAC**: Hệ thống phân quyền theo cấp bậc
3. **Intelligent Rate Limiting**: Rate limiting thông minh theo role và operation
4. **Comprehensive Audit**: Logging chi tiết mọi hoạt động authentication
5. **Security Validation**: Kiểm tra bảo mật cho các operation nhạy cảm

## 🔧 **Cách Sử Dụng**

### **1. Basic Authentication**

```typescript
@Controller('example')
@UseGuards(ProfessionalAuthGuard)
export class ExampleController {
  @Get('public')
  @Public() // Endpoint công khai
  getPublicData() {}

  @Get('protected')
  getProtectedData() {} // Yêu cầu authentication
}
```

### **2. Permission-Based Authorization**

```typescript
@Controller('config')
@UseGuards(ProfessionalAuthGuard)
export class ConfigController {
  @Get()
  @RequirePermissions(PERMISSIONS.CONFIG_READ)
  getConfigs() {}

  @Post()
  @RequirePermissions(PERMISSIONS.CONFIG_CREATE)
  createConfig() {}

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CONFIG_DELETE)
  deleteConfig() {}
}
```

### **3. Role-Based Authorization**

```typescript
@Controller('admin')
@UseGuards(ProfessionalAuthGuard)
export class AdminController {
  @Get('users')
  @RequireRoles(ROLES.ADMIN, ROLES.SUPERADMIN)
  getUsers() {}

  @Post('system/restart')
  @SuperAdminOnly()
  restartSystem() {}
}
```

### **4. Rate Limiting**

```typescript
@Controller('api')
@UseGuards(ProfessionalAuthGuard)
export class ApiController {
  @Post('sync')
  @SyncRateLimit() // 5 requests per 5 minutes
  syncData() {}

  @Post('backup')
  @BackupRateLimit() // 3 requests per 10 minutes
  createBackup() {}

  @Post('upload')
  @RateLimit({ windowMs: 60000, maxRequests: 10 })
  uploadFile() {}
}
```

### **5. Security Operations**

```typescript
@Controller('security')
@UseGuards(ProfessionalAuthGuard)
export class SecurityController {
  @Post('validate')
  @SecurityOperation() // Combines permissions + rate limiting + audit
  validateSecurity() {}

  @Post('encrypt')
  @RequirePermissions(PERMISSIONS.SECURITY_ENCRYPTION)
  @SensitiveRateLimit()
  @Sensitive()
  encryptData() {}
}
```

## 🎯 **Permission System**

### **Permission Hierarchy**

```typescript
const PERMISSIONS = {
  // Basic CRUD
  READ: 'read',
  CREATE: 'create', 
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Configuration
  CONFIG_READ: 'config:read',
  CONFIG_CREATE: 'config:create',
  CONFIG_UPDATE: 'config:update',
  CONFIG_DELETE: 'config:delete',
  CONFIG_SYNC: 'config:sync',
  
  // System
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_METRICS: 'system:metrics',
  SYSTEM_AUDIT: 'system:audit',
  
  // Security
  SECURITY_READ: 'security:read',
  SECURITY_MANAGE: 'security:manage',
  SECURITY_ENCRYPTION: 'security:encryption',
  
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
};
```

### **Role Hierarchy**

```typescript
const roleHierarchy = {
  'superadmin': ['admin', 'operator', 'viewer'],
  'admin': ['operator', 'viewer'],
  'operator': ['viewer'],
  'viewer': [],
};
```

**Inheritance Rules:**
- `superadmin`: Có tất cả permissions
- `admin`: Có permissions của operator + viewer + admin-specific
- `operator`: Có permissions của viewer + operator-specific  
- `viewer`: Chỉ có read permissions

## ⚡ **Rate Limiting**

### **Role-Based Limits**

| Role | Requests/Minute | Window |
|------|----------------|---------|
| superadmin | 200 | 60s |
| admin | 120 | 60s |
| operator | 80 | 60s |
| viewer | 40 | 60s |
| default | 20 | 60s |

### **Operation-Specific Limits**

| Operation | Limit | Window | Description |
|-----------|-------|---------|-------------|
| sync | 5 | 5 minutes | Configuration sync |
| backup | 3 | 10 minutes | Backup operations |
| sensitive | 10 | 5 minutes | Security operations |
| upload | 10 | 1 minute | File uploads |
| login | 5 | 15 minutes | Login attempts |

## 📊 **Audit & Monitoring**

### **Authentication Logs**

```typescript
interface AuthenticationLog {
  userId: string;
  username: string;
  action: string; // 'login', 'access_granted', 'access_denied'
  resource: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  duration: number;
  timestamp: Date;
}
```

### **Rate Limit Logs**

```typescript
interface RateLimitLog {
  userId: string;
  ipAddress: string;
  endpoint: string;
  currentCount: number;
  maxRequests: number;
  exceeded: boolean;
  timestamp: Date;
}
```

### **Security Events**

```typescript
interface SecurityEvent {
  userId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  resolved: boolean;
  timestamp: Date;
}
```

## 🔄 **Migration từ Hệ Thống Cũ**

### **Thay Đổi Chính**

1. **Guards**: `JwtAuthGuard` → `ProfessionalAuthGuard`
2. **Decorators**: Sử dụng decorators mới từ `auth.decorators.ts`
3. **Permissions**: Sử dụng constants từ `PERMISSIONS`
4. **Rate Limiting**: Tự động áp dụng, có thể customize

### **Breaking Changes**

- ❌ `@UseGuards(JwtAuthGuard)` 
- ✅ `@UseGuards(ProfessionalAuthGuard)`

- ❌ Manual permission checking
- ✅ `@RequirePermissions(PERMISSIONS.CONFIG_READ)`

- ❌ No rate limiting
- ✅ Automatic rate limiting với customization

## 🚀 **Best Practices**

### **1. Controller Level Protection**

```typescript
@Controller('api')
@UseGuards(ProfessionalAuthGuard) // Protect toàn bộ controller
export class ApiController {
  @Get('public')
  @Public() // Override cho public endpoints
  getPublicData() {}
}
```

### **2. Granular Permissions**

```typescript
// ✅ Good: Specific permissions
@RequirePermissions(PERMISSIONS.CONFIG_UPDATE)

// ❌ Avoid: Generic permissions  
@RequirePermissions('admin')
```

### **3. Combined Security**

```typescript
@Post('critical-operation')
@RequirePermissions(PERMISSIONS.SECURITY_MANAGE)
@SensitiveRateLimit()
@Sensitive()
async criticalOperation() {}
```

### **4. Error Handling**

```typescript
try {
  // Protected operation
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Handle authentication error
  } else if (error instanceof ForbiddenException) {
    // Handle authorization error
  } else if (error.status === 429) {
    // Handle rate limit error
  }
}
```

## 📈 **Performance Considerations**

### **Optimizations**

1. **Token-based Validation**: Không query database mỗi request (có thể enable)
2. **In-memory Rate Limiting**: Sử dụng Map thay vì database
3. **Async Logging**: Event-driven logging không block request
4. **Cleanup Jobs**: Tự động cleanup expired entries

### **Configuration**

```typescript
// .env
JWT_SECRET=your-super-secret-key
JWT_EXPIRY=24h
UPDATE_LAST_ACTIVITY=true # Enable/disable activity tracking
RATE_LIMIT_ENABLED=true
AUDIT_LOGGING_ENABLED=true
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **401 Unauthorized**: Token invalid hoặc expired
2. **403 Forbidden**: Insufficient permissions
3. **429 Too Many Requests**: Rate limit exceeded

### **Debug Mode**

```typescript
// Enable debug logging
const logger = new Logger('ProfessionalAuthGuard');
logger.debug('Authentication attempt details...');
```

## 📝 **Changelog**

### **v1.0.0 - Professional Auth System**

- ✅ Unified authentication guard
- ✅ Hierarchical RBAC system  
- ✅ Intelligent rate limiting
- ✅ Comprehensive audit logging
- ✅ Security event monitoring
- ✅ Professional decorators
- ✅ Enhanced user entity
- ✅ Migration support

### **Migration Completed**

- ✅ Removed old `JwtAuthGuard`
- ✅ Removed old `ConfigAuthGuard`, `ConfigRbacGuard`, `ConfigRateLimitGuard`
- ✅ Updated all controllers
- ✅ Enhanced database schema
- ✅ Added comprehensive logging

---

**🎯 Kết Quả**: Hệ thống authentication chuyên nghiệp, thống nhất, bảo mật cao với khả năng mở rộng tốt cho toàn bộ dự án FreeSWITCH.

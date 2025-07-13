# ABAC/RBAC Implementation Guide

## 🎯 Tổng quan Implementation

Hệ thống ABAC/RBAC đã được implement hoàn chỉnh cho FreeSWITCH PBX Enterprise System với các tính năng:

### ✅ **Đã hoàn thành:**
1. **Multi-Domain Role Hierarchy** - SuperAdmin → DomainAdmin → Manager → Supervisor → Agent → User
2. **Comprehensive Permission System** - Resource:Action pattern với 12 categories
3. **Attribute-Based Access Control** - User, Resource, Environment attributes
4. **Policy Engine** - Dynamic rule evaluation với Deny-Override algorithm
5. **Guards & Decorators** - Ready-to-use protection cho endpoints
6. **JWT Integration** - Roles/permissions trong JWT payload
7. **Audit System** - Comprehensive security logging

## 🏗️ Kiến trúc Components

### **Entities (Database Layer)**
```
├── Domain Entity          - Multi-tenant domains
├── Role Entity            - Hierarchical roles với levels
├── Permission Entity      - Resource:Action permissions
├── UserRole Entity        - User-Role assignments với time-based
├── UserAttribute Entity   - ABAC user attributes
├── Policy Entity          - ABAC policy rules
└── AuditLog Entity       - Security audit trail
```

### **Services (Business Logic)**
```
├── RBACService           - Role & permission management
├── ABACService           - Policy evaluation engine
└── AuthService           - JWT authentication với RBAC/ABAC
```

### **Guards (Protection Layer)**
```
├── JwtAuthGuard          - JWT token validation
├── RolesGuard            - Role-based access control
├── PermissionsGuard      - Permission-based access control
└── PolicyGuard           - ABAC policy evaluation
```

### **Decorators (Easy Usage)**
```
├── @RequireRoles()       - Role requirements
├── @RequirePermissions() - Permission requirements
├── @RequirePolicies()    - Policy requirements
├── @DomainScope()        - Domain isolation
├── @Resource()           - Resource type specification
└── Specialized decorators (Admin, Manager, CDR, Recording, etc.)
```

## 🚀 Cách sử dụng

### **1. Protect Endpoints với Roles**
```typescript
@Get('admin-data')
@RequireAdmin() // SuperAdmin, DomainAdmin, SystemAdmin
@UseGuards(JwtAuthGuard, RolesGuard)
getAdminData() {
  return { message: 'Admin only data' };
}
```

### **2. Protect Endpoints với Permissions**
```typescript
@Get('users')
@RequireReadAccess('users') // users:read permission
@UseGuards(JwtAuthGuard, PermissionsGuard)
getUsers() {
  return { users: [] };
}
```

### **3. Protect Endpoints với Policies (ABAC)**
```typescript
@Get('sensitive-data')
@RequirePolicies('BusinessHoursOnly', 'OfficeNetworkOnly')
@UseGuards(JwtAuthGuard, PolicyGuard)
getSensitiveData() {
  return { data: 'sensitive' };
}
```

### **4. Domain-Scoped Access**
```typescript
@Get('domain/:domainId/users')
@RequireDomainOwnership() // Own domain only
@UseGuards(JwtAuthGuard, RolesGuard)
getDomainUsers(@Param('domainId') domainId: string) {
  return { users: [] };
}
```

### **5. Comprehensive Protection**
```typescript
@Post('critical-operation')
@RequireRoles('SuperAdmin', 'SystemAdmin')
@RequirePermissions('system:execute')
@RequirePolicies('CriticalOperationApproval', 'MFARequired')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PolicyGuard)
performCriticalOperation() {
  return { status: 'executed' };
}
```

## 🔐 Role Hierarchy

### **Global Roles (Cross-Domain)**
- **SuperAdmin**: Toàn quyền hệ thống, quản lý tất cả domains
- **SystemAdmin**: Quản lý technical infrastructure
- **SecurityAdmin**: Quản lý security policies, audit
- **BillingAdmin**: Quản lý billing, cost management

### **Domain Roles (Per Domain)**
- **DomainAdmin**: Quản lý một domain cụ thể
- **DomainManager**: Quản lý business operations
- **DomainSupervisor**: Giám sát operations, reports

### **Department/Team Roles**
- **DepartmentManager**: Quản lý department
- **TeamLead**: Quản lý team
- **Supervisor**: Giám sát operations

### **Operational Roles**
- **CallCenterManager**: Quản lý call center
- **SeniorAgent**: Agent có kinh nghiệm
- **Agent**: Call center agent
- **Operator**: Tổng đài viên
- **Receptionist**: Lễ tân

### **Technical Roles**
- **TechnicalManager**: Quản lý technical team
- **NetworkAdmin**: Quản lý network, SIP
- **PBXAdmin**: Quản lý FreeSWITCH
- **ReportAnalyst**: Phân tích reports

## 📋 Permission Categories

### **System Management** (system:*)
- system:read, system:create, system:update, system:delete, system:manage

### **Domain Management** (domain:*)
- domain:read, domain:create, domain:update, domain:delete, domain:manage

### **User Management** (users:*)
- users:read, users:create, users:update, users:delete, users:manage

### **Call Management** (calls:*)
- calls:read, calls:create, calls:update, calls:delete, calls:execute

### **CDR Management** (cdr:*)
- cdr:read, cdr:export, cdr:delete, cdr:manage

### **Recording Management** (recordings:*)
- recordings:read, recordings:download, recordings:delete, recordings:manage

### **Billing Management** (billing:*)
- billing:read, billing:create, billing:update, billing:manage

### **Reports & Analytics** (reports:*, analytics:*)
- reports:read, reports:execute, analytics:read, analytics:execute

### **Configuration** (config:*)
- config:read, config:update, config:manage

### **Security** (security:*)
- security:read, security:update, security:manage

### **Monitoring** (monitoring:*)
- monitoring:read, monitoring:execute

## 🏷️ ABAC Attributes

### **User Attributes**
```typescript
{
  domainId: string;
  departmentId: string;
  securityClearance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  workingHours: TimeRange[];
  allowedIpRanges: string[];
  // ... more attributes
}
```

### **Resource Attributes**
```typescript
{
  resourceType: string;
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  sensitivityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ownerId: string;
  domainId: string;
}
```

### **Environment Attributes**
```typescript
{
  clientIp: string;
  isBusinessHours: boolean;
  deviceType: 'DESKTOP' | 'MOBILE' | 'IP_PHONE';
  authenticationMethod: string;
  riskScore: number;
}
```

## 📊 Policy Examples

### **Time-Based Policy**
```typescript
{
  name: "BusinessHoursOnly",
  condition: "environment.isBusinessHours === true",
  effect: "ALLOW",
  resources: ["cdr:*", "recordings:*"]
}
```

### **Location-Based Policy**
```typescript
{
  name: "OfficeNetworkOnly",
  condition: "user.allowedIpRanges.includes(environment.clientIp)",
  effect: "ALLOW",
  resources: ["system:*", "config:*"]
}
```

### **Hierarchical Policy**
```typescript
{
  name: "ManagerCanAccessSubordinates",
  condition: "target.managerId === user.userId || user.roles.includes('DomainAdmin')",
  effect: "ALLOW",
  resources: ["users:read", "cdr:read"]
}
```

### **Security Clearance Policy**
```typescript
{
  name: "HighSecurityDataAccess",
  condition: "user.securityClearance >= resource.sensitivityLevel",
  effect: "ALLOW",
  resources: ["recordings:read", "billing:read"]
}
```

## 🔄 Next Steps

### **Phase 1: Testing & Integration**
1. Tạo unit tests cho tất cả services
2. Integration tests cho guards và decorators
3. End-to-end tests cho authentication flow

### **Phase 2: Database Migration**
1. Tạo migration scripts cho entities
2. Seed data cho default roles và permissions
3. Data migration từ existing user system

### **Phase 3: Frontend Integration**
1. Update frontend để sử dụng new JWT structure
2. Implement role-based UI components
3. Permission-based menu và feature access

### **Phase 4: Production Deployment**
1. Environment configuration
2. Security hardening
3. Performance optimization
4. Monitoring và alerting

## 🛡️ Security Best Practices

1. **Principle of Least Privilege**: Users chỉ có minimum permissions cần thiết
2. **Defense in Depth**: Multiple authorization layers
3. **Audit Everything**: Comprehensive logging cho tất cả authorization decisions
4. **Regular Reviews**: Periodic access reviews và permission audits
5. **Dynamic Policies**: Context-aware access control
6. **Risk-Based Authentication**: Adaptive security dựa trên risk score

## 📚 Documentation References

- [ABAC/RBAC Architecture](./ABAC_RBAC_ARCHITECTURE.md)
- [Protected Endpoints Examples](../nestjs-app/src/auth/examples/protected-endpoints.example.ts)
- [Technical Specifications](./TECHNICAL_SPECS.md)
- [Development Log](./DEVELOPMENT_LOG.md)

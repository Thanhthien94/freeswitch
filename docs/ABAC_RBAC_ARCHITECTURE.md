# ABAC/RBAC Architecture for Enterprise PBX System

## 🏗️ Kiến trúc Tổng quan

### Multi-Domain Hierarchical Access Control
```
SuperAdmin (Global)
├── Domain Admin (Domain Level)
│   ├── Department Manager (Department Level)
│   │   ├── Team Lead (Team Level)
│   │   │   ├── Senior Agent (Individual Level)
│   │   │   └── Agent (Individual Level)
│   │   └── Operator (Individual Level)
│   └── Supervisor (Department Level)
└── System Admin (Global Technical)
```

## 🎭 Role Hierarchy

### 1. Global Roles (Cross-Domain)
- **SuperAdmin**: Quản lý toàn bộ hệ thống, tất cả domains
- **SystemAdmin**: Quản lý technical infrastructure, monitoring
- **SecurityAdmin**: Quản lý security policies, audit logs
- **BillingAdmin**: Quản lý billing, cost management

### 2. Domain Roles (Per Domain)
- **DomainAdmin**: Quản lý một domain cụ thể
- **DomainManager**: Quản lý business operations trong domain
- **DomainSupervisor**: Giám sát operations, reports

### 3. Department Roles (Per Department)
- **DepartmentManager**: Quản lý một department
- **TeamLead**: Quản lý một team trong department
- **Supervisor**: Giám sát team operations

### 4. Operational Roles
- **CallCenterManager**: Quản lý call center operations
- **SeniorAgent**: Agent có kinh nghiệm, training others
- **Agent**: Call center agent cơ bản
- **Operator**: Tổng đài viên
- **Receptionist**: Lễ tân, chuyển cuộc gọi

### 5. Technical Roles
- **TechnicalManager**: Quản lý technical team
- **NetworkAdmin**: Quản lý network, SIP configurations
- **PBXAdmin**: Quản lý FreeSWITCH configurations
- **ReportAnalyst**: Phân tích reports, CDR data

### 6. Basic Roles
- **User**: User cơ bản với quyền hạn tối thiểu
- **Guest**: Temporary access, limited permissions

## 🔑 Permission Matrix

### Resource Categories
1. **System Management** (system:*)
2. **Domain Management** (domain:*)
3. **User Management** (users:*)
4. **Call Management** (calls:*)
5. **Extension Management** (extensions:*)
6. **CDR Management** (cdr:*)
7. **Recording Management** (recordings:*)
8. **Billing Management** (billing:*)
9. **Reports & Analytics** (reports:*, analytics:*)
10. **Configuration Management** (config:*)
11. **Security Management** (security:*)
12. **Monitoring** (monitoring:*)

### Actions
- **read**: View/List resources
- **create**: Create new resources
- **update**: Modify existing resources
- **delete**: Remove resources
- **execute**: Execute operations/commands
- **manage**: Full control (all actions)

### Permission Examples
```
system:manage          // SuperAdmin only
domain:manage          // SuperAdmin, DomainAdmin (own domain)
users:create           // DomainAdmin, DepartmentManager
calls:read             // All roles (filtered by scope)
recordings:delete      // DomainAdmin, CallCenterManager
billing:read           // BillingAdmin, DomainAdmin
reports:execute        // Manager roles and above
config:update          // Technical roles
security:manage        // SecurityAdmin, SuperAdmin
```

## 🏷️ Attribute-Based Access Control (ABAC)

### User Attributes
```typescript
interface UserAttributes {
  // Identity
  userId: string;
  username: string;
  email: string;
  
  // Organizational
  domainId: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  
  // Role & Permissions
  roles: string[];
  permissions: string[];
  
  // Location & Time
  allowedIpRanges: string[];
  timezone: string;
  workingHours: TimeRange[];
  
  // Security
  securityClearance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mfaEnabled: boolean;
  lastPasswordChange: Date;
  
  // Business
  costCenter: string;
  employeeId: string;
  contractType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
}
```

### Resource Attributes
```typescript
interface ResourceAttributes {
  // Identity
  resourceId: string;
  resourceType: string;
  
  // Ownership
  ownerId: string;
  domainId: string;
  departmentId?: string;
  
  // Classification
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  sensitivityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Business
  costCenter: string;
  businessUnit: string;
}
```

### Environment Attributes
```typescript
interface EnvironmentAttributes {
  // Network
  clientIp: string;
  userAgent: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'IP_PHONE';
  
  // Time
  currentTime: Date;
  timezone: string;
  isBusinessHours: boolean;
  
  // Location
  geoLocation?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  
  // Security
  authenticationMethod: 'PASSWORD' | 'MFA' | 'SSO' | 'CERTIFICATE';
  sessionAge: number;
  riskScore: number;
}
```

## 📋 Policy Engine

### Policy Types

#### 1. Time-Based Policies
```typescript
{
  name: "BusinessHoursOnly",
  condition: "environment.isBusinessHours === true",
  effect: "ALLOW",
  resources: ["calls:*", "recordings:*"]
}
```

#### 2. Location-Based Policies
```typescript
{
  name: "OfficeNetworkOnly",
  condition: "user.allowedIpRanges.includes(environment.clientIp)",
  effect: "ALLOW",
  resources: ["system:*", "config:*"]
}
```

#### 3. Hierarchical Policies
```typescript
{
  name: "ManagerCanAccessSubordinates",
  condition: "target.managerId === user.userId || user.roles.includes('DomainAdmin')",
  effect: "ALLOW",
  resources: ["users:read", "cdr:read"]
}
```

#### 4. Data Classification Policies
```typescript
{
  name: "HighSecurityDataAccess",
  condition: "user.securityClearance >= resource.sensitivityLevel",
  effect: "ALLOW",
  resources: ["recordings:read", "cdr:export"]
}
```

#### 5. Domain Isolation Policies
```typescript
{
  name: "DomainIsolation",
  condition: "user.domainId === resource.domainId || user.roles.includes('SuperAdmin')",
  effect: "ALLOW",
  resources: ["*"]
}
```

## 🔄 Authorization Flow

### 1. Authentication
```
User Login → JWT Token → User Attributes Loaded
```

### 2. Authorization Request
```
Request → Extract User/Resource/Environment Attributes → Policy Evaluation
```

### 3. Policy Evaluation Engine
```typescript
interface PolicyEvaluationResult {
  decision: 'ALLOW' | 'DENY' | 'INDETERMINATE';
  reason: string;
  appliedPolicies: string[];
  obligations?: string[];
}
```

### 4. Decision Flow
```
1. Load applicable policies
2. Evaluate each policy condition
3. Combine policy results (Deny-Override)
4. Return final decision
5. Log decision for audit
```

## 🛡️ Security Features

### 1. Principle of Least Privilege
- Users get minimum permissions needed
- Time-limited elevated access
- Regular permission reviews

### 2. Defense in Depth
- Multiple authorization layers
- Resource-level access control
- Field-level data filtering

### 3. Audit & Compliance
- All authorization decisions logged
- Permission change tracking
- Regular access reviews
- Compliance reporting

### 4. Dynamic Permissions
- Context-aware access control
- Risk-based authentication
- Adaptive security policies

## 📊 Implementation Priority

### Phase 1: Core RBAC
1. Role hierarchy implementation
2. Basic permission system
3. Domain isolation

### Phase 2: Enhanced RBAC
1. Department/Team scoping
2. Hierarchical permissions
3. Permission inheritance

### Phase 3: ABAC Foundation
1. Attribute management
2. Basic policy engine
3. Time/Location policies

### Phase 4: Advanced ABAC
1. Complex policy rules
2. Risk-based access
3. Machine learning integration

### Phase 5: Enterprise Features
1. SSO integration
2. Advanced audit
3. Compliance reporting

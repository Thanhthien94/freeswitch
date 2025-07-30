import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, RoleLevel, RoleType } from '../entities/role.entity';
import { Permission, PermissionAction, PermissionCategory } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../../users/user.entity';
import { AuditLog, AuditAction, AuditResult } from '../entities/audit-log.entity';

export interface RoleAssignmentOptions {
  isPrimary?: boolean;
  expiresAt?: Date;
  reason?: string;
  constraints?: Record<string, any>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  appliedRoles: string[];
  appliedPermissions: string[];
}

@Injectable()
export class RBACService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  // ==================== ROLE MANAGEMENT ====================

  async createRole(
    name: string,
    type: RoleType,
    level: RoleLevel,
    domainId?: string,
    description?: string,
    createdBy?: string,
  ): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name, domainId: domainId || null },
    });

    if (existingRole) {
      throw new ConflictException(`Role '${name}' already exists in this domain`);
    }

    const role = this.roleRepository.create({
      name,
      type,
      level,
      domainId,
      description,
      createdBy,
    });

    return this.roleRepository.save(role);
  }

  async assignRole(
    userId: number,
    roleId: string,
    assignedBy: string | number,
    options?: RoleAssignmentOptions,
  ): Promise<UserRole> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check domain compatibility
    if (role.domainId && user.domainId !== role.domainId) {
      throw new ForbiddenException('Cannot assign domain-specific role to user from different domain');
    }

    // Check if assignment already exists
    const existingAssignment = await this.userRoleRepository.findOne({
      where: { userId, roleId, isActive: true },
    });

    if (existingAssignment) {
      throw new ConflictException('User already has this role assigned');
    }

    // If this is a primary role, unset other primary roles
    if (options?.isPrimary) {
      await this.userRoleRepository.update(
        { userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      assignedBy: typeof assignedBy === 'string' ? assignedBy : assignedBy.toString(), // Convert to string
      isPrimary: options?.isPrimary || false,
      expiresAt: options?.expiresAt,
    });

    const savedUserRole = await this.userRoleRepository.save(userRole);

    // Audit log
    await this.createAuditLog(
      userId,
      AuditAction.ROLE_ASSIGNED,
      AuditResult.SUCCESS,
      `Role '${role.name}' assigned to user`,
      { roleId, roleName: role.name, assignedBy }
    );

    return savedUserRole;
  }

  async revokeRole(
    userId: number,
    roleId: string,
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId, isActive: true },
      relations: ['role'],
    });

    if (!userRole) {
      throw new NotFoundException('User role assignment not found');
    }

    userRole.isActive = false;
    await this.userRoleRepository.save(userRole);

    // Audit log
    await this.createAuditLog(
      userId,
      AuditAction.ROLE_REVOKED,
      AuditResult.SUCCESS,
      `Role '${userRole.role.name}' revoked from user`,
      { roleId, roleName: userRole.role.name, revokedBy, reason }
    );
  }

  async getUserRoles(userId: number, includeInactive = false): Promise<UserRole[]> {
    const whereCondition: any = { userId };
    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    return this.userRoleRepository.find({
      where: whereCondition,
      relations: ['role', 'role.permissions'],
      order: { isPrimary: 'DESC', assignedAt: 'DESC' },
    });
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userRoles = await this.getUserRoles(userId);
    const validRoles = userRoles.filter(ur => ur.isValid);
    
    const permissions = new Map<string, Permission>();
    
    for (const userRole of validRoles) {
      if (userRole.role?.permissions) {
        for (const permission of userRole.role.permissions) {
          if (permission.isActive) {
            permissions.set(permission.id, permission);
          }
        }
      }
    }

    return Array.from(permissions.values());
  }

  // ==================== PERMISSION CHECKING ====================

  async hasPermission(
    userId: number,
    resource: string,
    action: PermissionAction,
    context?: Record<string, any>,
  ): Promise<PermissionCheckResult> {
    const userPermissions = await this.getUserPermissions(userId);
    const userRoles = await this.getUserRoles(userId);
    
    const requiredPermission = `${resource}:${action}`;
    const managePermission = `${resource}:manage`;
    
    // Check direct permission
    const hasDirectPermission = userPermissions.some(p => 
      p.fullPermission === requiredPermission || p.fullPermission === managePermission
    );

    if (hasDirectPermission) {
      return {
        allowed: true,
        reason: 'Direct permission granted',
        appliedRoles: userRoles.map(ur => ur.role.name),
        appliedPermissions: [requiredPermission],
      };
    }

    // Check wildcard permissions
    const hasWildcardPermission = userPermissions.some(p => 
      p.resource === '*' || (p.resource === resource && p.action === PermissionAction.MANAGE)
    );

    if (hasWildcardPermission) {
      return {
        allowed: true,
        reason: 'Wildcard permission granted',
        appliedRoles: userRoles.map(ur => ur.role.name),
        appliedPermissions: ['*'],
      };
    }

    return {
      allowed: false,
      reason: 'No matching permissions found',
      appliedRoles: userRoles.map(ur => ur.role.name),
      appliedPermissions: [],
    };
  }

  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(ur => ur.role.name === roleName && ur.isValid);
  }

  async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const userRoleNames = userRoles
      .filter(ur => ur.isValid)
      .map(ur => ur.role.name);
    
    return roleNames.some(roleName => userRoleNames.includes(roleName));
  }

  async isHigherRole(userId: number, targetUserId: number): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const targetUserRoles = await this.getUserRoles(targetUserId);
    
    const userHighestLevel = Math.min(...userRoles.map(ur => ur.role.level));
    const targetHighestLevel = Math.min(...targetUserRoles.map(ur => ur.role.level));
    
    return userHighestLevel < targetHighestLevel;
  }

  // ==================== DOMAIN MANAGEMENT ====================

  async canManageDomain(userId: number, domainId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // SuperAdmin can manage all domains
    if (await this.hasRole(userId, 'SuperAdmin')) {
      return true;
    }

    // Domain admin can manage their own domain
    if (user.domainId === domainId && await this.hasRole(userId, 'DomainAdmin')) {
      return true;
    }

    return false;
  }

  async getUsersInDomain(domainId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { domainId },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  // ==================== UTILITY METHODS ====================

  private async createAuditLog(
    userId: number,
    action: AuditAction,
    result: AuditResult,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      result,
      description,
      metadata,
    });

    await this.auditLogRepository.save(auditLog);
  }

  async getRoleHierarchy(roleId: string): Promise<Role[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['parentRole', 'childRoles'],
    });

    if (!role) return [];

    const hierarchy: Role[] = [role];
    
    // Add parent roles
    let currentRole = role;
    while (currentRole.parentRole) {
      hierarchy.unshift(currentRole.parentRole);
      currentRole = currentRole.parentRole;
    }

    // Add child roles
    const addChildRoles = (parentRole: Role) => {
      if (parentRole.childRoles) {
        for (const childRole of parentRole.childRoles) {
          hierarchy.push(childRole);
          addChildRoles(childRole);
        }
      }
    };
    addChildRoles(role);

    return hierarchy;
  }
}

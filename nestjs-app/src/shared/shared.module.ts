import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Services
import { RBACService } from '../auth/services/rbac.service';
import { ABACService } from '../auth/services/abac.service';

// Guards
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PolicyGuard } from '../auth/guards/policy.guard';

// Entities
import { User } from '../users/user.entity';
import { Domain } from '../auth/entities/domain.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { UserAttribute } from '../auth/entities/user-attribute.entity';
import { Policy } from '../auth/entities/policy.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Domain,
      Role,
      Permission,
      UserRole,
      UserAttribute,
      Policy,
      AuditLog,
    ]),
  ],
  providers: [
    RBACService,
    ABACService,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
  exports: [
    RBACService,
    ABACService,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
})
export class SharedModule {}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyEffect, PolicyStatus } from '../entities/policy.entity';
import { UserAttribute, AttributeCategory } from '../entities/user-attribute.entity';
import { AuditLog, AuditAction, AuditResult, RiskLevel } from '../entities/audit-log.entity';
import { User } from '../../users/user.entity';

export interface PolicyEvaluationContext {
  user: UserAttributes;
  resource: ResourceAttributes;
  environment: EnvironmentAttributes;
  action: string;
}

export interface UserAttributes {
  userId: number;
  username: string;
  email: string;
  domainId: string;
  departmentId?: string;
  teamId?: string;
  managerId?: number;
  roles: string[];
  permissions: string[];
  securityClearance: string;
  workingHours: TimeRange[];
  allowedIpRanges: string[];
  attributes: Record<string, any>;
}

export interface ResourceAttributes {
  resourceId: string;
  resourceType: string;
  ownerId?: string;
  domainId: string;
  departmentId?: string;
  dataClassification: string;
  sensitivityLevel: string;
  attributes: Record<string, any>;
}

export interface EnvironmentAttributes {
  clientIp: string;
  userAgent: string;
  deviceType: string;
  currentTime: Date;
  timezone: string;
  isBusinessHours: boolean;
  geoLocation?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  authenticationMethod: string;
  sessionAge: number;
  riskScore: number;
}

export interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  days: number[]; // 0-6, Sunday = 0
}

export interface PolicyEvaluationResult {
  decision: 'ALLOW' | 'DENY' | 'INDETERMINATE';
  reason: string;
  appliedPolicies: string[];
  obligations: string[];
  riskScore: number;
  evaluationTime: number;
}

@Injectable()
export class ABACService {
  private readonly logger = new Logger(ABACService.name);

  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(UserAttribute)
    private readonly userAttributeRepository: Repository<UserAttribute>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ==================== POLICY EVALUATION ====================

  async evaluateAccess(
    context: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Get applicable policies
      const policies = await this.getApplicablePolicies(
        context.resource.resourceType,
        context.action,
        context.user.domainId,
      );

      if (policies.length === 0) {
        return {
          decision: 'INDETERMINATE',
          reason: 'No applicable policies found',
          appliedPolicies: [],
          obligations: [],
          riskScore: 50,
          evaluationTime: Date.now() - startTime,
        };
      }

      // Evaluate each policy
      const policyResults: Array<{
        policy: Policy;
        result: boolean;
        reason: string;
      }> = [];

      for (const policy of policies) {
        try {
          const result = await this.evaluatePolicy(policy, context);
          policyResults.push({
            policy,
            result,
            reason: result ? 'Policy condition satisfied' : 'Policy condition not met',
          });

          // Update policy statistics
          policy.incrementEvaluationCount();
          if (result) {
            policy.incrementSuccessCount();
          } else {
            policy.incrementFailureCount();
          }
        } catch (error) {
          this.logger.error(`Error evaluating policy ${policy.name}:`, error);
          policyResults.push({
            policy,
            result: false,
            reason: `Policy evaluation error: ${error.message}`,
          });
          policy.incrementFailureCount();
        }
      }

      // Save policy statistics
      await this.policyRepository.save(policies);

      // Apply policy combination algorithm (Deny-Override)
      const finalDecision = this.combinePolicyResults(policyResults);
      const evaluationTime = Date.now() - startTime;

      // Calculate risk score
      const riskScore = this.calculateRiskScore(context, finalDecision);

      // Create audit log
      await this.createPolicyAuditLog(context, finalDecision, policyResults, evaluationTime);

      return {
        decision: finalDecision.decision,
        reason: finalDecision.reason,
        appliedPolicies: policyResults.map(pr => pr.policy.name),
        obligations: finalDecision.obligations,
        riskScore,
        evaluationTime,
      };

    } catch (error) {
      this.logger.error('Error in policy evaluation:', error);
      return {
        decision: 'DENY',
        reason: `Policy evaluation failed: ${error.message}`,
        appliedPolicies: [],
        obligations: [],
        riskScore: 100,
        evaluationTime: Date.now() - startTime,
      };
    }
  }

  private async evaluatePolicy(
    policy: Policy,
    context: PolicyEvaluationContext,
  ): Promise<boolean> {
    // Check if policy is effective
    if (!policy.isEffective) {
      return false;
    }

    // Evaluate policy condition using a simple expression evaluator
    return this.evaluateCondition(policy.condition, context);
  }

  private evaluateCondition(
    condition: string,
    context: PolicyEvaluationContext,
  ): boolean {
    try {
      // Create evaluation context
      const evalContext = {
        user: context.user,
        resource: context.resource,
        environment: context.environment,
        action: context.action,
        // Helper functions
        includes: (array: any[], item: any) => array.includes(item),
        startsWith: (str: string, prefix: string) => str.startsWith(prefix),
        endsWith: (str: string, suffix: string) => str.endsWith(suffix),
        matches: (str: string, pattern: string) => new RegExp(pattern).test(str),
        isInTimeRange: (time: Date, ranges: TimeRange[]) => this.isInTimeRange(time, ranges),
        isInIpRange: (ip: string, ranges: string[]) => this.isInIpRange(ip, ranges),
        hasAttribute: (obj: any, key: string) => obj.attributes && obj.attributes[key] !== undefined,
        getAttribute: (obj: any, key: string) => obj.attributes ? obj.attributes[key] : undefined,
      };

      // Simple condition evaluation (in production, use a proper expression engine)
      return this.safeEvaluate(condition, evalContext);
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  }

  private safeEvaluate(condition: string, context: any): boolean {
    // This is a simplified evaluator. In production, use a proper expression engine
    // like JSONata, JMESPath, or a custom parser for security
    
    // Replace context variables
    let evaluableCondition = condition;
    
    // Simple replacements for common patterns
    evaluableCondition = evaluableCondition.replace(/user\.roles\.includes\('([^']+)'\)/g, 
      (match, role) => context.user.roles.includes(role).toString());
    
    evaluableCondition = evaluableCondition.replace(/user\.domainId === resource\.domainId/g,
      (context.user.domainId === context.resource.domainId).toString());
    
    evaluableCondition = evaluableCondition.replace(/environment\.isBusinessHours/g,
      context.environment.isBusinessHours.toString());
    
    // More sophisticated evaluation would be needed for production
    // For now, return a simple boolean evaluation
    try {
      return Function('"use strict"; return (' + evaluableCondition + ')')();
    } catch {
      return false;
    }
  }

  private combinePolicyResults(
    results: Array<{ policy: Policy; result: boolean; reason: string }>,
  ): { decision: 'ALLOW' | 'DENY'; reason: string; obligations: string[] } {
    // Deny-Override algorithm
    const denyResults = results.filter(r => !r.result && r.policy.effect === PolicyEffect.DENY);
    if (denyResults.length > 0) {
      return {
        decision: 'DENY',
        reason: `Access denied by policy: ${denyResults[0].policy.name}`,
        obligations: [],
      };
    }

    const allowResults = results.filter(r => r.result && r.policy.effect === PolicyEffect.ALLOW);
    if (allowResults.length > 0) {
      return {
        decision: 'ALLOW',
        reason: `Access granted by policy: ${allowResults[0].policy.name}`,
        obligations: allowResults.flatMap(r => Object.keys(r.policy.obligations || {})),
      };
    }

    return {
      decision: 'DENY',
      reason: 'No applicable allow policies found',
      obligations: [],
    };
  }

  // ==================== ATTRIBUTE MANAGEMENT ====================

  async getUserAttributes(userId: number): Promise<UserAttributes> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role', 'domain'],
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const attributes = await this.userAttributeRepository.find({
      where: { userId, isActive: true },
    });

    const attributeMap: Record<string, any> = {};
    for (const attr of attributes) {
      if (attr.isEffective) {
        attributeMap[attr.attributeName] = attr.getValue();
      }
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      domainId: user.domainId,
      departmentId: user.departmentId,
      teamId: user.teamId,
      managerId: user.managerId,
      roles: user.getActiveRoles().map(ur => ur.role.name),
      permissions: [], // Would be populated from RBAC service
      securityClearance: attributeMap.securityClearance || 'LOW',
      workingHours: attributeMap.workingHours || [],
      allowedIpRanges: attributeMap.allowedIpRanges || [],
      attributes: attributeMap,
    };
  }

  async setUserAttribute(
    userId: number,
    attributeName: string,
    value: any,
    category: AttributeCategory = AttributeCategory.CUSTOM,
    setBy?: string,
  ): Promise<void> {
    const existingAttribute = await this.userAttributeRepository.findOne({
      where: { userId, attributeName },
    });

    if (existingAttribute) {
      existingAttribute.setValue(value);
      existingAttribute.updatedBy = setBy;
      await this.userAttributeRepository.save(existingAttribute);
    } else {
      const newAttribute = UserAttribute.createAttribute(
        userId,
        attributeName,
        value,
        this.inferAttributeType(value),
        category,
      );
      newAttribute.createdBy = setBy;
      await this.userAttributeRepository.save(newAttribute);
    }
  }

  // ==================== UTILITY METHODS ====================

  private async getApplicablePolicies(
    resourceType: string,
    action: string,
    domainId?: string,
  ): Promise<Policy[]> {
    const policies = await this.policyRepository.find({
      where: {
        status: PolicyStatus.ACTIVE,
      },
    });

    return policies.filter(policy => {
      // Check domain scope
      if (policy.domainId && policy.domainId !== domainId) {
        return false;
      }

      // Check if policy applies to this resource and action
      return policy.appliesTo(resourceType, action);
    });
  }

  private isInTimeRange(time: Date, ranges: TimeRange[]): boolean {
    const dayOfWeek = time.getDay();
    const timeStr = time.toTimeString().substring(0, 5); // HH:mm

    return ranges.some(range => {
      return range.days.includes(dayOfWeek) &&
             timeStr >= range.start &&
             timeStr <= range.end;
    });
  }

  private isInIpRange(ip: string, ranges: string[]): boolean {
    // Simplified IP range checking - in production, use proper CIDR matching
    return ranges.some(range => {
      if (range.includes('/')) {
        // CIDR notation - would need proper implementation
        return ip.startsWith(range.split('/')[0].substring(0, range.split('/')[0].lastIndexOf('.')));
      } else {
        return ip === range;
      }
    });
  }

  private calculateRiskScore(
    context: PolicyEvaluationContext,
    decision: { decision: 'ALLOW' | 'DENY' }
  ): number {
    let riskScore = context.environment.riskScore || 0;

    // Increase risk for denied access
    if (decision.decision === 'DENY') {
      riskScore += 20;
    }

    // Increase risk for high-sensitivity resources
    if (context.resource.sensitivityLevel === 'HIGH' || context.resource.sensitivityLevel === 'CRITICAL') {
      riskScore += 15;
    }

    // Increase risk for non-business hours access
    if (!context.environment.isBusinessHours) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  private inferAttributeType(value: any): any {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  private async createPolicyAuditLog(
    context: PolicyEvaluationContext,
    decision: { decision: 'ALLOW' | 'DENY'; reason: string },
    policyResults: Array<{ policy: Policy; result: boolean }>,
    evaluationTime: number,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId: context.user.userId,
      action: AuditAction.POLICY_EVALUATED,
      result: decision.decision === 'ALLOW' ? AuditResult.SUCCESS : AuditResult.FAILURE,
      description: decision.reason,
      resourceType: context.resource.resourceType,
      resourceId: context.resource.resourceId,
      domainId: context.user.domainId,
      clientIp: context.environment.clientIp,
      userAgent: context.environment.userAgent,
      policiesEvaluated: policyResults.map(pr => pr.policy.name),
      durationMs: evaluationTime,
      metadata: {
        action: context.action,
        decision: decision.decision,
        evaluatedPolicies: policyResults.length,
      },
    });

    await this.auditLogRepository.save(auditLog);
  }
}

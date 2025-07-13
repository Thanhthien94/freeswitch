import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ABACService, PolicyEvaluationContext } from '../services/abac.service';
import { POLICIES_KEY, RESOURCE_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(
    private reflector: Reflector,
    private abacService: ABACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPolicies = this.reflector.getAllAndOverride<string[]>(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPolicies || requiredPolicies.length === 0) {
      return true; // No policies required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Build evaluation context
      const evaluationContext = await this.buildEvaluationContext(request, user);

      // Evaluate access using ABAC
      const result = await this.abacService.evaluateAccess(evaluationContext);

      if (result.decision !== 'ALLOW') {
        this.logger.warn(
          `Policy evaluation denied access for user ${user.id}: ${result.reason}`
        );
        throw new ForbiddenException(`Access denied: ${result.reason}`);
      }

      // Log successful policy evaluation
      this.logger.debug(
        `Policy evaluation granted access for user ${user.id}. ` +
        `Applied policies: ${result.appliedPolicies.join(', ')}`
      );

      // Store evaluation result in request for potential use by controllers
      request.policyEvaluation = result;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Error in policy guard:', error);
      throw new ForbiddenException('Policy evaluation failed');
    }
  }

  private async buildEvaluationContext(
    request: any,
    user: any,
  ): Promise<PolicyEvaluationContext> {
    // Get user attributes from ABAC service
    const userAttributes = await this.abacService.getUserAttributes(user.id);

    // Extract resource information
    const resourceType = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      request.route?.handler,
    ]) || this.extractResourceType(request);

    const resourceId = this.extractResourceId(request);

    // Build resource attributes
    const resourceAttributes = {
      resourceId: resourceId || 'unknown',
      resourceType,
      ownerId: this.extractOwnerId(request),
      domainId: user.domainId || userAttributes.domainId,
      departmentId: this.extractDepartmentId(request),
      dataClassification: this.inferDataClassification(resourceType),
      sensitivityLevel: this.inferSensitivityLevel(resourceType),
      attributes: this.extractResourceAttributes(request),
    };

    // Build environment attributes
    const environmentAttributes = {
      clientIp: this.getClientIp(request),
      userAgent: request.headers['user-agent'] || 'unknown',
      deviceType: this.inferDeviceType(request.headers['user-agent']),
      currentTime: new Date(),
      timezone: this.extractTimezone(request),
      isBusinessHours: this.isBusinessHours(new Date()),
      geoLocation: await this.getGeoLocation(this.getClientIp(request)),
      authenticationMethod: this.extractAuthMethod(request),
      sessionAge: this.calculateSessionAge(request),
      riskScore: this.calculateRiskScore(request, userAttributes),
    };

    return {
      user: userAttributes,
      resource: resourceAttributes,
      environment: environmentAttributes,
      action: this.extractAction(request),
    };
  }

  private extractResourceType(request: any): string {
    const path = request.route?.path || request.url;
    
    if (path.includes('/users')) return 'users';
    if (path.includes('/calls')) return 'calls';
    if (path.includes('/cdr')) return 'cdr';
    if (path.includes('/recordings')) return 'recordings';
    if (path.includes('/extensions')) return 'extensions';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/billing')) return 'billing';
    if (path.includes('/config')) return 'config';
    if (path.includes('/system')) return 'system';
    if (path.includes('/security')) return 'security';
    if (path.includes('/monitoring')) return 'monitoring';
    
    return 'unknown';
  }

  private extractResourceId(request: any): string | null {
    return (
      request.params?.id ||
      request.params?.userId ||
      request.params?.callId ||
      request.params?.recordingId ||
      request.body?.id ||
      null
    );
  }

  private extractOwnerId(request: any): string | null {
    return (
      request.params?.ownerId ||
      request.body?.ownerId ||
      request.query?.ownerId ||
      null
    );
  }

  private extractDepartmentId(request: any): string | null {
    return (
      request.params?.departmentId ||
      request.body?.departmentId ||
      request.query?.departmentId ||
      null
    );
  }

  private extractAction(request: any): string {
    const method = request.method.toLowerCase();
    
    switch (method) {
      case 'get': return 'read';
      case 'post': return 'create';
      case 'put':
      case 'patch': return 'update';
      case 'delete': return 'delete';
      default: return 'execute';
    }
  }

  private inferDataClassification(resourceType: string): string {
    switch (resourceType) {
      case 'recordings':
      case 'cdr':
        return 'CONFIDENTIAL';
      case 'billing':
      case 'security':
        return 'RESTRICTED';
      case 'users':
      case 'calls':
        return 'INTERNAL';
      default:
        return 'PUBLIC';
    }
  }

  private inferSensitivityLevel(resourceType: string): string {
    switch (resourceType) {
      case 'recordings':
      case 'billing':
      case 'security':
        return 'HIGH';
      case 'cdr':
      case 'users':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  private extractResourceAttributes(request: any): Record<string, any> {
    return {
      method: request.method,
      path: request.route?.path || request.url,
      params: request.params,
      query: request.query,
    };
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private inferDeviceType(userAgent: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    if (ua.includes('sip') || ua.includes('phone')) {
      return 'ip_phone';
    }
    return 'desktop';
  }

  private extractTimezone(request: any): string {
    return request.headers['x-timezone'] || 'UTC';
  }

  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Monday to Friday, 9 AM to 6 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  private async getGeoLocation(ip: string): Promise<any> {
    // In production, integrate with a GeoIP service
    return null;
  }

  private extractAuthMethod(request: any): string {
    if (request.headers.authorization?.startsWith('Bearer')) {
      return 'JWT';
    }
    return 'unknown';
  }

  private calculateSessionAge(request: any): number {
    // Extract session start time from JWT or session
    // For now, return 0
    return 0;
  }

  private calculateRiskScore(request: any, userAttributes: any): number {
    let riskScore = 0;
    
    // Increase risk for non-business hours
    if (!this.isBusinessHours(new Date())) {
      riskScore += 20;
    }
    
    // Increase risk for mobile devices
    const deviceType = this.inferDeviceType(request.headers['user-agent']);
    if (deviceType === 'mobile') {
      riskScore += 10;
    }
    
    // Increase risk for external IPs (simplified check)
    const clientIp = this.getClientIp(request);
    if (!clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      riskScore += 15;
    }
    
    return Math.min(riskScore, 100);
  }
}

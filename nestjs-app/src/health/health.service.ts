import { Injectable, Logger } from '@nestjs/common';
import { EslService } from '../esl/esl.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly eslService: EslService) {}

  async getHealthStatus() {
    const startTime = Date.now();
    
    try {
      const eslConnected = await this.eslService.isConnected();
      const responseTime = Date.now() - startTime;

      return {
        status: eslConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          freeswitch: eslConnected ? 'up' : 'down'
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async getDetailedHealthStatus() {
    const startTime = Date.now();
    
    try {
      const eslConnected = await this.eslService.isConnected();
      const eslStatus = this.eslService.getConnectionStatus();

      // Debug: ESL Connection check
      // this.logger.log('ESL Connection check:', { eslConnected, eslStatus });

      let freeswitchStatus = null;
      if (eslConnected) {
        try {
          freeswitchStatus = await this.eslService.getStatus();
        } catch (error) {
          this.logger.warn('Failed to get FreeSWITCH status:', error);
        }
      }

      const activeCalls = eslConnected ? await this.getActiveCallsCount() : 0;

      return {
        status: eslConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        services: {
          freeswitch: {
            status: eslConnected ? 'up' : 'down',
            connection: eslStatus,
            activeCalls,
            details: freeswitchStatus
          },
          database: {
            status: 'up' // TODO: Add database health check
          },
          redis: {
            status: 'up' // TODO: Add Redis health check
          }
        }
      };
    } catch (error) {
      this.logger.error('Detailed health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async getFreeswitchHealth() {
    try {
      const eslConnected = await this.eslService.isConnected();
      
      if (!eslConnected) {
        return {
          status: 'down',
          message: 'ESL connection not available',
          timestamp: new Date().toISOString()
        };
      }

      const status = await this.eslService.getStatus();
      const activeCalls = await this.getActiveCallsCount();
      const eslStatus = this.eslService.getConnectionStatus();

      return {
        status: 'up',
        timestamp: new Date().toISOString(),
        activeCalls,
        connection: eslStatus,
        details: status
      };
    } catch (error) {
      this.logger.error('FreeSWITCH health check failed:', error);
      return {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getActiveCallsCount(): Promise<number> {
    try {
      const calls = await this.eslService.getActiveCalls();
      return Array.isArray(calls) ? calls.length : 0;
    } catch (error) {
      this.logger.warn('Failed to get active calls count:', error);
      return 0;
    }
  }
}

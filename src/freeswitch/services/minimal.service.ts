import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MinimalFreeSwitchService {
  private readonly logger = new Logger(MinimalFreeSwitchService.name);

  async getStatus(): Promise<{ status: string; message: string }> {
    this.logger.log('Getting FreeSWITCH status');
    return {
      status: 'ok',
      message: 'FreeSWITCH service is running'
    };
  }

  async getProfiles(): Promise<any[]> {
    this.logger.log('Getting SIP profiles');
    return [
      {
        id: '1',
        name: 'internal',
        type: 'internal',
        bindPort: 5060,
        isActive: true,
        isDefault: true
      },
      {
        id: '2', 
        name: 'external',
        type: 'external',
        bindPort: 5080,
        isActive: true,
        isDefault: false
      }
    ];
  }

  async getGateways(): Promise<any[]> {
    this.logger.log('Getting gateways');
    return [
      {
        id: '1',
        name: 'trunk_provider_1',
        displayName: 'Main SIP Trunk',
        gatewayHost: 'sip.provider.com',
        gatewayPort: 5060,
        isActive: true,
        status: 'registered'
      }
    ];
  }

  async getExtensions(): Promise<any[]> {
    this.logger.log('Getting extensions');
    return [
      {
        id: '1',
        extensionNumber: '1001',
        displayName: 'John Doe',
        isActive: true
      },
      {
        id: '2',
        extensionNumber: '1002', 
        displayName: 'Jane Smith',
        isActive: true
      }
    ];
  }

  async getDialplans(): Promise<any[]> {
    this.logger.log('Getting dialplans');
    return [
      {
        id: '1',
        name: 'local_extension',
        displayName: 'Local Extension Routing',
        context: 'default',
        isActive: true,
        isTemplate: false
      }
    ];
  }

  async getDomains(): Promise<any[]> {
    this.logger.log('Getting domains');
    return [
      {
        id: '1',
        name: 'company.local',
        displayName: 'Main Company Domain',
        isActive: true,
        maxUsers: 100,
        currentUsers: 45
      }
    ];
  }
}

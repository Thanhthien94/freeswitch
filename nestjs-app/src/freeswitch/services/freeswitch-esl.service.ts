import { Injectable, Logger } from '@nestjs/common';
import { EslService } from '../../esl/esl.service';

export interface FreeSwitchStatus {
  uptime: string;
  sessionCount: number;
  sessionPerSecond: number;
  maxSessions: number;
  version: string;
  ready: boolean;
}

export interface ReloadResult {
  success: boolean;
  message: string;
  details?: any;
}

@Injectable()
export class FreeSwitchEslService {
  private readonly logger = new Logger(FreeSwitchEslService.name);

  constructor(
    private readonly eslService: EslService,
  ) {}

  async getSystemStatus(): Promise<FreeSwitchStatus> {
    try {
      this.logger.debug('Getting FreeSWITCH system status');
      
      const statusCommand = 'status';
      const result = await this.eslService.executeCommand(statusCommand);
      
      // Parse status result
      const lines = result.split('\n');
      const status: Partial<FreeSwitchStatus> = {
        ready: true,
      };

      for (const line of lines) {
        if (line.includes('UP')) {
          const uptimeMatch = line.match(/UP (\d+) years?, (\d+) days?, (\d+) hours?, (\d+) minutes?, (\d+) seconds?/);
          if (uptimeMatch) {
            status.uptime = `${uptimeMatch[1]}y ${uptimeMatch[2]}d ${uptimeMatch[3]}h ${uptimeMatch[4]}m ${uptimeMatch[5]}s`;
          }
        }
        
        if (line.includes('session(s) since startup')) {
          const sessionMatch = line.match(/(\d+) session\(s\) since startup/);
          if (sessionMatch) {
            status.sessionCount = parseInt(sessionMatch[1]);
          }
        }
        
        if (line.includes('session(s) - peak')) {
          const peakMatch = line.match(/(\d+) session\(s\) - peak (\d+)/);
          if (peakMatch) {
            status.maxSessions = parseInt(peakMatch[2]);
          }
        }
        
        if (line.includes('session(s) per Sec out of max')) {
          const spsMatch = line.match(/(\d+) session\(s\) per Sec/);
          if (spsMatch) {
            status.sessionPerSecond = parseInt(spsMatch[1]);
          }
        }
        
        if (line.includes('FreeSWITCH')) {
          const versionMatch = line.match(/FreeSWITCH \(Version ([^)]+)\)/);
          if (versionMatch) {
            status.version = versionMatch[1];
          }
        }
      }

      return status as FreeSwitchStatus;
    } catch (error) {
      this.logger.error(`Failed to get system status: ${error.message}`);
      return {
        uptime: 'Unknown',
        sessionCount: 0,
        sessionPerSecond: 0,
        maxSessions: 0,
        version: 'Unknown',
        ready: false,
      };
    }
  }

  async reloadXmlConfig(): Promise<ReloadResult> {
    try {
      this.logger.log('Reloading XML configuration');
      
      const result = await this.eslService.executeCommand('reloadxml');
      
      return {
        success: true,
        message: 'XML configuration reloaded successfully',
        details: { result },
      };
    } catch (error) {
      this.logger.error(`Failed to reload XML config: ${error.message}`);
      return {
        success: false,
        message: `Failed to reload XML configuration: ${error.message}`,
      };
    }
  }

  async reloadSipProfile(profileName: string): Promise<ReloadResult> {
    try {
      this.logger.log(`Reloading SIP profile: ${profileName}`);
      
      const result = await this.eslService.executeCommand(`sofia profile ${profileName} restart`);
      
      return {
        success: true,
        message: `SIP profile '${profileName}' reloaded successfully`,
        details: { result },
      };
    } catch (error) {
      this.logger.error(`Failed to reload SIP profile ${profileName}: ${error.message}`);
      return {
        success: false,
        message: `Failed to reload SIP profile '${profileName}': ${error.message}`,
      };
    }
  }

  async reloadDialplan(): Promise<ReloadResult> {
    try {
      this.logger.log('Reloading dialplan');
      
      const result = await this.eslService.executeCommand('reloadxml');
      
      return {
        success: true,
        message: 'Dialplan reloaded successfully',
        details: { result },
      };
    } catch (error) {
      this.logger.error(`Failed to reload dialplan: ${error.message}`);
      return {
        success: false,
        message: `Failed to reload dialplan: ${error.message}`,
      };
    }
  }

  async getSipProfileStatus(profileName: string): Promise<{
    success: boolean;
    status?: string;
    registrations?: number;
    message?: string;
  }> {
    try {
      this.logger.debug(`Getting SIP profile status: ${profileName}`);
      
      const result = await this.eslService.executeCommand(`sofia status profile ${profileName}`);
      
      // Parse profile status
      const lines = result.split('\n');
      let registrations = 0;
      let status = 'unknown';
      
      for (const line of lines) {
        if (line.includes('Registrations:')) {
          const regMatch = line.match(/Registrations:\s*(\d+)/);
          if (regMatch) {
            registrations = parseInt(regMatch[1]);
          }
        }
        
        if (line.includes('RUNNING')) {
          status = 'running';
        } else if (line.includes('STOPPED')) {
          status = 'stopped';
        }
      }
      
      return {
        success: true,
        status,
        registrations,
      };
    } catch (error) {
      this.logger.error(`Failed to get SIP profile status: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getGatewayStatus(gatewayName: string): Promise<{
    success: boolean;
    status?: string;
    state?: string;
    message?: string;
  }> {
    try {
      this.logger.debug(`Getting gateway status: ${gatewayName}`);
      
      const result = await this.eslService.executeCommand(`sofia status gateway ${gatewayName}`);
      
      // Parse gateway status
      let status = 'unknown';
      let state = 'unknown';
      
      if (result.includes('REGED')) {
        status = 'registered';
        state = 'up';
      } else if (result.includes('UNREGED')) {
        status = 'unregistered';
        state = 'down';
      } else if (result.includes('TRYING')) {
        status = 'trying';
        state = 'connecting';
      }
      
      return {
        success: true,
        status,
        state,
      };
    } catch (error) {
      this.logger.error(`Failed to get gateway status: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async executeCommand(command: string): Promise<string> {
    try {
      this.logger.debug(`Executing FreeSWITCH command: ${command}`);
      return await this.eslService.executeCommand(command);
    } catch (error) {
      this.logger.error(`Failed to execute command '${command}': ${error.message}`);
      throw error;
    }
  }

  async killCall(callUuid: string): Promise<ReloadResult> {
    try {
      this.logger.log(`Killing call: ${callUuid}`);
      
      const result = await this.eslService.executeCommand(`uuid_kill ${callUuid}`);
      
      return {
        success: true,
        message: `Call ${callUuid} terminated successfully`,
        details: { result },
      };
    } catch (error) {
      this.logger.error(`Failed to kill call ${callUuid}: ${error.message}`);
      return {
        success: false,
        message: `Failed to terminate call: ${error.message}`,
      };
    }
  }

  async getActiveCalls(): Promise<{
    success: boolean;
    calls?: Array<{
      uuid: string;
      direction: string;
      callerNumber: string;
      calleeNumber: string;
      duration: number;
    }>;
    count?: number;
    message?: string;
  }> {
    try {
      this.logger.debug('Getting active calls');
      
      const result = await this.eslService.executeCommand('show calls as json');
      
      try {
        const callsData = JSON.parse(result);
        const calls = callsData.rows?.map((row: any) => ({
          uuid: row.uuid,
          direction: row.direction,
          callerNumber: row.cid_num,
          calleeNumber: row.dest,
          duration: parseInt(row.duration) || 0,
        })) || [];
        
        return {
          success: true,
          calls,
          count: calls.length,
        };
      } catch (parseError) {
        // Fallback to text parsing if JSON fails
        const lines = result.split('\n');
        const calls = lines
          .filter(line => line.includes('uuid:'))
          .map(line => {
            const uuidMatch = line.match(/uuid:\s*([a-f0-9-]+)/);
            return {
              uuid: uuidMatch ? uuidMatch[1] : 'unknown',
              direction: 'unknown',
              callerNumber: 'unknown',
              calleeNumber: 'unknown',
              duration: 0,
            };
          });
        
        return {
          success: true,
          calls,
          count: calls.length,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get active calls: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const status = await this.getSystemStatus();
      return status.ready;
    } catch (error) {
      return false;
    }
  }
}

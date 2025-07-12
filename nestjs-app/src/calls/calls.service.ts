import { Injectable, Logger } from '@nestjs/common';
import { EslService } from '../esl/esl.service';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(private readonly eslService: EslService) {}

  async getActiveCalls() {
    try {
      const calls = await this.eslService.getActiveCalls();
      return {
        data: calls,
        total: Array.isArray(calls) ? calls.length : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get active calls:', error);
      throw error;
    }
  }

  async originate(originateDto: any) {
    try {
      const { destination, context = 'default', timeout = 30 } = originateDto;
      
      if (!destination) {
        throw new Error('Destination is required');
      }

      const result = await this.eslService.originate(destination, context, timeout);
      
      this.logger.log(`Call originated: ${result.uuid} to ${destination}`);
      
      return {
        success: true,
        uuid: result.uuid,
        jobUuid: result.jobUuid,
        destination,
        context,
        timeout,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to originate call:', error);
      throw error;
    }
  }

  async hangup(uuid: string, cause: string = 'NORMAL_CLEARING') {
    try {
      await this.eslService.hangup(uuid, cause);
      
      this.logger.log(`Call hung up: ${uuid} with cause ${cause}`);
      
      return {
        success: true,
        uuid,
        cause,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to hangup call ${uuid}:`, error);
      throw error;
    }
  }

  async transfer(uuid: string, transferDto: any) {
    try {
      const { destination, context = 'default' } = transferDto;
      
      if (!destination) {
        throw new Error('Destination is required');
      }

      await this.eslService.transfer(uuid, destination, context);
      
      this.logger.log(`Call transferred: ${uuid} to ${destination}`);
      
      return {
        success: true,
        uuid,
        destination,
        context,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to transfer call ${uuid}:`, error);
      throw error;
    }
  }

  async getCallInfo(uuid: string) {
    try {
      const info = await this.eslService.getChannelInfo(uuid);
      
      return {
        uuid,
        info,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get call info for ${uuid}:`, error);
      throw error;
    }
  }
}

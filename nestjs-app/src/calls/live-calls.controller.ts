import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Body, 
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LiveCallsService, CallControlAction } from './live-calls.service';
import { HybridAuthGuard } from '../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Live Calls')
@ApiBearerAuth()
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('calls/live')
export class LiveCallsController {
  constructor(private readonly liveCallsService: LiveCallsService) {}

  @Get()
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Get all active calls with enhanced information' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of active calls with statistics',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              uuid: { type: 'string' },
              direction: { type: 'string', enum: ['inbound', 'outbound'] },
              callerNumber: { type: 'string' },
              callerName: { type: 'string' },
              calleeNumber: { type: 'string' },
              calleeName: { type: 'string' },
              status: { type: 'string', enum: ['ringing', 'answered', 'bridged', 'hold', 'transferring'] },
              startTime: { type: 'string', format: 'date-time' },
              answerTime: { type: 'string', format: 'date-time' },
              duration: { type: 'number' },
              recording: { type: 'boolean' },
              domain: { type: 'string' },
              context: { type: 'string' },
              sipProfile: { type: 'string' },
              codec: { type: 'string' },
            }
          }
        },
        stats: {
          type: 'object',
          properties: {
            totalActiveCalls: { type: 'number' },
            inboundCalls: { type: 'number' },
            outboundCalls: { type: 'number' },
            answeredCalls: { type: 'number' },
            ringingCalls: { type: 'number' },
            bridgedCalls: { type: 'number' },
            holdCalls: { type: 'number' },
            averageDuration: { type: 'number' },
            longestCall: { type: 'number' },
            shortestCall: { type: 'number' },
            callsPerMinute: { type: 'number' },
            answerRate: { type: 'number' },
          }
        },
        timestamp: { type: 'string' },
      }
    }
  })
  async getActiveCalls() {
    return this.liveCallsService.getActiveCalls();
  }

  @Get('stats')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Get live calls statistics' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Current live calls statistics' 
  })
  async getStats() {
    const stats = this.liveCallsService.getStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats/history')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get live calls statistics history' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Historical live calls statistics for analytics' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Limit number of history entries (default: 100)' 
  })
  async getStatsHistory(@Query('limit') limit?: number) {
    const history = this.liveCallsService.getStatsHistory();
    const limitedHistory = limit ? history.slice(-limit) : history;
    
    return {
      success: true,
      data: limitedHistory,
      total: history.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':callId')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Get specific call information' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detailed call information' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Call not found' 
  })
  async getCallInfo(@Param('callId') callId: string) {
    return this.liveCallsService.getCallInfo(callId);
  }

  @Post(':callId/control')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Execute call control action' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call control action executed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid action or parameters' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Call not found' 
  })
  async executeCallControl(
    @Param('callId') callId: string,
    @Body() actionDto: {
      action: 'hangup' | 'transfer' | 'hold' | 'unhold' | 'park' | 'record' | 'stop_record';
      destination?: string;
      context?: string;
      cause?: string;
      metadata?: Record<string, any>;
    }
  ) {
    const action: CallControlAction = {
      ...actionDto,
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/hangup')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Hangup a call' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call hung up successfully' 
  })
  async hangupCall(
    @Param('callId') callId: string,
    @Body() hangupDto?: { cause?: string }
  ) {
    const action: CallControlAction = {
      action: 'hangup',
      callId,
      cause: hangupDto?.cause || 'NORMAL_CLEARING',
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/transfer')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Transfer a call' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call transferred successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Destination is required' 
  })
  async transferCall(
    @Param('callId') callId: string,
    @Body() transferDto: { 
      destination: string; 
      context?: string 
    }
  ) {
    const action: CallControlAction = {
      action: 'transfer',
      callId,
      destination: transferDto.destination,
      context: transferDto.context || 'default',
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/hold')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Put call on hold' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call put on hold successfully' 
  })
  async holdCall(@Param('callId') callId: string) {
    const action: CallControlAction = {
      action: 'hold',
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/unhold')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Remove call from hold' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call removed from hold successfully' 
  })
  async unholdCall(@Param('callId') callId: string) {
    const action: CallControlAction = {
      action: 'unhold',
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/park')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Park a call' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call parked successfully' 
  })
  async parkCall(@Param('callId') callId: string) {
    const action: CallControlAction = {
      action: 'park',
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/record')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Start recording a call' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call recording started successfully' 
  })
  async startRecording(@Param('callId') callId: string) {
    const action: CallControlAction = {
      action: 'record',
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }

  @Post(':callId/stop-record')
  @Roles('superadmin', 'admin', 'operator')
  @ApiOperation({ summary: 'Stop recording a call' })
  @ApiParam({ name: 'callId', description: 'Call UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Call recording stopped successfully' 
  })
  async stopRecording(@Param('callId') callId: string) {
    const action: CallControlAction = {
      action: 'stop_record',
      callId,
    };

    return this.liveCallsService.executeCallControl(action);
  }
}

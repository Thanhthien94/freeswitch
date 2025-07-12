import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CallsService } from './calls.service';

@ApiTags('Calls')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active calls' })
  @ApiResponse({ status: 200, description: 'List of active calls' })
  async getActiveCalls() {
    return this.callsService.getActiveCalls();
  }

  @Post('originate')
  @ApiOperation({ summary: 'Originate a new call' })
  @ApiResponse({ status: 201, description: 'Call originated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async originate(@Body() originateDto: any) {
    return this.callsService.originate(originateDto);
  }

  @Put(':uuid/hangup')
  @ApiOperation({ summary: 'Hangup a call' })
  @ApiResponse({ status: 200, description: 'Call hung up' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async hangup(@Param('uuid') uuid: string, @Body() hangupDto?: any) {
    return this.callsService.hangup(uuid, hangupDto?.cause);
  }

  @Put(':uuid/transfer')
  @ApiOperation({ summary: 'Transfer a call' })
  @ApiResponse({ status: 200, description: 'Call transferred' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async transfer(@Param('uuid') uuid: string, @Body() transferDto: any) {
    return this.callsService.transfer(uuid, transferDto);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get call information' })
  @ApiResponse({ status: 200, description: 'Call information' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async getCallInfo(@Param('uuid') uuid: string) {
    return this.callsService.getCallInfo(uuid);
  }
}

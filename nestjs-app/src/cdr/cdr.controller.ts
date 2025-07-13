import { Controller, Get, Param, Query, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CdrService } from './cdr.service';

@ApiTags('CDR')
@Controller('cdr')
export class CdrController {
  constructor(private readonly cdrService: CdrService) {}

  @Get()
  @ApiOperation({ summary: 'Get call detail records' })
  @ApiResponse({ status: 200, description: 'List of CDR records' })
  async getCdrRecords(@Query() query: any) {
    return this.cdrService.getCdrRecords(query);
  }

  @Get('billing')
  @ApiOperation({ summary: 'Get B-leg billing records for agent billing' })
  @ApiResponse({ status: 200, description: 'B-leg CDR records for agent billing' })
  async getBillingCDRs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agentNumber') agentNumber?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (agentNumber) {
      filters.agentNumber = agentNumber;
    }

    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    return this.cdrService.getBillingCDRs(filters);
  }

  @Get('consolidated')
  @ApiOperation({ summary: 'Get consolidated CDR view (A-leg perspective with aggregated metrics)' })
  @ApiResponse({ status: 200, description: 'Consolidated CDR records for reporting' })
  async getConsolidatedCDRs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('callerNumber') callerNumber?: string,
    @Query('destinationNumber') destinationNumber?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    if (callerNumber) {
      filters.callerNumber = callerNumber;
    }
    if (destinationNumber) {
      filters.destinationNumber = destinationNumber;
    }
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    return await this.cdrService.getConsolidatedCDRs(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get call statistics' })
  @ApiResponse({ status: 200, description: 'Call statistics' })
  async getCallStats(@Query() query: any) {
    return this.cdrService.getCallStats(query);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get specific CDR record' })
  @ApiResponse({ status: 200, description: 'CDR record found' })
  @ApiResponse({ status: 404, description: 'CDR record not found' })
  async getCdrRecord(@Param('uuid') uuid: string) {
    return this.cdrService.getCdrRecord(uuid);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for FreeSWITCH CDR data' })
  @ApiResponse({ status: 200, description: 'CDR data processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CDR data' })
  async processCdrWebhook(@Body() cdrData: any) {
    try {
      // Log incoming CDR data for debugging
      console.log('Received CDR webhook data:', JSON.stringify(cdrData, null, 2));

      // Process the CDR data
      const result = await this.cdrService.createCdrFromEvent(cdrData);

      return {
        success: true,
        message: 'CDR data processed successfully',
        data: result
      };
    } catch (error) {
      console.error('Error processing CDR webhook:', error);
      return {
        success: false,
        message: 'Failed to process CDR data',
        error: error.message
      };
    }
  }
}

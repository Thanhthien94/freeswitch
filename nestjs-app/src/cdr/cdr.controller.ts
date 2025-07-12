import { Controller, Get, Param, Query } from '@nestjs/common';
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
}

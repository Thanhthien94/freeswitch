import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalAuthGuard } from '../auth/guards/professional-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExtensionService } from './extension.service';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';
import { ExtensionQueryDto } from './dto/extension-query.dto';

@ApiTags('extensions')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
@Controller('extensions')
export class ExtensionController {
  private readonly logger = new Logger(ExtensionController.name);

  constructor(private readonly extensionService: ExtensionService) {}

  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create a new extension' })
  @ApiResponse({ status: 201, description: 'Extension created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Extension already exists' })
  async create(@Body() createExtensionDto: any) {
    this.logger.log('🔥🔥🔥 Extension Controller - CREATE method called');
    this.logger.log(`🔥🔥🔥 Raw body received: ${JSON.stringify(createExtensionDto)}`);
    this.logger.log('🔥🔥🔥 DTO validation passed');

    try {
      const result = await this.extensionService.create(createExtensionDto);
      this.logger.log('🔥🔥🔥 Service call successful');
      return result;
    } catch (error) {
      this.logger.error(`🔥🔥🔥 Service call failed: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get all extensions with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Extensions retrieved successfully' })
  async findAll(@Query() query: ExtensionQueryDto) {
    return this.extensionService.findAll(query);
  }

  @Get('stats')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get extension statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Query('domainId') domainId?: string) {
    return this.extensionService.getExtensionStats(domainId);
  }

  @Get('registered')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get all registered extensions' })
  @ApiResponse({ status: 200, description: 'Registered extensions retrieved successfully' })
  async getRegistered(@Query('domainId') domainId?: string) {
    return this.extensionService.getRegisteredExtensions(domainId);
  }

  @Get('domain/:domainId')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get all extensions for a specific domain' })
  @ApiResponse({ status: 200, description: 'Domain extensions retrieved successfully' })
  async getByDomain(@Param('domainId') domainId: string) {
    return this.extensionService.getExtensionsByDomain(domainId);
  }

  @Get(':id')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get extension by ID' })
  @ApiResponse({ status: 200, description: 'Extension retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async findOne(@Param('id') id: string) {
    return this.extensionService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update extension' })
  @ApiResponse({ status: 200, description: 'Extension updated successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async update(
    @Param('id') id: string,
    @Body() updateExtensionDto: UpdateExtensionDto,
  ) {
    return this.extensionService.update(id, updateExtensionDto);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete extension' })
  @ApiResponse({ status: 204, description: 'Extension deleted successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async remove(@Param('id') id: string) {
    await this.extensionService.remove(id);
  }

  @Post('bulk')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create multiple extensions' })
  @ApiResponse({ status: 201, description: 'Extensions created successfully' })
  async bulkCreate(@Body() createExtensionDtos: CreateExtensionDto[]) {
    return this.extensionService.bulkCreate(createExtensionDtos);
  }

  @Patch('bulk')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update multiple extensions' })
  @ApiResponse({ status: 200, description: 'Extensions updated successfully' })
  async bulkUpdate(
    @Body() updates: { id: string; data: UpdateExtensionDto }[],
  ) {
    return this.extensionService.bulkUpdate(updates);
  }

  @Delete('bulk')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple extensions' })
  @ApiResponse({ status: 204, description: 'Extensions deleted successfully' })
  async bulkDelete(@Body() { ids }: { ids: string[] }) {
    await this.extensionService.bulkDelete(ids);
  }

  @Post('generate-range')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Generate a range of extensions' })
  @ApiResponse({ status: 201, description: 'Extension range generated successfully' })
  async generateRange(
    @Body() body: {
      domainId: string;
      startExtension: string;
      endExtension: string;
      template: Partial<CreateExtensionDto>;
    },
  ) {
    return this.extensionService.generateExtensionRange(
      body.domainId,
      body.startExtension,
      body.endExtension,
      body.template,
    );
  }

  @Patch(':id/reset-password')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Reset extension password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(
    @Param('id') id: string,
    @Body() body?: { password?: string },
  ) {
    return this.extensionService.resetPassword(id, body?.password);
  }

  @Patch(':extension/registration/:domainId')
  @Roles('admin', 'superadmin', 'system')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update extension registration status' })
  @ApiResponse({ status: 204, description: 'Registration status updated' })
  async updateRegistrationStatus(
    @Param('extension') extension: string,
    @Param('domainId') domainId: string,
    @Body() body: {
      isRegistered: boolean;
      ip?: string;
      userAgent?: string;
    },
  ) {
    await this.extensionService.updateRegistrationStatus(
      extension,
      domainId,
      body.isRegistered,
      {
        ip: body.ip,
        userAgent: body.userAgent,
      },
    );
  }

  @Get(':id/stats')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get call statistics for specific extension' })
  @ApiResponse({ status: 200, description: 'Extension call statistics retrieved successfully' })
  async getExtensionCallStats(@Param('id') id: string) {
    return this.extensionService.getExtensionCallStats(id);
  }

  @Get(':id/registration')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get registration status for specific extension' })
  @ApiResponse({ status: 200, description: 'Extension registration status retrieved successfully' })
  async getExtensionRegistration(@Param('id') id: string) {
    return this.extensionService.getExtensionRegistration(id);
  }

  @Get(':id/calls')
  @Roles('admin', 'superadmin', 'user')
  @ApiOperation({ summary: 'Get call history for specific extension' })
  @ApiResponse({ status: 200, description: 'Extension call history retrieved successfully' })
  async getExtensionCalls(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.extensionService.getExtensionCalls(id, limitNum, offsetNum);
  }

  @Post(':id/test-connection')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Test SIP connection for extension' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testExtensionConnection(@Param('id') id: string) {
    return this.extensionService.testExtensionConnection(id);
  }

  @Post(':id/generate-password')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Generate new password for extension' })
  @ApiResponse({ status: 200, description: 'Password generated successfully' })
  async generatePassword(@Param('id') id: string) {
    return this.extensionService.generatePassword(id);
  }

  @Post(':id/reboot')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Reboot extension (force re-registration)' })
  @ApiResponse({ status: 200, description: 'Extension reboot initiated' })
  async rebootExtension(@Param('id') id: string) {
    return this.extensionService.rebootExtension(id);
  }
}

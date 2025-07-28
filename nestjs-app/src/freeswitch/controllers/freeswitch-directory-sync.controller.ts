import { Controller, Post, Get, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalAuthGuard } from '../../auth/guards/professional-auth.guard';
import { FreeSwitchDirectorySyncService, DirectorySyncResult } from '../services/freeswitch-directory-sync.service';

@ApiTags('FreeSWITCH Directory Sync')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
@Controller('freeswitch/directory-sync')
export class FreeSwitchDirectorySyncController {
  private readonly logger = new Logger(FreeSwitchDirectorySyncController.name);

  constructor(
    private readonly directorySyncService: FreeSwitchDirectorySyncService,
  ) {}

  @Post('extension/:id')
  @ApiOperation({ summary: 'Sync specific extension to FreeSWITCH directory' })
  @ApiResponse({ status: 200, description: 'Extension synced successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async syncExtension(@Param('id') id: string): Promise<DirectorySyncResult> {
    this.logger.log(`Manual sync requested for extension: ${id}`);
    return await this.directorySyncService.syncExtensionToDirectory(id);
  }

  @Post('domain/:domainName')
  @ApiOperation({ summary: 'Sync all extensions of a domain to FreeSWITCH directory' })
  @ApiResponse({ status: 200, description: 'Domain synced successfully' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async syncDomain(@Param('domainName') domainName: string): Promise<DirectorySyncResult> {
    this.logger.log(`Manual sync requested for domain: ${domainName}`);
    return await this.directorySyncService.syncDomainDirectory(domainName);
  }

  @Post('all')
  @ApiOperation({ summary: 'Sync all domains and extensions to FreeSWITCH directory' })
  @ApiResponse({ status: 200, description: 'All directories synced successfully' })
  async syncAll(): Promise<DirectorySyncResult> {
    this.logger.log('Manual sync requested for all directories');
    return await this.directorySyncService.syncAllDirectories();
  }

  @Get('extension/:id/status')
  @ApiOperation({ summary: 'Check sync status of specific extension' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async checkExtensionSyncStatus(@Param('id') id: string): Promise<DirectorySyncResult> {
    this.logger.log(`Sync status check requested for extension: ${id}`);
    return await this.directorySyncService.checkExtensionSyncStatus(id);
  }

  @Post('extension/:id/remove')
  @ApiOperation({ summary: 'Remove specific extension from FreeSWITCH directory' })
  @ApiResponse({ status: 200, description: 'Extension removed successfully' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async removeExtension(@Param('id') id: string): Promise<DirectorySyncResult> {
    this.logger.log(`Manual remove requested for extension: ${id}`);
    return await this.directorySyncService.removeExtensionFromDirectory(id);
  }
}

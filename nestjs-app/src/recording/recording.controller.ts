import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
  StreamableFile,
  Header,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { RecordingService, RecordingInfo } from './recording.service';
import * as path from 'path';
import { HybridAuthGuard } from '../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Recordings')
@ApiBearerAuth('JWT-auth')
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  /**
   * Get all recordings with optional filters
   */
  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all recordings with optional filters' })
  @ApiResponse({ status: 200, description: 'List of recordings' })
  async getRecordings(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('callerNumber') callerNumber?: string,
    @Query('destinationNumber') destinationNumber?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<{ data: RecordingInfo[], pagination: any }> {
    const filters: any = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
      if (isNaN(filters.startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format');
      }
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
      if (isNaN(filters.endDate.getTime())) {
        throw new BadRequestException('Invalid endDate format');
      }
    }

    if (callerNumber) {
      filters.callerNumber = callerNumber;
    }

    if (destinationNumber) {
      filters.destinationNumber = destinationNumber;
    }

    // Add pagination support
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (isNaN(pageNum) || pageNum <= 0) {
      throw new BadRequestException('Invalid page value');
    }

    if (isNaN(limitNum) || limitNum <= 0) {
      throw new BadRequestException('Invalid limit value');
    }

    filters.page = pageNum;
    filters.limit = limitNum;

    return await this.recordingService.getRecordingsWithPagination(filters);
  }

  /**
   * Get specific recording information
   */
  @Get(':callUuid/info')
  async getRecordingInfo(@Param('callUuid') callUuid: string): Promise<RecordingInfo> {
    const recording = await this.recordingService.getRecordingInfo(callUuid);
    
    if (!recording) {
      throw new NotFoundException(`Recording not found for call ${callUuid}`);
    }

    return recording;
  }

  /**
   * Download recording file
   */
  @Get(':callUuid/download')
  async downloadRecording(
    @Param('callUuid') callUuid: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const recordingInfo = await this.recordingService.getRecordingInfo(callUuid);
    
    if (!recordingInfo) {
      throw new NotFoundException(`Recording not found for call ${callUuid}`);
    }

    if (!recordingInfo.exists) {
      throw new NotFoundException(`Recording file not found for call ${callUuid}`);
    }

    const stream = await this.recordingService.getRecordingStream(callUuid);
    
    if (!stream) {
      throw new NotFoundException(`Unable to access recording file for call ${callUuid}`);
    }

    const filename = `${recordingInfo.callerNumber}_${recordingInfo.destinationNumber}_${callUuid}.${recordingInfo.format}`;
    
    res.set({
      'Content-Type': this.getContentType(recordingInfo.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': recordingInfo.fileSize.toString(),
    });

    return new StreamableFile(stream);
  }

  /**
   * Stream recording for playback
   */
  @Get(':callUuid/stream')
  @Header('Accept-Ranges', 'bytes')
  async streamRecording(
    @Param('callUuid') callUuid: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const recordingInfo = await this.recordingService.getRecordingInfo(callUuid);
    
    if (!recordingInfo) {
      throw new NotFoundException(`Recording not found for call ${callUuid}`);
    }

    if (!recordingInfo.exists) {
      throw new NotFoundException(`Recording file not found for call ${callUuid}`);
    }

    const stream = await this.recordingService.getRecordingStream(callUuid);
    
    if (!stream) {
      throw new NotFoundException(`Unable to access recording file for call ${callUuid}`);
    }

    res.set({
      'Content-Type': this.getContentType(recordingInfo.format),
      'Content-Length': recordingInfo.fileSize.toString(),
      'Cache-Control': 'no-cache',
    });

    return new StreamableFile(stream);
  }

  /**
   * Delete recording
   */
  @Delete(':callUuid')
  async deleteRecording(@Param('callUuid') callUuid: string): Promise<{ success: boolean; message: string }> {
    const success = await this.recordingService.deleteRecording(callUuid);
    
    if (!success) {
      throw new NotFoundException(`Recording not found or could not be deleted for call ${callUuid}`);
    }

    return {
      success: true,
      message: `Recording for call ${callUuid} deleted successfully`
    };
  }

  /**
   * Get recording statistics
   */
  @Get('stats')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get recording statistics' })
  @ApiResponse({ status: 200, description: 'Recording statistics' })
  async getRecordingStats() {
    return await this.recordingService.getRecordingStats();
  }

  /**
   * Get content type based on file format
   */
  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'gsm': 'audio/gsm',
      'g729': 'audio/g729',
      'pcmu': 'audio/pcmu',
      'pcma': 'audio/pcma',
    };

    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }
}

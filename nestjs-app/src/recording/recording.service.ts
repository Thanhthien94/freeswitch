import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallDetailRecord } from '../cdr/cdr.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface RecordingInfo {
  callUuid: string;
  filePath: string;
  fileSize: number;
  duration: number;
  format: string;
  exists: boolean;
  createdAt: Date;
  callerNumber: string;
  destinationNumber: string;
}

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private readonly recordingsPath = process.env.RECORDINGS_PATH || '/opt/freeswitch/recordings';

  constructor(
    @InjectRepository(CallDetailRecord)
    private cdrRepository: Repository<CallDetailRecord>,
  ) {}

  /**
   * Get recording information for a specific call
   */
  async getRecordingInfo(callUuid: string): Promise<RecordingInfo | null> {
    const cdr = await this.cdrRepository.findOne({
      where: { callUuid },
      select: ['callUuid', 'recordingFilePath', 'totalDuration', 'callerIdNumber', 'destinationNumber', 'createdAt']
    });

    if (!cdr || !cdr.recordingFilePath) {
      return null;
    }

    const fullPath = path.isAbsolute(cdr.recordingFilePath) 
      ? cdr.recordingFilePath 
      : path.join(this.recordingsPath, cdr.recordingFilePath);

    const exists = fs.existsSync(fullPath);
    let fileSize = 0;

    if (exists) {
      try {
        const stats = fs.statSync(fullPath);
        fileSize = stats.size;
      } catch (error) {
        this.logger.error(`Failed to get file stats for ${fullPath}: ${error.message}`);
      }
    }

    return {
      callUuid: cdr.callUuid,
      filePath: fullPath,
      fileSize,
      duration: cdr.totalDuration,
      format: path.extname(cdr.recordingFilePath).toLowerCase().substring(1),
      exists,
      createdAt: cdr.createdAt,
      callerNumber: cdr.callerIdNumber,
      destinationNumber: cdr.destinationNumber,
    };
  }

  /**
   * Get all recordings with optional filters
   */
  async getRecordings(filters?: {
    startDate?: Date;
    endDate?: Date;
    callerNumber?: string;
    destinationNumber?: string;
    limit?: number;
  }): Promise<RecordingInfo[]> {
    const query = this.cdrRepository.createQueryBuilder('cdr')
      .select([
        'cdr.callUuid',
        'cdr.recordingFilePath',
        'cdr.totalDuration',
        'cdr.callerIdNumber',
        'cdr.destinationNumber',
        'cdr.createdAt'
      ])
      .where('cdr.recordingEnabled = :enabled', { enabled: true })
      .andWhere('cdr.recordingFilePath IS NOT NULL')
      .orderBy('cdr.createdAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('cdr.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('cdr.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.callerNumber) {
      query.andWhere('cdr.callerIdNumber = :callerNumber', { callerNumber: filters.callerNumber });
    }
    if (filters?.destinationNumber) {
      query.andWhere('cdr.destinationNumber = :destinationNumber', { destinationNumber: filters.destinationNumber });
    }
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    const cdrs = await query.getMany();
    const recordings: RecordingInfo[] = [];

    for (const cdr of cdrs) {
      const fullPath = path.isAbsolute(cdr.recordingFilePath) 
        ? cdr.recordingFilePath 
        : path.join(this.recordingsPath, cdr.recordingFilePath);

      const exists = fs.existsSync(fullPath);
      let fileSize = 0;

      if (exists) {
        try {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;
        } catch (error) {
          this.logger.error(`Failed to get file stats for ${fullPath}: ${error.message}`);
        }
      }

      recordings.push({
        callUuid: cdr.callUuid,
        filePath: fullPath,
        fileSize,
        duration: cdr.totalDuration,
        format: path.extname(cdr.recordingFilePath).toLowerCase().substring(1),
        exists,
        createdAt: cdr.createdAt,
        callerNumber: cdr.callerIdNumber,
        destinationNumber: cdr.destinationNumber,
      });
    }

    return recordings;
  }

  /**
   * Get recordings with pagination (consistent with CDR service)
   */
  async getRecordingsWithPagination(filters?: {
    startDate?: Date;
    endDate?: Date;
    callerNumber?: string;
    destinationNumber?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: RecordingInfo[], pagination: any }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const query = this.cdrRepository.createQueryBuilder('cdr')
      .select([
        'cdr.callUuid',
        'cdr.recordingFilePath',
        'cdr.totalDuration',
        'cdr.callerIdNumber',
        'cdr.destinationNumber',
        'cdr.createdAt'
      ])
      .where('cdr.recordingEnabled = :enabled', { enabled: true })
      .andWhere('cdr.recordingFilePath IS NOT NULL')
      .orderBy('cdr.createdAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('cdr.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('cdr.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.callerNumber) {
      query.andWhere('cdr.callerIdNumber = :callerNumber', { callerNumber: filters.callerNumber });
    }
    if (filters?.destinationNumber) {
      query.andWhere('cdr.destinationNumber = :destinationNumber', { destinationNumber: filters.destinationNumber });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    query.skip(offset).take(limit);

    const cdrs = await query.getMany();
    const recordings: RecordingInfo[] = [];

    for (const cdr of cdrs) {
      const fullPath = path.isAbsolute(cdr.recordingFilePath)
        ? cdr.recordingFilePath
        : path.join(this.recordingsPath, cdr.recordingFilePath);

      const exists = fs.existsSync(fullPath);
      let fileSize = 0;

      if (exists) {
        try {
          const stats = fs.statSync(fullPath);
          fileSize = stats.size;
        } catch (error) {
          this.logger.error(`Failed to get file stats for ${fullPath}: ${error.message}`);
        }
      }

      recordings.push({
        callUuid: cdr.callUuid,
        filePath: fullPath,
        fileSize,
        duration: cdr.totalDuration,
        format: path.extname(cdr.recordingFilePath).toLowerCase().substring(1),
        exists,
        createdAt: cdr.createdAt,
        callerNumber: cdr.callerIdNumber,
        destinationNumber: cdr.destinationNumber,
      });
    }

    return {
      data: recordings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get recording file stream for download/playback
   */
  async getRecordingStream(callUuid: string): Promise<fs.ReadStream | null> {
    const recordingInfo = await this.getRecordingInfo(callUuid);
    
    if (!recordingInfo || !recordingInfo.exists) {
      return null;
    }

    try {
      return fs.createReadStream(recordingInfo.filePath);
    } catch (error) {
      this.logger.error(`Failed to create read stream for ${recordingInfo.filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete recording file and update CDR
   */
  async deleteRecording(callUuid: string): Promise<boolean> {
    const recordingInfo = await this.getRecordingInfo(callUuid);
    
    if (!recordingInfo) {
      return false;
    }

    try {
      if (recordingInfo.exists) {
        fs.unlinkSync(recordingInfo.filePath);
        this.logger.log(`Deleted recording file: ${recordingInfo.filePath}`);
      }

      // Update CDR to reflect deletion
      await this.cdrRepository.update(
        { callUuid },
        { recordingFilePath: null, recordingEnabled: false }
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete recording ${recordingInfo.filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get recording statistics
   */
  async getRecordingStats(): Promise<{
    totalRecordings: number;
    totalSize: number;
    avgDuration: number;
    formatDistribution: Record<string, number>;
  }> {
    const recordings = await this.getRecordings();
    
    const stats = {
      totalRecordings: recordings.length,
      totalSize: recordings.reduce((sum, r) => sum + r.fileSize, 0),
      avgDuration: recordings.length > 0 
        ? recordings.reduce((sum, r) => sum + r.duration, 0) / recordings.length 
        : 0,
      formatDistribution: {} as Record<string, number>
    };

    recordings.forEach(recording => {
      const format = recording.format || 'unknown';
      stats.formatDistribution[format] = (stats.formatDistribution[format] || 0) + 1;
    });

    return stats;
  }
}

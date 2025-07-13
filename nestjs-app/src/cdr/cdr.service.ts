import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { CallDetailRecord, CallDirection, CallStatus } from './cdr.entity';
import { CallEvent } from './call-event.entity';
import { CallParticipant, ParticipantType } from './call-participant.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CdrService {
  private readonly logger = new Logger(CdrService.name);

  constructor(
    @InjectRepository(CallDetailRecord)
    private cdrRepository: Repository<CallDetailRecord>,
    @InjectRepository(CallEvent)
    private eventRepository: Repository<CallEvent>,
    @InjectRepository(CallParticipant)
    private participantRepository: Repository<CallParticipant>,
  ) {}

  // Real-time CDR Collection Methods
  async createCdrFromEvent(eventData: any): Promise<CallDetailRecord> {
    try {
      const cdr = new CallDetailRecord();

      // Basic call information
      cdr.callUuid = eventData.uuid || eventData['Unique-ID'];
      cdr.callerIdNumber = eventData.caller_id_number || eventData['Caller-Caller-ID-Number'] || 'unknown';
      cdr.destinationNumber = eventData.destination_number || eventData['Caller-Destination-Number'] || 'unknown';
      cdr.callerIdName = eventData.caller_id_name || eventData['Caller-Caller-ID-Name'];

      // Call context
      cdr.direction = this.determineCallDirection(eventData);
      cdr.context = eventData.context || eventData['Caller-Context'] || 'default';
      cdr.domainName = eventData.domain_name || eventData['variable_domain_name'];

      // B-leg billing flag for agent billing
      cdr.isBillingLeg = eventData.is_billing_leg || false;

      // Timestamps - Handle FreeSWITCH microsecond timestamps
      cdr.callCreatedAt = this.parseFreeSwitchTimestamp(eventData.created_time || eventData['Caller-Channel-Created-Time']);
      cdr.callStatus = CallStatus.RINGING;

      // Technical information
      cdr.callerIpAddress = eventData.caller_ip || eventData['Caller-Network-Addr'];
      cdr.sipUserAgent = eventData.user_agent || eventData['variable_sip_user_agent'];

      const savedCdr = await this.cdrRepository.save(cdr);
      this.logger.log(`Created CDR for call ${cdr.callUuid}`);

      return savedCdr;
    } catch (error) {
      this.logger.error(`Failed to create CDR: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCdrOnAnswer(callUuid: string, eventData: any): Promise<void> {
    try {
      const cdr = await this.cdrRepository.findOne({ where: { callUuid } });
      if (!cdr) {
        this.logger.warn(`CDR not found for answered call: ${callUuid}`);
        return;
      }

      cdr.callAnsweredAt = this.parseFreeSwitchTimestamp(eventData.answered_time || eventData['Caller-Channel-Answered-Time']);
      cdr.callStatus = CallStatus.ANSWERED;
      cdr.answerDisposition = eventData.answer_disposition || 'answered';

      // Calculate ring duration
      if (cdr.callCreatedAt && cdr.callAnsweredAt) {
        cdr.ringDuration = Math.floor((cdr.callAnsweredAt.getTime() - cdr.callCreatedAt.getTime()) / 1000);
      }

      await this.cdrRepository.save(cdr);
      this.logger.log(`Updated CDR for answered call ${callUuid}`);
    } catch (error) {
      this.logger.error(`Failed to update CDR on answer: ${error.message}`, error.stack);
    }
  }

  async updateCdrOnHangup(callUuid: string, eventData: any): Promise<void> {
    try {
      const cdr = await this.cdrRepository.findOne({ where: { callUuid } });
      if (!cdr) {
        this.logger.warn(`CDR not found for hangup call: ${callUuid}`);
        return;
      }

      cdr.callEndedAt = this.parseFreeSwitchTimestamp(eventData.hangup_time || eventData['Caller-Channel-Hangup-Time']);
      cdr.callStatus = CallStatus.COMPLETED;
      cdr.hangupCause = eventData.hangup_cause || eventData['Hangup-Cause'] || 'UNKNOWN';
      cdr.hangupDisposition = eventData.hangup_disposition;

      // Calculate durations
      if (cdr.callCreatedAt && cdr.callEndedAt) {
        cdr.totalDuration = Math.floor((cdr.callEndedAt.getTime() - cdr.callCreatedAt.getTime()) / 1000);
      }

      if (cdr.callAnsweredAt && cdr.callEndedAt) {
        cdr.talkDuration = Math.floor((cdr.callEndedAt.getTime() - cdr.callAnsweredAt.getTime()) / 1000);
        cdr.billableDuration = cdr.talkDuration; // Can be customized based on billing rules
      }

      // Recording information - Enhanced with FreeSWITCH variables and file detection
      this.logger.log(`Processing recording detection for call ${callUuid}`);

      const recordingFromEvent = eventData.recording_enabled === 'true' ||
                                 eventData.record_session === 'true' ||
                                 eventData.variable_record_session === 'true' || false;

      const recordingFilePathFromEvent = eventData.recording_file_path ||
                                        eventData.variable_recording_file_path ||
                                        eventData.variable_record_name;

      this.logger.log(`Recording from event: enabled=${recordingFromEvent}, path=${recordingFilePathFromEvent}`);

      // Detect recording file if not provided by event
      const recordingDetection = await this.detectRecordingFile(
        callUuid,
        cdr.callerIdNumber,
        cdr.destinationNumber,
        cdr.callCreatedAt
      );

      this.logger.log(`Recording detection result: enabled=${recordingDetection.enabled}, path=${recordingDetection.filePath}`);

      // Use detected recording info if available, otherwise use event data
      cdr.recordingEnabled = recordingDetection.enabled || recordingFromEvent;
      cdr.recordingFilePath = recordingDetection.filePath || recordingFilePathFromEvent;

      this.logger.log(`Final recording info: enabled=${cdr.recordingEnabled}, path=${cdr.recordingFilePath}`);

      // Quality metrics (if available) with validation
      // Convert FreeSWITCH quality percentage (0-100) to MOS Score (1.0-5.0)
      if (eventData.audio_quality_score) {
        const qualityPercent = parseFloat(eventData.audio_quality_score);
        // Convert 0-100% to MOS 1.0-5.0: MOS = 1.0 + (percent/100) * 4.0
        cdr.audioQualityScore = Math.round((1.0 + (qualityPercent / 100) * 4.0) * 100) / 100;
      } else {
        cdr.audioQualityScore = null;
      }
      cdr.packetLossPercent = eventData.packet_loss ?
        Math.min(Math.max(parseFloat(eventData.packet_loss), 0), 100) : null;
      cdr.jitterMs = eventData.jitter ?
        Math.min(Math.max(parseFloat(eventData.jitter), 0), 999999) : null;
      cdr.latencyMs = eventData.latency ?
        Math.min(Math.max(parseFloat(eventData.latency), 0), 999999) : null;

      cdr.processedAt = new Date();

      await this.cdrRepository.save(cdr);
      this.logger.log(`Completed CDR for call ${callUuid} - Duration: ${cdr.totalDuration}s`);
    } catch (error) {
      this.logger.error(`Failed to update CDR on hangup: ${error.message}`, error.stack);
    }
  }

  /**
   * Get B-leg billing records for agent billing
   * Focus on destination leg (B-leg) for accurate agent billing
   */
  async getBillingCDRs(filters?: {
    startDate?: Date;
    endDate?: Date;
    agentNumber?: string;
    limit?: number;
  }) {
    const query = this.cdrRepository.createQueryBuilder('cdr')
      .where('cdr.isBillingLeg = :isBillingLeg', { isBillingLeg: true })
      .leftJoinAndSelect('cdr.events', 'events')
      .leftJoinAndSelect('cdr.participants', 'participants')
      .orderBy('cdr.callCreatedAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('cdr.callCreatedAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('cdr.callCreatedAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.agentNumber) {
      query.andWhere('cdr.destinationNumber = :agentNumber', { agentNumber: filters.agentNumber });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    return await query.getMany();
  }

  /**
   * Get consolidated CDR view (A-leg perspective with B-leg metrics aggregated)
   * Professional approach for reporting while maintaining detailed dual-leg data
   */
  async getConsolidatedCDRs(filters?: {
    startDate?: Date;
    endDate?: Date;
    callerNumber?: string;
    destinationNumber?: string;
    limit?: number;
  }) {
    const query = this.cdrRepository.createQueryBuilder('cdr')
      .select([
        'cdr.callUuid',
        'cdr.callerIdNumber',
        'cdr.destinationNumber',
        'cdr.callCreatedAt',
        'cdr.callAnsweredAt',
        'cdr.callEndedAt',
        'cdr.callStatus',
        'cdr.hangupCause',
        'cdr.recordingEnabled',
        'cdr.recordingFilePath',
        'AVG(cdr.audioQualityScore) as avgAudioQuality',
        'AVG(cdr.jitterMs) as avgJitter',
        'AVG(cdr.latencyMs) as avgLatency',
        'MAX(cdr.totalDuration) as callDuration',
        'COUNT(*) as legCount'
      ])
      .groupBy('cdr.callUuid, cdr.callerIdNumber, cdr.destinationNumber, cdr.callCreatedAt, cdr.callAnsweredAt, cdr.callEndedAt, cdr.callStatus, cdr.hangupCause, cdr.recordingEnabled, cdr.recordingFilePath')
      .orderBy('cdr.callCreatedAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('cdr.callCreatedAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('cdr.callCreatedAt <= :endDate', { endDate: filters.endDate });
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

    return await query.getRawMany();
  }

  // Helper methods
  private parseFreeSwitchTimestamp(timestamp: string | number): Date {
    if (!timestamp) {
      return new Date();
    }

    // Handle string timestamps
    if (typeof timestamp === 'string') {
      // FreeSWITCH microsecond timestamp (e.g., "1752378769378323")
      if (/^\d+$/.test(timestamp) && timestamp.length > 10) {
        // Convert microseconds to milliseconds
        const milliseconds = parseInt(timestamp) / 1000;
        return new Date(milliseconds);
      }

      // Try parsing as regular date string
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle numeric timestamps
    if (typeof timestamp === 'number') {
      // If timestamp is in microseconds (> 10^12), convert to milliseconds
      if (timestamp > 1000000000000) {
        return new Date(timestamp / 1000);
      }
      // If timestamp is in seconds (< 10^12), convert to milliseconds
      if (timestamp > 1000000000) {
        return new Date(timestamp * 1000);
      }
      // Already in milliseconds
      return new Date(timestamp);
    }

    // Fallback to current time
    this.logger.warn(`Unable to parse timestamp: ${timestamp}, using current time`);
    return new Date();
  }

  private determineCallDirection(eventData: any): CallDirection {
    const context = eventData.context || eventData['Caller-Context'] || 'default';
    const callerNumber = eventData.caller_id_number || eventData['Caller-Caller-ID-Number'];
    const destNumber = eventData.destination_number || eventData['Caller-Destination-Number'];

    // Internal calls (both numbers are extensions)
    if (this.isExtension(callerNumber) && this.isExtension(destNumber)) {
      return CallDirection.INTERNAL;
    }

    // Inbound calls (external caller to extension)
    if (!this.isExtension(callerNumber) && this.isExtension(destNumber)) {
      return CallDirection.INBOUND;
    }

    // Outbound calls (extension to external)
    if (this.isExtension(callerNumber) && !this.isExtension(destNumber)) {
      return CallDirection.OUTBOUND;
    }

    return CallDirection.INTERNAL; // Default
  }

  private isExtension(number: string): boolean {
    if (!number) return false;
    // Assume extensions are 4-digit numbers starting with 10
    return /^10[0-9]{2}$/.test(number);
  }

  async getCdrRecords(query: any) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      callerNumber,
      destinationNumber,
      direction,
      status
    } = query;

    const where: any = {};

    if (startDate && endDate) {
      where.callCreatedAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.callCreatedAt = Between(new Date(startDate), new Date());
    }

    if (callerNumber) {
      where.callerIdNumber = callerNumber;
    }

    if (destinationNumber) {
      where.destinationNumber = destinationNumber;
    }

    if (direction) {
      where.direction = direction;
    }

    if (status) {
      where.callStatus = status;
    }

    const options: FindManyOptions<CallDetailRecord> = {
      where,
      order: { callCreatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['events', 'participants'],
    };

    const [records, total] = await this.cdrRepository.findAndCount(options);

    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCdrRecord(uuid: string): Promise<CallDetailRecord> {
    const record = await this.cdrRepository.findOne({
      where: { callUuid: uuid },
      relations: ['events', 'participants'],
    });

    if (!record) {
      throw new Error('CDR record not found');
    }

    return record;
  }

  async getCallStats(query: any) {
    const { startDate, endDate, direction } = query;

    const where: any = {};

    if (startDate && endDate) {
      where.callCreatedAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.callCreatedAt = Between(new Date(startDate), new Date());
    }

    if (direction) {
      where.direction = direction;
    }

    const records = await this.cdrRepository.find({ where });

    const totalCalls = records.length;
    const answeredCalls = records.filter(r => r.callAnsweredAt).length;
    const completedCalls = records.filter(r => r.callStatus === CallStatus.COMPLETED).length;

    const totalDuration = records.reduce((sum, r) => sum + (r.totalDuration || 0), 0);
    const totalTalkTime = records.reduce((sum, r) => sum + (r.talkDuration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    const avgTalkTime = answeredCalls > 0 ? totalTalkTime / answeredCalls : 0;

    // Quality metrics
    const recordsWithQuality = records.filter(r => r.audioQualityScore !== null);
    const avgQuality = recordsWithQuality.length > 0
      ? recordsWithQuality.reduce((sum, r) => sum + r.audioQualityScore, 0) / recordsWithQuality.length
      : null;

    return {
      totalCalls,
      answeredCalls,
      completedCalls,
      missedCalls: totalCalls - answeredCalls,
      answerRate: totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(2) : '0.00',
      completionRate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(2) : '0.00',
      totalDuration,
      totalTalkTime,
      avgDuration: Math.round(avgDuration),
      avgTalkTime: Math.round(avgTalkTime),
      avgQualityScore: avgQuality ? avgQuality.toFixed(2) : null,
      period: {
        startDate,
        endDate
      },
      breakdown: {
        byDirection: await this.getCallsByDirection(where),
        byHour: await this.getCallsByHour(where),
        byStatus: await this.getCallsByStatus(where),
      }
    };
  }

  private async getCallsByDirection(where: any) {
    const directions = Object.values(CallDirection);
    const result = {};

    for (const direction of directions) {
      const count = await this.cdrRepository.count({
        where: { ...where, direction }
      });
      result[direction] = count;
    }

    return result;
  }

  private async getCallsByHour(where: any) {
    // This would need raw SQL for proper hour grouping
    // For now, return empty object
    return {};
  }

  private async getCallsByStatus(where: any) {
    const statuses = Object.values(CallStatus);
    const result = {};

    for (const status of statuses) {
      const count = await this.cdrRepository.count({
        where: { ...where, callStatus: status }
      });
      result[status] = count;
    }

    return result;
  }

  // Recording detection methods
  private async detectRecordingFile(callUuid: string, callerNumber: string, destinationNumber: string, callCreatedAt: Date): Promise<{ enabled: boolean; filePath: string | null; fileSize?: number }> {
    try {
      const recordingsDir = process.env.RECORDINGS_DIR || '/var/lib/freeswitch/recordings';

      // Generate possible recording file patterns
      const timestamp = callCreatedAt.toISOString().replace(/[-:]/g, '').replace('T', '-').substring(0, 15); // YYYYMMDD-HHMMSS
      const patterns = [
        `${timestamp}_${callerNumber}_${destinationNumber}.wav`,
        `${timestamp}_${callerNumber}_${destinationNumber}_${callUuid}.wav`,
        `${callerNumber}_${destinationNumber}_${callUuid}.wav`,
        `${callUuid}.wav`
      ];

      for (const pattern of patterns) {
        const filePath = path.join(recordingsDir, pattern);
        try {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            this.logger.log(`Recording file found: ${pattern} (${stats.size} bytes)`);
            return {
              enabled: true,
              filePath: pattern, // Store relative path
              fileSize: stats.size
            };
          }
        } catch (error) {
          this.logger.warn(`Error checking recording file ${pattern}: ${error.message}`);
        }
      }

      return { enabled: false, filePath: null };
    } catch (error) {
      this.logger.error(`Error detecting recording file: ${error.message}`, error.stack);
      return { enabled: false, filePath: null };
    }
  }

  // Event logging methods
  async logCallEvent(cdrId: string, eventType: string, eventData: any, eventSubtype?: string): Promise<CallEvent> {
    try {
      const event = new CallEvent();
      event.cdrId = cdrId;
      event.eventType = eventType;
      event.eventSubtype = eventSubtype;
      event.eventTimestamp = new Date();
      event.eventData = eventData;
      event.eventSource = 'freeswitch';

      return await this.eventRepository.save(event);
    } catch (error) {
      this.logger.error(`Failed to log call event: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Participant management
  async addCallParticipant(
    cdrId: string,
    participantNumber: string,
    participantType: ParticipantType,
    participantData?: any
  ): Promise<CallParticipant> {
    try {
      const participant = new CallParticipant();
      participant.cdrId = cdrId;
      participant.participantNumber = participantNumber;
      participant.participantType = participantType;
      participant.joinedAt = new Date();

      if (participantData) {
        participant.participantName = participantData.name;
        participant.ipAddress = participantData.ipAddress;
        participant.userAgent = participantData.userAgent;
      }

      return await this.participantRepository.save(participant);
    } catch (error) {
      this.logger.error(`Failed to add call participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeCallParticipant(cdrId: string, participantNumber: string): Promise<void> {
    try {
      const participant = await this.participantRepository.findOne({
        where: { cdrId, participantNumber }
      });

      if (participant) {
        participant.leftAt = new Date();
        participant.durationSeconds = participant.participationDuration;
        await this.participantRepository.save(participant);
      }
    } catch (error) {
      this.logger.error(`Failed to remove call participant: ${error.message}`, error.stack);
    }
  }
}

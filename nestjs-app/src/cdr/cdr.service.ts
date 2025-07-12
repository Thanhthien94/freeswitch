import { Injectable } from '@nestjs/common';

@Injectable()
export class CdrService {
  // Mock CDR data
  private cdrRecords = [
    {
      uuid: '12345678-1234-1234-1234-123456789012',
      caller_id_number: '1001',
      destination_number: '1002',
      start_time: '2024-01-01T10:00:00Z',
      answer_time: '2024-01-01T10:00:05Z',
      end_time: '2024-01-01T10:02:30Z',
      duration: 150,
      billsec: 145,
      hangup_cause: 'NORMAL_CLEARING'
    },
    {
      uuid: '12345678-1234-1234-1234-123456789013',
      caller_id_number: '1002',
      destination_number: '1003',
      start_time: '2024-01-01T11:00:00Z',
      answer_time: '2024-01-01T11:00:03Z',
      end_time: '2024-01-01T11:05:15Z',
      duration: 315,
      billsec: 312,
      hangup_cause: 'NORMAL_CLEARING'
    }
  ];

  async getCdrRecords(query: any) {
    const { page = 1, limit = 10, startDate, endDate } = query;
    
    let filteredRecords = [...this.cdrRecords];
    
    if (startDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.start_time) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.start_time) <= new Date(endDate)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    return {
      data: paginatedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limit)
      }
    };
  }

  async getCdrRecord(uuid: string) {
    const record = this.cdrRecords.find(r => r.uuid === uuid);
    if (!record) {
      throw new Error('CDR record not found');
    }
    return record;
  }

  async getCallStats(query: any) {
    const { startDate, endDate } = query;
    
    let filteredRecords = [...this.cdrRecords];
    
    if (startDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.start_time) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.start_time) <= new Date(endDate)
      );
    }

    const totalCalls = filteredRecords.length;
    const answeredCalls = filteredRecords.filter(r => r.answer_time).length;
    const totalDuration = filteredRecords.reduce((sum, r) => sum + r.duration, 0);
    const totalBillsec = filteredRecords.reduce((sum, r) => sum + r.billsec, 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    return {
      totalCalls,
      answeredCalls,
      missedCalls: totalCalls - answeredCalls,
      answerRate: totalCalls > 0 ? (answeredCalls / totalCalls * 100).toFixed(2) : 0,
      totalDuration,
      totalBillsec,
      avgDuration: Math.round(avgDuration),
      period: {
        startDate,
        endDate
      }
    };
  }
}

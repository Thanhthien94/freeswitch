# FreeSWITCH Event Socket Library (ESL) Integration Guide

## Tổng quan về ESL

Event Socket Library (ESL) là thư viện C cung cấp interface để tương tác với FreeSWITCH event system. ESL cho phép ứng dụng external kết nối và điều khiển FreeSWITCH thông qua TCP socket.

## Hai chế độ hoạt động

### 1. Inbound Mode
- **Mô tả**: Ứng dụng kết nối VÀO FreeSWITCH
- **Use case**: API calls, monitoring, call control từ external application
- **Port**: 8021 (default)

### 2. Outbound Mode  
- **Mô tả**: FreeSWITCH kết nối RA external application
- **Use case**: Call handling, IVR applications, custom dialplan logic
- **Trigger**: Dialplan action `<action application="socket" data="host:port"/>`

## Node.js ESL Libraries

### 1. node-esl (Recommended)
```bash
npm install modesl
```

**Ưu điểm**:
- Implement đầy đủ ESL specification
- TypeScript support
- Active maintenance
- Comprehensive documentation

### 2. esl (Alternative)
```bash
npm install esl
```

**Ưu điểm**:
- Lightweight
- Simple API
- Good for basic use cases

## NestJS ESL Integration

### ESL Service Implementation

```typescript
// esl.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Connection as ESLConnection } from 'modesl';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EslService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EslService.name);
  private connection: ESLConnection;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.connection) {
      this.connection.disconnect();
    }
  }

  private async connect(): Promise<void> {
    try {
      const host = this.configService.get('FREESWITCH_HOST', 'localhost');
      const port = this.configService.get('FREESWITCH_ESL_PORT', 8021);
      const password = this.configService.get('FREESWITCH_ESL_PASSWORD', 'ClueCon');

      this.connection = new ESLConnection(host, port, password, () => {
        this.logger.log('Connected to FreeSWITCH ESL');
        this.reconnectAttempts = 0;
        this.setupEventHandlers();
      });

      this.connection.on('error', (error) => {
        this.logger.error('ESL Connection error:', error);
        this.handleReconnect();
      });

      this.connection.on('end', () => {
        this.logger.warn('ESL Connection ended');
        this.handleReconnect();
      });

    } catch (error) {
      this.logger.error('Failed to connect to FreeSWITCH:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    // Subscribe to all events
    this.connection.events('plain', 'all');
    
    // Handle events
    this.connection.on('esl::event::**', (event) => {
      this.handleEvent(event);
    });
  }

  private handleEvent(event: any): void {
    const eventName = event.getHeader('Event-Name');
    
    switch (eventName) {
      case 'CHANNEL_CREATE':
        this.handleChannelCreate(event);
        break;
      case 'CHANNEL_ANSWER':
        this.handleChannelAnswer(event);
        break;
      case 'CHANNEL_HANGUP':
        this.handleChannelHangup(event);
        break;
      case 'DTMF':
        this.handleDtmf(event);
        break;
      default:
        this.logger.debug(`Received event: ${eventName}`);
    }
  }

  private handleChannelCreate(event: any): void {
    const uuid = event.getHeader('Unique-ID');
    const callerNumber = event.getHeader('Caller-Caller-ID-Number');
    const destinationNumber = event.getHeader('Caller-Destination-Number');
    
    this.logger.log(`New call: ${callerNumber} -> ${destinationNumber} (${uuid})`);
    
    // Emit event for real-time updates
    // this.eventEmitter.emit('call.created', { uuid, callerNumber, destinationNumber });
  }

  private handleChannelAnswer(event: any): void {
    const uuid = event.getHeader('Unique-ID');
    this.logger.log(`Call answered: ${uuid}`);
    
    // this.eventEmitter.emit('call.answered', { uuid });
  }

  private handleChannelHangup(event: any): void {
    const uuid = event.getHeader('Unique-ID');
    const cause = event.getHeader('Hangup-Cause');
    
    this.logger.log(`Call hangup: ${uuid} (${cause})`);
    
    // this.eventEmitter.emit('call.hangup', { uuid, cause });
  }

  private handleDtmf(event: any): void {
    const uuid = event.getHeader('Unique-ID');
    const digit = event.getHeader('DTMF-Digit');
    
    this.logger.log(`DTMF: ${digit} on ${uuid}`);
    
    // this.eventEmitter.emit('call.dtmf', { uuid, digit });
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      this.logger.warn(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.logger.error('Max reconnection attempts reached');
    }
  }

  // API Methods
  async originate(destination: string, context: string = 'default', timeout: number = 30): Promise<any> {
    const uuid = await this.createUuid();
    const command = `{origination_uuid=${uuid},origination_timeout=${timeout}}sofia/internal/${destination} &park()`;
    
    try {
      const result = await this.connection.bgapi('originate', command);
      return {
        uuid,
        jobUuid: result.getHeader('Job-UUID'),
        success: true
      };
    } catch (error) {
      this.logger.error('Originate failed:', error);
      throw error;
    }
  }

  async hangup(uuid: string, cause: string = 'NORMAL_CLEARING'): Promise<void> {
    try {
      await this.connection.api('uuid_kill', `${uuid} ${cause}`);
    } catch (error) {
      this.logger.error(`Failed to hangup ${uuid}:`, error);
      throw error;
    }
  }

  async transfer(uuid: string, destination: string, context: string = 'default'): Promise<void> {
    try {
      await this.connection.api('uuid_transfer', `${uuid} ${destination} XML ${context}`);
    } catch (error) {
      this.logger.error(`Failed to transfer ${uuid}:`, error);
      throw error;
    }
  }

  async playback(uuid: string, file: string): Promise<void> {
    try {
      await this.connection.api('uuid_broadcast', `${uuid} ${file} aleg`);
    } catch (error) {
      this.logger.error(`Failed to playback on ${uuid}:`, error);
      throw error;
    }
  }

  async getChannelInfo(uuid: string): Promise<any> {
    try {
      const result = await this.connection.api('uuid_dump', uuid);
      return this.parseChannelInfo(result.getBody());
    } catch (error) {
      this.logger.error(`Failed to get channel info for ${uuid}:`, error);
      throw error;
    }
  }

  async getActiveCalls(): Promise<any[]> {
    try {
      const result = await this.connection.api('show', 'channels as json');
      return JSON.parse(result.getBody());
    } catch (error) {
      this.logger.error('Failed to get active calls:', error);
      throw error;
    }
  }

  private async createUuid(): Promise<string> {
    const result = await this.connection.api('create_uuid');
    return result.getBody().trim();
  }

  private parseChannelInfo(data: string): any {
    const info = {};
    const lines = data.split('\n');
    
    lines.forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        info[key.trim()] = value.trim();
      }
    });
    
    return info;
  }

  // Health check
  async isConnected(): Promise<boolean> {
    try {
      if (!this.connection) return false;
      
      const result = await this.connection.api('status');
      return result.getHeader('Reply-Text').includes('+OK');
    } catch {
      return false;
    }
  }
}
```

### ESL Module Configuration

```typescript
// esl.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EslService } from './esl.service';

@Module({
  imports: [ConfigModule],
  providers: [EslService],
  exports: [EslService],
})
export class EslModule {}
```

## Best Practices cho Production

### 1. Connection Management
- **Reconnection Logic**: Implement exponential backoff
- **Health Checks**: Regular connection status monitoring
- **Connection Pooling**: Multiple connections cho high load

### 2. Error Handling
- **Graceful Degradation**: Handle FreeSWITCH downtime
- **Timeout Management**: Set appropriate timeouts
- **Logging**: Comprehensive error logging

### 3. Security
- **Authentication**: Strong ESL password
- **Network Security**: Firewall rules, VPN access
- **ACL Configuration**: IP-based access control

### 4. Performance
- **Event Filtering**: Subscribe only to needed events
- **Async Operations**: Use bgapi for non-blocking calls
- **Resource Management**: Proper cleanup of resources

### 5. Monitoring
- **Metrics Collection**: Connection status, call volumes
- **Alerting**: Notify on connection failures
- **Performance Tracking**: Response times, error rates

## Common Use Cases

### 1. Call Origination
```typescript
async makeCall(from: string, to: string): Promise<string> {
  const uuid = await this.eslService.originate(
    `{origination_caller_id_number=${from}}sofia/internal/${to}@domain.com`,
    'default'
  );
  return uuid;
}
```

### 2. Call Control
```typescript
async controlCall(uuid: string, action: string, params?: any): Promise<void> {
  switch (action) {
    case 'hold':
      await this.eslService.connection.api('uuid_hold', uuid);
      break;
    case 'unhold':
      await this.eslService.connection.api('uuid_hold', `${uuid} off`);
      break;
    case 'mute':
      await this.eslService.connection.api('uuid_audio', `${uuid} start write mute`);
      break;
  }
}
```

### 3. Conference Management
```typescript
async createConference(name: string, profile: string = 'default'): Promise<void> {
  await this.eslService.connection.api('conference', `${name} bgdial sofia/internal/1000@domain.com`);
}

async addToConference(uuid: string, conference: string): Promise<void> {
  await this.eslService.transfer(uuid, `conference:${conference}`);
}
```

## Troubleshooting

### Common Issues
1. **Connection Refused**: Check FreeSWITCH ESL configuration
2. **Authentication Failed**: Verify ESL password
3. **Events Not Received**: Check event subscription
4. **API Timeouts**: Increase timeout values

### Debug Tips
- Enable ESL debug logging: `eslSetLogLevel(7)`
- Monitor FreeSWITCH logs: `/var/log/freeswitch/freeswitch.log`
- Use fs_cli for testing: `fs_cli -H localhost -P 8021 -p ClueCon`

## Resources

- [FreeSWITCH ESL Documentation](https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Client-and-Developer-Interfaces/Event-Socket-Library/)
- [node-esl GitHub](https://github.com/englercj/node-esl)
- [FreeSWITCH Event List](https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Introduction/Event-System/Event-List_7143557)

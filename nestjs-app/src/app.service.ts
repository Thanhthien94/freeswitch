import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FreeSWITCH PBX API is running!';
  }

  getVersion() {
    return {
      name: 'FreeSWITCH PBX API',
      version: '1.0.0',
      description: 'Enterprise PBX API with FreeSWITCH and NestJS',
      author: 'FreeSWITCH PBX Team',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

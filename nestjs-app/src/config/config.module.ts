import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { FreeSwitchConfig } from './entities/freeswitch-config.entity';
import { FreeSwitchConfigService } from './services/freeswitch-config.service';
import { ConfigAuditService } from './services/config-audit.service';
import { ConfigCacheService } from './services/config-cache.service';
import { FreeSwitchConfigController } from './controllers/freeswitch-config.controller';
import { EslModule } from '../esl/esl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FreeSwitchConfig]),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://redis:6379',
    }),
    EslModule,
  ],
  controllers: [FreeSwitchConfigController],
  providers: [
    FreeSwitchConfigService,
    ConfigAuditService,
    // ConfigCacheService, // Temporarily disabled
  ],
  exports: [
    FreeSwitchConfigService,
    ConfigAuditService,
    // ConfigCacheService, // Temporarily disabled
  ],
})
export class ConfigModule {}

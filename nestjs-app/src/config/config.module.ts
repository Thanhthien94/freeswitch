import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { FreeSwitchConfig } from './entities/freeswitch-config.entity';
import { FreeSwitchConfigService } from './services/freeswitch-config.service';
import { FreeSwitchDirectoryService } from './services/freeswitch-directory.service';
import { FreeSwitchImportService } from './services/freeswitch-import.service';
import { ConfigAuditService } from './services/config-audit.service';
import { ConfigCacheService } from './services/config-cache.service';
import { FreeSwitchConfigController } from './controllers/freeswitch-config.controller';
import { FreeSwitchSyncListener } from './listeners/freeswitch-sync.listener';
import { EslModule } from '../esl/esl.module';
import { Domain } from '../auth/entities/domain.entity';
import { Extension } from '../extensions/extension.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FreeSwitchConfig, Domain, Extension]),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://redis:6379',
    }),
    EslModule,
  ],
  controllers: [FreeSwitchConfigController],
  providers: [
    FreeSwitchConfigService,
    FreeSwitchDirectoryService,
    FreeSwitchImportService,
    FreeSwitchSyncListener,
    ConfigAuditService,
    // ConfigCacheService, // Temporarily disabled
  ],
  exports: [
    FreeSwitchConfigService,
    FreeSwitchDirectoryService,
    FreeSwitchImportService,
    ConfigAuditService,
    // ConfigCacheService, // Temporarily disabled
  ],
})
export class ConfigModule {}

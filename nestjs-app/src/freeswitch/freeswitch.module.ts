import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Domain } from './entities/domain.entity';
import { FreeSwitchSipProfile } from './entities/freeswitch-sip-profile.entity';
import { FreeSwitchGateway } from './entities/freeswitch-gateway.entity';
import { FreeSwitchDialplan } from './entities/freeswitch-dialplan.entity';
import { FreeSwitchExtension } from './entities/freeswitch-extension.entity';
import { FreeSwitchConfigVersion, FreeSwitchConfigDeployment } from './entities/freeswitch-config-version.entity';
import { GlobalNetworkConfig } from './entities/global-network-config.entity';

// Controllers
import { FreeSwitchSipProfileController } from './controllers/freeswitch-sip-profile.controller';
import { FreeSwitchGatewayController } from './controllers/freeswitch-gateway.controller';
import { FreeSwitchDialplanController } from './controllers/freeswitch-dialplan.controller';
import { FreeSwitchExtensionController } from './controllers/freeswitch-extension.controller';
import { FreeSwitchConfigController } from './controllers/freeswitch-config.controller';

// Services
import { FreeSwitchSipProfileService } from './services/freeswitch-sip-profile.service';
import { FreeSwitchGatewayService } from './services/freeswitch-gateway.service';
import { FreeSwitchDialplanService } from './services/freeswitch-dialplan.service';
import { FreeSwitchExtensionService } from './services/freeswitch-extension.service';
import { FreeSwitchXmlGeneratorService } from './services/freeswitch-xml-generator.service';
import { FreeSwitchEslService } from './services/freeswitch-esl.service';
import { FreeSwitchVersionService } from './services/freeswitch-version.service';
import { FreeSwitchConfigService } from './services/freeswitch-config.service';
import { FreeSwitchDirectorySyncService } from './services/freeswitch-directory-sync.service';
import { GlobalNetworkConfigService } from './services/global-network-config.service';
import { FreeSwitchConfigApplyService } from './services/freeswitch-config-apply.service';

import { FreeSwitchDomainController } from './controllers/freeswitch-domain.controller';
import { FreeSwitchDirectorySyncController } from './controllers/freeswitch-directory-sync.controller';
import { GlobalNetworkConfigController } from './controllers/global-network-config.controller';

// Shared modules
import { SharedModule } from '../shared/shared.module';
import { EslModule } from '../esl/esl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Domain,
      FreeSwitchSipProfile,
      FreeSwitchGateway,
      FreeSwitchDialplan,
      FreeSwitchExtension,
      FreeSwitchConfigVersion,
      FreeSwitchConfigDeployment,
      GlobalNetworkConfig,
    ]),
    SharedModule,
    EslModule,
  ],
  controllers: [
    FreeSwitchSipProfileController,
    FreeSwitchGatewayController,
    FreeSwitchDialplanController,
    FreeSwitchExtensionController,
    FreeSwitchConfigController,
    FreeSwitchDomainController,
    FreeSwitchDirectorySyncController,
    GlobalNetworkConfigController,
  ],
  providers: [
    FreeSwitchSipProfileService,
    FreeSwitchGatewayService,
    FreeSwitchDialplanService,
    FreeSwitchExtensionService,
    FreeSwitchXmlGeneratorService,
    FreeSwitchEslService,
    FreeSwitchVersionService,
    FreeSwitchConfigService,
    FreeSwitchDirectorySyncService,
    GlobalNetworkConfigService,
    FreeSwitchConfigApplyService,
  ],
  exports: [
    FreeSwitchSipProfileService,
    FreeSwitchGatewayService,
    FreeSwitchDialplanService,
    FreeSwitchExtensionService,
    FreeSwitchXmlGeneratorService,
    FreeSwitchEslService,
    FreeSwitchVersionService,
    FreeSwitchConfigService,
    FreeSwitchDirectorySyncService,
    GlobalNetworkConfigService,
    FreeSwitchConfigApplyService,
  ],
})
export class FreeSwitchModule {}

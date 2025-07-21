import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Domain } from './entities/domain.entity';
import { FreeSwitchSipProfile } from './entities/freeswitch-sip-profile.entity';
import { FreeSwitchGateway } from './entities/freeswitch-gateway.entity';
import { FreeSwitchDialplan } from './entities/freeswitch-dialplan.entity';
import { FreeSwitchExtension } from './entities/freeswitch-extension.entity';
import { FreeSwitchConfigVersion, FreeSwitchConfigDeployment } from './entities/freeswitch-config-version.entity';

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
  ],
})
export class FreeSwitchModule {}

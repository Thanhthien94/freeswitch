import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Extension } from './extension.entity';
import { ExtensionService } from './extension.service';
import { ExtensionController } from './extension.controller';
import { AuthModule } from '../auth/auth.module';
import { DomainModule } from '../domains/domain.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Extension]),
    forwardRef(() => DomainModule),
    UsersModule,
    AuthModule,
  ],
  controllers: [ExtensionController],
  providers: [ExtensionService],
  exports: [ExtensionService],
})
export class ExtensionModule {}

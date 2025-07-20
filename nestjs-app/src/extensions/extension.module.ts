import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Extension } from './extension.entity';
import { ExtensionService } from './extension.service';
import { ExtensionController } from './extension.controller';
import { DomainModule } from '../domains/domain.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

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

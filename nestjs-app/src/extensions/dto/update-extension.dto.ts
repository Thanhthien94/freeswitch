import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateExtensionDto } from './create-extension.dto';

export class UpdateExtensionDto extends PartialType(
  OmitType(CreateExtensionDto, ['extension', 'domainId'] as const)
) {}

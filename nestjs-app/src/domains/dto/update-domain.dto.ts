import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDomainDto } from './create-domain.dto';

export class UpdateDomainDto extends PartialType(
  OmitType(CreateDomainDto, ['name'] as const)
) {}

import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsEmail, Length, Matches } from 'class-validator';
import { ExtensionType, ExtensionStatus } from '../extension.entity';

export class CreateExtensionDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[0-9]+$/, { message: 'Extension must contain only numbers' })
  extension: string;

  @IsString()
  domainId: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsString()
  @Length(1, 100)
  displayName: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsOptional()
  @IsEnum(ExtensionType)
  type?: ExtensionType;

  @IsOptional()
  @IsEnum(ExtensionStatus)
  status?: ExtensionStatus;

  @IsString()
  @Length(6, 50)
  password: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  authId?: string;

  // Call Settings
  @IsOptional()
  @IsString()
  @Length(0, 100)
  callerIdName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  callerIdNumber?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  outboundCallerIdName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  outboundCallerIdNumber?: string;

  // Voicemail Settings
  @IsOptional()
  @IsBoolean()
  voicemailEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  voicemailPassword?: string;

  @IsOptional()
  @IsEmail()
  voicemailEmail?: string;

  @IsOptional()
  @IsBoolean()
  voicemailAttachFile?: boolean;

  @IsOptional()
  @IsBoolean()
  voicemailDeleteFile?: boolean;

  // Call Forwarding
  @IsOptional()
  @IsBoolean()
  callForwardEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  callForwardDestination?: string;

  @IsOptional()
  @IsBoolean()
  callForwardOnBusy?: boolean;

  @IsOptional()
  @IsBoolean()
  callForwardOnNoAnswer?: boolean;

  @IsOptional()
  @IsNumber()
  callForwardTimeout?: number;

  // Call Recording
  @IsOptional()
  @IsBoolean()
  callRecordingEnabled?: boolean;

  @IsOptional()
  @IsString()
  callRecordingMode?: string;

  // DND and Presence
  @IsOptional()
  @IsBoolean()
  dndEnabled?: boolean;

  @IsOptional()
  @IsString()
  presenceId?: string;

  // Advanced Settings
  @IsOptional()
  @IsNumber()
  maxCalls?: number;

  @IsOptional()
  @IsNumber()
  callTimeout?: number;

  @IsOptional()
  @IsString()
  callGroup?: string;

  @IsOptional()
  @IsString()
  pickupGroup?: string;

  @IsOptional()
  @IsString()
  codecPrefs?: string;

  @IsOptional()
  @IsBoolean()
  forcePing?: boolean;

  @IsOptional()
  @IsString()
  sipForceContact?: string;

  @IsOptional()
  @IsNumber()
  sipForceExpires?: number;

  @IsOptional()
  variables?: Record<string, any>;
}

export enum ExtensionType {
  USER = 'user',
  CONFERENCE = 'conference',
  QUEUE = 'queue',
  IVR = 'ivr',
}

export enum ExtensionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface Extension {
  id: string;
  extension: string;
  domainId: string;
  displayName?: string;
  description?: string;
  type: ExtensionType;
  status: ExtensionStatus;
  context?: string;
  callerIdName?: string;
  callerIdNumber?: string;
  callGroup?: string;
  pickupGroup?: string;
  maxCalls?: number;
  callTimeout?: number;
  recordCalls?: boolean;
  hangupAfterBridge?: boolean;
  continueOnFail?: boolean;
  authId?: string;
  isRegistered?: boolean;
  lastRegistration?: string;
  registrationIp?: string;
  userAgent?: string;
  expires?: string;
  createdAt: string;
  updatedAt: string;
  domain?: {
    id: string;
    name: string;
    displayName?: string;
  };
}

export interface CreateExtensionDto {
  extension: string;
  domainId: string;
  displayName?: string;
  description?: string;
  type: ExtensionType;
  status: ExtensionStatus;
  context?: string;
  callerIdName?: string;
  callerIdNumber?: string;
  callGroup?: string;
  pickupGroup?: string;
  maxCalls?: number;
  callTimeout?: number;
  recordCalls?: boolean;
  hangupAfterBridge?: boolean;
  continueOnFail?: boolean;
  password?: string;
}

export interface UpdateExtensionDto extends Partial<CreateExtensionDto> {
  password?: string;
}

export interface ExtensionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  type?: ExtensionType;
  status?: ExtensionStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExtensionResponse {
  data: Extension[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExtensionStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  registered: number;
  byType: Record<ExtensionType, number>;
  byDomain: Record<string, number>;
}

export interface ExtensionCallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
}

export interface ResetPasswordResponse {
  message: string;
  plainPassword: string;
}

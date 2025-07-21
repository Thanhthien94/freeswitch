/**
 * JWT Payload Interface
 * Defines the structure of JWT token payload
 */
export interface JwtPayload {
  sub: string | number; // Subject (user ID) - can be string or number
  username: string;
  email?: string;
  domainId?: string;
  roles?: string[];
  permissions?: string[];
  primaryRole?: string;
  sessionId?: string;
  tokenType?: 'access' | 'refresh' | 'websocket';
  iat?: number; // Issued at
  exp?: number; // Expires at
  aud?: string; // Audience
  iss?: string; // Issuer
}

/**
 * Enhanced JWT Payload for Professional Auth System
 */
export interface EnhancedJwtPayload extends JwtPayload {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  timezone?: string;
  lastLoginAt?: Date;
  mfaEnabled?: boolean;
  requirePasswordChange?: boolean;
  clientIp?: string;
  userAgent?: string;
}

/**
 * JWT Token Response Interface
 */
export interface JwtTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * JWT Validation Result Interface
 */
export interface JwtValidationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
  expired?: boolean;
}

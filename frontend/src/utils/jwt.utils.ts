/**
 * JWT Utility Functions
 * Enhanced token validation and management
 */

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  domainId: string;
  roles: string[];
  permissions: string[];
  primaryRole: string;
  sessionId: string;
  tokenType: string;
  iat: number;
  exp: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number; // seconds until expiry
  payload: JWTPayload | null;
  error?: string;
}

/**
 * Decode JWT token without verification
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Validate JWT token
 */
export const validateToken = (token: string | null): TokenValidationResult => {
  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      expiresIn: 0,
      payload: null,
      error: 'No token provided'
    };
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return {
      isValid: false,
      isExpired: true,
      expiresIn: 0,
      payload: null,
      error: 'Invalid token format'
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp <= now;
  const expiresIn = payload.exp - now;

  return {
    isValid: !isExpired,
    isExpired,
    expiresIn: Math.max(0, expiresIn),
    payload,
    error: isExpired ? 'Token expired' : undefined
  };
};

/**
 * Check if token needs refresh (expires in less than 5 minutes)
 */
export const shouldRefreshToken = (token: string | null): boolean => {
  const validation = validateToken(token);
  return validation.isValid && validation.expiresIn < 300; // 5 minutes
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = (token: string | null): Date | null => {
  const payload = token ? decodeJWT(token) : null;
  return payload ? new Date(payload.exp * 1000) : null;
};

/**
 * Check if user has specific permission from token
 */
export const hasPermissionFromToken = (token: string | null, permission: string): boolean => {
  const payload = token ? decodeJWT(token) : null;
  if (!payload) return false;
  
  return payload.permissions.includes(permission) || payload.permissions.includes('*:manage');
};

/**
 * Check if user has specific role from token
 */
export const hasRoleFromToken = (token: string | null, role: string): boolean => {
  const payload = token ? decodeJWT(token) : null;
  if (!payload) return false;
  
  return payload.roles.includes(role);
};

/**
 * Get user info from token
 */
export const getUserFromToken = (token: string | null): Partial<JWTPayload> | null => {
  const payload = token ? decodeJWT(token) : null;
  if (!payload) return null;
  
  return {
    sub: payload.sub,
    username: payload.username,
    email: payload.email,
    domainId: payload.domainId,
    roles: payload.roles,
    permissions: payload.permissions,
    primaryRole: payload.primaryRole
  };
};

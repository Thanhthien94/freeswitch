import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';

interface ErrorContext {
  requestId: string;
  method: string;
  url: string;
  clientIp: string;
  userAgent: string;
  userId?: string;
  timestamp: string;
  requestBody?: any;
  queryParams?: any;
  headers?: any;
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  statusCode: number;
  context: ErrorContext;
  additionalInfo?: any;
}

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request['requestId'] || this.generateRequestId();

    return next.handle().pipe(
      catchError((error) => {
        const errorDetails = this.buildErrorDetails(error, request, requestId);
        this.logError(errorDetails);
        
        // Re-throw the error to maintain normal error handling flow
        return throwError(() => error);
      })
    );
  }

  private buildErrorDetails(error: any, request: Request, requestId: string): ErrorDetails {
    const context: ErrorContext = {
      requestId,
      method: request.method,
      url: request.url,
      clientIp: this.getClientIp(request),
      userAgent: request.headers['user-agent'] || 'Unknown',
      userId: (request['user'] as any)?.id || (request['user'] as any)?.userId,
      timestamp: new Date().toISOString(),
      requestBody: this.sanitizeData(request.body),
      queryParams: request.query,
      headers: this.sanitizeHeaders(request.headers),
    };

    const statusCode = error instanceof HttpException 
      ? error.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      name: error.name || 'UnknownError',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      statusCode,
      context,
      additionalInfo: this.extractAdditionalInfo(error),
    };
  }

  private logError(errorDetails: ErrorDetails): void {
    const { statusCode, name, message, context } = errorDetails;
    const { requestId, method, url, clientIp, userId } = context;

    // Determine log level based on status code
    if (statusCode >= 500) {
      // Server errors - log as error
      this.logger.error(
        `🔴 SERVER ERROR [${requestId}] ${method} ${url} - ${statusCode} ${name}: ${message}`,
        {
          ...errorDetails,
          severity: 'HIGH',
          category: 'SERVER_ERROR',
        }
      );
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `🟡 CLIENT ERROR [${requestId}] ${method} ${url} - ${statusCode} ${name}: ${message}`,
        {
          ...errorDetails,
          severity: 'MEDIUM',
          category: 'CLIENT_ERROR',
        }
      );
    } else {
      // Other errors - log as info
      this.logger.log(
        `🔵 ERROR [${requestId}] ${method} ${url} - ${statusCode} ${name}: ${message}`,
        {
          ...errorDetails,
          severity: 'LOW',
          category: 'OTHER_ERROR',
        }
      );
    }

    // Log specific error patterns
    this.logSpecificErrorPatterns(errorDetails);
  }

  private logSpecificErrorPatterns(errorDetails: ErrorDetails): void {
    const { name, message, statusCode, context } = errorDetails;

    // Database connection errors
    if (name.includes('Connection') || message.includes('database')) {
      this.logger.error(
        `🗄️ DATABASE ERROR [${context.requestId}] - ${message}`,
        {
          ...errorDetails,
          category: 'DATABASE_ERROR',
          priority: 'CRITICAL',
        }
      );
    }

    // Authentication/Authorization errors
    if (statusCode === 401 || statusCode === 403) {
      this.logger.warn(
        `🔐 AUTH ERROR [${context.requestId}] - ${message} from ${context.clientIp}`,
        {
          ...errorDetails,
          category: 'AUTH_ERROR',
          securityEvent: true,
        }
      );
    }

    // Validation errors
    if (statusCode === 400 && name.includes('Validation')) {
      this.logger.warn(
        `📝 VALIDATION ERROR [${context.requestId}] - ${message}`,
        {
          ...errorDetails,
          category: 'VALIDATION_ERROR',
        }
      );
    }

    // Rate limiting errors
    if (statusCode === 429) {
      this.logger.warn(
        `🚦 RATE LIMIT ERROR [${context.requestId}] - ${context.clientIp}`,
        {
          ...errorDetails,
          category: 'RATE_LIMIT_ERROR',
          securityEvent: true,
        }
      );
    }
  }

  private extractAdditionalInfo(error: any): any {
    const additionalInfo: any = {};

    // Extract validation errors
    if (error.response?.message && Array.isArray(error.response.message)) {
      additionalInfo.validationErrors = error.response.message;
    }

    // Extract database errors
    if (error.code) {
      additionalInfo.errorCode = error.code;
    }

    if (error.detail) {
      additionalInfo.detail = error.detail;
    }

    // Extract HTTP exception response
    if (error instanceof HttpException) {
      additionalInfo.httpExceptionResponse = error.getResponse();
    }

    return Object.keys(additionalInfo).length > 0 ? additionalInfo : undefined;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private generateRequestId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

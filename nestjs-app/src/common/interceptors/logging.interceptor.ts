import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate unique request ID
    const requestId = this.generateRequestId();
    request['requestId'] = requestId;

    // Extract request information
    const { method, url, headers, body, query, params } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const clientIp = this.getClientIp(request);
    const contentLength = headers['content-length'] || '0';

    // Log incoming request
    this.logger.log(
      `🔵 INCOMING REQUEST [${requestId}]`,
      {
        requestId,
        method,
        url,
        clientIp,
        userAgent,
        contentLength,
        query: Object.keys(query).length > 0 ? query : undefined,
        params: Object.keys(params).length > 0 ? params : undefined,
        body: this.sanitizeBody(body),
        headers: this.sanitizeHeaders(headers),
        timestamp: new Date().toISOString(),
      }
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.logger.log(
          `🟢 RESPONSE SUCCESS [${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms`,
          {
            requestId,
            method,
            url,
            statusCode,
            duration,
            responseSize: JSON.stringify(data).length,
            clientIp,
            timestamp: new Date().toISOString(),
          }
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.error(
          `🔴 RESPONSE ERROR [${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms`,
          {
            requestId,
            method,
            url,
            statusCode,
            duration,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
            clientIp,
            timestamp: new Date().toISOString(),
          }
        );

        throw error;
      })
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      if (obj && typeof obj === 'object') {
        const result = { ...obj };
        Object.keys(result).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '[REDACTED]';
          } else if (typeof result[key] === 'object') {
            result[key] = sanitizeObject(result[key]);
          }
        });
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }
}

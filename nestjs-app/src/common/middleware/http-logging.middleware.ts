import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  originalUrl: string;
  clientIp: string;
  userAgent: string;
  contentType?: string;
  contentLength?: string;
  referer?: string;
  timestamp: string;
  headers: any;
  query: any;
  params: any;
  body?: any;
}

interface ResponseLog {
  requestId: string;
  statusCode: number;
  statusMessage: string;
  responseTime: number;
  contentLength?: string;
  timestamp: string;
}

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Attach request ID to request object for use in other interceptors
    req['requestId'] = requestId;

    // Log incoming request
    this.logRequest(req, requestId);

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Override response methods to capture response data
    res.send = function(body: any) {
      res.locals.responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      res.locals.responseBody = body;
      return originalJson.call(this, body);
    };

    res.end = function(chunk?: any, encoding?: any) {
      if (chunk) {
        res.locals.responseBody = chunk;
      }
      return originalEnd.call(this, chunk, encoding);
    };

    // Log response when finished
    res.on('finish', () => {
      this.logResponse(req, res, requestId, startTime);
    });

    // Log response on close (for aborted requests)
    res.on('close', () => {
      if (!res.headersSent) {
        this.logAbortedRequest(req, requestId, startTime);
      }
    });

    next();
  }

  private logRequest(req: Request, requestId: string): void {
    const requestLog: RequestLog = {
      requestId,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      clientIp: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || 'Unknown',
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      referer: req.headers['referer'],
      timestamp: new Date().toISOString(),
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      body: this.sanitizeBody(req.body),
    };

    // Skip logging for health checks and static assets
    if (this.shouldSkipLogging(req.url)) {
      return;
    }

    this.logger.log(
      `📥 HTTP REQUEST [${requestId}] ${req.method} ${req.url}`,
      requestLog
    );
  }

  private logResponse(req: Request, res: Response, requestId: string, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    const responseLog: ResponseLog = {
      requestId,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage || '',
      responseTime,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
    };

    // Skip logging for health checks and static assets
    if (this.shouldSkipLogging(req.url)) {
      return;
    }

    // Determine log level based on status code and response time
    if (res.statusCode >= 500) {
      this.logger.error(
        `📤 HTTP RESPONSE [${requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`,
        {
          ...responseLog,
          responseBody: this.sanitizeResponseBody(res.locals.responseBody),
        }
      );
    } else if (res.statusCode >= 400) {
      this.logger.warn(
        `📤 HTTP RESPONSE [${requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`,
        responseLog
      );
    } else if (responseTime > 1000) {
      this.logger.warn(
        `📤 HTTP RESPONSE [${requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms (SLOW)`,
        responseLog
      );
    } else {
      this.logger.log(
        `📤 HTTP RESPONSE [${requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`,
        responseLog
      );
    }
  }

  private logAbortedRequest(req: Request, requestId: string, startTime: number): void {
    const responseTime = Date.now() - startTime;

    this.logger.warn(
      `❌ HTTP REQUEST ABORTED [${requestId}] ${req.method} ${req.url} - ${responseTime}ms`,
      {
        requestId,
        method: req.method,
        url: req.url,
        responseTime,
        timestamp: new Date().toISOString(),
      }
    );
  }

  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/robots.txt',
      '/.well-known',
    ];

    return skipPatterns.some(pattern => url.startsWith(pattern));
  }

  private generateRequestId(): string {
    return `http_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
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

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const sanitized = { ...body };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponseBody(body: any): any {
    if (!body) return undefined;

    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;
      
      // Limit response body size in logs
      const bodyString = JSON.stringify(parsed);
      if (bodyString.length > 1000) {
        return `[RESPONSE_BODY:${bodyString.length}chars]`;
      }

      return parsed;
    } catch {
      return '[INVALID_JSON]';
    }
  }
}

import { Logger } from '@nestjs/common';

export class DatabaseLogger {
  private readonly logger = new Logger('DatabaseQuery');
  private readonly slowQueryThreshold = 1000; // 1 second

  logQuery(query: string, parameters?: any[], queryRunner?: any): void {
    const startTime = Date.now();
    
    this.logger.debug(
      `🗄️ EXECUTING QUERY`,
      {
        query: this.sanitizeQuery(query),
        parameters: this.sanitizeParameters(parameters),
        timestamp: new Date().toISOString(),
      }
    );

    // Store start time for duration calculation
    if (queryRunner) {
      queryRunner._startTime = startTime;
    }
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: any): void {
    const duration = queryRunner?._startTime ? Date.now() - queryRunner._startTime : 0;

    this.logger.error(
      `🔴 QUERY ERROR - ${duration}ms`,
      {
        error,
        query: this.sanitizeQuery(query),
        parameters: this.sanitizeParameters(parameters),
        duration,
        timestamp: new Date().toISOString(),
      }
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: any): void {
    if (time > this.slowQueryThreshold) {
      this.logger.warn(
        `🐌 SLOW QUERY - ${time}ms`,
        {
          query: this.sanitizeQuery(query),
          parameters: this.sanitizeParameters(parameters),
          duration: time,
          threshold: this.slowQueryThreshold,
          timestamp: new Date().toISOString(),
        }
      );
    } else {
      this.logger.debug(
        `✅ QUERY COMPLETED - ${time}ms`,
        {
          query: this.sanitizeQuery(query),
          duration: time,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  logSchemaBuild(message: string): void {
    this.logger.log(
      `🏗️ SCHEMA BUILD: ${message}`,
      {
        timestamp: new Date().toISOString(),
      }
    );
  }

  logMigration(message: string): void {
    this.logger.log(
      `🔄 MIGRATION: ${message}`,
      {
        timestamp: new Date().toISOString(),
      }
    );
  }

  log(level: 'log' | 'info' | 'warn' | 'error', message: any, queryRunner?: any): void {
    const logMethod = level === 'info' ? 'log' : level;
    
    this.logger[logMethod](
      `📊 DATABASE: ${message}`,
      {
        level,
        timestamp: new Date().toISOString(),
      }
    );
  }

  private sanitizeQuery(query: string): string {
    if (!query) return '';

    // Remove excessive whitespace and newlines for cleaner logs
    return query
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500) + (query.length > 500 ? '...' : '');
  }

  private sanitizeParameters(parameters?: any[]): any[] {
    if (!parameters || !Array.isArray(parameters)) {
      return [];
    }

    return parameters.map((param, index) => {
      // Redact sensitive data
      if (typeof param === 'string') {
        if (param.length > 100) {
          return `[LONG_STRING:${param.length}chars]`;
        }
        // Check for potential sensitive data patterns
        if (this.isSensitiveData(param)) {
          return '[REDACTED]';
        }
      }

      if (typeof param === 'object' && param !== null) {
        return '[OBJECT]';
      }

      return param;
    });
  }

  private isSensitiveData(value: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /bearer/i,
      /jwt/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(value));
  }
}

// Custom TypeORM logger
export class CustomTypeOrmLogger extends DatabaseLogger {
  logQuery(query: string, parameters?: any[], queryRunner?: any): void {
    super.logQuery(query, parameters, queryRunner);
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: any): void {
    super.logQueryError(error, query, parameters, queryRunner);
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: any): void {
    super.logQuerySlow(time, query, parameters, queryRunner);
  }

  logSchemaBuild(message: string): void {
    super.logSchemaBuild(message);
  }

  logMigration(message: string): void {
    super.logMigration(message);
  }

  log(level: 'log' | 'info' | 'warn' | 'error', message: any, queryRunner?: any): void {
    super.log(level, message, queryRunner);
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: string;
  statusCode?: number;
  error?: boolean;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second
  private readonly memoryWarningThreshold = 100 * 1024 * 1024; // 100MB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    
    const startTime = process.hrtime.bigint();
    const startCpuUsage = process.cpuUsage();
    const startMemory = process.memoryUsage();
    const requestId = request['requestId'] || this.generateRequestId();

    return next.handle().pipe(
      tap((data) => {
        this.logPerformanceMetrics(
          request,
          response,
          startTime,
          startCpuUsage,
          startMemory,
          requestId,
          false
        );
      }),
      catchError((error) => {
        this.logPerformanceMetrics(
          request,
          response,
          startTime,
          startCpuUsage,
          startMemory,
          requestId,
          true
        );
        throw error;
      })
    );
  }

  private logPerformanceMetrics(
    request: Request,
    response: any,
    startTime: bigint,
    startCpuUsage: NodeJS.CpuUsage,
    startMemory: NodeJS.MemoryUsage,
    requestId: string,
    hasError: boolean
  ): void {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    const currentMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      requestId,
      method: request.method,
      url: request.url,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      memoryUsage: {
        rss: currentMemory.rss - startMemory.rss,
        heapTotal: currentMemory.heapTotal - startMemory.heapTotal,
        heapUsed: currentMemory.heapUsed - startMemory.heapUsed,
        external: currentMemory.external - startMemory.external,
        arrayBuffers: currentMemory.arrayBuffers - startMemory.arrayBuffers,
      },
      cpuUsage: endCpuUsage,
      timestamp: new Date().toISOString(),
      statusCode: response.statusCode,
      error: hasError,
    };

    // Log performance metrics
    if (duration > this.slowRequestThreshold) {
      this.logger.warn(
        `🐌 SLOW REQUEST [${requestId}] ${request.method} ${request.url} - ${duration}ms`,
        metrics
      );
    } else {
      this.logger.debug(
        `⚡ PERFORMANCE [${requestId}] ${request.method} ${request.url} - ${duration}ms`,
        metrics
      );
    }

    // Check memory usage
    if (currentMemory.heapUsed > this.memoryWarningThreshold) {
      this.logger.warn(
        `🧠 HIGH MEMORY USAGE [${requestId}] - ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`,
        {
          requestId,
          memoryUsage: currentMemory,
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Log CPU usage if significant
    if (endCpuUsage.user > 100000 || endCpuUsage.system > 100000) { // 100ms
      this.logger.warn(
        `🔥 HIGH CPU USAGE [${requestId}] - User: ${endCpuUsage.user}μs, System: ${endCpuUsage.system}μs`,
        {
          requestId,
          cpuUsage: endCpuUsage,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  private generateRequestId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

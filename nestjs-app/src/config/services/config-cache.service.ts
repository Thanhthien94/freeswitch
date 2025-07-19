import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { FreeSwitchConfig } from '../entities/freeswitch-config.entity';

@Injectable()
export class ConfigCacheService {
  private readonly logger = new Logger(ConfigCacheService.name);
  private readonly CACHE_PREFIX = 'freeswitch:config:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Get cached configuration
   */
  async getConfig(category: string, name?: string): Promise<FreeSwitchConfig | FreeSwitchConfig[] | null> {
    try {
      const key = name 
        ? `${this.CACHE_PREFIX}${category}:${name}`
        : `${this.CACHE_PREFIX}${category}:*`;

      if (name) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        const keys = await this.redis.keys(key);
        if (keys.length === 0) return null;

        const values = await this.redis.mget(keys);
        return values
          .filter(value => value !== null)
          .map(value => JSON.parse(value as string));
      }
    } catch (error) {
      this.logger.error(`Failed to get cached config: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache configuration
   */
  async setConfig(config: FreeSwitchConfig): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${config.category}:${config.name}`;
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(config));
      
      this.logger.debug(`Cached config: ${config.category}.${config.name}`);
    } catch (error) {
      this.logger.error(`Failed to cache config: ${error.message}`);
    }
  }

  /**
   * Cache multiple configurations
   */
  async setConfigs(configs: FreeSwitchConfig[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const config of configs) {
        const key = `${this.CACHE_PREFIX}${config.category}:${config.name}`;
        pipeline.setex(key, this.CACHE_TTL, JSON.stringify(config));
      }
      
      await pipeline.exec();
      this.logger.debug(`Cached ${configs.length} configurations`);
    } catch (error) {
      this.logger.error(`Failed to cache configs: ${error.message}`);
    }
  }

  /**
   * Invalidate cached configuration
   */
  async invalidateConfig(category: string, name?: string): Promise<void> {
    try {
      if (name) {
        const key = `${this.CACHE_PREFIX}${category}:${name}`;
        await this.redis.del(key);
        this.logger.debug(`Invalidated cache: ${category}.${name}`);
      } else {
        const keys = await this.redis.keys(`${this.CACHE_PREFIX}${category}:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.logger.debug(`Invalidated ${keys.length} cached configs for category: ${category}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache: ${error.message}`);
    }
  }

  /**
   * Invalidate all configuration cache
   */
  async invalidateAllConfigs(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Invalidated all ${keys.length} cached configurations`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate all cache: ${error.message}`);
    }
  }

  /**
   * Get cached vars.xml content
   */
  async getVarsXml(): Promise<string | null> {
    try {
      const key = `${this.CACHE_PREFIX}vars-xml:content`;
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Failed to get cached vars.xml: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache vars.xml content
   */
  async setVarsXml(content: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}vars-xml:content`;
      await this.redis.setex(key, this.CACHE_TTL, content);
      this.logger.debug('Cached vars.xml content');
    } catch (error) {
      this.logger.error(`Failed to cache vars.xml: ${error.message}`);
    }
  }

  /**
   * Invalidate vars.xml cache
   */
  async invalidateVarsXml(): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}vars-xml:content`;
      await this.redis.del(key);
      this.logger.debug('Invalidated vars.xml cache');
    } catch (error) {
      this.logger.error(`Failed to invalidate vars.xml cache: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    configKeys: number;
    varsXmlCached: boolean;
    memoryUsage: string;
  }> {
    try {
      const allKeys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      const configKeys = allKeys.filter(key => !key.includes('vars-xml'));
      const varsXmlKey = `${this.CACHE_PREFIX}vars-xml:content`;
      const varsXmlCached = await this.redis.exists(varsXmlKey);
      const memoryInfo = await this.redis.memory('USAGE', this.CACHE_PREFIX);

      return {
        totalKeys: allKeys.length,
        configKeys: configKeys.length,
        varsXmlCached: varsXmlCached === 1,
        memoryUsage: `${memoryInfo} bytes`,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        totalKeys: 0,
        configKeys: 0,
        varsXmlCached: false,
        memoryUsage: '0 bytes',
      };
    }
  }

  /**
   * Clear all cache data
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Cleared ${keys.length} cache entries`);
      } else {
        this.logger.log('No cache entries to clear');
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
      throw error;
    }
  }
}

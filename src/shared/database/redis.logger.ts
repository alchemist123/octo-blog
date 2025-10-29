import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisLoggerService implements OnModuleInit {
  private readonly logger = new Logger(RedisLoggerService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    try {
      // Test Redis connection by setting and getting a test key
      const testKey = 'connection_test_' + Date.now();
      const testValue = 'test';
      
      await this.cacheManager.set(testKey, testValue, 1); // 1 second TTL
      const retrieved = await this.cacheManager.get(testKey);
      
      if (retrieved === testValue) {
        // Get store info if available
        const stores = (this.cacheManager as any).stores || [];
        const store = stores[0] || (this.cacheManager as any).store;
        let host = 'localhost';
        let port = 6379;
        let status = 'Connected';
        
        // Try to extract connection info from ioredis client
        if (store?.client) {
          const client = store.client;
          host = client.options?.host || client.options?.hostname || 'localhost';
          port = client.options?.port || 6379;
          
          // Check connection status
          if (client.status === 'ready') {
            status = 'Connected';
          } else if (client.status === 'connecting') {
            status = 'Connecting';
          } else {
            status = client.status || 'Unknown';
          }
        }
        
        this.logger.log('✅ Redis connection established successfully');
        this.logger.log(`   Host: ${host}`);
        this.logger.log(`   Port: ${port}`);
        this.logger.log(`   Status: ${status}`);
        
        // Clean up test key
        try {
          await this.cacheManager.del(testKey);
        } catch (delError) {
          // Ignore cleanup errors
        }
      } else {
        throw new Error('Redis connection test failed - value mismatch');
      }
    } catch (error: any) {
      this.logger.error('❌ Redis connection failed:', error.message || error);
      this.logger.warn('⚠️  Redis unavailable - caching will be disabled');
      // Don't throw - Redis is optional for the app
    }
  }
}


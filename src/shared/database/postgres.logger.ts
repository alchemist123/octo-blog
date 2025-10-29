import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class PostgresLoggerService implements OnModuleInit {
  private readonly logger = new Logger(PostgresLoggerService.name);

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async onModuleInit() {
    // Wait a bit for PostgreSQL to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Retry connection with backoff
    let retries = 5;
    let delay = 3000; // Start with longer delay
    
    while (retries > 0) {
      try {
        // Test connection
        await this.sequelize.authenticate();
        
        // Get connection details
        const config = this.sequelize.config as any;
        
        this.logger.log('✅ PostgreSQL connection established successfully');
        this.logger.log(`   Host: ${config.host}`);
        this.logger.log(`   Port: ${config.port}`);
        this.logger.log(`   Database: ${config.database}`);
        this.logger.log(`   Username: ${config.username}`);
        this.logger.log(`   Dialect: ${config.dialect || 'postgres'}`);
        
        // Log pool configuration if available
        if (config.pool) {
          this.logger.log(`   Pool - Max: ${config.pool.max || 'N/A'}, Min: ${config.pool.min || 'N/A'}`);
        }
        return; // Success, exit retry loop
      } catch (error: any) {
        retries--;
        const errorMessage = error?.message || error?.parent?.message || String(error);
        const errorCode = error?.parent?.code || error?.code || 'UNKNOWN';
        
        if (retries === 0) {
          this.logger.error('❌ PostgreSQL connection failed after retries');
          this.logger.error(`   Error: ${errorMessage}`);
          this.logger.error(`   Code: ${errorCode}`);
          this.logger.warn('⚠️  Application will continue but database features may be unavailable');
          this.logger.warn('⚠️  Make sure PostgreSQL container is running: docker ps | grep postgres');
          // Don't throw - allow app to start even if DB is temporarily unavailable
          return;
        }
        this.logger.warn(`⚠️  PostgreSQL connection failed (${errorCode}), retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    // Try to access pool events if available
    try {
      const connectionManager = this.sequelize.connectionManager as any;
      if (connectionManager.pool) {
        connectionManager.pool.on('acquire', () => {
          this.logger.debug('PostgreSQL connection acquired from pool');
        });

        connectionManager.pool.on('release', () => {
          this.logger.debug('PostgreSQL connection released to pool');
        });

        connectionManager.pool.on('error', (error: Error) => {
          this.logger.error('❌ PostgreSQL pool error:', error.message);
        });
      }
    } catch (poolError) {
      // Pool events are optional, don't fail if not available
      this.logger.debug('Pool event listeners could not be attached');
    }
  }
}


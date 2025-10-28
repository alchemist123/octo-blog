import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoLoggerService implements OnModuleInit {
  private readonly logger = new Logger(MongoLoggerService.name);

  constructor(@InjectConnection('blog') private readonly connection: Connection) {}

  onModuleInit() {
    // Log when MongoDB connects
    this.connection.on('connected', () => {
      this.logger.log('✅ MongoDB connection established successfully');
      this.logger.log(`   Host: ${this.connection.host}`);
      this.logger.log(`   Port: ${this.connection.port}`);
      this.logger.log(`   Database: ${this.connection.name}`);
      this.logger.log(`   State: ${this.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });

    // Log when MongoDB disconnects
    this.connection.on('disconnected', () => {
      this.logger.warn('⚠️  MongoDB connection lost');
    });

    // Log connection errors
    this.connection.on('error', (error) => {
      this.logger.error('❌ MongoDB connection error:', error.message);
    });

    // Log when connection is closed
    this.connection.on('close', () => {
      this.logger.warn('MongoDB connection closed');
    });

    // Log reconnection attempts
    this.connection.on('reconnected', () => {
      this.logger.log('🔄 MongoDB reconnected successfully');
    });

    // Log when reconnection fails
    this.connection.on('reconnectFailed', () => {
      this.logger.error('❌ MongoDB reconnection failed');
    });
  }
}


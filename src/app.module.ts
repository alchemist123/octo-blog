import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import * as redisStore from 'cache-manager-ioredis-yet';
import { options as dbConfig } from './datasources/postgres';
import { UserModule } from './user/user.module';
import { AuthModule } from './authentication/auth.module';
import { SystemModule } from './system/system.module';
import { MushroomModule } from './mushroom/mushroom.module';
import { StoriesModule } from './stories/stories.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = configService.get<number>('REDIS_PORT') || 6379;
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        return {
          store: redisStore,
          host: redisHost,
          port: redisPort,
          ...(redisPassword && { password: redisPassword }),
          ttl: 300, // Default TTL: 5 minutes
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      connectionName: 'blog',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongodbUri = configService.get<string>('MONGODB_URI');
        
        // Check if running in Docker by looking at the connection string
        const isDocker = process.env.MONGODB_URI?.includes('mongodb:') || process.env.DOCKER === 'true';
        
        // Use local MongoDB URI if running locally
        const defaultUri = isDocker
          ? 'mongodb://mongouser:mongopass123@mongodb:27017/blog?authSource=admin'
          : 'mongodb://mongouser:mongopass123@localhost:27017/blog?authSource=admin';
        
        return {
          uri: mongodbUri || defaultUri,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRoot(dbConfig),
    DatabaseModule,
    UserModule,
    AuthModule,
    SystemModule,
    MushroomModule,
    StoriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

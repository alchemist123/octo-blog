import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { options as dbConfig } from './datasources/postgres';
import { UserModule } from './user/user.module';
import { AuthModule } from './authentication/auth.module';
import { SystemModule } from './system/system.module';
import { MushroomModule } from './mushroom/mushroom.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    UserModule,
    AuthModule,
    SystemModule,
    MushroomModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

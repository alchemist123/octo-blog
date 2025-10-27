import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
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
})
export class AppModule {}

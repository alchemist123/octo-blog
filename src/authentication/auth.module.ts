import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { MiddlewaresModule } from '../shared/middlewares/middlewares.module';
import { User } from '../shared/models/User';
import { Otp } from '../shared/models/Otp';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { errorHandler } from '../shared/middlewares/error-handler';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { GitLabStrategy } from './strategies/gitlab.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { OtpService } from '../shared/utilities/otp.service';
import { OtpVerificationInterceptor } from '../shared/interceptors/otp-verification.interceptor';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    MiddlewaresModule,
    SequelizeModule.forFeature([User, Otp]),
    UserModule,
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    errorHandler,
    JwtStrategy,
    JwtAuthGuard,
    GoogleStrategy,
    GitHubStrategy,
    GitLabStrategy,
    OtpService,
    OtpVerificationInterceptor,
  ],
  exports: [AuthService, PassportModule, JwtAuthGuard],
})
export class AuthModule {}

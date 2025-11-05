import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OtpService } from '../utilities/otp.service';
import { OtpType } from '../models/Otp';

@Injectable()
export class OtpVerificationInterceptor implements NestInterceptor {
  constructor(private readonly otpService: OtpService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    // Check if body exists
    if (!body) {
      throw new HttpException(
        'Request body is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Extract OTP details from request
    const { email, otpCode, type } = body;

    if (!email || !otpCode || !type) {
      throw new HttpException(
        'Email, OTP code, and type are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Map string type to OtpType enum
    const otpType = this.mapStringToOtpType(type);

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(email, otpCode, otpType);

    if (!isValid) {
      throw new HttpException(
        'Invalid or expired OTP code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Attach verified email to request for use in controller
    request.verifiedEmail = email;
    request.verifiedOtpType = otpType;

    return next.handle();
  }

  private mapStringToOtpType(type: string): OtpType {
    switch (type) {
      case 'login':
        return OtpType.LOGIN;
      case 'signup':
        return OtpType.SIGNUP;
      case 'reset-password':
        return OtpType.RESET_PASSWORD;
      case 'change-email':
        return OtpType.CHANGE_EMAIL;
      case 'verify-email':
        return OtpType.VERIFY_EMAIL;
      default:
        throw new HttpException('Invalid OTP type', HttpStatus.BAD_REQUEST);
    }
  }
}

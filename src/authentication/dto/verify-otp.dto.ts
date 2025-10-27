import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otpCode: string;

  @IsNotEmpty()
  @IsString()
  type: 'login' | 'signup' | 'reset-password' | 'change-email' | 'verify-email';
}

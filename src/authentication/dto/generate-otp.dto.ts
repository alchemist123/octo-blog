import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class GenerateOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['login', 'signup', 'reset-password', 'change-email', 'verify-email'], {
    message: 'Type must be one of: login, signup, reset-password, change-email, verify-email',
  })
  type: 'login' | 'signup' | 'reset-password' | 'change-email' | 'verify-email';
}

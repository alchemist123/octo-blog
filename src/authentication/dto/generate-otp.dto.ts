import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send OTP' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'login', 
    enum: ['login', 'signup', 'reset-password', 'change-email', 'verify-email'],
    description: 'Type of OTP request' 
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['login', 'signup', 'reset-password', 'change-email', 'verify-email'], {
    message: 'Type must be one of: login, signup, reset-password, change-email, verify-email',
  })
  type: 'login' | 'signup' | 'reset-password' | 'change-email' | 'verify-email';
}

import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code', minLength: 6, maxLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otpCode: string;

  @ApiProperty({ 
    example: 'login', 
    enum: ['login', 'signup', 'reset-password', 'change-email', 'verify-email'],
    description: 'Type of OTP request' 
  })
  @IsNotEmpty()
  @IsString()
  type: 'login' | 'signup' | 'reset-password' | 'change-email' | 'verify-email';
}

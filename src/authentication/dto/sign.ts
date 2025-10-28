import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class signupDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  public password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  public name: string;

  @ApiProperty({ example: 'johndoe', description: 'Unique username' })
  @IsNotEmpty()
  @IsString()
  public userName: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false, description: 'Display picture URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  public dp_url?: string;

  @ApiProperty({ example: 'I am a software developer', required: false, description: 'User biography' })
  @IsOptional()
  @IsString()
  public bio?: string;

  @ApiProperty({ example: 'New York, USA', required: false, description: 'User location' })
  @IsOptional()
  @IsString()
  public location?: string;

  @ApiProperty({ example: [], required: false, description: 'Personal website links' })
  @IsOptional()
  @IsArray()
  public personal_website?: any[];
}

export class loginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  public password: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsNotEmpty()
  @IsString()
  public otpCode: string;

  @ApiProperty({ example: 'login', description: 'OTP type' })
  @IsNotEmpty()
  @IsString()
  public type: string;
}

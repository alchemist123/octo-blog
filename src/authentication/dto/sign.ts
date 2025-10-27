import { IsEmail, IsNotEmpty, IsString, IsUrl, IsOptional, IsArray } from 'class-validator';

export class signupDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsNotEmpty()
  @IsString()
  public userName: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  public dp_url?: string;

  @IsOptional()
  @IsString()
  public bio?: string;

  @IsOptional()
  @IsString()
  public location?: string;

  @IsOptional()
  @IsArray()
  public personal_website?: any[];
}

export class loginDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;
}

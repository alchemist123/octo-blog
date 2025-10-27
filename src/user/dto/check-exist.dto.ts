import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CheckExistDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['email', 'username'], {
    message: 'Type must be either "email" or "username"',
  })
  type: 'email' | 'username';

  @IsNotEmpty()
  @IsString()
  value: string;
}

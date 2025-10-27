import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddInterestDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  interest: string;
}

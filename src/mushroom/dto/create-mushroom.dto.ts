import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsUrl,
  IsNumber,
} from 'class-validator';

export class CreateMushroomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['closed', 'open'], {
    message: 'Status must be either "closed" or "open"',
  })
  status?: 'closed' | 'open';

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'dp_url must be a valid URL' })
  dp_url?: string;

  @IsOptional()
  @IsNumber()
  subscribers?: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['dev', 'art', 'entertainment', 'other', 'philosophy'], {
    message: 'Type must be one of: dev, art, entertainment, other, philosophy',
  })
  type: 'dev' | 'art' | 'entertainment' | 'other' | 'philosophy';
}

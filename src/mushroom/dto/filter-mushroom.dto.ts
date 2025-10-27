import { IsOptional, IsString, IsIn, IsUUID, ValidateIf, IsNotEmpty } from 'class-validator';

export class FilterMushroomDto {
  @IsOptional()
  @IsString()
  @IsIn(['dev', 'art', 'entertainment', 'other', 'philosophy'], {
    message: 'Type must be one of: dev, art, entertainment, other, philosophy',
  })
  type?: 'dev' | 'art' | 'entertainment' | 'other' | 'philosophy';

  @IsOptional()
  @IsString()
  @IsIn(['closed', 'open'], {
    message: 'Status must be either "closed" or "open"',
  })
  status?: 'closed' | 'open';

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}


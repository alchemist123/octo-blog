import { IsString, IsOptional, IsArray, IsEnum, IsUUID, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoryDto {
  @ApiPropertyOptional({ description: 'Story title', example: 'Updated Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Story type', example: 'article' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnails_url?: string;

  @ApiPropertyOptional({ description: 'Tag line', example: 'A comprehensive guide' })
  @IsOptional()
  @IsString()
  tagLine?: string;

  @ApiPropertyOptional({ description: 'Hashtags', example: ['nestjs', 'backend'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Mushroom ID', example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'mushroomId must be a valid UUID' })
  mushroomId?: string;
}


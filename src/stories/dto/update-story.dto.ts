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

  @ApiPropertyOptional({ description: 'Post type', enum: ['self', 'mushroom'] })
  @IsOptional()
  @IsEnum(['self', 'mushroom'])
  postType?: 'self' | 'mushroom';

  @ApiPropertyOptional({ description: 'Story type', enum: ['tutorial', 'blog'] })
  @IsOptional()
  @IsEnum(['tutorial', 'blog'])
  storyType?: 'tutorial' | 'blog';

  @ApiPropertyOptional({ description: 'Story status', enum: ['draft', 'requested', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'requested', 'published'])
  status?: 'draft' | 'requested' | 'published';

  @ApiPropertyOptional({ description: 'Sentimental score', example: 0.85 })
  @IsOptional()
  @IsNumber()
  sentimentalScore?: number;

  @ApiPropertyOptional({ description: 'Rich content object', type: Object, additionalProperties: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  content?: any;
}


import { IsString, IsOptional, IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({ description: 'Story title', example: 'Getting Started with NestJS' })
  @IsString()
  title: string;

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

  @ApiPropertyOptional({ description: 'Hashtags', example: ['nestjs', 'backend', 'api'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Mushroom ID', example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID('4', { message: 'mushroomId must be a valid UUID' })
  mushroomId?: string;

  @ApiProperty({ description: 'Post type', enum: ['self', 'mushroom'], example: 'self' })
  @IsEnum(['self', 'mushroom'])
  postType: 'self' | 'mushroom';

  @ApiProperty({ description: 'Story type', enum: ['tutorial', 'blog'], example: 'blog' })
  @IsEnum(['tutorial', 'blog'])
  storyType: 'tutorial' | 'blog';

  @ApiPropertyOptional({ description: 'Story status', enum: ['draft', 'requested', 'published'], example: 'draft' })
  @IsOptional()
  @IsEnum(['draft', 'requested', 'published'])
  status?: 'draft' | 'requested' | 'published';

  @ApiPropertyOptional({ 
    description: 'Rich content object', 
    type: Object,
    additionalProperties: true
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  content?: any; // Rich content object
}

import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterStoryDto {
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

  @ApiPropertyOptional({ description: 'Author ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Mushroom ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  mushroomId?: string;

  @ApiPropertyOptional({ description: 'Search term', example: 'nestjs' })
  @IsOptional()
  @IsString()
  search?: string;
}

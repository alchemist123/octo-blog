import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MyStoriesFilterDto {
  @ApiPropertyOptional({ 
    description: 'Filter stories by status', 
    enum: ['draft', 'requested', 'published'],
    example: 'draft'
  })
  @IsOptional()
  @IsEnum(['draft', 'requested', 'published'])
  status?: 'draft' | 'requested' | 'published';
}

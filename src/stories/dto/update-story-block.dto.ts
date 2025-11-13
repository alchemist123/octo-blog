import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoryBlockDto {
  @ApiPropertyOptional({ 
    description: 'Content block type', 
    enum: ['text', 'video_url', 'image', 'html', 'footer']
  })
  @IsOptional()
  @IsEnum(['text', 'video_url', 'image', 'html', 'footer'])
  type?: 'text' | 'video_url' | 'image' | 'html' | 'footer';

  @ApiPropertyOptional({ 
    description: 'Content of the block as a JSON object',
    example: { text: 'Hello', format: 'plain' },
    type: Object
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}

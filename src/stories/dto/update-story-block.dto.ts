import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoryBlockDto {
  @ApiPropertyOptional({ 
    description: 'Content block type', 
    enum: ['text', 'video_url', 'image', 'html', 'footer']
  })
  @IsOptional()
  @IsEnum(['text', 'video_url', 'image', 'html', 'footer'])
  type?: 'text' | 'video_url' | 'image' | 'html' | 'footer';

  @ApiPropertyOptional({ description: 'Content of the block' })
  @IsOptional()
  @IsString()
  content?: string;
}

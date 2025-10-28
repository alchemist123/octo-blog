import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryBlockDto {
  @ApiProperty({ description: 'Order number of the content block', example: 1 })
  @IsNumber()
  orderNo: number;

  @ApiProperty({ 
    description: 'Content block type', 
    enum: ['text', 'video_url', 'image', 'html', 'footer'],
    example: 'text'
  })
  @IsEnum(['text', 'video_url', 'image', 'html', 'footer'])
  type: 'text' | 'video_url' | 'image' | 'html' | 'footer';

  @ApiPropertyOptional({ description: 'Content of the block', example: 'This is the content', nullable: true })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiPropertyOptional({ description: 'MongoDB ID of the story aggregate document' })
  @IsOptional()
  @IsString()
  mongoId?: string;
}

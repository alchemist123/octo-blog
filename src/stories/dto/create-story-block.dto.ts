import { IsString, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryBlockDto {
  @ApiProperty({ description: 'Story ID', example: '12345' })
  @IsString()
  storyId: string;

  @ApiProperty({ description: 'MongoDB ID of the story aggregate document', example: '507f1f77bcf86cd799439011' })
  @IsString()
  mongoId: string;

  @ApiProperty({ 
    description: 'Content block type', 
    enum: ['text', 'video_url', 'image', 'html', 'footer'],
    example: 'text'
  })
  @IsEnum(['text', 'video_url', 'image', 'html', 'footer'])
  type: 'text' | 'video_url' | 'image' | 'html' | 'footer';

  @ApiProperty({ 
    description: 'Content of the block as a JSON object', 
    example: { text: 'Hello', format: 'plain' },
    type: Object
  })
  @IsObject()
  content: Record<string, any>;

  @ApiProperty({ description: 'Order number of the content block', example: 1 })
  @IsNumber()
  orderNo: number;
}

import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeUserDto {
  @ApiProperty({
    description: 'User ID to subscribe to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;
}


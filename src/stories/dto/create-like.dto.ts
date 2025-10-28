import { IsUUID, IsOptional } from 'class-validator';

export class CreateLikeDto {
  @IsOptional()
  @IsUUID()
  commentId?: string;
}


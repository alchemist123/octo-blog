import { IsNotEmpty, IsIn } from 'class-validator';

export class UploadImageDto {
  @IsNotEmpty()
  @IsIn(['dp', 'blog-images'], {
    message: 'Type must be either "dp" or "blog-images"',
  })
  type: 'dp' | 'blog-image';
}


import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddAdminDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

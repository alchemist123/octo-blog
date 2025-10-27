import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemService } from './system.service';
import { FileUploadService } from '../shared/utilities/fileUploads';
import { UploadImageDto } from './dto/upload-image.dto';

@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('health')
  getHealth(): any {
    return this.systemService.getHealth();
  }

  @Get('topics')
  async getTopics() {
    return await this.systemService.getCategoriesWithTopics();
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadImageDto,
  ): Promise<{ url: string }> {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file is an image
    const isImage = this.fileUploadService.isImage(file.originalname);
    if (!isImage) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Upload the file
    const { type } = query;
    const fileUrl = await this.fileUploadService.uploadFile(
      file.buffer,
      file.originalname,
      type,
    );

    return { url: fileUrl };
  }
}

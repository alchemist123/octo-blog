import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { FileUploadService } from '../shared/utilities/fileUploads';
import { Topic } from '../shared/models/Topic';

@Module({
  imports: [SequelizeModule.forFeature([Topic])],
  controllers: [SystemController],
  providers: [SystemService, FileUploadService],
  exports: [SystemService],
})
export class SystemModule {}


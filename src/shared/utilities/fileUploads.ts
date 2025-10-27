import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileUploadService {
  async uploadFile(
    dataBuffer: Buffer,
    fileName: string,
    folder: 'dp' | 'blog-image',
  ) {
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      region: process.env.AWS_REGION as string,
    });

    // Construct the key with folder
    const fileKey = `${folder}/${uuid()}-${fileName}`;

    const uploadResult = await s3
      .upload({
        Bucket: bucketName,
        Body: dataBuffer,
        Key: fileKey,
        ContentType: this.getContentType(fileName),
      })
      .promise();

    const fileStorageInDB = {
      fileName: fileName,
      fileUrl: uploadResult.Location,
      key: uploadResult.Key,
    };
    return fileStorageInDB.fileUrl;
  }
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return contentTypes[ext || ''] || 'image/jpeg';
  }

  isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return allowedExtensions.includes(ext || '');
  }
}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const s3Enabled = this.configService.get<string>('S3_BUCKET');

    if (s3Enabled) {
      return this.uploadToS3(file, folder);
    }

    return this.uploadLocal(file, folder);
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string = 'general'): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      region: this.configService.get<string>('S3_REGION'),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
    });

    const key = `${folder}/${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: this.configService.get<string>('S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }

  async uploadLocal(file: Express.Multer.File, folder: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const s3Enabled = this.configService.get<string>('S3_BUCKET');
    if (s3Enabled && fileUrl.includes('amazonaws.com')) {
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        region: this.configService.get<string>('S3_REGION'),
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      });

      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(3).join('/');
      const bucket = urlParts[2].split('.')[0];

      await s3
        .deleteObject({
          Bucket: this.configService.get<string>('S3_BUCKET'),
          Key: key,
        })
        .promise();
    } else {
      const fs = require('fs');
      const path = require('path');
      const filepath = path.join(process.cwd(), fileUrl);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }

  validateImage(file: Express.Multer.File): boolean {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return allowedMimes.includes(file.mimetype);
  }

  validateVideo(file: Express.Multer.File): boolean {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    return allowedMimes.includes(file.mimetype);
  }

  getFileUrl(filename: string, folder: string): string {
    const s3Enabled = this.configService.get<string>('S3_BUCKET');
    if (s3Enabled) {
      return `https://${this.configService.get<string>('S3_BUCKET')}.s3.${this.configService.get<string>('S3_REGION')}.amazonaws.com/${folder}/${filename}`;
    }
    return `/uploads/${folder}/${filename}`;
  }
}

// aws-s3.service.ts
import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  RekognitionClient,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AwsS3Service {
  private readonly isProduction: boolean
  private readonly s3Client: S3Client;
  private readonly rekognitionClient: RekognitionClient;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction) {
      const region = process.env.AWS_REGION!;
      const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      };

      this.s3Client = new S3Client({ region, credentials });
      this.rekognitionClient = new RekognitionClient({ region, credentials });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const filename = `${Date.now()}-${uuid()}-${file.originalname}`;

    if (!this.isProduction) {
      // Development: Save locally
      const localPath = path.join(__dirname, '../../../uploads', folder);
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }

      const filePath = path.join(localPath, filename);
      fs.writeFileSync(filePath, file.buffer);
      return `http://localhost:5000/uploads/${folder}/${filename}`;
    }

    const key = `${folder}/${filename}`;
    const bucket = process.env.AWS_BUCKET_NAME!;

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3Client!.send(new PutObjectCommand(params));

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async compareFaces(documentKey: string, selfieKey: string): Promise<number> {
    if(!this.isProduction) {
      // Development mode: Always return a fake similarity
      return 100;
    }

    const bucket = process.env.AWS_BUCKET_NAME!;

    const command = new CompareFacesCommand({
      SourceImage: { S3Object: { Bucket: bucket, Name: selfieKey } },
      TargetImage: { S3Object: { Bucket: bucket, Name: documentKey } },
      SimilarityThreshold: 60,
    });

    const result = await this.rekognitionClient.send(command);
    return result.FaceMatches?.[0]?.Similarity ?? 0;
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isProduction) {
      // In development, assume file is on local storage and ignore
      return;
    }

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
    });
    await this.s3Client!.send(command);
  }
}

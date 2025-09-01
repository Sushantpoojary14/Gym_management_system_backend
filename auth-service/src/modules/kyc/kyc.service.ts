import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateKycDto } from './dto/create-kyc.dto';

import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { KycStatus } from 'src/common/enums/kycStatus.enum';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private awsService: AwsS3Service,
  ) {}

  async createOrUpdateKyc(
    userId: string,
    dto: CreateKycDto,
    docFile: Express.Multer.File,
    selfieFile: Express.Multer.File,
  ): Promise<any> {
    try {
      const [docUrl, selfieUrl] = await Promise.all([
        this.awsService.uploadFile(docFile, 'kyc/documents'),
        this.awsService.uploadFile(selfieFile, 'kyc/selfies'),
      ]);

      const documentKey = docUrl.split('.com/')[1];
      const selfieKey = selfieUrl.split('.com/')[1];

      const similarity = await this.awsService.compareFaces(
        documentKey,
        selfieKey,
      );
      if (similarity < 60) {
        await Promise.all([
          this.awsService.deleteFile(documentKey),
          this.awsService.deleteFile(selfieKey),
        ]);
        throw new BadRequestException(
          'Face match failed. Please upload clearer images.',
        );
      }

      const existing = await this.prisma.kyc.findUnique({ where: { userId } });
      if (existing) {
        await this.prisma.kyc.update({
          where: { id: existing.id },
          data: {
            documentType: dto.documentType,
            documentNumber: dto.documentNumber,
            documentUrl: docUrl,
            selfieUrl: selfieUrl,
            status: KycStatus.PENDING,
            adminRemark: '',
          },
        });
        return await this.prisma.kyc.findUnique({ where: { id: existing.id } });
      }

      const kyc = this.prisma.kyc.create({
        data: {
          userId,
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          documentUrl: docUrl,
          selfieUrl: selfieUrl,
          status: KycStatus.PENDING,
        },
      });

      return kyc;
    } catch (error) {
      if (error instanceof BadRequestException) throw error.message;
      throw new InternalServerErrorException(
        error.message ?? 'Something went wrong',
      );
    }
  }

  async approveKyc(
    kycId: string,
    adminId: string,
    dto: { remark?: string },
  ): Promise<any> {
    try {
      const kyc = await this.prisma.kyc.findUnique({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      await this.prisma.kyc.update({
        where: { id: kycId },
        data: {
          status: KycStatus.APPROVED,
          approvedBy: adminId,
          adminRemark: dto?.remark ?? '',
        },
      });

      return await this.prisma.kyc.findUnique({ where: { id: kycId } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(
        error.message ?? 'Something went wrong',
      );
    }
  }

  async rejectKyc(
    kycId: string,
    adminId: string,
    dto: { remark: string },
  ): Promise<any> {
    try {
      const kyc = await this.prisma.kyc.findUnique({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      await this.prisma.kyc.update({
        where: { id: kycId },
        data: {
          status: KycStatus.REJECTED,
          approvedBy: adminId,
          adminRemark: dto?.remark ?? '',
        },
      });

      return await this.prisma.kyc.findUnique({ where: { id: kycId } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(
        error.message ?? 'Something went wrong',
      );
    }
  }

  async getKyc(userId: string) {
    try {
      const kyc = await this.prisma.kyc.findUnique({ where: { userId } });
      if (!kyc) throw new NotFoundException('KYC not found');
      return kyc;
    } catch (error) {
      if (error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(
        error.message ?? 'Something went wrong',
      );
    }
  }
}

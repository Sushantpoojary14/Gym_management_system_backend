import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { Repository } from 'typeorm';
import { Kyc } from './entities/kyc.entity';
import { KycStatus } from 'src/common/enums/kycStatus.enum';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private kycRepository: Repository<Kyc>,
    private awsService: AwsS3Service
  ) {}

  async createOrUpdateKyc(
    userId: number,
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

      const similarity = await this.awsService.compareFaces(documentKey, selfieKey);
      if (similarity < 60) {
        await Promise.all([
          this.awsService.deleteFile(documentKey),
          this.awsService.deleteFile(selfieKey),
        ]);
        throw new BadRequestException('Face match failed. Please upload clearer images.');
      }

      const existing = await this.kycRepository.findOne({ where: { userId } });
      if (existing) {
        await this.kycRepository.update(existing.id, {
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          documentUrl: docUrl,
          selfieUrl: selfieUrl,
          status: KycStatus.PENDING,
          adminRemark: "",
        });
        return await this.kycRepository.findOne({ where: { id: existing.id } });
      }

      const kyc = this.kycRepository.create({
        userId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentUrl: docUrl,
        selfieUrl: selfieUrl,
        status: KycStatus.PENDING,
      });

      return this.kycRepository.save(kyc);
    } catch (error) {
      if(error instanceof BadRequestException) throw error.message;
      throw new InternalServerErrorException(error.message??'Something went wrong');
    }
  }

  async approveKyc(
    kycId: number,
    adminId: number,
    dto: { remark?: string },
  ): Promise<any> {
    try {
      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      await this.kycRepository.update(kycId, {
        status: KycStatus.APPROVED,
        approvedBy: adminId,
        adminRemark: dto?.remark ?? "",
      });

      return await this.kycRepository.findOne({ where: { id: kycId } });
    } catch (error) {
      if(error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(error.message??'Something went wrong');
    }
  }

  async rejectKyc(
    kycId: number,
    adminId: number,
    dto: { remark: string },
  ): Promise<any> {
    try {
      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      await this.kycRepository.update(kycId, {
        status: KycStatus.REJECTED,
        approvedBy: adminId,
        adminRemark: dto?.remark??"",
      });

      return await this.kycRepository.findOne({ where: { id: kycId } });
    } catch (error) {
      if(error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(error.message??'Something went wrong');
    }
  }

  async getKyc(userId: number) {
    try {
      const kyc = await this.kycRepository.findOne({ where: { userId } });
      if(!kyc) throw new NotFoundException('KYC not found');
      return kyc
    } catch (error) {
      if(error instanceof NotFoundException) throw error.message;
      throw new InternalServerErrorException(error.message??'Something went wrong');
    }
  }
}

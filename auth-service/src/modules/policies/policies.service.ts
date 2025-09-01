import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';
import { CreatePolicyDto, CreatePolicySectionDto } from './dto/create-policy.dto';
import { PolicySection } from './entities/policySection.entity';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { InternalServerError } from '@aws-sdk/client-rekognition';
import { PolicyType } from 'src/common/enums/policyTypes.enum';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private policyRepo: Repository<Policy>,

    @InjectRepository(PolicySection)
    private sectionRepo: Repository<PolicySection>,

    private awsService: AwsS3Service
  ) { }

  async createPolicy(dto: CreatePolicyDto, file: Express.Multer.File): Promise<Policy> {
    try {
      const { heading, version, type, isActive = true, mediaType, sections } = dto;
      let mediaUrl = '';

      if (file) {
        mediaUrl = await this.awsService.uploadFile(file, 'uploads/policies');
      }

      const policy = this.policyRepo.create({
        heading,
        version,
        isActive,
        type,
        mediaUrl,
        mediaType,
        sections: sections.map(section => this.sectionRepo.create(section)),
      });

      return await this.policyRepo.save(policy);
    } catch (error) {
      throw new InternalServerError(error.message ?? "Internal Server Error");
    }
  }


  async findAll(query: {
    page: number;
    limit: number;
    search?: string;
    type?: PolicyType;
    isActive?: boolean;
  }) {
    const { page, limit, search, type, isActive } = query;

    const where: any = {};

    if (search) {
      where.heading = ILike(`%${search}%`);
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await this.policyRepo.findAndCount({
      where,
      order: { policyCreatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sections'], // if you want to include sections
    });

    return {
      message: 'Request successful',
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      statusCode: 200,
      error: null,
    };
  }


  async findOne(type: PolicyType): Promise<Policy | null> {
    return await this.policyRepo.findOne({
      where: { type, isActive: true },
      order: { policyCreatedAt: 'DESC' },
      relations: ['sections'],
    });
  }

  async update(policyId: number, dto: UpdatePolicyDto, file?: Express.Multer.File) {
    const policy = await this.policyRepo.findOne({
      where: { id: policyId },
      relations: ['sections'],
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (dto.heading !== undefined) policy.heading = dto.heading;
    if (dto.version !== undefined) policy.version = dto.version;
    if (dto.isActive !== undefined) policy.isActive = dto.isActive;
    if (dto.type !== undefined) policy.type = dto.type as any;
    if (dto.mediaUrl !== undefined) policy.mediaUrl = dto.mediaUrl;
    if (dto.mediaType !== undefined) policy.mediaType = dto.mediaType;
    if (dto.policyValidity !== undefined) policy.policyValidity = dto.policyValidity;

    await this.policyRepo.save(policy);

    const updatedSections: PolicySection[] = [];

    if (dto.sections && dto.sections.length > 0) {
      for (const sectionDto of dto.sections) {
        // Update existing section
        if (sectionDto.id) {
          const existing = await this.sectionRepo.findOne({
            where: { id: sectionDto.id, policy: { id: policyId } },
          });

          if (existing) {
            existing.subHeading = sectionDto.subHeading;
            existing.description = sectionDto.description;
            updatedSections.push(await this.sectionRepo.save(existing));
          }
        } else {
          // Create new section
          const newSection = this.sectionRepo.create({
            subHeading: sectionDto.subHeading,
            description: sectionDto.description,
            policy,
          });
          updatedSections.push(await this.sectionRepo.save(newSection));
        }
      }
    }

    return "Policy Updated successfully";
  }



  async remove(id: number): Promise<string> {
    const result = await this.policyRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Policy not found');
    }
    return "Policy removed successfully";
  }

}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, BadRequestException, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto, CreatePolicySectionDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParseJSONPipe } from 'src/common/utils/parse-json.pipe';
import { PolicyType } from 'src/common/enums/policyTypes.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) { }

  @Post('/')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'media', maxCount: 1 }]))
  async create(
    @Body('heading') heading: string,
    @Body('version') version: string,
    @Body('isActive') isActive: string,
    @Body('type') type: PolicyType,
    @Body('mediaType') mediaType: 'image' | 'video',
    @Body('sections', ParseJSONPipe) sections: CreatePolicySectionDto[],
    @UploadedFiles() files: { media?: Express.Multer.File },
  ) {
    const dto: CreatePolicyDto = {
      heading,
      version,
      isActive: true,
      type,
      mediaType,
      sections,
    };
    const createPolicyDto = plainToInstance(CreatePolicyDto, dto);
    const errors = await validate(createPolicyDto);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return this.policiesService.createPolicy(dto, files.media?.[0]);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('type') type?: PolicyType,
    @Query('isActive') isActive?: string,
  ) {
    return this.policiesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('/findByType')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Query('type') type: PolicyType) {
    const normalized = type?.toLowerCase();

    const validTypes = Object.values(PolicyType);
    if (!normalized || !validTypes.includes(normalized as PolicyType)) {
      throw new BadRequestException({
        message: `Invalid 'type'. Allowed values: ${validTypes.join(', ')}`,
        error: 'Bad Request',
        statusCode: 400,
      });
    }
    return this.policiesService.findOne(type);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'media', maxCount: 1 }]))
  async update(@Param('id') id: string, 
    @Body('heading') heading: string,
    @Body('version') version: string,
    @Body('isActive') isActive: string,
    @Body('type') type: PolicyType,
    @Body('mediaType') mediaType: 'image' | 'video',
    @Body('sections', ParseJSONPipe) sections: CreatePolicySectionDto[],
    @UploadedFiles() files: { media?: Express.Multer.File },) 
  {
    const dto: UpdatePolicyDto = {
      heading,
      version,
      isActive: isActive === 'true' ? true : false,
      type,
      mediaType,
      sections,
    };
    const createPolicyDto = plainToInstance(UpdatePolicyDto, dto,files?.media?.[0]);
    const errors = await validate(createPolicyDto);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return this.policiesService.update(+id, createPolicyDto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER)
  remove(@Param('id') id: string) {
    return this.policiesService.remove(+id);
  }
}

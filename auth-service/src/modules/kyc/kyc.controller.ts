import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  UploadedFiles,
  Req,
  Query,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Request } from 'express';

@Controller('kyc')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async uploadKyc(
    @Req() req: Request,
    @Body() dto: CreateKycDto,
    @UploadedFiles()
    files: { document?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
  ) {
    if (!files?.document?.[0] || !files?.selfie?.[0]) {
      throw new BadRequestException('Both document and selfie are required');
    }

    return this.kycService.createOrUpdateKyc(
      req.user.id,
      dto,
      files.document[0],
      files.selfie[0],
    );
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async approveKyc(
    @Param('id') kycId: string,
    @Req() req: Request,
    @Body() dto: any,
  ) {
    return this.kycService.approveKyc(kycId, req.user.id, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async rejectKyc(
    @Param('id') kycId: string,
    @Req() req: Request,
    @Body() dto: any,
  ) {
    return this.kycService.rejectKyc(kycId, req.user.id, dto);
  }

  @Get('/')
  @Roles(UserRole.SUPER_ADMIN)
  async getKyc(@Req() req: Request, @Query('id') id?: string) {
    if (req.user.role === UserRole.SUPER_ADMIN) {
      if (!id) {
        throw new BadRequestException('id is required');
      }
      return this.kycService.getKyc(id);
    }
    return this.kycService.getKyc(req.user.id);
  }
}

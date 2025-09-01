import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('/')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER, UserRole.KYC_OFFICER, UserRole.SUPPORT_AGENT, UserRole.MATCH_MANAGER, UserRole.CONTEST_MANAGER, UserRole.USER)
  @UseGuards(AuthGuard('jwt'))
  findOne(@Req() req: Request) {
    return this.referralService.getReferralInfo(req.user.id);
  }
}

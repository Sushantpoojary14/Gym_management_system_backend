import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { UserCouponService } from './user-coupon.service';
import { CreateUserCouponDto } from './dto/create-user-coupon.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('user-coupons')
export class UserCouponController {
  constructor(private readonly userCouponService: UserCouponService) {}

  @Post('assign')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  assignCoupon(@Body() dto: CreateUserCouponDto) {
    return this.userCouponService.assignCoupon(dto);
  }

  @Post('redeem/:userId/:code')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,
    UserRole.FINANCE_OFFICER,
    UserRole.KYC_OFFICER,
    UserRole.SUPPORT_AGENT,
    UserRole.CONTEST_MANAGER,
    UserRole.MATCH_MANAGER,
    UserRole.USER
  )
  redeemCoupon(
    @Param('userId') userId: number,
    @Param('code') code: string,
    @Body('amount') amount: number
  ) {
    return this.userCouponService.redeemCoupon(userId, code,amount);
  }

  @Get(':userId')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
    @Roles(UserRole.SUPER_ADMIN,
    UserRole.FINANCE_OFFICER,
    UserRole.KYC_OFFICER,
    UserRole.SUPPORT_AGENT,
    UserRole.CONTEST_MANAGER,
    UserRole.MATCH_MANAGER,
    UserRole.USER
  )
  getUserCoupons(@Param('userId') userId: number) {
    return this.userCouponService.getUserCoupons(userId);
  }

}

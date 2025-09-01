import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CouponService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,
    UserRole.USER,
    UserRole.KYC_OFFICER,
    UserRole.CONTEST_MANAGER,
    UserRole.FINANCE_OFFICER,
    UserRole.MATCH_MANAGER,
    UserRole.SUPPORT_AGENT
  )
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,
    UserRole.USER,
    UserRole.KYC_OFFICER,
    UserRole.CONTEST_MANAGER,
    UserRole.FINANCE_OFFICER,
    UserRole.MATCH_MANAGER,
    UserRole.SUPPORT_AGENT
  )
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER)
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(+id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(+id);
  }
}

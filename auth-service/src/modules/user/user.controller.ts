import { Controller, Get, Body, Param, Delete, UseGuards, Req, ForbiddenException, Query, Put, BadRequestException, InternalServerErrorException, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './user.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from './entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { UserStatus } from 'src/common/enums/status.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateBulkUserDto } from './dto/update-bulk-user.dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'),RolesGuard)
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get('/')
  @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN,UserRole.STAFF)
  findById(@Req() req: Request): Promise<User|null> {
    return this.userService.findById(req.user.id);
  }

  @Get('find')
  @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN)
  async findUser(
    @Query('key') key: keyof User,
    @Query('value') value: string,
  ): Promise<User | null> {
    if (!key || !value) {
      throw new BadRequestException('Both key and value query parameters are required');
    }

    try {
      const user = await this.userService.findOne(key, value);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Error fetching user');
    }
  }

  @Roles(UserRole.SUPER_ADMIN)

  @Get('/all')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.userService.findAll(
      Number(page),
      Number(limit),
      {
        status,
        search,
        role,
      }
    );
  }

  @Roles(UserRole.SUPER_ADMIN)
 
  @Get('/status-summary')
  getStatusSummary() {
    return this.userService.findAllByStatus();
  }


  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN,UserRole.STAFF,UserRole.ADMIN)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'profile_image', maxCount: 1 }]))
  update(@Param('id') id: number, @Req() req: Request, 
  @Body() updateUserDto: UpdateUserDto,
  @UploadedFiles() files: { profile_image?: Express.Multer.File; },): Promise<User|null>
   {
    const currentUser = req.user;
    const isSelf = currentUser.id === +id;
    const isAdmin = [
      UserRole.SUPER_ADMIN,
      UserRole.STAFF,
      UserRole.ADMIN,
    ].includes(currentUser.role);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own account');
    }

    return this.userService.update(+id, {...updateUserDto,reqUrl:req.originalUrl},files.profile_image?.[0]);
  }

  @Patch('/bulk-update')

  @Roles(UserRole.SUPER_ADMIN)
  async bulkUpdateUsers(
    @Body() dto:UpdateBulkUserDto,
  ) {
    return this.userService.bulkUpdate(dto.ids,dto.status);
  }


  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN)

  remove(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user; 
    const isSelf = currentUser.id === +id;
    const isAdmin = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ].includes(currentUser.role);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own account');
    }
    return this.userService.remove(+id);
  }
}

import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CategoryFaq } from 'src/common/enums/categoryFaq.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.SUPPORT_AGENT,UserRole.USER)
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqsService.create(createFaqDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.SUPER_ADMIN,
    UserRole.MATCH_MANAGER,
    UserRole.CONTEST_MANAGER,
    UserRole.FINANCE_OFFICER,
    UserRole.KYC_OFFICER,
    UserRole.SUPPORT_AGENT,
    UserRole.USER
  )
  findAll() {
    return this.faqsService.findAll();
  }


  @Get('popular')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,
    UserRole.MATCH_MANAGER,
    UserRole.CONTEST_MANAGER,
    UserRole.FINANCE_OFFICER,
    UserRole.KYC_OFFICER,
    UserRole.SUPPORT_AGENT,
    UserRole.USER
  )
  findPopular() {
    return this.faqsService.findPopular();
  }


  @Put(':id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.SUPPORT_AGENT,UserRole.USER)
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqsService.update(+id, updateFaqDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.SUPER_ADMIN,UserRole.SUPPORT_AGENT,UserRole.USER)
  remove(@Param('id') id: string) {
    return this.faqsService.remove(+id);
  }
}
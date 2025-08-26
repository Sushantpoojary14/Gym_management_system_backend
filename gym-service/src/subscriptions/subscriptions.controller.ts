import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('subscriptions')
@Controller('subscriptions')
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gym or membership plan not found' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions with optional filters' })
  @ApiResponse({ status: HttpStatus.OK, type: [SubscriptionResponseDto] })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('userId') userId?: string,
    @Query('gymId') gymId?: string,
    @Query('status') status?: SubscriptionStatus,
  ): Promise<SubscriptionResponseDto[]> {
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (gymId) where.gymId = gymId;
    if (status) where.status = status;

    return this.subscriptionsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all subscriptions for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: [SubscriptionResponseDto] })
  findByUser(@Param('userId') userId: string): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionsService.findByUser(userId);
  }

  @Get('gym/:gymId')
  @ApiOperation({ summary: 'Get all subscriptions for a gym' })
  @ApiResponse({ status: HttpStatus.OK, type: [SubscriptionResponseDto] })
  findByGym(@Param('gymId') gymId: string): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionsService.findByGym(gymId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update subscription status' })
  @ApiResponse({ status: HttpStatus.OK, type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: SubscriptionStatus,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.updateStatus(id, status);
  }

  @Patch(':id/add-sessions')
  @ApiOperation({ summary: 'Add used sessions to a subscription' })
  @ApiResponse({ status: HttpStatus.OK, type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot add more sessions than allowed' })
  addSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('count', ParseIntPipe) count: number,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.addSessions(id, count);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subscriptionsService.remove(id);
  }
}

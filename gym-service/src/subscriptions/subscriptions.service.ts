import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Check if gym exists
    const gym = await this.prisma.gym.findUnique({
      where: { id: createSubscriptionDto.gymId },
    });
    
    if (!gym) {
      throw new NotFoundException(`Gym with ID ${createSubscriptionDto.gymId} not found`);
    }

    // Check if membership plan exists and belongs to the gym
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { 
        id: createSubscriptionDto.membershipPlanId,
        gymId: createSubscriptionDto.gymId,
      },
    });

    if (!membershipPlan) {
      throw new NotFoundException(
        `Membership plan with ID ${createSubscriptionDto.membershipPlanId} not found for gym ${createSubscriptionDto.gymId}`
      );
    }

    // Create the subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId: createSubscriptionDto.userId,
        gymId: createSubscriptionDto.gymId,
        membershipPlanId: createSubscriptionDto.membershipPlanId,
        startDate: new Date(createSubscriptionDto.startDate),
        endDate: new Date(createSubscriptionDto.endDate),
        status: createSubscriptionDto.status,
        autoRenew: createSubscriptionDto.autoRenew,
        sessionsAllowed: createSubscriptionDto.sessionsAllowed,
        sessionsUsed: createSubscriptionDto.sessionsUsed || 0,
        notes: createSubscriptionDto.notes,
      },
    });

    return this.mapToDto(subscription);
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SubscriptionWhereUniqueInput;
    where?: Prisma.SubscriptionWhereInput;
    orderBy?: Prisma.SubscriptionOrderByWithRelationInput;
  }): Promise<SubscriptionResponseDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const subscriptions = await this.prisma.subscription.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        gym: true,
        membershipPlan: true,
      },
    });
    return subscriptions.map(sub => this.mapToDto(sub));
  }

  async findOne(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        gym: true,
        membershipPlan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.mapToDto(subscription);
  }

  async update(
    id: string,
    updateData: Prisma.SubscriptionUpdateInput,
  ): Promise<SubscriptionResponseDto> {
    try {
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id },
        data: updateData,
        include: {
          gym: true,
          membershipPlan: true,
        },
      });
      return this.mapToDto(updatedSubscription);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.subscription.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByUser(userId: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      include: {
        gym: true,
        membershipPlan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    return subscriptions.map(sub => this.mapToDto(sub));
  }

  async findByGym(gymId: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { gymId },
      include: {
        gym: true,
        membershipPlan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    return subscriptions.map(sub => this.mapToDto(sub));
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<SubscriptionResponseDto> {
    return this.update(id, { status });
  }

  async addSessions(
    id: string,
    sessionsToAdd: number,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const newSessionsUsed = (subscription.sessionsUsed || 0) + sessionsToAdd;
    
    if (subscription.sessionsAllowed && newSessionsUsed > subscription.sessionsAllowed) {
      throw new Error('Cannot add more sessions than allowed in the plan');
    }

    return this.update(id, { sessionsUsed: newSessionsUsed });
  }

  private mapToDto(subscription: any): SubscriptionResponseDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
      gymId: subscription.gymId,
      membershipPlanId: subscription.membershipPlanId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
      autoRenew: subscription.autoRenew,
      sessionsAllowed: subscription.sessionsAllowed,
      sessionsUsed: subscription.sessionsUsed,
      notes: subscription.notes,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}

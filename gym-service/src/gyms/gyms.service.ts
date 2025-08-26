import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { GymResponseDto } from './dto/gym-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GymsService {
  constructor(private prisma: PrismaService) {}

  async create(createGymDto: CreateGymDto): Promise<GymResponseDto> {
    const gym = await this.prisma.gym.create({
      data: {
        ...createGymDto,
      },
    });
    return this.mapToDto(gym);
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GymWhereUniqueInput;
    where?: Prisma.GymWhereInput;
    orderBy?: Prisma.GymOrderByWithRelationInput;
  }): Promise<GymResponseDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const gyms = await this.prisma.gym.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return gyms.map(gym => this.mapToDto(gym));
  }

  async findOne(id: string): Promise<GymResponseDto> {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
    });

    if (!gym) {
      throw new NotFoundException(`Gym with ID ${id} not found`);
    }

    return this.mapToDto(gym);
  }

  async update(id: string, updateGymDto: UpdateGymDto): Promise<GymResponseDto> {
    try {
      const updatedGym = await this.prisma.gym.update({
        where: { id },
        data: updateGymDto,
      });
      return this.mapToDto(updatedGym);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Gym with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.gym.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Gym with ID ${id} not found`);
      }
      throw error;
    }
  }

  private mapToDto(gym: any): GymResponseDto {
    return {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      city: gym.city,
      state: gym.state,
      country: gym.country,
      postalCode: gym.postalCode,
      phone: gym.phone,
      email: gym.email,
      website: gym.website,
      logo: gym.logo,
      description: gym.description,
      isActive: gym.isActive,
      createdAt: gym.createdAt,
      updatedAt: gym.updatedAt,
    };
  }
}

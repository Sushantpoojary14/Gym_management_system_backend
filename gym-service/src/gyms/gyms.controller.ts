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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GymsService } from './gyms.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { GymResponseDto } from './dto/gym-response.dto';

@ApiTags('gyms')
@Controller('gyms')
@ApiBearerAuth()
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new gym' })
  @ApiResponse({ status: HttpStatus.CREATED, type: GymResponseDto })
  create(@Body() createGymDto: CreateGymDto): Promise<GymResponseDto> {
    return this.gymsService.create(createGymDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gyms' })
  @ApiResponse({ status: HttpStatus.OK, type: [GymResponseDto] })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<GymResponseDto[]> {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === true || isActive === 'true';
    }

    return this.gymsService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gym by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: GymResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gym not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<GymResponseDto> {
    return this.gymsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a gym' })
  @ApiResponse({ status: HttpStatus.OK, type: GymResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gym not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGymDto: UpdateGymDto,
  ): Promise<GymResponseDto> {
    return this.gymsService.update(id, updateGymDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a gym' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gym not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gymsService.remove(id);
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class GymResponseDto {
  @ApiProperty({ description: 'Unique identifier of the gym' })
  id: string;

  @ApiProperty({ description: 'Name of the gym' })
  name: string;

  @ApiProperty({ description: 'Physical address of the gym' })
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  country: string;

  @ApiProperty({ name: 'postal_code' })
  postalCode: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  website?: string;

  @ApiProperty({ required: false })
  logo?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ default: true })
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

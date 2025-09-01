import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { UserStatus } from 'src/common/enums/status.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsDateString()
  dateOfBirth: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @IsBoolean()
  is18: boolean;

  @IsOptional()
  @IsString()
  profileUrl: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsBoolean()
  isDeleted: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDeletionDate?: Date;
}

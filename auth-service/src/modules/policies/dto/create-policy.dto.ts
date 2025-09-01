import { IsOptional, IsString, IsEnum, ValidateNested, isEmpty, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType } from 'src/common/enums/policyTypes.enum';

export class CreatePolicySectionDto {
  id?: number;
  
  @IsString()
  subHeading: string;

  @IsString()
  description: string;
}

export class CreatePolicyDto {
  @IsString()
  heading: string;

  @IsString()
  version: string;

  @IsNotEmpty({ message: 'type should not be empty' })
  @IsEnum(PolicyType, {
    message: `type must be one of: ${Object.values(PolicyType).join(', ')}`,
  })
  type: PolicyType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsEnum(['image', 'video'])
  mediaType?: 'image' | 'video';

  @IsOptional()
  policyValidity?: Date;

  @IsOptional()
  isActive?: boolean;

  @ValidateNested({ each: true })
  @Type(() => CreatePolicySectionDto)
  sections: CreatePolicySectionDto[];
}

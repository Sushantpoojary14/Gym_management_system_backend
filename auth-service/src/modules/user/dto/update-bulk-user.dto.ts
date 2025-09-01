import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { UserStatus } from 'src/common/enums/status.enum';

export class UpdateBulkUserDto {
  @IsArray()
  @ArrayNotEmpty()
  ids: number[];

  @IsEnum(UserStatus, { message: `Status must be one of ${Object.values(UserStatus).join(', ')}` })
  status: UserStatus;
}

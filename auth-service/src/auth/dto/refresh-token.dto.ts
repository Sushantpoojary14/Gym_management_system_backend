import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  token: string;
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

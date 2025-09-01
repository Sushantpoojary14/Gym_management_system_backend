import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateMessageDto {
  @IsNotEmpty()
  sessionId: number;

  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @IsNotEmpty()
  @IsNumber()
  message: string;

  @IsOptional()
  senderRole?: any;
}

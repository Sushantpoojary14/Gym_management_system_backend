import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMailDto {
    @IsNotEmpty()
    @IsEmail()
    email:string;
    @IsOptional()
    @IsString()
    subject?: string;
    @IsNotEmpty()
    @IsString()
    message: string;
}

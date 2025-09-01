import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class passwordDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
    @IsString()
    @IsNotEmpty()
    newPassword: string;
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}

export class updatePasswordDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
    @IsString()
    @IsNotEmpty()
    newPassword: string;
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}
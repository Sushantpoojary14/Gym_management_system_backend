import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class loginDto{
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
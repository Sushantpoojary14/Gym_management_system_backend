import { IsString, IsEmail, IsOptional, IsBoolean, IsDate, IsUrl, IsEnum } from "class-validator";
import { UserRole } from "src/common/enums/role.enum";
import { Gender } from "src/common/enums/gender.enum";

export class CreateAuthDto {
    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email: string;

    @IsOptional()
    @IsString({ message: 'Password must be a string' })
    password: string;

    // @IsOptional()
    @IsString({ message: 'Phone must be a string' })
    phone: string;

    @IsOptional()
    @IsString({ message: 'Full name must be a string' })
    fullName?: string;

    @IsOptional()
    @IsEnum(Gender, { message: 'Gender must be a valid gender' })
    gender?: Gender|null;

    @IsOptional()
    @IsDate({ message: 'Date of birth must be a valid date' })
    dateOfBirth?: Date|null;

    @IsOptional()
    @IsUrl({}, { message: 'Profile URL must be a valid URL' })
    profileUrl?: string;

    @IsOptional()
    @IsString({ message: 'Referral code must be a string' })
    referralCode?: string;

    @IsEnum(UserRole, { message: 'Role must be a valid user role' })
    role?: UserRole;

    @IsOptional()
    @IsBoolean({ message: 'isVerified must be a boolean' })
    isVerified?: boolean;

    @IsString({ message: 'is18 must be true or false' })
    is18?: "true" | "false";
}

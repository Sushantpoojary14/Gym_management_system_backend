import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { CategoryFaq } from 'src/common/enums/categoryFaq.enum';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsEnum(CategoryFaq)
  @IsOptional()
  category?: CategoryFaq;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;
}

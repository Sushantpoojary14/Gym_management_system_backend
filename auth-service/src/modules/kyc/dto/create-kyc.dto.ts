import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { KycDocuments } from 'src/common/enums/kycDocuments.enum';

export class CreateKycDto {
  @IsEnum(KycDocuments, { message: 'Invalid document type' })
  documentType: KycDocuments;

  @IsString()
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber: string;
}

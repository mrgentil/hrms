import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  document_type?: string;

  @IsString()
  file_path: string;

  @IsBoolean()
  @IsOptional()
  is_confidential?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  expires_at?: string;
}

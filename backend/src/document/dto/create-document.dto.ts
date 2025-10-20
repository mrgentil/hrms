import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @Type(() => Number)
  @IsInt()
  user_id: number;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  document_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  file_path?: string;

  @IsOptional()
  @IsBoolean()
  is_confidential?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}


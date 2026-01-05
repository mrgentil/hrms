import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @MinLength(2, { message: 'Le titre doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le titre ne peut pas dépasser 255 caractères' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Le niveau ne peut pas dépasser 255 caractères' })
  level?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsInt()
  company_id?: number;
}

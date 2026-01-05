import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2, { message: 'Le nom du département doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom du département ne peut pas dépasser 255 caractères' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  manager_user_id?: number;

  @IsOptional()
  @IsInt()
  parent_department_id?: number;

  @IsOptional()
  @IsInt()
  company_id?: number;
}

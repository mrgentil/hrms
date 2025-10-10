import { IsString, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom du rôle doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom du rôle ne peut pas dépasser 100 caractères' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

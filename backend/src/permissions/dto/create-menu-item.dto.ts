import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsInt()
  permission_id?: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsInt()
  permission_id?: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

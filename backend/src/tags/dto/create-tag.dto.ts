import { IsString, IsOptional, IsArray, IsInt, Matches, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
  color?: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
  color?: string;
}

export class AssignTagsDto {
  @IsArray()
  @IsInt({ each: true })
  tag_ids: number[];
}

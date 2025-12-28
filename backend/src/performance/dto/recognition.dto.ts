import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { recognition_type } from '@prisma/client';

export class CreateRecognitionDto {
  @IsInt()
  to_user_id: number;

  @IsOptional()
  @IsEnum(recognition_type)
  type?: recognition_type;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class RecognitionQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  from_user_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  to_user_id?: number;

  @IsOptional()
  @IsEnum(recognition_type)
  type?: recognition_type;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_public?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 20;
}

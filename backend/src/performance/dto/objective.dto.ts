import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { perf_objective_type, metric_type, perf_obj_status } from '@prisma/client';

export class CreateKeyResultDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  target_value?: number;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateObjectiveDto {
  @IsOptional()
  @IsInt()
  review_id?: number;

  @IsInt()
  employee_id: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(perf_objective_type)
  type?: perf_objective_type;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(metric_type)
  metric_type?: metric_type;

  @IsOptional()
  @IsNumber()
  target_value?: number;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  weight?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKeyResultDto)
  key_results?: CreateKeyResultDto[];
}

export class UpdateObjectiveDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(perf_objective_type)
  type?: perf_objective_type;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(metric_type)
  metric_type?: metric_type;

  @IsOptional()
  @IsNumber()
  target_value?: number;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(perf_obj_status)
  status?: perf_obj_status;
}

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsNumber()
  current_value?: number;
}

export class LinkObjectiveToReviewDto {
  @IsInt()
  review_id: number;
}

export class ObjectiveQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employee_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  review_id?: number;

  @IsOptional()
  @IsEnum(perf_obj_status)
  status?: perf_obj_status;

  @IsOptional()
  @IsEnum(perf_objective_type)
  type?: perf_objective_type;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

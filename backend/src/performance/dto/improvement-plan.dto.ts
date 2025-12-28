import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { perf_plan_status, perf_action_status } from '@prisma/client';

export class CreateActionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class CreateImprovementPlanDto {
  @IsOptional()
  @IsInt()
  review_id?: number;

  @IsInt()
  employee_id: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions?: CreateActionDto[];
}

export class UpdateImprovementPlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(perf_plan_status)
  status?: perf_plan_status;
}

export class AddActionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateActionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(perf_action_status)
  status?: perf_action_status;

  @IsOptional()
  @IsString()
  employee_notes?: string;

  @IsOptional()
  @IsString()
  manager_notes?: string;
}

export class ImprovementPlanQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employee_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  manager_id?: number;

  @IsOptional()
  @IsEnum(perf_plan_status)
  status?: perf_plan_status;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 20;
}

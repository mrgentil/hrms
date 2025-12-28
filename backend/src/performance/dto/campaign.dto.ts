import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { campaign_type, campaign_status } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(campaign_type)
  type?: campaign_type;

  @IsInt()
  year: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsDateString()
  self_review_deadline?: string;

  @IsOptional()
  @IsDateString()
  manager_review_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_self?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_manager?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_feedback360?: number;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(campaign_type)
  type?: campaign_type;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  self_review_deadline?: string;

  @IsOptional()
  @IsDateString()
  manager_review_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_self?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_manager?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight_feedback360?: number;

  @IsOptional()
  @IsEnum(campaign_status)
  status?: campaign_status;
}

export class CampaignQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsEnum(campaign_status)
  status?: campaign_status;

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

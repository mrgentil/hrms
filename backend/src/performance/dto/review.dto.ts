import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { review_status } from '@prisma/client';

export class CreateReviewDto {
  @IsInt()
  campaign_id: number;

  @IsInt()
  employee_id: number;

  @IsInt()
  manager_id: number;
}

export class CreateBulkReviewsDto {
  @IsInt()
  campaign_id: number;

  @IsArray()
  @IsInt({ each: true })
  employee_ids: number[];
}

export class SubmitSelfReviewDto {
  @IsInt()
  @Min(0)
  @Max(100)
  self_rating: number;

  @IsOptional()
  @IsString()
  self_comments?: string;
}

export class SubmitManagerReviewDto {
  @IsInt()
  @Min(0)
  @Max(100)
  manager_rating: number;

  @IsOptional()
  @IsString()
  manager_comments?: string;
}

export class FinalizeReviewDto {
  @IsInt()
  @Min(0)
  @Max(100)
  final_rating: number;

  @IsOptional()
  @IsString()
  final_comments?: string;
}

export class ReviewQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  campaign_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employee_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  manager_id?: number;

  @IsOptional()
  @IsEnum(review_status)
  status?: review_status;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  limit?: number = 20;
}

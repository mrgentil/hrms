import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FeedbackResponseDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  answer?: string;
}

export class RequestFeedbackDto {
  @IsInt()
  review_id: number;

  @IsArray()
  @IsInt({ each: true })
  reviewer_ids: number[];

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}

export class SubmitFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedbackResponseDto)
  responses?: FeedbackResponseDto[];

  @IsOptional()
  @IsString()
  comments?: string;
}

export class FeedbackQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  review_id?: number;

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

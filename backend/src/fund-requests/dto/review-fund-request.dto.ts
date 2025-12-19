import { IsEnum, IsOptional, IsString } from 'class-validator';
import { fund_request_status } from '@prisma/client';

export class ReviewFundRequestDto {
    @IsEnum(fund_request_status)
    status: fund_request_status;

    @IsOptional()
    @IsString()
    reviewer_comment?: string;
}

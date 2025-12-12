import { IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAdvanceDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    amount?: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsDateString()
    needed_by_date?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(12)
    repayment_months?: number;
}

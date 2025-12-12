import { IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdvanceDto {
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    amount: number;

    @IsString()
    reason: string;

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

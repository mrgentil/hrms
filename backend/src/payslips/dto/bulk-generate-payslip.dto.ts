import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkGeneratePayslipDto {
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(12)
    month: number;

    @IsNumber()
    @Type(() => Number)
    @Min(2020)
    year: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    department_id?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

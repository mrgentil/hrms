import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayslipDto {
    @IsNumber()
    @Type(() => Number)
    user_id: number;

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
    @IsString()
    notes?: string;
}

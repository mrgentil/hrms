import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFundRequestDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    amount?: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    project?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsDateString()
    needed_by?: string;
}

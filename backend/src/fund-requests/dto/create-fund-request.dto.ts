import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFundRequestDto {
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    amount: number;

    @IsString()
    reason: string;

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

import { IsString, IsOptional } from 'class-validator';

export class UpdatePayslipDto {
    @IsOptional()
    @IsString()
    notes?: string;
}

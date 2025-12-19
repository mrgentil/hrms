import { IsOptional, IsString } from 'class-validator';

export class MarkAsPaidDto {
    @IsOptional()
    @IsString()
    payment_method?: string;

    @IsOptional()
    @IsString()
    payment_ref?: string;
}

import { IsString, IsOptional, IsEmail, IsHexColor, IsInt, IsEnum, Matches, Min, Max, IsBoolean, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { WeekDay } from './update-company.dto';

export class CreateCompanyDto {
    // Informations Générales (required)
    @IsString()
    name: string;

    // Informations Générales (optional)
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    tax_id?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code' })
    currency?: string;

    @IsString()
    @IsOptional()
    language?: string;

    // Branding
    @IsHexColor()
    @IsOptional()
    primary_color?: string;

    @IsHexColor()
    @IsOptional()
    secondary_color?: string;

    // Règles RH
    @IsOptional()
    @IsEnum(WeekDay, { each: true })
    working_days?: WeekDay[];

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(24)
    @Type(() => Number)
    daily_work_hours?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    probation_period?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    fiscal_year_start?: number;
}

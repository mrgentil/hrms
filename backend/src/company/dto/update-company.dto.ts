import { IsString, IsOptional, IsHexColor, IsInt, IsEnum, Matches, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum WeekDay {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY',
}

export class UpdateCompanyDto {
    // Informations Générales
    @IsString()
    @IsOptional()
    name?: string;

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
    // logo_url n'est pas modifiable ici

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

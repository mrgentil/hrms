import { IsInt, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export class CreateOnboardingDto {
    @IsInt()
    employeeId: number;

    @IsOptional()
    @IsInt()
    mentorId?: number;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsArray()
    checklist?: any[];
}

export class UpdateOnboardingDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsInt()
    mentorId?: number;

    @IsOptional()
    @IsArray()
    checklist?: any[];
}

import { IsString, IsOptional, IsDateString, IsArray, IsInt, IsObject } from 'class-validator';

export class CreateJobOfferDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    department: string;

    @IsString()
    location: string;

    @IsString()
    contractType: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsDateString()
    postedDate?: string;

    // Scoring fields
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredSkills?: string[];

    @IsOptional()
    @IsInt()
    minExperience?: number;

    @IsOptional()
    @IsObject()
    scoringCriteria?: Record<string, number>;
}

export class UpdateJobOfferDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    contractType?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsDateString()
    postedDate?: string;

    // Scoring fields
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredSkills?: string[];

    @IsOptional()
    @IsInt()
    minExperience?: number;

    @IsOptional()
    @IsObject()
    scoringCriteria?: Record<string, number>;
}


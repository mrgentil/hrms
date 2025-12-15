import { IsString, IsOptional, IsEmail, IsInt, IsBoolean, IsArray } from 'class-validator';

export class CreateCandidateDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    cvUrl?: string;

    @IsOptional()
    @IsString()
    linkedinUrl?: string;

    @IsOptional()
    @IsArray()
    skills?: string[];

    @IsOptional()
    @IsInt()
    rating?: number;

    @IsOptional()
    @IsInt()
    yearsExperience?: number;

    @IsOptional()
    @IsBoolean()
    isInTalentPool?: boolean;
}

export class UpdateCandidateDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    cvUrl?: string;

    @IsOptional()
    @IsString()
    linkedinUrl?: string;

    @IsOptional()
    @IsArray()
    skills?: string[];

    @IsOptional()
    @IsInt()
    rating?: number;

    @IsOptional()
    @IsInt()
    yearsExperience?: number;

    @IsOptional()
    @IsBoolean()
    isInTalentPool?: boolean;
}

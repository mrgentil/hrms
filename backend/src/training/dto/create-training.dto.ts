import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TrainingLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
    EXPERT = 'EXPERT',
}

export class CreateTrainingDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    category_id: number;

    @IsEnum(TrainingLevel)
    @IsOptional()
    level?: TrainingLevel;

    @IsInt()
    @Min(1)
    duration_hours: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    max_participants?: number;

    @IsOptional()
    @IsBoolean()
    is_mandatory?: boolean;

    @IsOptional()
    @IsBoolean()
    is_online?: boolean;

    @IsOptional()
    @IsString()
    instructor_name?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    prerequisites?: string;

    @IsOptional()
    @IsString()
    objectives?: string;

    @IsOptional()
    @IsString()
    image_url?: string;
}

export class CreateTrainingCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export class CreateTrainingSessionDto {
    @IsInt()
    training_id: number;

    @Type(() => Date)
    start_date: Date;

    @Type(() => Date)
    end_date: Date;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsInt()
    max_participants?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

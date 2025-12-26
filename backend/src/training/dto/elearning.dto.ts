import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { TrainingLevel } from './create-training.dto';

export class CreateElearningModuleDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    content_url?: string;

    @IsInt()
    @Min(1)
    duration_minutes: number;

    @IsEnum(TrainingLevel)
    level: TrainingLevel;

    @IsOptional()
    @IsInt()
    category_id?: number;

    @IsOptional()
    @IsString()
    badge_name?: string;

    @IsOptional()
    @IsString()
    badge_icon?: string;
}

export class UpdateProgressDto {
    @IsInt()
    progress_percent: number;

    @IsOptional()
    @IsInt()
    score?: number;
}

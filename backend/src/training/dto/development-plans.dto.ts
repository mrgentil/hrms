import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlanStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum ObjectivePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum ObjectiveStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export class CreateDevelopmentPlanDto {
    @IsInt()
    user_id: number;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Date)
    start_date: Date;

    @IsOptional()
    @Type(() => Date)
    target_date?: Date;
}

export class CreateObjectiveDto {
    @IsInt()
    plan_id: number;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    skill_area?: string;

    @IsEnum(ObjectivePriority)
    @IsOptional()
    priority?: ObjectivePriority;

    @IsOptional()
    @Type(() => Date)
    target_date?: Date;
}

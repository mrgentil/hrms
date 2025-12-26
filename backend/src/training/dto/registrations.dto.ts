import { IsInt, IsOptional, IsString, IsDecimal, isEnum, IsEnum } from 'class-validator';

export enum RegistrationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
}

export class CreateRegistrationDto {
    @IsInt()
    training_id: number;

    @IsOptional()
    @IsInt()
    session_id?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateRegistrationStatusDto {
    @IsEnum(RegistrationStatus)
    status: RegistrationStatus;

    @IsOptional()
    @IsString()
    feedback?: string;

    @IsOptional()
    @IsDecimal()
    score?: number;
}

export class AssignTrainingDto extends CreateRegistrationDto {
    @IsInt()
    user_id: number;
}

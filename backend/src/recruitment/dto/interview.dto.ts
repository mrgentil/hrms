import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateInterviewDto {
    @IsInt()
    applicationId: number;

    @IsInt()
    candidateId: number;

    @IsInt()
    interviewerId: number;

    @IsDateString()
    interviewDate: string;

    @IsOptional()
    @IsString()
    type?: string;
}

export class UpdateInterviewDto {
    @IsOptional()
    @IsDateString()
    interviewDate?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsInt()
    rating?: number;

    @IsOptional()
    @IsString()
    feedback?: string;
}

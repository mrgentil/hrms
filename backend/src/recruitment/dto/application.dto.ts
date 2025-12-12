import { IsInt } from 'class-validator';

export class CreateApplicationDto {
    @IsInt()
    jobOfferId: number;

    @IsInt()
    candidateId: number;
}

export class UpdateApplicationDto {
    stage?: string;
    status?: string;
}

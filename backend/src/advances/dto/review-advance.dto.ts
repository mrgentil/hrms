import { IsEnum, IsString, IsOptional } from 'class-validator';

export class ReviewAdvanceDto {
    @IsEnum(['APPROVED', 'REJECTED'])
    status: 'APPROVED' | 'REJECTED';

    @IsOptional()
    @IsString()
    reviewer_comment?: string;
}

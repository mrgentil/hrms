import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum CertStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    REVOKED = 'REVOKED',
}

export class CreateCertificationDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    issuing_org?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsInt()
    validity_months?: number;
}

export class AssignCertificationDto {
    @IsInt()
    certification_id: number;

    @IsInt()
    user_id: number;

    @Type(() => Date)
    obtained_date: Date;

    @IsOptional()
    @Type(() => Date)
    expiry_date?: Date;

    @IsOptional()
    @IsString()
    credential_id?: string;

    @IsOptional()
    @IsString()
    credential_url?: string;
}

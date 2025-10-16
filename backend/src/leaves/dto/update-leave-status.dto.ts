import { application_status } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaveStatusDto {
  @IsEnum(application_status, { message: 'Statut de congé invalide.' })
  status!: application_status;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workflow_step?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  approver_comment?: string;
}

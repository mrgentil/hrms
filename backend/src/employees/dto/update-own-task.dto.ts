import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { task_status } from '@prisma/client';

export class UpdateOwnTaskDto {
  @IsEnum(task_status)
  @IsOptional()
  status?: task_status;

  @IsDateString()
  @IsOptional()
  completed_at?: string | null;
}

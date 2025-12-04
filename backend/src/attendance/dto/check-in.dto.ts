import { IsOptional, IsString, IsEnum } from 'class-validator';
import { attendance_status } from '@prisma/client';

export class CheckInDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(attendance_status)
  status?: attendance_status;
}

export class CheckOutDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetAttendanceQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

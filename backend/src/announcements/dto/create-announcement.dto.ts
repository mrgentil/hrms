import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsEnum } from 'class-validator';

export enum AnnouncementType {
  INFO = 'INFO',
  EVENT = 'EVENT',
  POLICY = 'POLICY',
  CELEBRATION = 'CELEBRATION',
  URGENT = 'URGENT',
  MAINTENANCE = 'MAINTENANCE',
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsOptional()
  @IsDateString()
  publish_date?: string;

  @IsOptional()
  @IsDateString()
  expire_date?: string;

  @IsOptional()
  @IsBoolean()
  target_all?: boolean;

  @IsOptional()
  @IsNumber()
  department_id?: number;
}

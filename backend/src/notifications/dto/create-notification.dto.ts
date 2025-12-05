import { IsString, IsOptional, IsInt, IsEnum, IsBoolean } from 'class-validator';

export enum NotificationType {
  PROJECT_ADDED = 'PROJECT_ADDED',
  PROJECT_REMOVED = 'PROJECT_REMOVED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UNASSIGNED = 'TASK_UNASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_COMMENT = 'TASK_COMMENT',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_PENDING = 'LEAVE_PENDING',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MESSAGE = 'MESSAGE',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

export class CreateNotificationDto {
  @IsInt()
  user_id: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsInt()
  entity_id?: number;
}

export class MarkAsReadDto {
  @IsOptional()
  @IsInt({ each: true })
  notification_ids?: number[];

  @IsOptional()
  @IsBoolean()
  mark_all?: boolean;
}

import { IsString, IsOptional, IsDateString, IsInt, IsEnum, IsArray } from 'class-validator';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsInt()
  project_id: number;

  @IsInt()
  task_column_id: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  assignee_ids?: number[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsInt()
  task_column_id?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  assignee_ids?: number[];
}

export class MoveTaskDto {
  @IsInt()
  task_column_id: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class CreateColumnDto {
  @IsString()
  name: string;

  @IsInt()
  task_board_id: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

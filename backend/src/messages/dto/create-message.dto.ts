import { IsString, IsOptional, IsInt, IsArray, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_group?: boolean;

  @IsArray()
  @IsInt({ each: true })
  participant_ids: number[];
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @Type(() => Number)
  @IsInt()
  conversation_id: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    }
    return value;
  })
  mentioned_user_ids?: number[];
}

export class AddParticipantDto {
  @IsInt()
  user_id: number;
}

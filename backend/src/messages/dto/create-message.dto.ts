import { IsString, IsOptional, IsInt, IsArray, IsBoolean } from 'class-validator';

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
  @IsString()
  content: string;

  @IsInt()
  conversation_id: number;
}

export class AddParticipantDto {
  @IsInt()
  user_id: number;
}

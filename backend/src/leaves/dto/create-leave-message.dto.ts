import { IsString, MaxLength } from 'class-validator';

export class CreateLeaveMessageDto {
  @IsString()
  @MaxLength(2000)
  message!: string;
}

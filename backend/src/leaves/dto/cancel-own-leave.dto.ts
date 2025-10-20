import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOwnLeaveDto {
  @IsOptional()
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @MaxLength(500, { message: 'Le motif ne doit pas dépasser 500 caractères.' })
  reason?: string;
}

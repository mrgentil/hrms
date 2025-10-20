import { application_type } from '@prisma/client';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';

export class UpdateOwnLeaveDto {
  @IsOptional()
  @IsEnum(application_type, {
    message: 'Le type de congé fourni est invalide.',
  })
  type?: application_type;

  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être une date valide.' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être une date valide.' })
  end_date?: string;

  @IsOptional()
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @MinLength(5, { message: 'Le motif doit contenir au moins 5 caractères.' })
  @MaxLength(500, { message: 'Le motif ne doit pas dépasser 500 caractères.' })
  reason?: string;

  @IsOptional()
  @IsInt({ message: 'Le type de congé sélectionné est invalide.' })
  @IsPositive({ message: 'Le type de congé sélectionné est invalide.' })
  leave_type_id?: number;

  @IsOptional()
  @IsInt({ message: 'Le responsable choisi est invalide.' })
  @IsPositive({ message: 'Le responsable choisi est invalide.' })
  approver_user_id?: number;
}

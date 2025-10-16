import { application_type } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeaveDto {
  @IsEnum(application_type, {
    message: 'Le type de congé doit être une valeur valide.',
  })
  type: application_type;

  @IsDateString({}, { message: 'La date de début doit être une date valide.' })
  start_date: string;

  @IsDateString({}, { message: 'La date de fin doit être une date valide.' })
  end_date: string;

  @IsOptional()
  @IsInt({ message: 'Le type de congé sélectionné est invalide.' })
  @IsPositive({ message: 'Le type de congé sélectionné est invalide.' })
  leave_type_id?: number;

  @IsOptional()
  @IsInt({ message: 'Le responsable choisi est invalide.' })
  @IsPositive({ message: 'Le responsable choisi est invalide.' })
  approver_user_id?: number;

  @IsNotEmpty({ message: 'Le motif est requis.' })
  @IsString({ message: 'Le motif doit être une chaîne de caractères.' })
  @MaxLength(500, { message: 'Le motif ne doit pas dépasser 500 caractères.' })
  reason: string;
}

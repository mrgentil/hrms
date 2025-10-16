import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { user_personal_info_gender, user_personal_info_marital_status } from '@prisma/client';

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString({ message: 'Le nom complet doit etre une chaine de caracteres.' })
  @MinLength(2, { message: 'Le nom complet doit contenir au moins 2 caracteres.' })
  @MaxLength(150, { message: 'Le nom complet ne doit pas depasser 150 caracteres.' })
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  work_email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de naissance doit etre une date valide.' })
  date_of_birth?: string;

  @IsOptional()
  @IsEnum(user_personal_info_gender, { message: 'Genre invalide.' })
  gender?: user_personal_info_gender;

  @IsOptional()
  @IsEnum(user_personal_info_marital_status, { message: 'Statut marital invalide.' })
  marital_status?: user_personal_info_marital_status;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  spouse_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  id_number?: string;

  @IsOptional()
  @IsString({ message: 'Le numero de telephone mobile doit etre une chaine de caracteres.' })
  @MaxLength(50, { message: 'Le numero de telephone mobile est trop long.' })
  mobile?: string;

  @IsOptional()
  @IsString({ message: 'Le numero de telephone fixe doit etre une chaine de caracteres.' })
  @MaxLength(50, { message: 'Le numero de telephone fixe est trop long.' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Adresse e-mail personnelle invalide.' })
  email_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergency_contact_primary_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergency_contact_primary_relation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergency_contact_primary_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergency_contact_secondary_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergency_contact_secondary_relation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergency_contact_secondary_phone?: string;
}

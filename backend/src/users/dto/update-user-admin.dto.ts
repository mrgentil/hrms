import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsDateString, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

// DTO pour la modification complète d'un utilisateur par un admin/RH
export class UpdateUserAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom complet doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom complet ne peut pas dépasser 255 caractères' })
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email doit être valide' })
  work_email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle doit être une valeur valide du système' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  active?: boolean;

  @IsOptional()
  @IsInt({ message: 'L\'ID du département doit être un nombre entier' })
  @Min(1, { message: 'L\'ID du département doit être positif' })
  department_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La date d\'embauche doit être une date valide' })
  hire_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être une date valide' })
  termination_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'L\'URL de la photo ne peut pas dépasser 500 caractères' })
  profile_photo_url?: string;

  @IsOptional()
  @IsInt({ message: 'L\'ID du manager doit être un nombre entier' })
  @Min(1, { message: 'L\'ID du manager doit être positif' })
  manager_user_id?: number;

  @IsOptional()
  @IsInt({ message: 'L\'ID du poste doit être un nombre entier' })
  @Min(1, { message: 'L\'ID du poste doit être positif' })
  position_id?: number;
}

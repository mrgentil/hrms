import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsInt, IsDateString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom complet doit contenir au moins 2 caractères' })
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email doit être valide' })
  work_email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle doit être une valeur valide du système' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsInt()
  position_id?: number;

  @IsOptional()
  @IsInt()
  manager_user_id?: number;

  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @IsOptional()
  @IsDateString()
  termination_date?: string;

  @IsOptional()
  @IsString()
  profile_photo_url?: string;

  // Financial information
  @IsOptional()
  @IsInt()
  salary_basic?: number;

  @IsOptional()
  @IsInt()
  salary_gross?: number;

  @IsOptional()
  @IsInt()
  salary_net?: number;

  @IsOptional()
  @IsInt()
  allowance_house_rent?: number;

  @IsOptional()
  @IsInt()
  allowance_medical?: number;

  @IsOptional()
  @IsInt()
  allowance_special?: number;

  @IsOptional()
  @IsInt()
  allowance_fuel?: number;

  @IsOptional()
  @IsInt()
  allowance_phone_bill?: number;

  @IsOptional()
  @IsInt()
  allowance_other?: number;

  @IsOptional()
  @IsInt()
  deduction_provident_fund?: number;

  @IsOptional()
  @IsInt()
  deduction_tax?: number;

  @IsOptional()
  @IsInt()
  deduction_other?: number;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  account_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  iban?: string;
}

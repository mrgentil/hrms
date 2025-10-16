import { IsString, IsEmail, IsOptional, IsInt, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, user_personal_info_gender, user_personal_info_marital_status, user_financial_info_employment_type } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  full_name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsInt()
  @IsOptional()
  role_id?: number;

  @IsInt()
  @IsOptional()
  department_id?: number;

  @IsInt()
  @IsOptional()
  position_id?: number;

  @IsInt()
  @IsOptional()
  manager_user_id?: number;

  @IsEmail()
  @IsOptional()
  work_email?: string;

  @IsDateString()
  @IsOptional()
  hire_date?: string;

  @IsString()
  @IsOptional()
  profile_photo_url?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // Informations personnelles
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsEnum(user_personal_info_gender)
  @IsOptional()
  gender?: user_personal_info_gender;

  @IsEnum(user_personal_info_marital_status)
  @IsOptional()
  marital_status?: user_personal_info_marital_status;

  @IsString()
  @IsOptional()
  father_name?: string;

  @IsString()
  @IsOptional()
  id_number?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email_address?: string;

  // Informations financières
  @IsEnum(user_financial_info_employment_type)
  @IsOptional()
  employment_type?: user_financial_info_employment_type;

  @IsInt()
  @IsOptional()
  salary_basic?: number;

  @IsInt()
  @IsOptional()
  salary_gross?: number;

  @IsInt()
  @IsOptional()
  salary_net?: number;

  @IsInt()
  @IsOptional()
  allowance_house_rent?: number;

  @IsInt()
  @IsOptional()
  allowance_medical?: number;

  @IsInt()
  @IsOptional()
  allowance_special?: number;

  @IsInt()
  @IsOptional()
  allowance_fuel?: number;

  @IsInt()
  @IsOptional()
  allowance_phone_bill?: number;

  @IsInt()
  @IsOptional()
  allowance_other?: number;

  @IsInt()
  @IsOptional()
  deduction_provident_fund?: number;

  @IsInt()
  @IsOptional()
  deduction_tax?: number;

  @IsInt()
  @IsOptional()
  deduction_other?: number;

  @IsString()
  @IsOptional()
  bank_name?: string;

  @IsString()
  @IsOptional()
  account_name?: string;

  @IsString()
  @IsOptional()
  account_number?: string;

  @IsString()
  @IsOptional()
  iban?: string;
}

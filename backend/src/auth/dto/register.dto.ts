import { IsNotEmpty, IsString, MinLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsOptional()
  @IsEmail()
  work_email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ROLE_EMPLOYEE;
}

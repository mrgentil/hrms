import { IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { employment_contract_contract_type, employment_contract_status } from '@prisma/client';

export class CreateContractDto {
  @IsEnum(employment_contract_contract_type)
  contract_type: employment_contract_contract_type;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsDateString()
  @IsOptional()
  probation_end_date?: string;

  @IsEnum(employment_contract_status)
  @IsOptional()
  status?: employment_contract_status;

  @IsNumber()
  @IsOptional()
  weekly_hours?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

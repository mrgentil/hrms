import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  INTERIM = 'INTERIM',
  STAGE = 'STAGE',
  APPRENTISSAGE = 'APPRENTISSAGE',
  FREELANCE = 'FREELANCE',
  OTHER = 'OTHER',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
}

export class CreateContractDto {
  @IsNumber()
  user_id: number;

  @IsEnum(ContractType)
  contract_type: ContractType;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsString()
  salary_currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  working_hours?: number;

  @IsOptional()
  @IsDateString()
  probation_end?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsString()
  document_url?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

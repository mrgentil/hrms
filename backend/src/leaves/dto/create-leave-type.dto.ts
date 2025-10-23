import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom du type de congé est requis.' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  description?: string | null;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2 },
    { message: "L'allocation annuelle doit être un nombre." },
  )
  @Min(0, { message: "L'allocation annuelle ne peut pas être négative." })
  default_allowance?: number;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2 },
    { message: "L'allocation mensuelle doit être un nombre." },
  )
  @Min(0, { message: "L'allocation mensuelle ne peut pas être négative." })
  monthly_allowance?: number;

  @IsOptional()
  @IsBoolean({ message: 'La validation requise doit être un booléen.' })
  requires_approval?: boolean;
}

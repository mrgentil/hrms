import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

// DTO pour la modification du profil personnel par l'utilisateur lui-même
export class UpdatePersonalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'L\'URL de la photo ne peut pas dépasser 500 caractères' })
  profile_photo_url?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Le mot de passe actuel est requis' })
  current_password: string;

  @IsString()
  @MinLength(6, { message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
  new_password: string;

  @IsString()
  @MinLength(6, { message: 'La confirmation du mot de passe est requise' })
  confirm_password: string;
}

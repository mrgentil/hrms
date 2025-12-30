import { IsString, MinLength } from 'class-validator';

export class SetupPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;
}

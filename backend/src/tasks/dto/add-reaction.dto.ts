import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AddReactionDto {
    @IsString()
    @IsNotEmpty({ message: 'L\'emoji est requis' })
    @Matches(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u, {
        message: 'Format emoji invalide',
    })
    emoji: string;
}

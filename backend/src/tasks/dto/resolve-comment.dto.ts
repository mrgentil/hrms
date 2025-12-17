import { IsBoolean } from 'class-validator';

export class ResolveCommentDto {
    @IsBoolean()
    isResolved: boolean;
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskFeaturesReactionsService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // RÉACTIONS EMOJI
    // ============================================

    async addReaction(commentId: number, userId: number, emoji: string) {
        // Vérifier que le commentaire existe
        const comment = await this.prisma.task_comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Commentaire introuvable');
        }

        // Ajouter ou update la réaction (upsert pour éviter les doublons)
        return this.prisma.comment_reaction.upsert({
            where: {
                comment_id_user_id_emoji: {
                    comment_id: commentId,
                    user_id: userId,
                    emoji: emoji,
                },
            },
            create: {
                comment_id: commentId,
                user_id: userId,
                emoji: emoji,
            },
            update: {}, // Déjà existe, rien à faire
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        profile_photo_url: true,
                    },
                },
            },
        });
    }

    async removeReaction(commentId: number, userId: number, emoji: string) {
        try {
            return await this.prisma.comment_reaction.delete({
                where: {
                    comment_id_user_id_emoji: {
                        comment_id: commentId,
                        user_id: userId,
                        emoji: emoji,
                    },
                },
            });
        } catch (error) {
            throw new NotFoundException('Réaction introuvable');
        }
    }

    async getReactions(commentId: number) {
        const reactions = await this.prisma.comment_reaction.findMany({
            where: { comment_id: commentId },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        profile_photo_url: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });

        // Grouper par emoji avec compteur
        // @ts-ignore
        const grouped = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user);
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped);
    }

    // ============================================
    // ÉPINGLER / RÉSOUDRE COMMENTAIRES
    // ============================================

    async togglePin(commentId: number, userId: number, isPinned: boolean) {
        // Vérifier que le commentaire existe
        const comment = await this.prisma.task_comment.findUnique({
            where: { id: commentId },
            include: { task: true },
        });

        if (!comment) {
            throw new NotFoundException('Commentaire introuvable');
        }

        // Vérifier permissions (project member ou admin)
        // TODO: Ajouter vérification des permissions si nécessaire

        return this.prisma.task_comment.update({
            where: { id: commentId },
            data: {
                is_pinned: isPinned,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: { id: true, full_name: true, profile_photo_url: true },
                },
            },
        });
    }

    async resolveComment(commentId: number, userId: number) {
        return this.prisma.task_comment.update({
            where: { id: commentId },
            data: {
                is_resolved: true,
                resolved_by: userId,
                resolved_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: { id: true, full_name: true, profile_photo_url: true },
                },
                resolver: {
                    select: { id: true, full_name: true },
                },
            },
        });
    }

    async unresolveComment(commentId: number, userId: number) {
        return this.prisma.task_comment.update({
            where: { id: commentId },
            data: {
                is_resolved: false,
                resolved_by: null,
                resolved_at: null,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: { id: true, full_name: true, profile_photo_url: true },
                },
            },
        });
    }

    // ============================================
    // HISTORIQUE DES MODIFICATIONS
    // ============================================

    // Modifier updateComment existant pour sauvegarder l'historique
    async updateCommentWithHistory(commentId: number, userId: number, content: string) {
        const existing = await this.prisma.task_comment.findUnique({
            where: { id: commentId },
        });

        if (!existing) {
            throw new NotFoundException('Commentaire non trouvé');
        }

        if (existing.user_id !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
        }

        // Sauvegarder l'historique avant modification
        await this.prisma.comment_edit_history.create({
            data: {
                comment_id: commentId,
                user_id: userId,
                old_content: existing.content,
                new_content: content,
            },
        });

        // Mettre à jour le commentaire
        return this.prisma.task_comment.update({
            where: { id: commentId },
            data: {
                content: content,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: { id: true, full_name: true, profile_photo_url: true },
                },
            },
        });
    }

    async getCommentHistory(commentId: number) {
        return this.prisma.comment_edit_history.findMany({
            where: { comment_id: commentId },
            include: {
                user: {
                    select: { id: true, full_name: true, profile_photo_url: true },
                },
            },
            orderBy: { edited_at: 'desc' },
        });
    }
}

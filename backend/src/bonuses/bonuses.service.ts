import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BonusesService {
    private readonly logger = new Logger(BonusesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getBonuses(filters: any, user?: any) {
        const where: any = {};

        if (user && user.company_id) {
            where.user = { company_id: user.company_id };
        }

        const bonuses = await this.prisma.bonus.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return {
            success: true,
            data: bonuses,
            total: bonuses.length,
        };
    }

    async getMyBonuses(userId: number) {
        try {
            const bonuses = await this.prisma.bonus.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });

            return {
                success: true,
                data: bonuses,
                total: bonuses.length,
            };
        } catch (error) {
            this.logger.error('Error fetching user bonuses:', error);
            return {
                success: false,
                message: 'Erreur lors de la récupération de vos bonus',
            };
        }
    }

    async createBonus(dto: any, creatorId: number) {
        try {
            const bonus = await this.prisma.bonus.create({
                data: {
                    ...dto,
                    created_by: creatorId,
                    status: 'DRAFT',
                }
            });

            return {
                success: true,
                data: bonus,
                message: 'Bonus créé avec succès',
            };
        } catch (error) {
            this.logger.error('Error creating bonus:', error);
            return {
                success: false,
                message: 'Erreur lors de la création du bonus',
            };
        }
    }

    async submitBonus(id: number) {
        try {
            const bonus = await this.prisma.bonus.update({
                where: { id },
                data: {
                    status: 'PENDING',
                    submitted_at: new Date(),
                }
            });

            return {
                success: true,
                data: bonus,
                message: 'Bonus soumis avec succès',
            };
        } catch (error) {
            this.logger.error('Error submitting bonus:', error);
            return {
                success: false,
                message: 'Erreur lors de la soumission du bonus',
            };
        }
    }

    async reviewBonus(id: number, dto: any, reviewerId: number) {
        try {
            const bonus = await this.prisma.bonus.update({
                where: { id },
                data: {
                    status: dto.status,
                    approved_by: reviewerId,
                    approved_at: new Date(),
                    approver_comment: dto.comment,
                }
            });

            return {
                success: true,
                data: bonus,
                message: `Bonus ${dto.status === 'APPROVED' ? 'approuvé' : 'rejeté'} avec succès`,
            };
        } catch (error) {
            this.logger.error('Error reviewing bonus:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'évaluation du bonus',
            };
        }
    }
}

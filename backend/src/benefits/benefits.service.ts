import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BenefitsService {
    private readonly logger = new Logger(BenefitsService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getBenefits(filters: any) {
        try {
            const benefits = await this.prisma.benefit_catalog.findMany({
                where: filters.is_active !== undefined ? { is_active: filters.is_active } : undefined,
            });

            return {
                success: true,
                data: benefits,
            };
        } catch (error) {
            this.logger.error('Error fetching benefits:', error);
            return {
                success: false,
                message: 'Erreur lors de la récupération des avantages',
            };
        }
    }

    async getMyBenefits(userId: number) {
        try {
            const enrollments = await this.prisma.employee_benefit.findMany({
                where: { user_id: userId },
                include: { benefit: true },
            });

            return {
                success: true,
                data: enrollments,
            };
        } catch (error) {
            this.logger.error('Error fetching user benefits:', error);
            return {
                success: false,
                message: 'Erreur lors de la récupération de vos avantages',
            };
        }
    }

    async createBenefit(dto: any) {
        try {
            const benefit = await this.prisma.benefit_catalog.create({
                data: dto,
            });

            return {
                success: true,
                data: benefit,
                message: 'Avantage créé avec succès',
            };
        } catch (error) {
            this.logger.error('Error creating benefit:', error);
            return {
                success: false,
                message: 'Erreur lors de la création de l\'avantage',
            };
        }
    }

    async enrollBenefit(userId: number, dto: any) {
        try {
            const enrollment = await this.prisma.employee_benefit.create({
                data: {
                    ...dto,
                    user_id: userId,
                    start_date: dto.start_date || new Date(),
                    status: 'ACTIVE',
                },
            });

            return {
                success: true,
                data: enrollment,
                message: 'Inscription réussie',
            };
        } catch (error) {
            this.logger.error('Error enrolling in benefit:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'inscription',
            };
        }
    }

    async terminateEnrollment(id: number) {
        try {
            await this.prisma.employee_benefit.update({
                where: { id },
                data: {
                    status: 'TERMINATED',
                    end_date: new Date(),
                },
            });

            return {
                success: true,
                message: 'Avantage résilié avec succès',
            };
        } catch (error) {
            this.logger.error('Error terminating benefit:', error);
            return {
                success: false,
                message: 'Erreur lors de la résiliation',
            };
        }
    }
}

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

    async getMyBonuses() {
        return this.getBonuses({});
    }

    async createBonus(dto: any) {
        this.logger.warn('MOCK: Creating bonus');
        return {
            success: true,
            data: { id: Date.now(), ...dto, status: 'DRAFT' },
            message: 'Bonus créé (MOCK)',
        };
    }

    async submitBonus(id: number) {
        return { success: true, message: 'Bonus soumis (MOCK)' };
    }

    async reviewBonus(id: number, dto: any) {
        return { success: true, message: `Bonus ${dto.status} (MOCK)` };
    }
}

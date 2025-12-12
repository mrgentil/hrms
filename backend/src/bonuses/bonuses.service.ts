import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BonusesService {
    private readonly logger = new Logger(BonusesService.name);

    async getBonuses(filters: any) {
        this.logger.warn('Using MOCK bonuses service - implement real service later');

        // Mock data
        const mockBonuses = [
            {
                id: 1,
                user_id: 1,
                bonus_type: 'PERFORMANCE',
                amount: 1500,
                title: 'Prime de performance Q4',
                description: 'Excellent travail ce trimestre',
                period: 'Q4 2024',
                status: 'APPROVED',
                created_at: new Date('2024-12-01'),
                user: { id: 1, full_name: 'John Doe' },
            },
        ];

        return {
            success: true,
            data: mockBonuses,
            total: mockBonuses.length,
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

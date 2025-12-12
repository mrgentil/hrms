import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BenefitsService {
    private readonly logger = new Logger(BenefitsService.name);

    async getBenefits(filters: any) {
        this.logger.warn('Using MOCK benefits service - implement real service later');

        // Mock benefits catalog
        const mockBenefits = [
            {
                id: 1,
                name: 'Assurance Santé Premium',
                description: 'Couverture santé complète pour vous et votre famille',
                benefit_type: 'HEALTH_INSURANCE',
                value_type: 'FIXED',
                value_amount: 150,
                employer_contribution: 100,
                employee_contribution: 50,
                is_active: true,
                requires_enrollment: true,
            },
            {
                id: 2,
                name: 'Tickets Restaurant',
                description: 'Carte tickets restaurant 10€/jour',
                benefit_type: 'MEAL_VOUCHERS',
                value_type: 'FIXED',
                value_amount: 200,
                employer_contribution: 120,
                employee_contribution: 80,
                is_active: true,
                requires_enrollment: true,
            },
        ];

        return {
            success: true,
            data: mockBenefits,
        };
    }

    async getMyBenefits() {
        const mockEnrollments = [
            {
                id: 1,
                benefit_id: 1,
                user_id: 1,
                start_date: new Date('2024-01-01'),
                status: 'ACTIVE',
                usage_count: 5,
                last_used_at: new Date('2024-12-01'),
                benefit: {
                    name: 'Assurance Santé Premium',
                    benefit_type: 'HEALTH_INSURANCE',
                },
            },
        ];

        return {
            success: true,
            data: mockEnrollments,
        };
    }

    async createBenefit(dto: any) {
        return {
            success: true,
            data: { id: Date.now(), ...dto },
            message: 'Avantage créé (MOCK)',
        };
    }

    async enrollBenefit(dto: any) {
        return {
            success: true,
            data: { id: Date.now(), ...dto, status: 'ACTIVE' },
            message: 'Inscription réussie (MOCK)',
        };
    }

    async terminateEnrollment(id: number) {
        return {
            success: true,
            message: 'Avantage résilié (MOCK)',
        };
    }
}

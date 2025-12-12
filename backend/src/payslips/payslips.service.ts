import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdvancesService } from '../advances/advances.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';

@Injectable()
export class PayslipsService {
    private readonly logger = new Logger(PayslipsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly advancesService: AdvancesService,
    ) { }

    /**
     * Generate a payslip from user's financial info
     */
    async create(generatedBy: number, dto: CreatePayslipDto) {
        this.logger.log(`Generating payslip for user ${dto.user_id} - ${dto.month}/${dto.year}`);

        try {
            // Check if payslip already exists for this period
            const existing = await this.prisma.payslip.findFirst({
                where: {
                    user_id: dto.user_id,
                    month: dto.month,
                    year: dto.year,
                },
            });

            if (existing) {
                throw new BadRequestException(
                    `Payslip already exists for ${dto.month}/${dto.year}`,
                );
            }

            // Get user's financial info
            const user = await this.prisma.user.findUnique({
                where: { id: dto.user_id },
                include: {
                    user_financial_info: true,
                },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const financialInfo = user.user_financial_info?.[0];
            if (!financialInfo) {
                throw new BadRequestException(
                    'User has no financial information configured',
                );
            }

            // Calculate salary components
            const salaryBasic = Number(financialInfo.salary_basic) || 0;
            const allowanceTotal = Number(financialInfo.allowance_total) || 0;
            const deductionTotal = Number(financialInfo.deduction_total) || 0;

            // Build allowances breakdown
            const allowancesBreakdown: Array<{ name: string; amount: number }> = [];
            if (financialInfo.allowance_house_rent) {
                allowancesBreakdown.push({
                    name: 'Logement',
                    amount: Number(financialInfo.allowance_house_rent),
                });
            }
            if (financialInfo.allowance_medical) {
                allowancesBreakdown.push({
                    name: 'Santé',
                    amount: Number(financialInfo.allowance_medical),
                });
            }
            if (financialInfo.allowance_special) {
                allowancesBreakdown.push({
                    name: 'Spéciale',
                    amount: Number(financialInfo.allowance_special),
                });
            }
            if (financialInfo.allowance_fuel) {
                allowancesBreakdown.push({
                    name: 'Carburant',
                    amount: Number(financialInfo.allowance_fuel),
                });
            }
            if (financialInfo.allowance_phone_bill) {
                allowancesBreakdown.push({
                    name: 'Téléphone',
                    amount: Number(financialInfo.allowance_phone_bill),
                });
            }
            if (financialInfo.allowance_other) {
                allowancesBreakdown.push({
                    name: 'Autres',
                    amount: Number(financialInfo.allowance_other),
                });
            }

            // Build deductions breakdown
            const deductionsBreakdown: Array<{ name: string; amount: number }> = [];
            if (financialInfo.deduction_provident_fund) {
                deductionsBreakdown.push({
                    name: 'Caisse de prévoyance',
                    amount: Number(financialInfo.deduction_provident_fund),
                });
            }
            if (financialInfo.deduction_tax) {
                deductionsBreakdown.push({
                    name: 'Impôts',
                    amount: Number(financialInfo.deduction_tax),
                });
            }
            if (financialInfo.deduction_other) {
                deductionsBreakdown.push({
                    name: 'Autres déductions',
                    amount: Number(financialInfo.deduction_other),
                });
            }

            // Get approved bonuses for this period (not yet paid)
            const bonuses = await this.prisma.bonus.findMany({
                where: {
                    user_id: dto.user_id,
                    status: 'APPROVED',
                    payslip_month: null,
                },
            });

            const bonusesTotal = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);
            const bonusesBreakdown = bonuses.map((b) => ({
                id: b.id,
                name: b.title,
                amount: Number(b.amount),
            }));

            // Process salary advance repayments for this period
            const advances = await this.prisma.salary_advance.findMany({
                where: {
                    user_id: dto.user_id,
                    status: { in: ['APPROVED', 'REPAYING'] },
                    repayment_start: {
                        lte: new Date(dto.year, dto.month - 1, 1),
                    },
                },
            });

            let advanceDeduction = 0;
            for (const advance of advances) {
                if (advance.monthly_deduction && Number(advance.total_repaid) < Number(advance.amount)) {
                    // Process this month's repayment
                    await this.advancesService.processRepayment(advance.id, dto.month, dto.year);
                    advanceDeduction += Number(advance.monthly_deduction);
                }
            }

            // Add advance deduction to deductions
            if (advanceDeduction > 0) {
                deductionsBreakdown.push({
                    name: 'Remboursement avance',
                    amount: advanceDeduction,
                });
            }

            // Calculate final amounts
            const salaryGross = salaryBasic + allowanceTotal;
            const totalDeductions = deductionTotal + advanceDeduction;
            const salaryNet = salaryGross + bonusesTotal - totalDeductions;

            // Create payslip
            const payslip = await this.prisma.payslip.create({
                data: {
                    user_id: dto.user_id,
                    month: dto.month,
                    year: dto.year,
                    salary_basic: salaryBasic,
                    salary_gross: salaryGross,
                    allowances_total: allowanceTotal,
                    allowances_breakdown: allowancesBreakdown,
                    deductions_total: totalDeductions,
                    deductions_breakdown: deductionsBreakdown,
                    bonuses_total: bonusesTotal,
                    bonuses_breakdown: bonusesBreakdown,
                    advances_deducted: advanceDeduction,
                    salary_net: salaryNet,
                    status: 'DRAFT',
                    generated_by: generatedBy,
                    notes: dto.notes,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            work_email: true,
                            department_user_department_idTodepartment: {
                                select: {
                                    department_name: true,
                                },
                            },
                        },
                    },
                    generator: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            });

            // Mark bonuses as paid and link to payslip
            if (bonuses.length > 0) {
                await this.prisma.bonus.updateMany({
                    where: {
                        id: { in: bonuses.map((b) => b.id) },
                    },
                    data: {
                        payslip_month: dto.month,
                        payslip_year: dto.year,
                        status: 'PAID',
                        paid_at: new Date(),
                    },
                });
            }

            this.logger.log(`Payslip ${payslip.id} generated successfully`);
            return {
                success: true,
                data: payslip,
                message: 'Bulletin de paie généré avec succès',
            };
        } catch (error: any) {
            this.logger.error(`Error generating payslip: ${error.message}`, error.stack);
            throw new BadRequestException(`Erreur lors de la génération: ${error.message}`);
        }
    }

    /**
     * Get all payslips with filters
     */
    async findAll(filters?: {
        user_id?: number;
        month?: number;
        year?: number;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const where: any = {};

        if (filters?.user_id) {
            where.user_id = filters.user_id;
        }

        if (filters?.month) {
            where.month = filters.month;
        }

        if (filters?.year) {
            where.year = filters.year;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.payslip.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            work_email: true,
                            department_user_department_idTodepartment: {
                                select: {
                                    department_name: true,
                                },
                            },
                        },
                    },
                    generator: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' },
                ],
                skip,
                take: limit,
            }),
            this.prisma.payslip.count({ where }),
        ]);

        return {
            success: true,
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get current user's payslips
     */
    async findMyPayslips(userId: number, filters?: { year?: number }) {
        const where: any = {
            user_id: userId,
            status: { not: 'DRAFT' }, // Only show published payslips to employees
        };

        if (filters?.year) {
            where.year = filters.year;
        }

        const payslips = await this.prisma.payslip.findMany({
            where,
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
        });

        return {
            success: true,
            data: payslips,
        };
    }

    /**
     * Get a single payslip
     */
    async findOne(id: number) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                    },
                },
                generator: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
            },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        return {
            success: true,
            data: payslip,
        };
    }

    /**
     * Update a payslip (only DRAFT)
     */
    async update(id: number, dto: UpdatePayslipDto) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        if (payslip.status !== 'DRAFT') {
            throw new BadRequestException('Can only update DRAFT payslips');
        }

        const updated = await this.prisma.payslip.update({
            where: { id },
            data: dto,
        });

        return {
            success: true,
            data: updated,
            message: 'Bulletin mis à jour',
        };
    }

    /**
     * Delete a payslip (only DRAFT)
     */
    async delete(id: number) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        if (payslip.status !== 'DRAFT') {
            throw new BadRequestException('Can only delete DRAFT payslips');
        }

        await this.prisma.payslip.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Bulletin supprimé',
        };
    }

    /**
     * Publish a payslip
     */
    async publish(id: number) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        if (payslip.status !== 'DRAFT') {
            throw new BadRequestException('Can only publish DRAFT payslips');
        }

        const updated = await this.prisma.payslip.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                published_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                    },
                },
            },
        });

        this.logger.log(`Payslip ${id} published for ${updated.user.full_name}`);

        return {
            success: true,
            data: updated,
            message: 'Bulletin publié',
        };
    }

    /**
     * Generate PDF (placeholder - would use pdfkit or puppeteer in real implementation)
     */
    async generatePDF(id: number): Promise<Buffer> {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        // TODO: Implement real PDF generation with pdfkit or puppeteer
        // For now, return a simple text-based PDF
        const pdfContent = `
BULLETIN DE PAIE
================

Employé: ${payslip.user.full_name}
Période: ${payslip.month}/${payslip.year}

Salaire de base: ${payslip.salary_basic} EUR
Salaire brut: ${payslip.salary_gross} EUR
Allocations: ${payslip.allowances_total} EUR
Déductions: ${payslip.deductions_total} EUR
Primes: ${payslip.bonuses_total || 0} EUR

SALAIRE NET: ${payslip.salary_net} EUR

Généré le: ${new Date().toLocaleDateString('fr-FR')}
    `;

        return Buffer.from(pdfContent, 'utf-8');
    }
}

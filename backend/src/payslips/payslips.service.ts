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
     * Simulate salary calculation
     */
    async simulateSalary(grossSalary: number) {
        // Simulation standard (Approximation RDC/International)
        // Adjust these rates based on local tax laws (IPR, CNSS, etc.)
        const socialSecurityRate = 0.05; // Exemple: CNSS (Part employé) ~5%
        const taxRate = 0.15; // Exemple: IPR (Impôt) ~15% (Moyenne)

        const employerChargesRate = 0.10; // Exemple: CNSS/INPP (Part patronale) ~10%

        const salaryGross = Number(grossSalary);
        const employeeDeductions = salaryGross * (socialSecurityRate + taxRate);
        const salaryNet = salaryGross - employeeDeductions;
        const employerCost = salaryGross * (1 + employerChargesRate);

        return {
            gross_salary: salaryGross,
            net_salary: Number(salaryNet.toFixed(2)),
            employee_deductions: Number(employeeDeductions.toFixed(2)),
            employer_cost: Number(employerCost.toFixed(2)),
            employer_charges: Number((salaryGross * employerChargesRate).toFixed(2)),
            monthly_net: Number(salaryNet.toFixed(2)) // Monthly same as calculated
        };
    }

    /**
     * Generate PDF using PDFKit
     */
    async generatePDF(id: number): Promise<Buffer> {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        department_user_department_idTodepartment: true,
                        position: true
                    }
                },
            },
        });

        if (!payslip) {
            throw new NotFoundException('Payslip not found');
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        return new Promise((resolve, reject) => {
            doc.on('data', (buffer: any) => buffers.push(buffer));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err: any) => reject(err));

            // -- HEADER --
            doc.fontSize(20).text('BULLETIN DE PAIE', { align: 'center' });
            doc.moveDown();

            // Company Info (Mock)
            doc.fontSize(10).text('HRMS Corp', 50, 80);
            doc.text('123 Business Street', 50, 95);
            doc.text('75000 Paris, France', 50, 110);
            doc.text('SIRET: 123 456 789 00012', 50, 125);

            // Employee Info
            doc.rect(300, 80, 250, 80).stroke();
            doc.fontSize(10).font('Helvetica-Bold').text('EMPLOYÉ', 310, 90);
            doc.font('Helvetica').text(`${payslip.user.full_name}`, 310, 105);
            doc.text(`Email: ${payslip.user.work_email}`, 310, 120);
            doc.text(`Département: ${payslip.user.department_user_department_idTodepartment?.department_name || 'N/A'}`, 310, 135);
            doc.text(`Poste: ${payslip.user.position?.title || 'N/A'}`, 310, 150);

            doc.moveDown(4);

            // Period
            doc.fontSize(12).font('Helvetica-Bold')
                .text(`Période de paie: ${(payslip.month).toString().padStart(2, '0')}/${payslip.year}`, 50, 200);

            // -- TABLE HEADER --
            const tableTop = 230;
            doc.font('Helvetica-Bold');
            doc.text('Description', 50, tableTop);
            doc.text('Base', 200, tableTop, { align: 'right' });
            doc.text('Taux', 300, tableTop, { align: 'right' });
            doc.text('Montant', 400, tableTop, { align: 'right' });
            doc.text('Net', 500, tableTop, { align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // -- ROWS --
            let y = tableTop + 25;
            doc.font('Helvetica');

            // Salaire de base
            doc.text('Salaire de base', 50, y);
            doc.text(Number(payslip.salary_basic).toFixed(2), 200, y, { align: 'right' });
            doc.text(Number(payslip.salary_gross).toFixed(2), 500, y, { align: 'right' });
            y += 20;

            // Allowances
            if (payslip.allowances_breakdown && Array.isArray(payslip.allowances_breakdown)) {
                (payslip.allowances_breakdown as any[]).forEach(item => {
                    doc.text(`Indemnité: ${item.name}`, 50, y);
                    doc.text(Number(item.amount).toFixed(2), 500, y, { align: 'right' });
                    y += 15;
                });
            }

            // Deductions
            if (payslip.deductions_breakdown && Array.isArray(payslip.deductions_breakdown)) {
                doc.fillColor('red');
                (payslip.deductions_breakdown as any[]).forEach(item => {
                    doc.text(`Retenue: ${item.name}`, 50, y);
                    doc.text(`-${Number(item.amount).toFixed(2)}`, 500, y, { align: 'right' });
                    y += 15;
                });
                doc.fillColor('black');
            }

            // -- TOTALS --
            y += 20;
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 15;

            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('NET À PAYER', 350, y);
            doc.rect(480, y - 5, 70, 20).fill('#e2e8f0');
            doc.fillColor('black').text(`${Number(payslip.salary_net).toFixed(2)} €`, 480, y, { align: 'right' });

            // Footer
            doc.fontSize(8).text('Ce bulletin de paie est généré électroniquement par HRMS.', 50, 700, { align: 'center' });

            doc.end();
        });
    }
}

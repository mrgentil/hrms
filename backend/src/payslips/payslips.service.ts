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
import { BulkGeneratePayslipDto } from './dto/bulk-generate-payslip.dto';
import PDFDocument = require('pdfkit');

@Injectable()
export class PayslipsService {
    private readonly logger = new Logger(PayslipsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly advancesService: AdvancesService,
    ) { }

    // ─────────────────────────────────────────────────────────────
    // Helpers — Calcul des jours ouvrables du mois
    // ─────────────────────────────────────────────────────────────

    private getWorkingDaysInMonth(year: number, month: number): number {
        const daysInMonth = new Date(year, month, 0).getDate();
        let workingDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            // 0 = Sunday, 6 = Saturday
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
        }
        return workingDays;
    }

    /**
     * Calculate attendance data for a user in a given month
     * Returns: present days, absent days, leave days, overtime hours, late deduction minutes
     */
    private async calculateAttendanceData(
        userId: number,
        year: number,
        month: number,
    ) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get all attendance records for this period
        const attendances = await this.prisma.attendance.findMany({
            where: {
                user_id: userId,
                date: { gte: startDate, lte: endDate },
            },
        });

        // Get approved leaves for this period
        const approvedLeaves = await this.prisma.application.findMany({
            where: {
                user_id: userId,
                status: 'Approved' as any,
                start_date: { lte: endDate },
                end_date: { gte: startDate },
            },
        });

        // Count leave days within the month
        let leaveDays = 0;
        const leaveDatesSet = new Set<string>();
        for (const leave of approvedLeaves) {
            const leaveStart = new Date(Math.max(leave.start_date.getTime(), startDate.getTime()));
            const leaveEnd = new Date(Math.min(leave.end_date.getTime(), endDate.getTime()));
            for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    leaveDatesSet.add(d.toISOString().split('T')[0]);
                    leaveDays++;
                }
            }
        }

        const totalWorkingDays = this.getWorkingDaysInMonth(year, month);
        let presentDays = 0;
        let totalOvertimeHours = 0;
        let lateMinutesTotal = 0;

        for (const att of attendances) {
            const dateStr = att.date.toISOString().split('T')[0];
            if (att.status === 'PRESENT' || att.status === 'LATE') {
                presentDays++;
            }
            if (att.overtime_hours) {
                totalOvertimeHours += att.overtime_hours;
            }
            // Accumulate late minutes (approximate from check_in vs schedule)
            if (att.status === 'LATE' && att.check_in) {
                const checkIn = new Date(att.check_in);
                const scheduled = new Date(att.date);
                scheduled.setHours(9, 0, 0, 0); // Default 9h00
                const lateMs = checkIn.getTime() - scheduled.getTime();
                if (lateMs > 0) {
                    lateMinutesTotal += Math.floor(lateMs / 60000);
                }
            }
        }

        const absentDays = Math.max(0, totalWorkingDays - leaveDays - presentDays);

        return {
            totalWorkingDays,
            presentDays,
            absentDays,
            leaveDays,
            totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
            lateMinutesTotal,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Main creation — with attendance-based calculation
    // ─────────────────────────────────────────────────────────────

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
                    department: { select: { name: true } },
                    position: { select: { title: true } },
                },
            });

            if (!user) throw new NotFoundException('User not found');

            const financialInfo = user.user_financial_info?.[0];
            if (!financialInfo) {
                throw new BadRequestException('User has no financial information configured');
            }

            // ── 1. Base salary components ──
            const salaryBasic = Number(financialInfo.salary_basic) || 0;
            const allowanceTotal = Number(financialInfo.allowance_total) || 0;
            const baseDeductionTotal = Number(financialInfo.deduction_total) || 0;

            // ── 2. Attendance-based adjustments ──
            const attendanceData = await this.calculateAttendanceData(
                dto.user_id,
                dto.year,
                dto.month,
            );

            const { totalWorkingDays, presentDays, absentDays, leaveDays, totalOvertimeHours, lateMinutesTotal } = attendanceData;

            // Absence deduction: proportional to absent days (without approved leaves)
            let absenceDeduction = 0;
            if (absentDays > 0 && totalWorkingDays > 0) {
                const dailyRate = salaryBasic / totalWorkingDays;
                absenceDeduction = Math.round(dailyRate * absentDays * 100) / 100;
            }

            // Late deduction: if total late minutes > 30 per month → proportional deduction
            let lateDeduction = 0;
            if (lateMinutesTotal > 30 && salaryBasic > 0) {
                const monthlyMinutes = totalWorkingDays * 8 * 60; // total expected work minutes
                lateDeduction = Math.round((salaryBasic * (lateMinutesTotal / monthlyMinutes)) * 100) / 100;
            }

            // Overtime bonus: overtime rate = 1.25x hourly rate
            let overtimeBonus = 0;
            if (totalOvertimeHours > 0 && salaryBasic > 0 && totalWorkingDays > 0) {
                const hourlyRate = salaryBasic / (totalWorkingDays * 8);
                overtimeBonus = Math.round(hourlyRate * 1.25 * totalOvertimeHours * 100) / 100;
            }

            // ── 3. Build allowances breakdown ──
            const allowancesBreakdown: Array<{ name: string; amount: number }> = [];
            if (financialInfo.allowance_house_rent) allowancesBreakdown.push({ name: 'Logement', amount: Number(financialInfo.allowance_house_rent) });
            if (financialInfo.allowance_medical) allowancesBreakdown.push({ name: 'Santé', amount: Number(financialInfo.allowance_medical) });
            if (financialInfo.allowance_special) allowancesBreakdown.push({ name: 'Spéciale', amount: Number(financialInfo.allowance_special) });
            if (financialInfo.allowance_fuel) allowancesBreakdown.push({ name: 'Carburant', amount: Number(financialInfo.allowance_fuel) });
            if (financialInfo.allowance_phone_bill) allowancesBreakdown.push({ name: 'Téléphone', amount: Number(financialInfo.allowance_phone_bill) });
            if (financialInfo.allowance_other) allowancesBreakdown.push({ name: 'Autres', amount: Number(financialInfo.allowance_other) });

            if (overtimeBonus > 0) {
                allowancesBreakdown.push({
                    name: `Heures sup. (${totalOvertimeHours}h × 1.25)`,
                    amount: overtimeBonus,
                });
            }

            // ── 4. Build deductions breakdown ──
            const deductionsBreakdown: Array<{ name: string; amount: number }> = [];
            if (financialInfo.deduction_provident_fund) deductionsBreakdown.push({ name: 'Caisse de prévoyance', amount: Number(financialInfo.deduction_provident_fund) });
            if (financialInfo.deduction_tax) deductionsBreakdown.push({ name: 'Impôts / IPR', amount: Number(financialInfo.deduction_tax) });
            if (financialInfo.deduction_other) deductionsBreakdown.push({ name: 'Autres déductions', amount: Number(financialInfo.deduction_other) });

            if (absenceDeduction > 0) {
                deductionsBreakdown.push({
                    name: `Absences non justifiées (${absentDays}j)`,
                    amount: absenceDeduction,
                });
            }
            if (lateDeduction > 0) {
                deductionsBreakdown.push({
                    name: `Retenues retards (${lateMinutesTotal}min)`,
                    amount: lateDeduction,
                });
            }

            // ── 5. Bonuses ──
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

            // ── 6. Advances ──
            const advances = await this.prisma.salary_advance.findMany({
                where: {
                    user_id: dto.user_id,
                    status: { in: ['APPROVED', 'REPAYING'] },
                    repayment_start: { lte: new Date(dto.year, dto.month - 1, 1) },
                },
            });

            let advanceDeduction = 0;
            for (const advance of advances) {
                if (advance.monthly_deduction && Number(advance.total_repaid) < Number(advance.amount)) {
                    await this.advancesService.processRepayment(advance.id, dto.month, dto.year);
                    advanceDeduction += Number(advance.monthly_deduction);
                }
            }

            if (advanceDeduction > 0) {
                deductionsBreakdown.push({ name: 'Remboursement avance sur salaire', amount: advanceDeduction });
            }

            // ── 7. Final calculations ──
            const totalAllowances = allowanceTotal + overtimeBonus;
            const salaryGross = salaryBasic + totalAllowances;
            const totalDeductions = baseDeductionTotal + absenceDeduction + lateDeduction + advanceDeduction;
            const salaryNet = salaryGross + bonusesTotal - totalDeductions;

            // ── 8. Create payslip ──
            const payslip = await this.prisma.payslip.create({
                data: {
                    user_id: dto.user_id,
                    month: dto.month,
                    year: dto.year,
                    salary_basic: salaryBasic,
                    salary_gross: salaryGross,
                    allowances_total: totalAllowances,
                    allowances_breakdown: allowancesBreakdown,
                    deductions_total: totalDeductions,
                    deductions_breakdown: deductionsBreakdown,
                    bonuses_total: bonusesTotal,
                    bonuses_breakdown: bonusesBreakdown,
                    advances_deducted: advanceDeduction,
                    salary_net: Math.max(0, salaryNet),
                    status: 'DRAFT',
                    generated_by: generatedBy,
                    notes: [
                        dto.notes,
                        `Présences: ${presentDays}/${totalWorkingDays} jours`,
                        absentDays > 0 ? `Absences: ${absentDays}j` : null,
                        leaveDays > 0 ? `Congés: ${leaveDays}j` : null,
                        totalOvertimeHours > 0 ? `Heures sup: ${totalOvertimeHours}h` : null,
                    ].filter(Boolean).join(' | '),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            work_email: true,
                            department: { select: { name: true } },
                        },
                    },
                    generator: { select: { id: true, full_name: true } },
                },
            });

            // Mark bonuses as paid
            if (bonuses.length > 0) {
                await this.prisma.bonus.updateMany({
                    where: { id: { in: bonuses.map((b) => b.id) } },
                    data: {
                        payslip_month: dto.month,
                        payslip_year: dto.year,
                        status: 'PAID',
                        paid_at: new Date(),
                    },
                });
            }

            this.logger.log(`Payslip ${payslip.id} generated for user ${dto.user_id} (net: ${salaryNet.toFixed(2)})`);

            return {
                success: true,
                data: {
                    ...payslip,
                    attendance_summary: {
                        totalWorkingDays,
                        presentDays,
                        absentDays,
                        leaveDays,
                        totalOvertimeHours,
                        absenceDeduction,
                        overtimeBonus,
                        lateDeduction,
                    },
                },
                message: 'Bulletin de paie généré avec succès',
            };
        } catch (error: any) {
            this.logger.error(`Error generating payslip: ${error.message}`, error.stack);
            throw new BadRequestException(`Erreur lors de la génération: ${error.message}`);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Bulk generate — for all active employees in a department/company
    // ─────────────────────────────────────────────────────────────

    async bulkGenerate(generatedBy: number, dto: BulkGeneratePayslipDto) {
        this.logger.log(`Bulk payslip generation for ${dto.month}/${dto.year}`);

        const where: any = {
            active: true,
            user_financial_info: { some: {} }, // Only users with financial info
        };

        if (dto.department_id) {
            where.department_id = dto.department_id;
        }

        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, full_name: true },
        });

        const results = {
            success: [] as any[],
            skipped: [] as any[],
            errors: [] as any[],
        };

        for (const user of users) {
            // Skip if already exists
            const existing = await this.prisma.payslip.findFirst({
                where: { user_id: user.id, month: dto.month, year: dto.year },
            });

            if (existing) {
                results.skipped.push({ userId: user.id, name: user.full_name, reason: 'Already exists' });
                continue;
            }

            try {
                const result = await this.create(generatedBy, {
                    user_id: user.id,
                    month: dto.month,
                    year: dto.year,
                    notes: dto.notes,
                });
                results.success.push({ userId: user.id, name: user.full_name, payslipId: result.data.id });
            } catch (err: any) {
                results.errors.push({ userId: user.id, name: user.full_name, error: err.message });
            }
        }

        return {
            success: true,
            message: `Génération terminée: ${results.success.length} créés, ${results.skipped.length} ignorés, ${results.errors.length} erreurs`,
            data: results,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Standard CRUD
    // ─────────────────────────────────────────────────────────────

    async findAll(filters?: {
        user_id?: number;
        month?: number;
        year?: number;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const where: any = {};
        if (filters?.user_id) where.user_id = filters.user_id;
        if (filters?.month) where.month = filters.month;
        if (filters?.year) where.year = filters.year;
        if (filters?.status) where.status = filters.status;

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
                            department: { select: { name: true } },
                        },
                    },
                    generator: { select: { id: true, full_name: true } },
                },
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.payslip.count({ where }),
        ]);

        return { success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findMyPayslips(userId: number, filters?: { year?: number }) {
        const where: any = {
            user_id: userId,
            status: { not: 'DRAFT' },
        };
        if (filters?.year) where.year = filters.year;

        const payslips = await this.prisma.payslip.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });

        return { success: true, data: payslips };
    }

    async findOne(id: number) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } },
                        user_financial_info: {
                            select: { bank_name: true, account_number: true, iban: true },
                        },
                    },
                },
                generator: { select: { id: true, full_name: true } },
            },
        });

        if (!payslip) throw new NotFoundException('Payslip not found');

        return { success: true, data: payslip };
    }

    async update(id: number, dto: UpdatePayslipDto) {
        const payslip = await this.prisma.payslip.findUnique({ where: { id } });
        if (!payslip) throw new NotFoundException('Payslip not found');
        if (payslip.status !== 'DRAFT') throw new BadRequestException('Can only update DRAFT payslips');

        const updated = await this.prisma.payslip.update({ where: { id }, data: dto });
        return { success: true, data: updated, message: 'Bulletin mis à jour' };
    }

    async delete(id: number) {
        const payslip = await this.prisma.payslip.findUnique({ where: { id } });
        if (!payslip) throw new NotFoundException('Payslip not found');
        if (payslip.status !== 'DRAFT') throw new BadRequestException('Can only delete DRAFT payslips');

        await this.prisma.payslip.delete({ where: { id } });
        return { success: true, message: 'Bulletin supprimé' };
    }

    async publish(id: number) {
        const payslip = await this.prisma.payslip.findUnique({ where: { id } });
        if (!payslip) throw new NotFoundException('Payslip not found');
        if (payslip.status !== 'DRAFT') throw new BadRequestException('Can only publish DRAFT payslips');

        const updated = await this.prisma.payslip.update({
            where: { id },
            data: { status: 'PUBLISHED', published_at: new Date() },
            include: { user: { select: { id: true, full_name: true, work_email: true } } },
        });

        this.logger.log(`Payslip ${id} published for ${updated.user.full_name}`);
        return { success: true, data: updated, message: 'Bulletin publié' };
    }

    async simulateSalary(grossSalary: number) {
        const socialSecurityRate = 0.05;
        const taxRate = 0.15;
        const employerChargesRate = 0.10;

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
            monthly_net: Number(salaryNet.toFixed(2)),
        };
    }

    // ─────────────────────────────────────────────────────────────
    // PDF Generation — Professional Design
    // ─────────────────────────────────────────────────────────────

    async generatePDF(id: number): Promise<Buffer> {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        department: true,
                        position: true,
                        user_financial_info: true,
                        company: true,
                    },
                },
                generator: { select: { id: true, full_name: true } },
            },
        });

        if (!payslip) throw new NotFoundException('Payslip not found');

        const company = payslip.user?.company;
        const financialInfo = payslip.user?.user_financial_info?.[0];

        const MONTHS_FR = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
        ];

        const monthLabel = MONTHS_FR[(payslip.month - 1)];
        const currency = company?.currency || '€';
        const fmt = (n: any) => `${Number(n || 0).toFixed(2)} ${currency}`;

        // Colors
        const PRIMARY = '#1e3a5f';    // Dark navy blue
        const ACCENT = '#2563eb';     // Blue accent
        const GREEN = '#16a34a';      // Green for earnings
        const RED = '#dc2626';        // Red for deductions
        const LIGHT_GRAY = '#f1f5f9'; // Light background

        return new Promise((resolve, reject) => {
            const doc = new (PDFDocument as any)({ margin: 0, size: 'A4' });
            const buffers: Buffer[] = [];
            doc.on('data', (b: Buffer) => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const W = 595; // A4 width in points
            const H = 842; // A4 height in points
            const MARGIN = 40;
            const COL_W = (W - MARGIN * 2) / 2 - 10;

            // ── HEADER BAND ──
            doc.rect(0, 0, W, 90).fill(PRIMARY);

            // Company name
            doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
                .text(company?.name || 'HRMS Corp', MARGIN, 20, { width: 280 });

            doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
                .text([
                    company?.address,
                    company?.email,
                    company?.tax_id ? `TVA: ${company.tax_id}` : null,
                ].filter(Boolean).join('  •  '), MARGIN, 50, { width: 350 });

            // Bulletin label (top right)
            doc.fillColor('#e2e8f0').fontSize(14).font('Helvetica-Bold')
                .text('BULLETIN DE PAIE', W - 220, 18, { width: 180, align: 'right' });

            doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
                .text(`${monthLabel} ${payslip.year}`, W - 220, 40, { width: 180, align: 'right' });

            doc.fillColor('#64748b').fontSize(8)
                .text(`N° ${String(payslip.id).padStart(6, '0')}`, W - 220, 56, { width: 180, align: 'right' });

            // ── INFO CARDS ──
            const cardY = 105;
            const cardH = 80;

            // Employee card
            doc.rect(MARGIN, cardY, COL_W, cardH).fillAndStroke(LIGHT_GRAY, LIGHT_GRAY);
            doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('EMPLOYÉ', MARGIN + 10, cardY + 10);
            doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
                .text(payslip.user.full_name, MARGIN + 10, cardY + 24);
            doc.fillColor('#64748b').fontSize(8).font('Helvetica')
                .text(payslip.user.position?.title || '', MARGIN + 10, cardY + 42)
                .text(payslip.user.department?.name || '', MARGIN + 10, cardY + 54)
                .text(payslip.user.work_email || '', MARGIN + 10, cardY + 66);

            // Period card
            const card2X = MARGIN + COL_W + 20;
            doc.rect(card2X, cardY, COL_W, cardH).fillAndStroke(LIGHT_GRAY, LIGHT_GRAY);
            doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text('PÉRIODE', card2X + 10, cardY + 10);
            doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold')
                .text(`${monthLabel} ${payslip.year}`, card2X + 10, cardY + 24);
            doc.fillColor('#64748b').fontSize(8).font('Helvetica')
                .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, card2X + 10, cardY + 42)
                .text(`Par: ${payslip.generator?.full_name || 'Système'}`, card2X + 10, cardY + 54)
                .text(`Statut: ${payslip.status}`, card2X + 10, cardY + 66);

            // ── GAINS SECTION ──
            let y = cardY + cardH + 20;

            // Section header: Gains
            doc.rect(MARGIN, y, W - MARGIN * 2, 22).fill(GREEN);
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
                .text('ÉLÉMENTS DE SALAIRE (GAINS)', MARGIN + 10, y + 7);

            y += 22;

            // Table header
            const colDes = MARGIN;
            const colMnt = W - MARGIN - 90;
            const rowH = 18;

            doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill('#dcfce7');
            doc.fillColor('#166534').fontSize(7.5).font('Helvetica-Bold')
                .text('Libellé', colDes + 8, y + 5)
                .text('Montant', colMnt, y + 5, { width: 80, align: 'right' });
            y += rowH;

            // Salaire de base row
            doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill('white');
            doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold')
                .text('Salaire de base', colDes + 8, y + 5);
            doc.fillColor(GREEN).font('Helvetica-Bold')
                .text(fmt(payslip.salary_basic), colMnt, y + 5, { width: 80, align: 'right' });
            y += rowH;

            // Allowances
            let totalGains = Number(payslip.salary_basic);
            if (payslip.allowances_breakdown && Array.isArray(payslip.allowances_breakdown)) {
                (payslip.allowances_breakdown as any[]).forEach((item, i) => {
                    doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill(i % 2 === 0 ? '#f0fdf4' : 'white');
                    doc.fillColor('#374151').fontSize(8.5).font('Helvetica')
                        .text(`Indemnité – ${item.name}`, colDes + 8, y + 5);
                    doc.fillColor(GREEN)
                        .text(fmt(item.amount), colMnt, y + 5, { width: 80, align: 'right' });
                    totalGains += Number(item.amount);
                    y += rowH;
                });
            }

            // Bonuses
            if (payslip.bonuses_breakdown && Array.isArray(payslip.bonuses_breakdown)) {
                (payslip.bonuses_breakdown as any[]).forEach((item) => {
                    doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill('#f0fdf4');
                    doc.fillColor('#374151').fontSize(8.5).font('Helvetica')
                        .text(`Prime – ${item.name}`, colDes + 8, y + 5);
                    doc.fillColor(GREEN)
                        .text(fmt(item.amount), colMnt, y + 5, { width: 80, align: 'right' });
                    totalGains += Number(item.amount);
                    y += rowH;
                });
            }

            // Gains total
            doc.rect(MARGIN, y, W - MARGIN * 2, 20).fill('#bbf7d0');
            doc.fillColor('#14532d').fontSize(9).font('Helvetica-Bold')
                .text('TOTAL BRUT', colDes + 8, y + 6)
                .text(fmt(payslip.salary_gross), colMnt, y + 6, { width: 80, align: 'right' });
            y += 20;

            // ── RETENUES SECTION ──
            y += 12;
            doc.rect(MARGIN, y, W - MARGIN * 2, 22).fill(RED);
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
                .text('RETENUES ET DÉDUCTIONS', MARGIN + 10, y + 7);
            y += 22;

            doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill('#fee2e2');
            doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold')
                .text('Libellé', colDes + 8, y + 5)
                .text('Montant', colMnt, y + 5, { width: 80, align: 'right' });
            y += rowH;

            if (payslip.deductions_breakdown && Array.isArray(payslip.deductions_breakdown)) {
                (payslip.deductions_breakdown as any[]).forEach((item, i) => {
                    doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill(i % 2 === 0 ? '#fff1f2' : 'white');
                    doc.fillColor('#374151').fontSize(8.5).font('Helvetica')
                        .text(item.name, colDes + 8, y + 5);
                    doc.fillColor(RED)
                        .text(`- ${fmt(item.amount)}`, colMnt, y + 5, { width: 80, align: 'right' });
                    y += rowH;
                });
            } else {
                doc.rect(MARGIN, y, W - MARGIN * 2, rowH).fill('white');
                doc.fillColor('#9ca3af').fontSize(8.5).font('Helvetica')
                    .text('Aucune retenue', colDes + 8, y + 5);
                y += rowH;
            }

            // Deductions total
            doc.rect(MARGIN, y, W - MARGIN * 2, 20).fill('#fecaca');
            doc.fillColor('#7f1d1d').fontSize(9).font('Helvetica-Bold')
                .text('TOTAL RETENUES', colDes + 8, y + 6)
                .text(`- ${fmt(payslip.deductions_total)}`, colMnt, y + 6, { width: 80, align: 'right' });
            y += 20;

            // ── NET À PAYER ──
            y += 15;
            doc.rect(MARGIN, y, W - MARGIN * 2, 45).fill(PRIMARY);
            doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
                .text('NET À PAYER', MARGIN + 15, y + 14);
            doc.fillColor('#60a5fa').fontSize(18).font('Helvetica-Bold')
                .text(fmt(payslip.salary_net), colMnt - 20, y + 10, { width: 110, align: 'right' });
            y += 45;

            // ── BANK INFO ──
            if (financialInfo?.iban || financialInfo?.bank_name) {
                y += 12;
                doc.rect(MARGIN, y, W - MARGIN * 2, 32).fill(LIGHT_GRAY);
                doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
                    .text(`Banque: ${financialInfo?.bank_name || 'N/A'}`, MARGIN + 10, y + 8)
                    .text(`IBAN: ${financialInfo?.iban ? '****' + financialInfo.iban.slice(-4) : 'N/A'}`, MARGIN + 10, y + 20);
                y += 32;
            }

            // ── NOTES ──
            if (payslip.notes) {
                y += 10;
                doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Oblique')
                    .text(`Note: ${payslip.notes}`, MARGIN, y, { width: W - MARGIN * 2 });
                y += 20;
            }

            // ── FOOTER ──
            doc.rect(0, H - 35, W, 35).fill('#f8fafc');
            doc.rect(0, H - 36, W, 1).fill('#e2e8f0');
            doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
                .text(
                    'Ce bulletin de paie est un document électronique généré par le système HRMS. Conservez-le précieusement.',
                    MARGIN, H - 23, { width: W - MARGIN * 2, align: 'center' },
                );

            doc.end();
        });
    }
}

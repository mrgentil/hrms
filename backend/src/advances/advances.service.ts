import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { ReviewAdvanceDto } from './dto/review-advance.dto';
import { advance_status } from '@prisma/client';

@Injectable()
export class AdvancesService {
    private readonly logger = new Logger(AdvancesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly rolesService: RolesService,
    ) { }

    /**
     * Create a new salary advance request
     */
    async create(userId: number, dto: CreateAdvanceDto) {
        this.logger.log(`User ${userId} creating advance request for ${dto.amount}`);

        // Validate user exists and get their salary info
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_financial_info: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Optional: Validate advance amount against salary (e.g., max 50% of monthly salary)
        const maxAdvance = user.user_financial_info?.[0]?.salary_net
            ? Number(user.user_financial_info[0].salary_net) * 0.5
            : null;

        if (maxAdvance && dto.amount > maxAdvance) {
            throw new BadRequestException(
                `Advance amount cannot exceed 50% of monthly net salary (${maxAdvance.toFixed(2)} EUR)`,
            );
        }

        // Calculate monthly deduction if repayment months specified
        const monthlyDeduction = dto.repayment_months
            ? dto.amount / dto.repayment_months
            : null;

        const advance = await this.prisma.salary_advance.create({
            data: {
                user_id: userId,
                amount: dto.amount,
                reason: dto.reason,
                needed_by_date: dto.needed_by_date ? new Date(dto.needed_by_date) : null,
                repayment_months: dto.repayment_months,
                monthly_deduction: monthlyDeduction,
                status: advance_status.DRAFT,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                        department: {
                            select: {
                                department_name: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`Advance ${advance.id} created successfully`);
        return advance;
    }

    /**
     * Get all advances (HR/Admin only)
     */
    async findAll(filters?: {
        user_id?: number;
        status?: advance_status;
        page?: number;
        limit?: number;
    }) {
        const where: any = {};

        if (filters?.user_id) {
            where.user_id = filters.user_id;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.salary_advance.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            work_email: true,
                            department: {
                                select: {
                                    department_name: true,
                                },
                            },
                        },
                    },
                    reviewer: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                    repayments: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.salary_advance.count({ where }),
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
     * Get current user's advances
     */
    async findMyAdvances(userId: number) {
        const advances = await this.prisma.salary_advance.findMany({
            where: {
                user_id: userId,
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
                repayments: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return {
            success: true,
            data: advances,
        };
    }

    /**
     * Get a single advance by ID
     */
    async findOne(id: number, userId?: number) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
                repayments: {
                    orderBy: {
                        deducted_at: 'desc',
                    },
                },
            },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        // Check if user has access to this advance
        if (userId && advance.user_id !== userId) {
            // User can only see their own advances unless they have permission
            throw new ForbiddenException('Access denied');
        }

        return {
            success: true,
            data: advance,
        };
    }

    /**
     * Update an advance (only in DRAFT status)
     */
    async update(id: number, userId: number, dto: UpdateAdvanceDto) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (advance.user_id !== userId) {
            throw new ForbiddenException('You can only update your own advances');
        }

        if (advance.status !== advance_status.DRAFT) {
            throw new BadRequestException('Can only update advances in DRAFT status');
        }

        // Recalculate monthly deduction if amount or months changed
        const amount = dto.amount ?? Number(advance.amount);
        const months = dto.repayment_months ?? advance.repayment_months;
        const monthlyDeduction = months ? amount / months : null;

        const updated = await this.prisma.salary_advance.update({
            where: { id },
            data: {
                ...dto,
                needed_by_date: dto.needed_by_date ? new Date(dto.needed_by_date) : undefined,
                monthly_deduction: monthlyDeduction,
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

        return {
            success: true,
            data: updated,
            message: 'Advance updated successfully',
        };
    }

    /**
     * Submit an advance for approval
     */
    async submit(id: number, userId: number) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (advance.user_id !== userId) {
            throw new ForbiddenException('You can only submit your own advances');
        }

        if (advance.status !== advance_status.DRAFT) {
            throw new BadRequestException('Can only submit advances in DRAFT status');
        }

        const updated = await this.prisma.salary_advance.update({
            where: { id },
            data: {
                status: advance_status.PENDING,
                submitted_at: new Date(),
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

        this.logger.log(`Advance ${id} submitted for approval by user ${userId}`);

        return {
            success: true,
            data: updated,
            message: 'Advance submitted for approval',
        };
    }

    /**
     * Review an advance (approve or reject)
     */
    async review(id: number, reviewerId: number, dto: ReviewAdvanceDto) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (advance.status !== advance_status.PENDING) {
            throw new BadRequestException('Can only review advances in PENDING status');
        }

        const newStatus =
            dto.status === advance_status.APPROVED
                ? advance_status.APPROVED
                : advance_status.REJECTED;

        const updated = await this.prisma.salary_advance.update({
            where: { id },
            data: {
                status: newStatus,
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                reviewer_comment: dto.reviewer_comment,
                // If approved and has repayment plan, set repayment start date to next month
                repayment_start:
                    newStatus === advance_status.APPROVED && advance.repayment_months
                        ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                        : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
            },
        });

        this.logger.log(
            `Advance ${id} ${newStatus} by reviewer ${reviewerId}`,
        );

        return {
            success: true,
            data: updated,
            message: `Advance ${newStatus.toLowerCase()}`,
        };
    }

    /**
     * Cancel an advance
     */
    async cancel(id: number, userId: number) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (advance.user_id !== userId) {
            throw new ForbiddenException('You can only cancel your own advances');
        }

        if (!['DRAFT', 'PENDING'].includes(advance.status)) {
            throw new BadRequestException('Can only cancel DRAFT or PENDING advances');
        }

        const updated = await this.prisma.salary_advance.update({
            where: { id },
            data: {
                status: advance_status.CANCELLED,
            },
        });

        return {
            success: true,
            data: updated,
            message: 'Advance cancelled',
        };
    }

    /**
     * Delete an advance (only DRAFT or CANCELLED)
     */
    async delete(id: number, userId: number) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (advance.user_id !== userId) {
            throw new ForbiddenException('You can only delete your own advances');
        }

        if (!['DRAFT', 'CANCELLED'].includes(advance.status)) {
            throw new BadRequestException('Can only delete DRAFT or CANCELLED advances');
        }

        await this.prisma.salary_advance.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Advance deleted successfully',
        };
    }

    /**
     * Process repayment for an advance (called when generating payslip)
     */
    async processRepayment(
        advanceId: number,
        payslipMonth: number,
        payslipYear: number,
    ) {
        const advance = await this.prisma.salary_advance.findUnique({
            where: { id: advanceId },
            include: {
                repayments: true,
            },
        });

        if (!advance) {
            throw new NotFoundException('Advance not found');
        }

        if (!advance.monthly_deduction) {
            throw new BadRequestException('No repayment plan configured');
        }

        const totalRepaid = Number(advance.total_repaid);
        const amount = Number(advance.amount);
        const monthlyDeduction = Number(advance.monthly_deduction);

        // Check if already fully repaid
        if (totalRepaid >= amount) {
            return null;
        }

        // Calculate this month's deduction (last payment might be less)
        const remaining = amount - totalRepaid;
        const thisMonthDeduction = Math.min(monthlyDeduction, remaining);

        // Create repayment record
        const repayment = await this.prisma.advance_repayment.create({
            data: {
                advance_id: advanceId,
                payslip_month: payslipMonth,
                payslip_year: payslipYear,
                amount: thisMonthDeduction,
            },
        });

        // Update advance total_repaid
        const newTotalRepaid = totalRepaid + thisMonthDeduction;
        const fullyRepaid = newTotalRepaid >= amount;

        await this.prisma.salary_advance.update({
            where: { id: advanceId },
            data: {
                total_repaid: newTotalRepaid,
                status: fullyRepaid ? advance_status.COMPLETED : advance_status.REPAYING,
                fully_repaid_at: fullyRepaid ? new Date() : null,
            },
        });

        return repayment;
    }
}

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundRequestDto } from './dto/update-fund-request.dto';
import { ReviewFundRequestDto } from './dto/review-fund-request.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
import { fund_request_status } from '@prisma/client';

@Injectable()
export class FundRequestsService {
    private readonly logger = new Logger(FundRequestsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly rolesService: RolesService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    /**
     * Create a new fund request
     */
    async create(userId: number, dto: CreateFundRequestDto) {
        this.logger.log(`User ${userId} creating fund request for ${dto.amount}`);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const fundRequest = await this.prisma.fund_request.create({
            data: {
                user_id: userId,
                amount: dto.amount,
                reason: dto.reason,
                project: dto.project,
                department: dto.department,
                needed_by: dto.needed_by ? new Date(dto.needed_by) : null,
                status: fund_request_status.DRAFT,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        work_email: true,
                        department: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`Fund request ${fundRequest.id} created successfully`);
        return fundRequest;
    }

    /**
     * Get all fund requests (HR/Admin/Finance only)
     */
    async findAll(filters?: {
        user_id?: number;
        status?: fund_request_status;
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
            this.prisma.fund_request.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            work_email: true,
                            department: {
                                select: {
                                    name: true,
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
                },
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.fund_request.count({ where }),
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
     * Get current user's fund requests
     */
    async findMyRequests(userId: number) {
        const requests = await this.prisma.fund_request.findMany({
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
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return {
            success: true,
            data: requests,
        };
    }

    /**
     * Get a single fund request by ID
     */
    async findOne(id: number, userId?: number) {
        const request = await this.prisma.fund_request.findUnique({
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
            },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        // Check if user has access to this request
        if (userId && request.user_id !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return {
            success: true,
            data: request,
        };
    }

    /**
     * Update a fund request (only in DRAFT status)
     */
    async update(id: number, userId: number, dto: UpdateFundRequestDto) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.user_id !== userId) {
            throw new ForbiddenException('You can only update your own requests');
        }

        if (request.status !== fund_request_status.DRAFT) {
            throw new BadRequestException('Can only update requests in DRAFT status');
        }

        const updated = await this.prisma.fund_request.update({
            where: { id },
            data: {
                ...dto,
                needed_by: dto.needed_by ? new Date(dto.needed_by) : undefined,
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
            message: 'Fund request updated successfully',
        };
    }

    /**
     * Submit a fund request for approval
     */
    async submit(id: number, userId: number) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.user_id !== userId) {
            throw new ForbiddenException('You can only submit your own requests');
        }

        if (request.status !== fund_request_status.DRAFT) {
            throw new BadRequestException('Can only submit requests in DRAFT status');
        }

        const updated = await this.prisma.fund_request.update({
            where: { id },
            data: {
                status: fund_request_status.PENDING,
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

        this.logger.log(`Fund request ${id} submitted for approval by user ${userId}`);

        // NOTIFICATIONS
        // 1. Find reviewers (users with payroll.fund_requests permission)
        // Check both custom roles with permission AND Super Admin (who always has access)
        const reviewers = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'ROLE_SUPER_ADMIN' },
                    {
                        role_relation: {
                            role_permission: {
                                some: {
                                    permission: {
                                        name: 'payroll.fund_requests',
                                    },
                                },
                            },
                        },
                    },
                ],
                active: true, // Only active users
            },
            select: { id: true, work_email: true, full_name: true },
        });

        const requesterName = updated.user.full_name;
        const amount = Number(updated.amount);

        for (const reviewer of reviewers) {
            // In-app notification
            await this.notificationsService.notifyFundRequestSubmitted(
                reviewer.id,
                updated.id,
                requesterName,
                amount,
                updated.reason,
            );

            // Email notification
            if (reviewer.work_email) {
                await this.mailService.sendMail({
                    to: reviewer.work_email,
                    subject: `Nouvelle demande de fonds de ${requesterName}`,
                    html: `
                        <h3>Nouvelle demande de fonds</h3>
                        <p><strong>${requesterName}</strong> a soumis une demande de fonds.</p>
                        <ul>
                            <li><strong>Montant:</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)}</li>
                            <li><strong>Raison:</strong> ${updated.reason}</li>
                            <li><strong>Département:</strong> ${updated.department || 'N/A'}</li>
                            <li><strong>Projet:</strong> ${updated.project || 'N/A'}</li>
                        </ul>
                        <p><a href="${process.env.FRONTEND_URL}/payroll/fund-requests">Cliquez ici pour voir la demande</a></p>
                    `,
                });
            }
        }

        return {
            success: true,
            data: updated,
            message: 'Fund request submitted for approval',
        };
    }

    /**
     * Review a fund request (approve or reject)
     */
    async review(id: number, reviewerId: number, dto: ReviewFundRequestDto) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.status !== fund_request_status.PENDING) {
            throw new BadRequestException('Can only review requests in PENDING status');
        }

        const newStatus =
            dto.status === fund_request_status.APPROVED
                ? fund_request_status.APPROVED
                : fund_request_status.REJECTED;

        const updated = await this.prisma.fund_request.update({
            where: { id },
            data: {
                status: newStatus,
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                reviewer_comment: dto.reviewer_comment,
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

        this.logger.log(`Fund request ${id} ${newStatus} by reviewer ${reviewerId}`);

        // NOTIFICATIONS
        const requester = updated.user;
        const reviewerName = updated.reviewer?.full_name || 'Un administrateur';

        if (newStatus === fund_request_status.APPROVED) {
            // In-app
            await this.notificationsService.notifyFundRequestApproved(
                requester.id,
                updated.id,
                reviewerName,
                dto.reviewer_comment,
            );

            // Email
            if (requester.work_email) {
                await this.mailService.sendMail({
                    to: requester.work_email,
                    subject: 'Votre demande de fonds a été approuvée',
                    html: `
                        <h3>Demande Approuvée ✅</h3>
                        <p>Votre demande de fonds a été approuvée par <strong>${reviewerName}</strong>.</p>
                        <p><strong>Commentaire:</strong> ${dto.reviewer_comment || 'Aucun commentaire'}</p>
                        <p>Le paiement sera traité prochainement.</p>
                        <p><a href="${process.env.FRONTEND_URL}/payroll/fund-requests">Voir la demande</a></p>
                    `,
                });
            }
        } else {
            // REJECTED
            // In-app
            await this.notificationsService.notifyFundRequestRejected(
                requester.id,
                updated.id,
                reviewerName,
                dto.reviewer_comment,
            );

            // Email
            if (requester.work_email) {
                await this.mailService.sendMail({
                    to: requester.work_email,
                    subject: 'Votre demande de fonds a été refusée',
                    html: `
                        <h3>Demande Refusée ❌</h3>
                        <p>Votre demande de fonds a été refusée par <strong>${reviewerName}</strong>.</p>
                        <p><strong>Raison du refus:</strong> ${dto.reviewer_comment || 'Aucun commentaire'}</p>
                        <p><a href="${process.env.FRONTEND_URL}/payroll/fund-requests">Voir la demande</a></p>
                    `,
                });
            }
        }

        return {
            success: true,
            data: updated,
            message: `Fund request ${newStatus.toLowerCase()}`,
        };
    }

    /**
     * Mark a fund request as paid
     */
    async markAsPaid(id: number, reviewerId: number, dto: MarkAsPaidDto) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.status !== fund_request_status.APPROVED) {
            throw new BadRequestException('Can only mark APPROVED requests as paid');
        }

        const updated = await this.prisma.fund_request.update({
            where: { id },
            data: {
                status: fund_request_status.PAID,
                paid_at: new Date(),
                payment_method: dto.payment_method,
                payment_ref: dto.payment_ref,
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

        this.logger.log(`Fund request ${id} marked as paid by ${reviewerId}`);

        // NOTIFICATIONS
        const requester = updated.user;
        const payerName = updated.reviewer?.full_name || 'La comptabilité';
        const amount = Number(updated.amount);

        // In-app
        await this.notificationsService.notifyFundRequestPaid(
            requester.id,
            updated.id,
            payerName,
            amount,
            dto.payment_method,
        );

        // Email
        if (requester.work_email) {
            await this.mailService.sendMail({
                to: requester.work_email,
                subject: 'Paiement de votre demande de fonds effectué',
                html: `
                    <h3>Paiement Effectué 💸</h3>
                    <p>Votre demande de fonds de <strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)}</strong> a été payée.</p>
                    <ul>
                        <li><strong>Payé par:</strong> ${payerName}</li>
                        <li><strong>Méthode:</strong> ${dto.payment_method || 'N/A'}</li>
                        <li><strong>Référence:</strong> ${dto.payment_ref || 'N/A'}</li>
                    </ul>
                    <p><a href="${process.env.FRONTEND_URL}/payroll/fund-requests">Voir la demande</a></p>
                `,
            });
        }

        return {
            success: true,
            data: updated,
            message: 'Fund request marked as paid',
        };
    }

    /**
     * Cancel a fund request
     */
    async cancel(id: number, userId: number) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.user_id !== userId) {
            throw new ForbiddenException('You can only cancel your own requests');
        }

        if (!['DRAFT', 'PENDING'].includes(request.status)) {
            throw new BadRequestException('Can only cancel DRAFT or PENDING requests');
        }

        const updated = await this.prisma.fund_request.update({
            where: { id },
            data: {
                status: fund_request_status.CANCELLED,
            },
        });

        return {
            success: true,
            data: updated,
            message: 'Fund request cancelled',
        };
    }

    /**
     * Delete a fund request (only DRAFT or CANCELLED)
     */
    async delete(id: number, userId: number) {
        const request = await this.prisma.fund_request.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Fund request not found');
        }

        if (request.user_id !== userId) {
            throw new ForbiddenException('You can only delete your own requests');
        }

        if (!['DRAFT', 'CANCELLED'].includes(request.status)) {
            throw new BadRequestException('Can only delete DRAFT or CANCELLED requests');
        }

        await this.prisma.fund_request.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Fund request deleted successfully',
        };
    }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Liste toutes les entreprises (Super Admin) ou uniquement l'entreprise courante (Admin)
     */
    async findAll(isSuperAdmin: boolean, companyId?: number) {
        if (isSuperAdmin) {
            // Super Admin voit toutes les entreprises
            return this.prisma.company.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: {
                            users: true,
                            departments: true,
                            positions: true,
                        },
                    },
                },
            });
        } else if (companyId) {
            // Admin normal voit uniquement son entreprise
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                include: {
                    _count: {
                        select: {
                            users: true,
                            departments: true,
                            positions: true,
                        },
                    },
                },
            });
            return company ? [company] : [];
        }
        return [];
    }

    async findOne(id: number) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        departments: true,
                        positions: true,
                    },
                },
            },
        });

        if (!company) {
            throw new NotFoundException('Entreprise non trouvée');
        }

        return company;
    }

    /**
     * Créer une nouvelle entreprise (Super Admin uniquement)
     */
    async create(createCompanyDto: CreateCompanyDto) {
        return this.prisma.company.create({
            data: {
                name: createCompanyDto.name,
                email: createCompanyDto.email,
                phone: createCompanyDto.phone,
                address: createCompanyDto.address,
                website: createCompanyDto.website,
                tax_id: createCompanyDto.tax_id,
                country: createCompanyDto.country,
                timezone: createCompanyDto.timezone || 'UTC',
                currency: createCompanyDto.currency || '$',
                primary_color: createCompanyDto.primary_color,
                secondary_color: createCompanyDto.secondary_color,
                working_days: createCompanyDto.working_days as any,
                daily_work_hours: createCompanyDto.daily_work_hours,
                probation_period: createCompanyDto.probation_period,
                fiscal_year_start: createCompanyDto.fiscal_year_start,
                is_active: true,
            },
        });
    }

    async update(id: number, updateCompanyDto: UpdateCompanyDto, isSystemAdmin: boolean = false) {
        // Vérifier si l'entreprise existe
        const company = await this.findOne(id);

        // Filtrer les champs
        const { name, ...otherData } = updateCompanyDto;
        const dataToUpdate: any = { ...otherData };

        if (name) {
            dataToUpdate.name = name;
        }

        // Gestion JSON working_days
        if (updateCompanyDto.working_days) {
            dataToUpdate.working_days = updateCompanyDto.working_days as any;
        }

        return this.prisma.company.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    /**
     * Désactiver une entreprise (soft delete)
     */
    async deactivate(id: number) {
        const company = await this.findOne(id);

        // Vérifier s'il y a des utilisateurs actifs
        const activeUsersCount = await this.prisma.user.count({
            where: {
                company_id: id,
                active: true,
            },
        });

        if (activeUsersCount > 0) {
            throw new BadRequestException(
                `Impossible de désactiver cette entreprise: ${activeUsersCount} utilisateur(s) actif(s) y sont rattachés.`
            );
        }

        return this.prisma.company.update({
            where: { id },
            data: { is_active: false },
        });
    }

    /**
     * Réactiver une entreprise
     */
    async reactivate(id: number) {
        await this.prisma.company.findUniqueOrThrow({
            where: { id },
        }).catch(() => {
            throw new NotFoundException('Entreprise non trouvée');
        });

        return this.prisma.company.update({
            where: { id },
            data: { is_active: true },
        });
    }

    async updateLogo(companyId: number, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Format de fichier non supporté (JPG, PNG, WEBP uniquement)');
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'companies', companyId.toString());
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extension = file.originalname.split('.').pop();
        const filename = `logo-${Date.now()}.${extension}`;
        const filePath = join(uploadDir, filename);

        fs.writeFileSync(filePath, file.buffer);

        const logoUrl = `/uploads/companies/${companyId}/${filename}`;

        return this.prisma.company.update({
            where: { id: companyId },
            data: { logo_url: logoUrl },
        });
    }
}

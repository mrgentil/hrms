import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    ForbiddenException,
    ParseIntPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

@Controller('company')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    // ============================================
    // ENDPOINTS SUPER ADMIN - Gestion Multi-Entreprises
    // ============================================

    /**
     * Liste toutes les entreprises (Super Admin uniquement)
     */
    @Get()
    async findAll(@CurrentUser() currentUser: any) {
        const isSuperAdmin = currentUser.role === UserRole.ROLE_SUPER_ADMIN;

        // Pour les non-Super Admin, ils verront seulement leur entreprise
        const companies = await this.companyService.findAll(isSuperAdmin, currentUser.company_id);

        return {
            success: true,
            data: companies,
        };
    }

    /**
     * Créer une nouvelle entreprise (Super Admin uniquement)
     */
    @Post()
    async create(
        @Body() createCompanyDto: CreateCompanyDto,
        @CurrentUser() currentUser: any,
    ) {
        if (currentUser.role !== UserRole.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException('Seul un Super Admin peut créer des entreprises');
        }

        const company = await this.companyService.create(createCompanyDto);
        return {
            success: true,
            data: company,
            message: 'Entreprise créée avec succès',
        };
    }

    // ============================================
    // ENDPOINTS "ME" - Entreprise de l'utilisateur courant
    // IMPORTANT: Ces routes doivent être AVANT les routes :id
    // ============================================

    @Get('me')
    async findMe(@CurrentUser() currentUser: any) {
        if (!currentUser.company_id) {
            throw new ForbiddenException('Aucune entreprise associée à ce compte');
        }
        const company = await this.companyService.findOne(currentUser.company_id);
        return {
            success: true,
            data: company,
        };
    }

    @Patch('me')
    async updateMe(
        @Body() updateCompanyDto: UpdateCompanyDto,
        @CurrentUser() currentUser: any,
    ) {
        if (!currentUser.company_id) {
            throw new ForbiddenException('Aucune entreprise associée');
        }

        const canEdit = [UserRole.ROLE_SUPER_ADMIN, UserRole.ROLE_ADMIN, UserRole.ROLE_RH].includes(currentUser.role);
        if (!canEdit) {
            throw new ForbiddenException('Permissions insuffisantes pour modifier l\'entreprise');
        }

        // Seul Admin peut changer le nom
        if (updateCompanyDto.name && currentUser.role !== UserRole.ROLE_SUPER_ADMIN && currentUser.role !== UserRole.ROLE_ADMIN) {
            delete updateCompanyDto.name;
        }

        const updated = await this.companyService.update(currentUser.company_id, updateCompanyDto, currentUser.role === UserRole.ROLE_SUPER_ADMIN);
        return {
            success: true,
            data: updated,
            message: 'Configuration mise à jour',
        };
    }

    @Post('me/logo')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
                ],
            }),
        )
        file: Express.Multer.File,
        @CurrentUser() currentUser: any,
    ) {
        if (!currentUser.company_id) {
            throw new ForbiddenException('Aucune entreprise associée');
        }

        const canEdit = [UserRole.ROLE_SUPER_ADMIN, UserRole.ROLE_ADMIN, UserRole.ROLE_RH].includes(currentUser.role);
        if (!canEdit) {
            throw new ForbiddenException('Permissions insuffisantes pour modifier le logo');
        }

        const result = await this.companyService.updateLogo(currentUser.company_id, file);
        return {
            success: true,
            data: result,
            message: 'Logo mis à jour avec succès',
        };
    }

    // ============================================
    // ENDPOINTS avec :id - Gestion par ID
    // ============================================

    /**
     * Obtenir les détails d'une entreprise par ID
     */
    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        const isSuperAdmin = currentUser.role === UserRole.ROLE_SUPER_ADMIN;

        // Vérification d'accès: Super Admin peut tout voir, sinon seulement sa propre entreprise
        if (!isSuperAdmin && currentUser.company_id !== id) {
            throw new ForbiddenException('Accès non autorisé à cette entreprise');
        }

        const company = await this.companyService.findOne(id);
        return {
            success: true,
            data: company,
        };
    }

    /**
     * Modifier une entreprise par ID (Super Admin peut modifier toutes, Admin/RH leur propre)
     */
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCompanyDto: UpdateCompanyDto,
        @CurrentUser() currentUser: any,
    ) {
        const isSuperAdmin = currentUser.role === UserRole.ROLE_SUPER_ADMIN;
        const canEdit = [UserRole.ROLE_SUPER_ADMIN, UserRole.ROLE_ADMIN, UserRole.ROLE_RH].includes(currentUser.role);

        if (!canEdit) {
            throw new ForbiddenException('Permissions insuffisantes pour modifier une entreprise');
        }

        // Admin/RH ne peuvent modifier que leur propre entreprise
        if (!isSuperAdmin && currentUser.company_id !== id) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre entreprise');
        }

        // Seul Super Admin peut changer le nom d'une autre entreprise
        if (updateCompanyDto.name && !isSuperAdmin && currentUser.role !== UserRole.ROLE_ADMIN) {
            delete updateCompanyDto.name;
        }

        const updated = await this.companyService.update(id, updateCompanyDto, isSuperAdmin);
        return {
            success: true,
            data: updated,
            message: 'Entreprise mise à jour',
        };
    }

    /**
     * Désactiver une entreprise (Super Admin uniquement)
     */
    @Delete(':id')
    async deactivate(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        if (currentUser.role !== UserRole.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException('Seul un Super Admin peut désactiver des entreprises');
        }

        const result = await this.companyService.deactivate(id);
        return {
            success: true,
            data: result,
            message: 'Entreprise désactivée',
        };
    }

    /**
     * Réactiver une entreprise (Super Admin uniquement)
     */
    @Post(':id/reactivate')
    async reactivate(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: any,
    ) {
        if (currentUser.role !== UserRole.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException('Seul un Super Admin peut réactiver des entreprises');
        }

        const result = await this.companyService.reactivate(id);
        return {
            success: true,
            data: result,
            message: 'Entreprise réactivée',
        };
    }

    /**
     * Upload logo pour une entreprise spécifique (Super Admin)
     */
    @Post(':id/logo')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogoById(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
                ],
            }),
        )
        file: Express.Multer.File,
        @CurrentUser() currentUser: any,
    ) {
        if (currentUser.role !== UserRole.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException('Seul un Super Admin peut modifier le logo d\'autres entreprises');
        }

        const result = await this.companyService.updateLogo(id, file);
        return {
            success: true,
            data: result,
            message: 'Logo mis à jour avec succès',
        };
    }
}

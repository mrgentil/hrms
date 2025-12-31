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
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

@Controller('company')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get('me')
    async findMe(@CurrentUser() currentUser: any) {
        if (!currentUser.company_id) {
            // Cas edge: SuperAdmin sans compagnie ou utilisateur legacy non migré (devrait pas arriver en phase 2)
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

        // Vérification des permissions
        const canEdit = [UserRole.ROLE_SUPER_ADMIN, UserRole.ROLE_ADMIN, UserRole.ROLE_RH].includes(currentUser.role);
        if (!canEdit) {
            throw new ForbiddenException('Permissions insuffisantes pour modifier l\'entreprise');
        }

        // Règle métier: Seul Admin peut changer le nom
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
                    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
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
}

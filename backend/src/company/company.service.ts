import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { createWriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: number) {
        const company = await this.prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            throw new NotFoundException('Entreprise non trouvée');
        }

        return company;
    }

    async update(id: number, updateCompanyDto: UpdateCompanyDto, isSystemAdmin: boolean = false) {
        // Vérifier si l'entreprise existe
        const company = await this.findOne(id);

        // Règle: seul un admin (ou système) peut changer le nom
        // Note: Le guard du controller vérifiera si l'utilisateur est admin de son entreprise
        // Ici on peut ajouter une sécurité supplémentaire si besoin

        // Filtrer les champs
        const { name, ...otherData } = updateCompanyDto;
        const dataToUpdate: any = { ...otherData };

        if (name) {
            if (!isSystemAdmin) {
                // Optionnel : Bloquer le changement de nom si pas admin
                // Pour l'instant on laisse passer si le DTO est validé par le controller
                dataToUpdate.name = name;
            } else {
                dataToUpdate.name = name;
            }
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

    async updateLogo(companyId: number, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        // Validation basique (type et taille gérés par Interceptor/Pipe normalement, mais double check ici)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Format de fichier non supporté (JPG, PNG, WEBP uniquement)');
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'companies', companyId.toString());
        // Assurer que le dossier existe (nécessite fs.mkdir, on assume ici que public/uploads existe ou on le crée)
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extension = file.originalname.split('.').pop();
        const filename = `logo-${Date.now()}.${extension}`;
        const filePath = join(uploadDir, filename);

        // Écrire le fichier
        // Note: En prod, utiliser un storage provider (S3). Ici local.
        fs.writeFileSync(filePath, file.buffer);

        const logoUrl = `/uploads/companies/${companyId}/${filename}`;

        return this.prisma.company.update({
            where: { id: companyId },
            data: { logo_url: logoUrl },
        });
    }
}

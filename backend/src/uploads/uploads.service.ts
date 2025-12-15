import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'cvs');

    constructor() {
        // Créer le dossier uploads s'il n'existe pas
        this.ensureUploadDir();
    }

    private ensureUploadDir(): void {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
            this.logger.log(`Created upload directory: ${this.uploadDir}`);
        }
    }

    /**
     * Sauvegarde un fichier uploadé
     */
    async saveFile(file: Express.Multer.File): Promise<string> {
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = path.join(this.uploadDir, filename);

        fs.writeFileSync(filepath, file.buffer);
        this.logger.log(`File saved: ${filepath}`);

        return filepath;
    }

    /**
     * Lit le contenu d'un fichier
     */
    async readFile(filepath: string): Promise<Buffer> {
        return fs.readFileSync(filepath);
    }

    /**
     * Supprime un fichier
     */
    async deleteFile(filepath: string): Promise<void> {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            this.logger.log(`File deleted: ${filepath}`);
        }
    }

    /**
     * Retourne le chemin relatif pour stockage en base
     */
    getRelativePath(absolutePath: string): string {
        return path.relative(process.cwd(), absolutePath);
    }

    /**
     * Retourne l'URL d'accès au fichier
     */
    getFileUrl(filepath: string): string {
        const relativePath = this.getRelativePath(filepath);
        return `/uploads/${relativePath.replace(/\\/g, '/')}`;
    }
}

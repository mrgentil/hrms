import {
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Body,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { CVParserService, ParsedCV } from './cv-parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../recruitment/scoring.service';

export interface CVUploadResult {
    success: boolean;
    filename: string;
    candidateId?: number;
    applicationId?: number;
    score?: number;
    parsedData?: Partial<ParsedCV>;
    error?: string;
    missingSkillsConfig?: boolean;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    constructor(
        private readonly uploadsService: UploadsService,
        private readonly cvParserService: CVParserService,
        private readonly prisma: PrismaService,
        private readonly scoringService: ScoringService,
    ) { }

    /**
     * Upload et analyse un CV unique
     */
    @Post('cv')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                cb(new BadRequestException('Only PDF files are allowed'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    async uploadCV(
        @UploadedFile() file: Express.Multer.File,
        @Body('jobOfferId') jobOfferId: string,
    ): Promise<CVUploadResult> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!jobOfferId) {
            throw new BadRequestException('Job offer ID is required');
        }

        const jobIdNum = parseInt(jobOfferId);

        return this.processCV(file, jobIdNum);
    }

    /**
     * Upload et analyse plusieurs CVs en masse
     */
    @Post('cv/bulk')
    @UseInterceptors(FilesInterceptor('files', 20, {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max par fichier
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                cb(new BadRequestException('Only PDF files are allowed'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    async uploadCVsBulk(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('jobOfferId') jobOfferId: string,
    ): Promise<CVUploadResult[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        if (!jobOfferId) {
            throw new BadRequestException('Job offer ID is required');
        }

        const jobIdNum = parseInt(jobOfferId);
        const results: CVUploadResult[] = [];

        for (const file of files) {
            try {
                const result = await this.processCV(file, jobIdNum);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    filename: file.originalname,
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * Traite un CV: parse, crée candidat, crée candidature, calcule score
     */
    private async processCV(file: Express.Multer.File, jobOfferId: number): Promise<CVUploadResult> {
        try {
            this.logger.log(`Processing CV: ${file.originalname}`);

            // 1. Sauvegarder le fichier
            const filepath = await this.uploadsService.saveFile(file);
            const cvUrl = this.uploadsService.getFileUrl(filepath);

            // 2. Parser le CV avec IA
            const parsedData = await this.cvParserService.parseCV(file.buffer);
            this.logger.log(`Parsed CV: ${parsedData.firstName} ${parsedData.lastName}`);

            // 3. Vérifier si le candidat existe déjà
            let candidate = await this.prisma.candidate.findUnique({
                where: { email: parsedData.email },
            });

            if (!candidate) {
                // Créer le candidat
                candidate = await this.prisma.candidate.create({
                    data: {
                        first_name: parsedData.firstName,
                        last_name: parsedData.lastName,
                        email: parsedData.email,
                        phone: parsedData.phone,
                        cv_url: cvUrl,
                        skills: parsedData.skills,
                        years_experience: parsedData.yearsExperience,
                        rating: 0,
                        is_in_talent_pool: false,
                    },
                });
                this.logger.log(`Created candidate: ${candidate.id}`);
            } else {
                // Mettre à jour le CV et les infos
                candidate = await this.prisma.candidate.update({
                    where: { id: candidate.id },
                    data: {
                        first_name: parsedData.firstName || undefined,
                        last_name: parsedData.lastName || undefined,
                        phone: parsedData.phone || undefined,
                        cv_url: cvUrl,
                        skills: parsedData.skills.length > 0 ? parsedData.skills : undefined,
                        years_experience: parsedData.yearsExperience || undefined,
                    },
                });
                this.logger.log(`Updated candidate: ${candidate.id}`);
            }

            // 4. Vérifier si une candidature existe déjà
            let application = await this.prisma.candidate_application.findFirst({
                where: {
                    candidate_id: candidate.id,
                    job_offer_id: jobOfferId,
                },
            });

            if (!application) {
                // Créer la candidature
                application = await this.prisma.candidate_application.create({
                    data: {
                        candidate_id: candidate.id,
                        job_offer_id: jobOfferId,
                        status: 'NEW',
                        stage: 'NEW',
                    },
                });
                this.logger.log(`Created application: ${application.id}`);
            }

            // 5. Calculer le score
            const scoreResult = await this.scoringService.calculateScore(application.id);
            this.logger.log(`Score calculated: ${scoreResult.score}`);

            if (scoreResult.score >= 80) {
                this.logger.warn(`HIGH SCORE ALERT: Candidate ${candidate.first_name} ${candidate.last_name} (${candidate.email}) scored ${scoreResult.score}/100!`);
                // TODO: Implement actual notification system (email, in-app notification)
            }

            return {
                success: true,
                filename: file.originalname,
                candidateId: candidate.id,
                applicationId: application.id,
                score: scoreResult.score,
                parsedData: {
                    firstName: parsedData.firstName,
                    lastName: parsedData.lastName,
                    email: parsedData.email,
                    skills: parsedData.skills,
                    yearsExperience: parsedData.yearsExperience,
                },
                missingSkillsConfig: scoreResult.missingSkillsConfig,
            };
        } catch (error) {
            this.logger.error(`Failed to process CV: ${file.originalname}`, error);
            return {
                success: false,
                filename: file.originalname,
                error: error.message,
            };
        }
    }
}

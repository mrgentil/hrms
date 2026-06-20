import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TwoFactorService {
    private readonly logger = new Logger(TwoFactorService.name);

    constructor(private readonly prisma: PrismaService) {
        // Configuration TOTP
        authenticator.options = {
            window: 1,      // Tolérance d'1 intervalle de chaque côté (30s)
            step: 30,       // Pas de 30 secondes (standard Google Authenticator)
            digits: 6,      // Code à 6 chiffres
        };
    }

    /**
     * Generate a new 2FA secret and QR code for a user
     * Returns secret + QR code base64 image (without saving yet)
     */
    async generateSetup(userId: number): Promise<{
        secret: string;
        qrCodeDataUrl: string;
        manualKey: string;
    }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, work_email: true, full_name: true, two_factor_enabled: true },
        });

        if (!user) throw new BadRequestException('Utilisateur non trouvé');

        if (user.two_factor_enabled) {
            throw new BadRequestException('La double authentification est déjà activée');
        }

        // Generate a new TOTP secret
        const secret = authenticator.generateSecret(20);

        // Build TOTP URI (compatible with Google Authenticator, Authy, etc.)
        const appName = process.env.APP_NAME || 'HRMS';
        const accountName = user.work_email || user.username;
        const otpAuthUrl = authenticator.keyuri(accountName, appName, secret);

        // Generate QR code as base64 data URL
        const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            color: { dark: '#1e3a5f', light: '#ffffff' },
            width: 256,
        });

        // Store the secret temporarily (not yet enabled — user must verify first)
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                two_factor_secret: secret,
                two_factor_enabled: false, // Will be true only after verification
                updated_at: new Date(),
            },
        });

        this.logger.log(`2FA setup initiated for user ${userId}`);

        return {
            secret,
            qrCodeDataUrl,
            manualKey: secret, // For manual entry in authenticator apps
        };
    }

    /**
     * Verify the TOTP code and activate 2FA if valid
     * Also generates backup codes
     */
    async verifyAndEnable(userId: number, token: string): Promise<{
        enabled: boolean;
        backupCodes: string[];
    }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_secret: true, two_factor_enabled: true },
        });

        if (!user?.two_factor_secret) {
            throw new BadRequestException('Veuillez d\'abord initier la configuration 2FA');
        }

        // Verify the provided TOTP code
        const isValid = authenticator.verify({
            token: token.replace(/\s/g, ''),
            secret: user.two_factor_secret,
        });

        if (!isValid) {
            throw new UnauthorizedException('Code invalide. Vérifiez l\'heure de votre appareil.');
        }

        // Generate 8 backup codes (one-time use)
        const rawBackupCodes = Array.from({ length: 8 }, () =>
            Math.random().toString(36).substring(2, 8).toUpperCase(),
        );

        // Hash backup codes before storage
        const hashedBackupCodes = await Promise.all(
            rawBackupCodes.map((code) => bcrypt.hash(code, 10)),
        );

        // Enable 2FA and store hashed backup codes
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                two_factor_enabled: true,
                two_factor_backup_codes: hashedBackupCodes,
                updated_at: new Date(),
            },
        });

        this.logger.log(`2FA enabled for user ${userId}`);

        return {
            enabled: true,
            backupCodes: rawBackupCodes, // Return RAW codes ONCE — user must save them
        };
    }

    /**
     * Disable 2FA for a user (requires current TOTP code for security)
     */
    async disable(userId: number, token: string): Promise<{ disabled: boolean }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_secret: true, two_factor_enabled: true },
        });

        if (!user?.two_factor_enabled) {
            throw new BadRequestException('La double authentification n\'est pas activée');
        }

        const isValid = authenticator.verify({
            token: token.replace(/\s/g, ''),
            secret: user.two_factor_secret!,
        });

        if (!isValid) {
            throw new UnauthorizedException('Code invalide. Impossible de désactiver le 2FA.');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                two_factor_enabled: false,
                two_factor_secret: null,
                two_factor_backup_codes: null,
                updated_at: new Date(),
            },
        });

        this.logger.log(`2FA disabled for user ${userId}`);

        return { disabled: true };
    }

    /**
     * Verify a TOTP token during login (step 2)
     * Also accepts backup codes as fallback
     */
    async verifyToken(userId: number, token: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                two_factor_secret: true,
                two_factor_enabled: true,
                two_factor_backup_codes: true,
            },
        });

        if (!user?.two_factor_enabled || !user.two_factor_secret) {
            return false;
        }

        const cleanToken = token.replace(/\s/g, '');

        // First try TOTP
        const isValidTotp = authenticator.verify({
            token: cleanToken,
            secret: user.two_factor_secret,
        });

        if (isValidTotp) return true;

        // Fallback: try backup codes
        if (user.two_factor_backup_codes && Array.isArray(user.two_factor_backup_codes)) {
            const backupCodes = user.two_factor_backup_codes as string[];

            for (let i = 0; i < backupCodes.length; i++) {
                const isMatch = await bcrypt.compare(cleanToken, backupCodes[i]);
                if (isMatch) {
                    // Remove used backup code
                    const remainingCodes = [...backupCodes];
                    remainingCodes.splice(i, 1);

                    await this.prisma.user.update({
                        where: { id: userId },
                        data: {
                            two_factor_backup_codes: remainingCodes,
                            updated_at: new Date(),
                        },
                    });

                    this.logger.warn(`User ${userId} used a backup code. ${remainingCodes.length} remaining.`);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get 2FA status for a user
     */
    async getStatus(userId: number): Promise<{
        enabled: boolean;
        hasBackupCodes: boolean;
        backupCodesCount: number;
    }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { two_factor_enabled: true, two_factor_backup_codes: true },
        });

        const backupCodes = (user?.two_factor_backup_codes as string[]) || [];

        return {
            enabled: user?.two_factor_enabled || false,
            hasBackupCodes: backupCodes.length > 0,
            backupCodesCount: backupCodes.length,
        };
    }
}

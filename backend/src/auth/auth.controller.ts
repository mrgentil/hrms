import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param
} from '@nestjs/common';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePersonalProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { TwoFactorService } from './two-factor.service';

// Configuration pour l'upload d'avatars
const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(file.originalname);
    callback(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService,
  ) { }

  @Public()
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Register est désactivé - les utilisateurs sont créés par les admins via /users
  // @UseGuards(JwtAuthGuard)
  // @Post('register')
  // async register(@Body(ValidationPipe) registerDto: RegisterDto) {
  //   return this.authService.register(registerDto);
  // }

  @Public()
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      work_email: user.work_email,
      active: user.active,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/personal')
  async updatePersonalProfile(
    @CurrentUser() user: any,
    @Body(ValidationPipe) updateProfileDto: UpdatePersonalProfileDto,
  ) {
    const updatedUser = await this.authService.updatePersonalProfile(user.id, updateProfileDto);
    return {
      success: true,
      data: updatedUser,
      message: 'Profil mis à jour avec succès',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(user.id, changePasswordDto);
    return {
      success: true,
      message: result.message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: avatarStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Seuls les fichiers image sont autorisés'), false);
      }
      callback(null, true);
    },
  }))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const updatedUser = await this.authService.uploadAvatar(user.id, file.filename);
    return {
      success: true,
      data: updatedUser,
      message: 'Avatar mis à jour avec succès',
    };
  }

  @Public()
  @Get('verify-invitation/:token')
  async verifyInvitation(@Param('token') token: string) {
    return this.authService.verifyInvitationToken(token);
  }

  @Public()
  @Post('setup-password')
  async setupPassword(@Body(ValidationPipe) setupPasswordDto: SetupPasswordDto) {
    return this.authService.setupPassword(setupPasswordDto);
  }

  // ─── 2FA ENDPOINTS ─────────────────────────────────────────

  /** Step 2 of 2FA login — validate TOTP code and get full JWT */
  @Public()
  @Post('2fa/login')
  async login2FA(
    @Body('temp_token') tempToken: string,
    @Body('totp_code') totpCode: string,
  ) {
    return this.authService.login2FA(tempToken, totpCode);
  }

  /** Get 2FA status for current user */
  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async get2FAStatus(@CurrentUser() user: any) {
    return this.twoFactorService.getStatus(user.id);
  }

  /** Initiate 2FA setup — get QR code */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setup2FA(@CurrentUser() user: any) {
    const result = await this.twoFactorService.generateSetup(user.id);
    return {
      success: true,
      data: {
        qrCodeDataUrl: result.qrCodeDataUrl,
        manualKey: result.manualKey,
      },
    };
  }

  /** Verify TOTP code and activate 2FA */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify-setup')
  async verify2FASetup(
    @CurrentUser() user: any,
    @Body('totp_code') totpCode: string,
  ) {
    const result = await this.twoFactorService.verifyAndEnable(user.id, totpCode);
    return {
      success: true,
      message: 'Double authentification activée avec succès',
      data: result,
    };
  }

  /** Disable 2FA (requires current TOTP code) */
  @UseGuards(JwtAuthGuard)
  @Delete('2fa/disable')
  async disable2FA(
    @CurrentUser() user: any,
    @Body('totp_code') totpCode: string,
  ) {
    const result = await this.twoFactorService.disable(user.id, totpCode);
    return {
      success: true,
      message: 'Double authentification désactivée',
      data: result,
    };
  }
}

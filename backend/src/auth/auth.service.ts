import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePersonalProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) { }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user && user.active && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Nom d\'utilisateur ou mot de passe incorrect');
    }

    // Récupérer les permissions de l'utilisateur via son rôle
    let permissions: string[] = [];
    if (user.role_id) {
      const roleWithPermissions = await this.prisma.role.findUnique({
        where: { id: user.role_id },
        include: {
          role_permission: {
            include: {
              permission: {
                select: { name: true },
              },
            },
          },
        },
      });
      if (roleWithPermissions) {
        permissions = roleWithPermissions.role_permission
          .map(rp => rp.permission?.name)
          .filter(Boolean) as string[];
      }
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      role_id: user.role_id,
      permissions: permissions,
    };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    // Récupérer le profil complet avec les nouvelles informations
    const fullProfile = await this.getProfile(user.id);

    // Log de connexion
    await this.auditService.logLogin(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: fullProfile.id,
        username: fullProfile.username,
        full_name: fullProfile.full_name,
        role: fullProfile.role,
        role_id: fullProfile.role_id,
        role_info: fullProfile.role_info,
        current_role: fullProfile.current_role,
        work_email: fullProfile.work_email || undefined,
        active: fullProfile.active,
        profile_photo_url: fullProfile.profile_photo_url,
        department: fullProfile.department,
        permissions: permissions,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà utilisé');
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (registerDto.work_email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { work_email: registerDto.work_email },
      });

      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        password: hashedPassword,
        full_name: registerDto.full_name,
        work_email: registerDto.work_email,
        role: registerDto.role || UserRole.ROLE_EMPLOYEE,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Générer les tokens
    const payload = { username: user.username, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        work_email: user.work_email || undefined,
        active: user.active,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
      }

      // Récupérer les permissions pour le nouveau token
      let permissions: string[] = [];
      if (user.role_id) {
        const roleWithPermissions = await this.prisma.role.findUnique({
          where: { id: user.role_id },
          include: {
            role_permission: {
              include: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        });
        if (roleWithPermissions) {
          permissions = roleWithPermissions.role_permission
            .map(rp => rp.permission?.name)
            .filter(Boolean) as string[];
        }
      }

      const newPayload = {
        username: user.username,
        sub: user.id,
        role: user.role,
        role_id: user.role_id,
        permissions: permissions
      };
      const access_token = this.jwtService.sign(newPayload);

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true, // Ancien système (deprecated)
        role_id: true, // Nouveau système
        work_email: true,
        active: true,
        department_id: true,
        position_id: true,
        hire_date: true,
        profile_photo_url: true,
        created_at: true,
        updated_at: true,
        department: {
          select: {
            id: true,
            department_name: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        role_relation: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            icon: true,
            is_system: true,
            role_permission: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    return {
      ...user,
      department: user.department,
      role_info: user.role_relation, // Nouveau système de rôles
      current_role: user.role_relation?.name || user.role, // Fallback vers l'ancien système
      permissions: user.role_relation?.role_permission?.map(rp => rp.permission?.name).filter(Boolean) || [],
    };
  }

  async updatePersonalProfile(userId: number, updateProfileDto: UpdatePersonalProfileDto) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Mettre à jour seulement les champs autorisés (avatar pour l'instant)
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
        profile_photo_url: true,
        updated_at: true,
      },
    });

    return updatedUser;
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { current_password, new_password, confirm_password } = changePasswordDto;

    // Vérifier que les nouveaux mots de passe correspondent
    if (new_password !== confirm_password) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updated_at: new Date(),
      },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  async uploadAvatar(userId: number, filename: string) {
    const avatarUrl = `/uploads/avatars/${filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile_photo_url: avatarUrl,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        profile_photo_url: true,
      },
    });

    return updatedUser;
  }

}

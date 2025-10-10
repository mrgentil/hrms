import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface UserWithPermissions {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  work_email?: string;
  active: boolean;
  permissions: string[];
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère un utilisateur avec ses permissions
   * Version simplifiée qui utilise le fallback basé sur l'enum
   */
  async getUserWithPermissions(userId: number): Promise<UserWithPermissions | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
      }
    });

    if (!user) {
      return null;
    }

    // Utiliser les permissions basées sur l'enum pour l'instant
    const permissions = this.getFallbackPermissions(user.role);

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      work_email: user.work_email || undefined,
      active: user.active,
      permissions: permissions,
    };
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    const user = await this.getUserWithPermissions(userId);
    if (!user) return false;

    return user.permissions.includes(permission) || user.permissions.includes('system.admin');
  }

  /**
   * Permissions basées sur l'ancien système enum
  */
  private getFallbackPermissions(role: UserRole): string[] {
    switch (role) {
      case UserRole.ROLE_SUPER_ADMIN:
        return [
          'system.admin',
          'users.view', 'users.create',
          'users.create.super_admin', 'users.create.admin', 'users.create.hr', 'users.create.manager', 'users.create.employee',
          'users.edit', 'users.delete', 'users.manage_roles',
          'reports.view', 'reports.export',
          'departments.view', 'departments.manage',
          'projects.view', 'projects.manage'
        ];

      case UserRole.ROLE_ADMIN:
        return [
          'system.admin',
          'users.view', 'users.create',
          'users.create.admin', 'users.create.hr', 'users.create.manager', 'users.create.employee',
          'users.edit', 'users.delete', 'users.manage_roles',
          'reports.view', 'reports.export',
          'departments.view', 'departments.manage',
          'projects.view', 'projects.manage'
        ];
      
      case UserRole.ROLE_HR:
        return [
          'users.view', 'users.create',
          'users.create.manager', 'users.create.employee',
          'users.edit',
          'reports.view',
          'departments.view',
          'projects.view'
        ];
      
      case UserRole.ROLE_MANAGER:
        return [
          'users.view', 'users.edit',
          'reports.view', 'reports.export',
          'departments.view',
          'projects.view', 'projects.manage'
        ];
      
      case UserRole.ROLE_EMPLOYEE:
        return [
          'users.view',
          'reports.view',
          'departments.view',
          'projects.view'
        ];
      
      default:
        return ['users.view'];
    }
  }
}

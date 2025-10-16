import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from '@prisma/client';

// Définition des permissions disponibles dans le système
export const SYSTEM_PERMISSIONS = {
  // Gestion des utilisateurs
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_CREATE_SUPER_ADMIN: 'users.create.super_admin',
  USERS_CREATE_ADMIN: 'users.create.admin',
  USERS_CREATE_HR: 'users.create.hr',
  USERS_CREATE_MANAGER: 'users.create.manager',
  USERS_CREATE_EMPLOYEE: 'users.create.employee',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_VIEW_SALARY: 'users.view_salary',
  USERS_EDIT_SALARY: 'users.edit_salary',

  // Gestion des départements
  DEPARTMENTS_VIEW: 'departments.view',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_EDIT: 'departments.edit',
  DEPARTMENTS_DELETE: 'departments.delete',
  DEPARTMENTS_MANAGE: 'departments.manage',

  // Gestion des postes
  POSITIONS_VIEW: 'positions.view',
  POSITIONS_CREATE: 'positions.create',
  POSITIONS_EDIT: 'positions.edit',
  POSITIONS_DELETE: 'positions.delete',

  // Gestion des congés
  LEAVES_VIEW_OWN: 'leaves.view_own',
  LEAVES_VIEW_TEAM: 'leaves.view_team',
  LEAVES_VIEW_ALL: 'leaves.view_all',
  LEAVES_CREATE: 'leaves.create',
  LEAVES_APPROVE: 'leaves.approve',
  LEAVES_REJECT: 'leaves.reject',
  LEAVES_CANCEL: 'leaves.cancel',

  // Gestion financière
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_APPROVE: 'expenses.approve',
  BUDGET_VIEW: 'budget.view',
  BUDGET_MANAGE: 'budget.manage',

  // Rapports et analytics
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_ADVANCED: 'analytics.advanced',

  // Administration système
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_LOGS: 'system.logs',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Profil personnel
  PROFILE_VIEW_OWN: 'profile.view_own',
  PROFILE_EDIT_OWN: 'profile.edit_own',
} as const;

// Rôles prédéfinis avec leurs permissions
export const PREDEFINED_ROLES = [
  {
    name: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    color: '#dc2626',
    icon: '👑',
    permissions: Object.values(SYSTEM_PERMISSIONS),
  },
  {
    name: 'Administrateur',
    description: 'Gestion globale du système et des utilisateurs',
    color: '#ea580c',
    icon: '🛡️',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_CREATE,
      SYSTEM_PERMISSIONS.USERS_CREATE_ADMIN,
      SYSTEM_PERMISSIONS.USERS_CREATE_HR,
      SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
      SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
      SYSTEM_PERMISSIONS.USERS_EDIT,
      SYSTEM_PERMISSIONS.USERS_DELETE,
      SYSTEM_PERMISSIONS.USERS_MANAGE_ROLES,
      SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
      SYSTEM_PERMISSIONS.DEPARTMENTS_CREATE,
      SYSTEM_PERMISSIONS.DEPARTMENTS_EDIT,
      SYSTEM_PERMISSIONS.DEPARTMENTS_DELETE,
      SYSTEM_PERMISSIONS.POSITIONS_VIEW,
      SYSTEM_PERMISSIONS.POSITIONS_CREATE,
      SYSTEM_PERMISSIONS.POSITIONS_EDIT,
      SYSTEM_PERMISSIONS.POSITIONS_DELETE,
      SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
      SYSTEM_PERMISSIONS.LEAVES_APPROVE,
      SYSTEM_PERMISSIONS.LEAVES_REJECT,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
      SYSTEM_PERMISSIONS.SYSTEM_SETTINGS,
      SYSTEM_PERMISSIONS.ROLES_MANAGE,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'RH Manager',
    description: 'Gestion complète des ressources humaines',
    color: '#0891b2',
    icon: '👥',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_CREATE,
      SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
      SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
      SYSTEM_PERMISSIONS.USERS_EDIT,
      SYSTEM_PERMISSIONS.USERS_VIEW_SALARY,
      SYSTEM_PERMISSIONS.USERS_EDIT_SALARY,
      SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
      SYSTEM_PERMISSIONS.DEPARTMENTS_MANAGE,
      SYSTEM_PERMISSIONS.POSITIONS_VIEW,
      SYSTEM_PERMISSIONS.POSITIONS_CREATE,
      SYSTEM_PERMISSIONS.POSITIONS_EDIT,
      SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
      SYSTEM_PERMISSIONS.LEAVES_APPROVE,
      SYSTEM_PERMISSIONS.LEAVES_REJECT,
      SYSTEM_PERMISSIONS.PAYROLL_VIEW,
      SYSTEM_PERMISSIONS.PAYROLL_MANAGE,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'RH Spécialiste',
    description: 'Opérations courantes des ressources humaines',
    color: '#0d9488',
    icon: '📋',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_EDIT,
      SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
      SYSTEM_PERMISSIONS.POSITIONS_VIEW,
      SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
      SYSTEM_PERMISSIONS.LEAVES_APPROVE,
      SYSTEM_PERMISSIONS.PAYROLL_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'Manager',
    description: 'Gestion d\'équipe et approbation des demandes',
    color: '#7c3aed',
    icon: '👨‍💼',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
      SYSTEM_PERMISSIONS.POSITIONS_VIEW,
      SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
      SYSTEM_PERMISSIONS.LEAVES_APPROVE,
      SYSTEM_PERMISSIONS.LEAVES_REJECT,
      SYSTEM_PERMISSIONS.EXPENSES_APPROVE,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'Comptable',
    description: 'Gestion de la comptabilité et des finances',
    color: '#059669',
    icon: '💰',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_VIEW_SALARY,
      SYSTEM_PERMISSIONS.PAYROLL_VIEW,
      SYSTEM_PERMISSIONS.PAYROLL_MANAGE,
      SYSTEM_PERMISSIONS.EXPENSES_VIEW,
      SYSTEM_PERMISSIONS.EXPENSES_APPROVE,
      SYSTEM_PERMISSIONS.BUDGET_VIEW,
      SYSTEM_PERMISSIONS.BUDGET_MANAGE,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'Financier',
    description: 'Analyse financière et reporting avancé',
    color: '#dc2626',
    icon: '📊',
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_VIEW_SALARY,
      SYSTEM_PERMISSIONS.PAYROLL_VIEW,
      SYSTEM_PERMISSIONS.EXPENSES_VIEW,
      SYSTEM_PERMISSIONS.BUDGET_VIEW,
      SYSTEM_PERMISSIONS.BUDGET_MANAGE,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
      SYSTEM_PERMISSIONS.ANALYTICS_ADVANCED,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
  {
    name: 'Employé',
    description: 'Accès de base pour les employés',
    color: '#6b7280',
    icon: '👤',
    permissions: [
      SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
      SYSTEM_PERMISSIONS.LEAVES_CREATE,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    // Vérifier si le rôle existe déjà
    const existingRole = await this.prisma.role.findFirst({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Un rôle avec ce nom existe déjà');
    }

    // Créer le rôle avec tous les champs
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions,
        color: createRoleDto.color || '#6b7280',
        icon: createRoleDto.icon || '👤',
        is_system: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return role;
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return roles.map(role => ({
      ...role,
      userCount: role._count.users,
    }));
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            work_email: true,
            username: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    return {
      ...role,
      userCount: role._count.users,
    };
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Vérifier si le nouveau nom existe déjà (si changé)
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const nameExists = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ConflictException('Un rôle avec ce nom existe déjà');
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        ...updateRoleDto,
        updated_at: new Date(),
      },
    });

    return updatedRole;
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Empêcher la suppression si des utilisateurs sont assignés
    if (role._count.users > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce rôle car ${role._count.users} utilisateur(s) y sont assignés`,
      );
    }

    // Empêcher la suppression des rôles système
    if (role.is_system) {
      throw new ConflictException('Impossible de supprimer un rôle système');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Rôle supprimé avec succès' };
  }

  async getAvailablePermissions() {
    return {
      permissions: SYSTEM_PERMISSIONS,
      categories: {
        users: 'Gestion des utilisateurs',
        departments: 'Gestion des départements',
        positions: 'Gestion des postes',
        leaves: 'Gestion des congés',
        payroll: 'Gestion de la paie',
        expenses: 'Gestion des dépenses',
        budget: 'Gestion du budget',
        reports: 'Rapports',
        analytics: 'Analyses',
        system: 'Administration système',
        roles: 'Gestion des rôles',
        permissions: 'Gestion des permissions',
        profile: 'Profil personnel',
      },
    };
  }

  async initializePredefinedRoles() {
    const results: Array<{action: string, role: string, error?: string}> = [];

    for (const roleData of PREDEFINED_ROLES) {
      try {
        // Vérifier si le rôle existe déjà
        const existingRole = await this.prisma.role.findFirst({
          where: { name: roleData.name },
        });

        if (!existingRole) {
          const role = await this.prisma.role.create({
            data: {
              name: roleData.name,
              description: roleData.description,
              permissions: roleData.permissions,
              color: roleData.color,
              icon: roleData.icon,
              is_system: true, // Marquer comme rôle système
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          results.push({ action: 'created', role: role.name });
        } else {
          const existingPermissions = Array.isArray(existingRole.permissions)
            ? (existingRole.permissions as string[])
            : [];
          const mergedPermissions = Array.from(
            new Set([...existingPermissions, ...roleData.permissions]),
          );

          if (mergedPermissions.length !== existingPermissions.length) {
            await this.prisma.role.update({
              where: { id: existingRole.id },
              data: {
                permissions: mergedPermissions,
                updated_at: new Date(),
              },
            });
            results.push({ action: 'updated', role: roleData.name });
          } else {
            results.push({ action: 'exists', role: roleData.name });
          }
        }
      } catch (error: any) {
        results.push({ action: 'error', role: roleData.name, error: error.message });
      }
    }

    return results;
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role_relation: true,
      },
    });

    if (!user) {
      return [];
    }

    const legacy = this.getLegacyPermissions(user.role);

    if (user.role_relation?.permissions && Array.isArray(user.role_relation.permissions)) {
      const persisted = user.role_relation.permissions as string[];
      return Array.from(new Set([...persisted, ...legacy]));
    }

    return legacy;
  }

  private getLegacyPermissions(role: UserRole | null): string[] {
    switch (role) {
      case UserRole.ROLE_SUPER_ADMIN:
        return [
          'system.admin',
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.USERS_CREATE,
          SYSTEM_PERMISSIONS.USERS_CREATE_SUPER_ADMIN,
          SYSTEM_PERMISSIONS.USERS_CREATE_ADMIN,
          SYSTEM_PERMISSIONS.USERS_CREATE_HR,
          SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
          SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
          SYSTEM_PERMISSIONS.USERS_EDIT,
          SYSTEM_PERMISSIONS.USERS_DELETE,
          SYSTEM_PERMISSIONS.USERS_MANAGE_ROLES,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
          SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
          SYSTEM_PERMISSIONS.SYSTEM_SETTINGS,
          SYSTEM_PERMISSIONS.ROLES_MANAGE,
          SYSTEM_PERMISSIONS.PERMISSIONS_MANAGE,
        ];
      case UserRole.ROLE_ADMIN:
        return [
          'system.admin',
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.USERS_CREATE,
          SYSTEM_PERMISSIONS.USERS_CREATE_ADMIN,
          
          SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
          SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
          SYSTEM_PERMISSIONS.USERS_EDIT,
          SYSTEM_PERMISSIONS.USERS_DELETE,
          SYSTEM_PERMISSIONS.USERS_MANAGE_ROLES,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
          SYSTEM_PERMISSIONS.ANALYTICS_VIEW,
          SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
          SYSTEM_PERMISSIONS.DEPARTMENTS_MANAGE,
          SYSTEM_PERMISSIONS.POSITIONS_VIEW,
          SYSTEM_PERMISSIONS.POSITIONS_CREATE,
          SYSTEM_PERMISSIONS.POSITIONS_EDIT,
          SYSTEM_PERMISSIONS.POSITIONS_DELETE,
        ];
      case UserRole.ROLE_RH:
        return [
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.USERS_CREATE,
          
          SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
          SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
          SYSTEM_PERMISSIONS.USERS_EDIT,
          SYSTEM_PERMISSIONS.USERS_VIEW_SALARY,
          SYSTEM_PERMISSIONS.USERS_EDIT_SALARY,
          SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
          SYSTEM_PERMISSIONS.DEPARTMENTS_MANAGE,
          SYSTEM_PERMISSIONS.POSITIONS_VIEW,
          SYSTEM_PERMISSIONS.POSITIONS_CREATE,
          SYSTEM_PERMISSIONS.POSITIONS_EDIT,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.PAYROLL_VIEW,
          SYSTEM_PERMISSIONS.PAYROLL_MANAGE,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
        ];
      case UserRole.ROLE_MANAGER:
        return [
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.USERS_EDIT,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
          SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
          SYSTEM_PERMISSIONS.POSITIONS_VIEW,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
        ];
      case UserRole.ROLE_EMPLOYEE:
        return [
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
          SYSTEM_PERMISSIONS.LEAVES_CREATE,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
        ];
      default:
        return [SYSTEM_PERMISSIONS.USERS_VIEW];
    }
  }

  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission) || permissions.includes('system.admin');
  }

  async assignRoleToUser(userId: number, roleId: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que le rôle existe
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Assigner le rôle
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role_id: roleId,
        updated_at: new Date(),
      },
      include: {
        role_relation: true,
      },
    });

    return updatedUser;
  }
}

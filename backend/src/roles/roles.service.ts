import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from '@prisma/client';
import { PERMISSION_GROUPS } from '../common/constants/permissions.constants';

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

  ANNOUNCEMENTS_VIEW: 'announcements.view',
  ANNOUNCEMENTS_MANAGE: 'announcements.manage',

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
  LEAVES_MANAGE_TYPES: 'leaves.manage_types',

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
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE,
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
      SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES,
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
      SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES,
      SYSTEM_PERMISSIONS.PAYROLL_VIEW,
      SYSTEM_PERMISSIONS.PAYROLL_MANAGE,
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE,
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
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE,
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
      SYSTEM_PERMISSIONS.EXPENSES_APPROVE,
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
      SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
      SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
      SYSTEM_PERMISSIONS.LEAVES_CREATE,
      SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
    ],
  },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async create(createRoleDto: CreateRoleDto) {
    // Vérifier si le rôle existe déjà
    const existingRole = await this.prisma.role.findFirst({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Un rôle avec ce nom existe déjà');
    }

    const { permissions, ...roleData } = createRoleDto;

    // Créer le rôle
    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        // On garde le champ JSON vide ou synchronisé si besoin, mais on utilise principalement la table de liaison
        permissions: [],
        color: roleData.color || '#6b7280',
        icon: roleData.icon || '👤',
        is_system: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Si des permissions sont fournies, les ajouter
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      console.log('📝 Création des permissions pour le rôle', role.id);

      // Récupérer les permissions existantes
      const permissionRecords = await this.prisma.permission.findMany({
        where: {
          name: { in: permissions },
        },
      });

      // Créer les permissions manquantes
      const existingNames = permissionRecords.map(p => p.name);
      const missingPerms = permissions.filter(p => !existingNames.includes(p));

      if (missingPerms.length > 0) {
        for (const permName of missingPerms) {
          await this.prisma.permission.create({
            data: {
              name: permName,
              description: permName,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }

      // Récupérer toutes les permissions
      const allPermissionRecords = await this.prisma.permission.findMany({
        where: { name: { in: permissions } },
      });

      // Lier les permissions au rôle
      if (allPermissionRecords.length > 0) {
        await this.prisma.role_permission.createMany({
          data: allPermissionRecords.map((perm) => ({
            role_id: role.id,
            permission_id: perm.id,
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });
        console.log('   ✅ Permissions assignées au nouveau rôle:', allPermissionRecords.length);
      }
    }

    return this.findOne(role.id);
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, role_permission: true },
        },
        role_permission: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    return roles.map(role => ({
      ...role,
      userCount: role._count.users,
      permissions: role.role_permission.map(rp => rp.permission?.name).filter(Boolean),
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
        role_permission: {
          include: {
            permission: true,
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
      permissions: role.role_permission.map(rp => ({
        id: rp.permission?.id,
        name: rp.permission?.name,
        description: rp.permission?.description,
      })),
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

    // Extraire les permissions du DTO
    const { permissions, ...roleData } = updateRoleDto;

    // Mettre à jour le rôle
    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        updated_at: new Date(),
      },
    });

    // Si des permissions sont fournies, les mettre à jour
    if (permissions && Array.isArray(permissions)) {
      console.log('📝 Mise à jour des permissions pour le rôle', id);
      console.log('   Permissions reçues:', permissions.length, permissions.slice(0, 5));

      // Supprimer les anciennes permissions
      const deleted = await this.prisma.role_permission.deleteMany({
        where: { role_id: id },
      });
      console.log('   Anciennes permissions supprimées:', deleted.count);

      // Récupérer les IDs des permissions par leurs noms
      const permissionRecords = await this.prisma.permission.findMany({
        where: {
          name: { in: permissions },
        },
      });
      console.log('   Permissions trouvées en BD:', permissionRecords.length);

      // Créer les permissions manquantes
      const existingNames = permissionRecords.map(p => p.name);
      const missingPerms = permissions.filter(p => !existingNames.includes(p));

      if (missingPerms.length > 0) {
        console.log('   ⚠️ Permissions manquantes à créer:', missingPerms.length);
        for (const permName of missingPerms) {
          await this.prisma.permission.create({
            data: {
              name: permName,
              description: permName,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }

      // Récupérer toutes les permissions (existantes + nouvelles)
      const allPermissionRecords = await this.prisma.permission.findMany({
        where: { name: { in: permissions } },
      });
      console.log('   Total permissions en BD:', allPermissionRecords.length);

      // Ajouter les permissions au rôle
      if (allPermissionRecords.length > 0) {
        await this.prisma.role_permission.createMany({
          data: allPermissionRecords.map((perm) => ({
            role_id: id,
            permission_id: perm.id,
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });
        console.log('   ✅ Permissions assignées au rôle:', allPermissionRecords.length);
      }
    }

    // Retourner le rôle avec ses permissions
    return this.findOne(id);
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
    // Récupérer les permissions depuis la base de données
    const dbPermissions = await this.prisma.permission.findMany({
      orderBy: [{ group_name: 'asc' }, { sort_order: 'asc' }, { name: 'asc' }],
    });

    // Si des permissions existent en DB, les utiliser
    if (dbPermissions.length > 0) {
      const permissionsByModule: Record<string, Array<{ name: string; description: string }>> = {};

      for (const perm of dbPermissions) {
        const moduleName = perm.group_name || 'Autre';
        if (!permissionsByModule[moduleName]) {
          permissionsByModule[moduleName] = [];
        }
        permissionsByModule[moduleName].push({
          name: perm.name,
          description: perm.label || perm.description || perm.name,
        });
      }

      return permissionsByModule;
    }

    // Fallback: utiliser PERMISSION_GROUPS depuis le fichier de constantes
    const permissionsByModule: Record<string, Array<{ name: string; description: string }>> = {};

    for (const group of PERMISSION_GROUPS) {
      const moduleName = group.name;
      permissionsByModule[moduleName] = group.permissions.map(p => ({
        name: p.key,
        description: p.description,
      }));
    }

    return permissionsByModule;
  }

  async initializePredefinedRoles() {
    const results: Array<{ action: string, role: string, error?: string }> = [];

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
        role_relation: {
          include: {
            role_permission: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const legacy = this.getLegacyPermissions(user.role);
    const relationPermissions = user.role_relation?.role_permission?.map(rp => rp.permission?.name).filter(Boolean) as string[] || [];

    let jsonPermissions: string[] = [];
    if (user.role_relation?.permissions && Array.isArray(user.role_relation.permissions)) {
      jsonPermissions = user.role_relation.permissions as string[];
    }

    console.log(`[RolesService] Legacy perms for ${user.role}:`, legacy);
    console.log(`[RolesService] Relation perms:`, relationPermissions);

    // Merge all sources of permissions: Legacy + Relation Table + JSON Field
    return Array.from(new Set([...legacy, ...relationPermissions, ...jsonPermissions]));
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
          SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
          SYSTEM_PERMISSIONS.LEAVES_CREATE,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
          SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
          SYSTEM_PERMISSIONS.DEPARTMENTS_MANAGE,
          SYSTEM_PERMISSIONS.POSITIONS_VIEW,
          SYSTEM_PERMISSIONS.POSITIONS_CREATE,
          SYSTEM_PERMISSIONS.POSITIONS_EDIT,
          SYSTEM_PERMISSIONS.POSITIONS_DELETE,
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
          SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
          SYSTEM_PERMISSIONS.LEAVES_CREATE,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
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
          SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL,
          SYSTEM_PERMISSIONS.LEAVES_CREATE,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES,
          SYSTEM_PERMISSIONS.PAYROLL_VIEW,
          SYSTEM_PERMISSIONS.PAYROLL_MANAGE,
          SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
          SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
        ];
      case UserRole.ROLE_MANAGER:
        return [
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
          SYSTEM_PERMISSIONS.ANNOUNCEMENTS_MANAGE,
          SYSTEM_PERMISSIONS.USERS_EDIT,
          SYSTEM_PERMISSIONS.REPORTS_VIEW,
          SYSTEM_PERMISSIONS.REPORTS_CREATE,
          SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW,
          SYSTEM_PERMISSIONS.POSITIONS_VIEW,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN,
          SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM,
          SYSTEM_PERMISSIONS.LEAVES_CREATE,
          SYSTEM_PERMISSIONS.LEAVES_APPROVE,
          SYSTEM_PERMISSIONS.LEAVES_REJECT,
          SYSTEM_PERMISSIONS.PROFILE_VIEW_OWN,
          SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN,
        ];
      case UserRole.ROLE_EMPLOYEE:
        return [
          SYSTEM_PERMISSIONS.USERS_VIEW,
          SYSTEM_PERMISSIONS.ANNOUNCEMENTS_VIEW,
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

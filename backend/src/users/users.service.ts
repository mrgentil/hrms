import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RolesService, SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';

export const ROLE_CREATION_PERMISSIONS: Record<UserRole, string> = {
  [UserRole.ROLE_SUPER_ADMIN]: SYSTEM_PERMISSIONS.USERS_CREATE_SUPER_ADMIN,
  [UserRole.ROLE_ADMIN]: SYSTEM_PERMISSIONS.USERS_CREATE_ADMIN,
  [UserRole.ROLE_RH]: SYSTEM_PERMISSIONS.USERS_CREATE_HR,
  [UserRole.ROLE_MANAGER]: SYSTEM_PERMISSIONS.USERS_CREATE_MANAGER,
  [UserRole.ROLE_EMPLOYEE]: SYSTEM_PERMISSIONS.USERS_CREATE_EMPLOYEE,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
    private auditService: AuditService,
  ) {}

  async validateRoleAssignment(userId: number, targetRole: UserRole) {
    const requiredPermission = ROLE_CREATION_PERMISSIONS[targetRole];

    if (!requiredPermission) {
      throw new ForbiddenException('Rôle cible non supporté');
    }

    const hasPermission = await this.rolesService.hasPermission(userId, requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissions insuffisantes pour créer un utilisateur avec le rôle ${targetRole}`,
      );
    }
  }

  async getCreatableRolesForUser(userId: number): Promise<UserRole[]> {
    const checks = await Promise.all(
      (Object.entries(ROLE_CREATION_PERMISSIONS) as Array<[UserRole, string]>).map(
        async ([role, permission]) => {
          const allowed = await this.rolesService.hasPermission(userId, permission);
          return allowed ? role : null;
        },
      ),
    );

    return checks.filter((value): value is UserRole => value !== null);
  }

  async create(createUserDto: CreateUserDto, currentUserId: number) {
    const roleToAssign = createUserDto.role ?? UserRole.ROLE_EMPLOYEE;
    await this.validateRoleAssignment(currentUserId, roleToAssign);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà utilisé');
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (createUserDto.work_email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { work_email: createUserDto.work_email },
      });

      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        full_name: createUserDto.full_name,
        work_email: createUserDto.work_email,
        role: roleToAssign,
        active: createUserDto.active ?? true,
        department_id: createUserDto.department_id,
        position_id: createUserDto.position_id,
        hire_date: createUserDto.hire_date ? new Date(createUserDto.hire_date) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        department_user_department_idTodepartment: {
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
      },
    });

    // Log de création
    await this.auditService.logCreate(currentUserId, 'user', user.id, {
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(queryParams: QueryParamsDto) {
    const { page = 1, limit = 10, search, role, active, department_id } = queryParams;
    const skip = (page - 1) * limit;

    // Construire les conditions de recherche
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { full_name: { contains: search } },
        { work_email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (department_id) {
      where.department_id = department_id;
    }

    // Récupérer les utilisateurs avec pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          full_name: true,
          role: true, // Ancien système (deprecated)
          role_id: true, // Nouveau système
          work_email: true,
          active: true,
          hire_date: true,
          created_at: true,
          updated_at: true,
          department_user_department_idTodepartment: {
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
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map(user => ({
        ...user,
        department: user.department_user_department_idTodepartment,
        role_info: user.role_relation, // Nouveau système de rôles
        current_role: user.role_relation?.name || user.role, // Fallback vers l'ancien système
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
        hire_date: true,
        termination_date: true,
        profile_photo_url: true,
        created_at: true,
        updated_at: true,
        department_user_department_idTodepartment: {
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
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        role_relation: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        user_personal_info: {
          select: {
            id: true,
            date_of_birth: true,
            gender: true,
            marital_status: true,
            mobile: true,
            phone: true,
            email_address: true,
            address: true,
            city: true,
            country: true,
            emergency_contact_primary_name: true,
            emergency_contact_primary_phone: true,
          },
        },
        user_employment_history: {
          select: {
            id: true,
            change_type: true,
            effective_date: true,
            notes: true,
          },
          orderBy: { effective_date: 'desc' },
        },
        user_document_user_document_user_idTouser: {
          select: {
            id: true,
            name: true,
            document_type: true,
            file_path: true,
            is_confidential: true,
          },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      ...user,
      department: user.department_user_department_idTodepartment,
      manager: user.user,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'unicité du nom d'utilisateur si modifié
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });

      if (usernameExists && usernameExists.id !== id) {
        throw new ConflictException('Ce nom d\'utilisateur est déjà utilisé');
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateUserDto.work_email && updateUserDto.work_email !== existingUser.work_email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { work_email: updateUserDto.work_email },
      });

      if (emailExists && emailExists.id !== id) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      ...updateUserDto,
      updated_at: new Date(),
    };

    // Hasher le nouveau mot de passe si fourni
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Convertir les dates si nécessaire
    if (updateUserDto.hire_date) {
      updateData.hire_date = new Date(updateUserDto.hire_date);
    }

    if (updateUserDto.termination_date) {
      updateData.termination_date = new Date(updateUserDto.termination_date);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department_user_department_idTodepartment: {
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
      },
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      department: user.department_user_department_idTodepartment,
    };
  }

  async toggleStatus(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        active: !user.active,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
        hire_date: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedUser;
  }

  async updateAdmin(id: number, updateUserAdminDto: UpdateUserAdminDto) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (updateUserAdminDto.work_email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          work_email: updateUserAdminDto.work_email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Vérifier si le département existe
    if (updateUserAdminDto.department_id) {
      const departmentExists = await this.prisma.department.findUnique({
        where: { id: updateUserAdminDto.department_id },
      });

      if (!departmentExists) {
        throw new BadRequestException('Département non trouvé');
      }
    }

    // Vérifier si le poste existe
    if (updateUserAdminDto.position_id) {
      const positionExists = await this.prisma.position.findUnique({
        where: { id: updateUserAdminDto.position_id },
      });

      if (!positionExists) {
        throw new BadRequestException('Poste non trouvé');
      }
    }

    // Vérifier si le manager existe
    if (updateUserAdminDto.manager_user_id) {
      const managerExists = await this.prisma.user.findUnique({
        where: { id: updateUserAdminDto.manager_user_id },
      });

      if (!managerExists) {
        throw new BadRequestException('Manager non trouvé');
      }
    }

    // Préparer les données pour la mise à jour
    const updateData: any = {
      ...updateUserAdminDto,
      updated_at: new Date(),
    };

    // Convertir les dates si fournies
    if (updateUserAdminDto.hire_date) {
      updateData.hire_date = new Date(updateUserAdminDto.hire_date);
    }
    if (updateUserAdminDto.termination_date) {
      updateData.termination_date = new Date(updateUserAdminDto.termination_date);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
        department_id: true,
        hire_date: true,
        termination_date: true,
        profile_photo_url: true,
        manager_user_id: true,
        position_id: true,
        created_at: true,
        updated_at: true,
        department_user_department_idTodepartment: {
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
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    return updatedUser;
  }

  async getAdminOptions(currentUserId: number) {
    // Récupérer les départements
    const departments = await this.prisma.department.findMany({
      select: {
        id: true,
        department_name: true,
      },
      orderBy: {
        department_name: 'asc',
      },
    });

    // Récupérer les postes
    const positions = await this.prisma.position.findMany({
      select: {
        id: true,
        title: true,
        level: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    // Récupérer les managers potentiels (utilisateurs avec rôle SUPER_ADMIN, ADMIN ou MANAGER)
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.ROLE_MANAGER,
        active: true,
      },
      select: {
        id: true,
        full_name: true,
        role: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    });

    return {
      departments,
      positions,
      managers,
      roles: await this.getCreatableRolesForUser(currentUserId),
    };
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async search(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { full_name: { contains: query } },
          { work_email: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
      },
    });

    return users;
  }

  async getStats() {
    const [total, active, inactive, roleStats, departmentStats] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.user.count({ where: { active: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.user.groupBy({
        by: ['department_id'],
        _count: { department_id: true },
        where: { department_id: { not: null } },
      }),
    ]);

    // Transformer les statistiques par rôle
    const byRole = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Récupérer les noms des départements pour les statistiques
    const departmentIds = departmentStats.map(stat => stat.department_id).filter((id): id is number => id !== null);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, department_name: true },
    });

    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.id] = dept.department_name;
      return acc;
    }, {} as Record<number, string>);

    const byDepartment = departmentStats.reduce((acc, stat) => {
      if (stat.department_id) {
        const deptName = departmentMap[stat.department_id] || `Département ${stat.department_id}`;
        acc[deptName] = stat._count.department_id;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive,
      byRole,
      byDepartment,
    };
  }

  async exportUsers(format: 'csv' | 'xlsx' = 'csv'): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        work_email: true,
        active: true,
        hire_date: true,
        created_at: true,
        department_user_department_idTodepartment: {
          select: { department_name: true },
        },
        position: {
          select: { title: true },
        },
      },
    });

    if (format === 'csv') {
      const headers = ['ID', 'Nom d\'utilisateur', 'Nom complet', 'Rôle', 'Email', 'Statut', 'Département', 'Poste', 'Date d\'embauche'];
      const rows = users.map(user => [
        user.id,
        user.username,
        user.full_name,
        user.role,
        user.work_email || '',
        user.active ? 'Actif' : 'Inactif',
        user.department_user_department_idTodepartment?.department_name || '',
        user.position?.title || '',
        user.hire_date ? user.hire_date.toISOString().split('T')[0] : '',
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return Buffer.from(csvContent, 'utf-8');
    }

    // Pour XLSX, on retourne un CSV pour l'instant
    throw new BadRequestException('Format XLSX non supporté pour le moment');
  }

  async importUsers(file: any) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('Seuls les fichiers CSV sont supportés');
    }

    // Pour l'instant, on retourne un résultat fictif
    return {
      imported: 0,
      errors: ['Import CSV non implémenté pour le moment'],
    };
  }
}

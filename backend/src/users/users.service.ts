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
  ) { }

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
        role_id: createUserDto.role_id, // Nouveau système de rôles
        active: createUserDto.active ?? true,
        department_id: createUserDto.department_id,
        position_id: createUserDto.position_id,
        hire_date: createUserDto.hire_date ? new Date(createUserDto.hire_date) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
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
        department: user.department,
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
        user_financial_info: {
          select: {
            id: true,
            salary_basic: true,
            salary_gross: true,
            salary_net: true,
            allowance_house_rent: true,
            allowance_medical: true,
            allowance_special: true,
            allowance_fuel: true,
            allowance_phone_bill: true,
            allowance_other: true,
            allowance_total: true,
            deduction_provident_fund: true,
            deduction_tax: true,
            deduction_other: true,
            deduction_total: true,
            bank_name: true,
            account_name: true,
            account_number: true,
            iban: true,
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
      department: user.department,
      manager: user.user,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        user_financial_info: true,
      },
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

    // Extraire les champs financiers du DTO
    const {
      salary_basic,
      salary_gross,
      salary_net,
      allowance_house_rent,
      allowance_medical,
      allowance_special,
      allowance_fuel,
      allowance_phone_bill,
      allowance_other,
      deduction_provident_fund,
      deduction_tax,
      deduction_other,
      bank_name,
      account_name,
      account_number,
      iban,
      ...userFields
    } = updateUserDto;

    // Préparer les données à mettre à jour pour l'utilisateur (sans les champs financiers)
    const updateData: any = {
      ...userFields,
      manager_user_id: updateUserDto.manager_user_id,
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

    // Mettre à jour l'utilisateur
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
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
      },
    });

    // Gérer les informations financières si des champs sont fournis
    const hasFinancialData =
      salary_basic !== undefined ||
      salary_gross !== undefined ||
      salary_net !== undefined ||
      allowance_house_rent !== undefined ||
      allowance_medical !== undefined ||
      allowance_special !== undefined ||
      allowance_fuel !== undefined ||
      allowance_phone_bill !== undefined ||
      allowance_other !== undefined ||
      deduction_provident_fund !== undefined ||
      deduction_tax !== undefined ||
      deduction_other !== undefined ||
      bank_name !== undefined ||
      account_name !== undefined ||
      account_number !== undefined ||
      iban !== undefined;

    if (hasFinancialData) {
      const financialData: any = {};

      if (salary_basic !== undefined) financialData.salary_basic = salary_basic;
      if (salary_gross !== undefined) financialData.salary_gross = salary_gross;
      if (salary_net !== undefined) financialData.salary_net = salary_net;
      if (allowance_house_rent !== undefined) financialData.allowance_house_rent = allowance_house_rent;
      if (allowance_medical !== undefined) financialData.allowance_medical = allowance_medical;
      if (allowance_special !== undefined) financialData.allowance_special = allowance_special;
      if (allowance_fuel !== undefined) financialData.allowance_fuel = allowance_fuel;
      if (allowance_phone_bill !== undefined) financialData.allowance_phone_bill = allowance_phone_bill;
      if (allowance_other !== undefined) financialData.allowance_other = allowance_other;
      if (deduction_provident_fund !== undefined) financialData.deduction_provident_fund = deduction_provident_fund;
      if (deduction_tax !== undefined) financialData.deduction_tax = deduction_tax;
      if (deduction_other !== undefined) financialData.deduction_other = deduction_other;
      if (bank_name !== undefined) financialData.bank_name = bank_name;
      if (account_name !== undefined) financialData.account_name = account_name;
      if (account_number !== undefined) financialData.account_number = account_number;
      if (iban !== undefined) financialData.iban = iban;

      // Calculer les totaux
      const allowances = [
        allowance_house_rent,
        allowance_medical,
        allowance_special,
        allowance_fuel,
        allowance_phone_bill,
        allowance_other,
      ].filter((v) => v !== undefined) as number[];

      if (allowances.length > 0) {
        financialData.allowance_total = allowances.reduce((sum, val) => sum + val, 0);
      }

      const deductions = [
        deduction_provident_fund,
        deduction_tax,
        deduction_other,
      ].filter((v) => v !== undefined) as number[];

      if (deductions.length > 0) {
        financialData.deduction_total = deductions.reduce((sum, val) => sum + val, 0);
      }

      // Vérifier si des infos financières existent déjà
      const existingFinancial = existingUser.user_financial_info?.[0];

      if (existingFinancial) {
        // Mettre à jour
        await this.prisma.user_financial_info.update({
          where: { id: existingFinancial.id },
          data: financialData,
        });
      } else {
        // Créer
        await this.prisma.user_financial_info.create({
          data: {
            ...financialData,
            user_id: id,
          },
        });
      }
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      department: user.department,
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

    // Récupérer tous les utilisateurs actifs comme managers potentiels
    const managers = await this.prisma.user.findMany({
      where: {
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

    // Récupérer les rôles personnalisés depuis la table role
    const customRoles = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        is_system: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      departments,
      positions,
      managers,
      roles: await this.getCreatableRolesForUser(currentUserId), // Ancien système (enum)
      customRoles, // Nouveau système (table role)
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
        department: {
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
        user.department?.department_name || '',
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

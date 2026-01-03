import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { application_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { UpdateOwnTaskDto } from './dto/update-own-task.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) { }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const {
      // Données utilisateur de base
      username,
      password,
      full_name,
      role,
      role_id,
      department_id,
      position_id,
      manager_user_id,
      work_email,
      hire_date,
      profile_photo_url,
      active,

      // Informations personnelles
      date_of_birth,
      gender,
      marital_status,
      father_name,
      id_number,
      address,
      city,
      country,
      mobile,
      phone,
      email_address,

      // Informations financières
      employment_type,
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
    } = createEmployeeDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec ce nom d\'utilisateur existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculer les totaux
    const allowance_total = (allowance_house_rent || 0) +
      (allowance_medical || 0) +
      (allowance_special || 0) +
      (allowance_fuel || 0) +
      (allowance_phone_bill || 0) +
      (allowance_other || 0);

    const deduction_total = (deduction_provident_fund || 0) +
      (deduction_tax || 0) +
      (deduction_other || 0);

    return this.prisma.$transaction(async (prisma) => {
      // Créer l'utilisateur principal
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          full_name,
          role: role || 'ROLE_EMPLOYEE',
          role_id,
          department_id,
          position_id,
          manager_user_id,
          work_email,
          hire_date: hire_date ? new Date(hire_date) : null,
          profile_photo_url,
          active: active ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Créer les informations personnelles si fournies
      if (date_of_birth || gender || marital_status || father_name || id_number ||
        address || city || country || mobile || phone || email_address) {
        await prisma.user_personal_info.create({
          data: {
            user_id: user.id,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            gender,
            marital_status,
            father_name,
            id_number,
            address,
            city,
            country,
            mobile,
            phone,
            email_address,
          },
        });
      }

      // Créer les informations financières si fournies
      if (employment_type || salary_basic || salary_gross || salary_net ||
        allowance_house_rent || allowance_medical || allowance_special ||
        allowance_fuel || allowance_phone_bill || allowance_other ||
        deduction_provident_fund || deduction_tax || deduction_other ||
        bank_name || account_name || account_number || iban) {
        await prisma.user_financial_info.create({
          data: {
            user_id: user.id,
            employment_type,
            salary_basic,
            salary_gross,
            salary_net,
            allowance_house_rent,
            allowance_medical,
            allowance_special,
            allowance_fuel,
            allowance_phone_bill,
            allowance_other,
            allowance_total,
            deduction_provident_fund,
            deduction_tax,
            deduction_other,
            deduction_total,
            bank_name,
            account_name,
            account_number,
            iban,
          },
        });
      }

      return this.findOne(user.id);
    });
  }

  async findAll(page = 1, limit = 10, search?: string, department_id?: number) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { username: { contains: search } },
        { work_email: { contains: search } },
      ];
    }

    if (department_id) {
      where.department_id = department_id;
    }

    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true },
          },
          position: {
            select: { id: true, title: true, level: true },
          },
          role_relation: {
            select: { id: true, name: true, color: true, icon: true },
          },
          user_personal_info: true,
          user_financial_info: true,
          employment_contract: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, title: true, level: true, description: true },
        },
        role_relation: {
          select: { id: true, name: true, color: true, icon: true, description: true },
        },
        user_personal_info: true,
        user_financial_info: true,
        employment_contract: {
          orderBy: { created_at: 'desc' },
        },
        user_document_user_document_user_idTouser: {
          include: {
            user_user_document_uploaded_by_user_idTouser: {
              select: { id: true, full_name: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        user_employment_history: {
          orderBy: { effective_date: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employé non trouvé');
    }

    return employee;
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const {
      // Données utilisateur de base
      username,
      password,
      full_name,
      role,
      role_id,
      department_id,
      position_id,
      manager_user_id,
      work_email,
      hire_date,
      profile_photo_url,
      active,

      // Informations personnelles
      date_of_birth,
      gender,
      marital_status,
      father_name,
      id_number,
      address,
      city,
      country,
      mobile,
      phone,
      email_address,

      // Informations financières
      employment_type,
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
    } = updateEmployeeDto;

    const existingEmployee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      throw new NotFoundException('Employé non trouvé');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Préparer les données utilisateur
      const userData: any = {
        updated_at: new Date(),
      };

      if (username) userData.username = username;
      if (password) userData.password = await bcrypt.hash(password, 10);
      if (full_name) userData.full_name = full_name;
      if (role) userData.role = role;
      if (role_id !== undefined) userData.role_id = role_id;
      if (department_id !== undefined) userData.department_id = department_id;
      if (position_id !== undefined) userData.position_id = position_id;
      if (manager_user_id !== undefined) userData.manager_user_id = manager_user_id;
      if (work_email) userData.work_email = work_email;
      if (hire_date) userData.hire_date = new Date(hire_date);
      if (profile_photo_url) userData.profile_photo_url = profile_photo_url;
      if (active !== undefined) userData.active = active;

      // Mettre à jour l'utilisateur principal
      const user = await prisma.user.update({
        where: { id },
        data: userData,
      });

      // Mettre à jour les informations personnelles
      if (date_of_birth || gender || marital_status || father_name || id_number ||
        address || city || country || mobile || phone || email_address) {

        const personalData: any = {};
        if (date_of_birth) personalData.date_of_birth = new Date(date_of_birth);
        if (gender) personalData.gender = gender;
        if (marital_status) personalData.marital_status = marital_status;
        if (father_name) personalData.father_name = father_name;
        if (id_number) personalData.id_number = id_number;
        if (address) personalData.address = address;
        if (city) personalData.city = city;
        if (country) personalData.country = country;
        if (mobile) personalData.mobile = mobile;
        if (phone) personalData.phone = phone;
        if (email_address) personalData.email_address = email_address;

        const existingPersonalInfo = await prisma.user_personal_info.findFirst({
          where: { user_id: id },
        });

        if (existingPersonalInfo) {
          await prisma.user_personal_info.update({
            where: { id: existingPersonalInfo.id },
            data: personalData,
          });
        } else {
          await prisma.user_personal_info.create({
            data: {
              user_id: id,
              ...personalData,
            },
          });
        }
      }

      // Mettre à jour les informations financières
      if (employment_type || salary_basic !== undefined || salary_gross !== undefined ||
        salary_net !== undefined || allowance_house_rent !== undefined ||
        allowance_medical !== undefined || allowance_special !== undefined ||
        allowance_fuel !== undefined || allowance_phone_bill !== undefined ||
        allowance_other !== undefined || deduction_provident_fund !== undefined ||
        deduction_tax !== undefined || deduction_other !== undefined ||
        bank_name || account_name || account_number || iban) {

        const financialData: any = {};
        if (employment_type) financialData.employment_type = employment_type;
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
        if (bank_name) financialData.bank_name = bank_name;
        if (account_name) financialData.account_name = account_name;
        if (account_number) financialData.account_number = account_number;
        if (iban) financialData.iban = iban;

        // Calculer les totaux
        const currentFinancial = await prisma.user_financial_info.findFirst({
          where: { user_id: id },
        });

        const allowance_total = (financialData.allowance_house_rent ?? currentFinancial?.allowance_house_rent ?? 0) +
          (financialData.allowance_medical ?? currentFinancial?.allowance_medical ?? 0) +
          (financialData.allowance_special ?? currentFinancial?.allowance_special ?? 0) +
          (financialData.allowance_fuel ?? currentFinancial?.allowance_fuel ?? 0) +
          (financialData.allowance_phone_bill ?? currentFinancial?.allowance_phone_bill ?? 0) +
          (financialData.allowance_other ?? currentFinancial?.allowance_other ?? 0);

        const deduction_total = (financialData.deduction_provident_fund ?? currentFinancial?.deduction_provident_fund ?? 0) +
          (financialData.deduction_tax ?? currentFinancial?.deduction_tax ?? 0) +
          (financialData.deduction_other ?? currentFinancial?.deduction_other ?? 0);

        financialData.allowance_total = allowance_total;
        financialData.deduction_total = deduction_total;

        if (currentFinancial) {
          await prisma.user_financial_info.update({
            where: { id: currentFinancial.id },
            data: financialData,
          });
        } else {
          await prisma.user_financial_info.create({
            data: {
              user_id: id,
              ...financialData,
            },
          });
        }
      }

      return this.findOne(user.id);
    });
  }

  async remove(id: number) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employé non trouvé');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Employé supprimé avec succès' };
  }

  // Gestion des contrats
  async createContract(employeeId: number, createContractDto: CreateContractDto) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employé non trouvé');
    }

    return this.prisma.employment_contract.create({
      data: {
        user_id: employeeId,
        contract_type: createContractDto.contract_type,
        start_date: new Date(createContractDto.start_date),
        end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
        probation_end_date: createContractDto.probation_end_date ? new Date(createContractDto.probation_end_date) : null,
        status: createContractDto.status || 'DRAFT',
        weekly_hours: createContractDto.weekly_hours,
        notes: createContractDto.notes,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async getContracts(employeeId: number) {
    return this.prisma.employment_contract.findMany({
      where: { user_id: employeeId },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateContract(contractId: number, updateData: Partial<CreateContractDto>) {
    const contract = await this.prisma.employment_contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }

    const data: any = { updated_at: new Date() };

    if (updateData.contract_type) data.contract_type = updateData.contract_type;
    if (updateData.start_date) data.start_date = new Date(updateData.start_date);
    if (updateData.end_date) data.end_date = new Date(updateData.end_date);
    if (updateData.probation_end_date) data.probation_end_date = new Date(updateData.probation_end_date);
    if (updateData.status) data.status = updateData.status;
    if (updateData.weekly_hours !== undefined) data.weekly_hours = updateData.weekly_hours;
    if (updateData.notes !== undefined) data.notes = updateData.notes;

    return this.prisma.employment_contract.update({
      where: { id: contractId },
      data,
    });
  }

  async deleteContract(contractId: number) {
    const contract = await this.prisma.employment_contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }

    await this.prisma.employment_contract.delete({
      where: { id: contractId },
    });

    return { message: 'Contrat supprimé avec succès' };
  }

  // Gestion des documents
  async createDocument(employeeId: number, uploadedByUserId: number, createDocumentDto: CreateDocumentDto) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employé non trouvé');
    }

    return this.prisma.user_document.create({
      data: {
        user_id: employeeId,
        uploaded_by_user_id: uploadedByUserId,
        name: createDocumentDto.name,
        document_type: createDocumentDto.document_type,
        file_path: createDocumentDto.file_path,
        is_confidential: createDocumentDto.is_confidential || false,
        description: createDocumentDto.description,
        expires_at: createDocumentDto.expires_at ? new Date(createDocumentDto.expires_at) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user_user_document_uploaded_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
    });
  }

  async getDocuments(employeeId: number) {
    return this.prisma.user_document.findMany({
      where: { user_id: employeeId },
      include: {
        user_user_document_uploaded_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMyDocuments(userId: number) {
    return this.getDocuments(userId);
  }

  async getMyProjects(userId: number) {
    return this.prisma.project.findMany({
      where: {
        project_member: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        user: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        project_member: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        task: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            task: true,
            project_member: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getMyTasks(userId: number) {
    return this.prisma.task.findMany({
      where: {
        task_assignment: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        task_column: {
          select: { id: true, name: true },
        },
        task_assignment: {
          where: { user_id: userId },
          select: { id: true, role: true, assigned_at: true },
        },
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
      ],
    });
  }

  async updateMyTask(userId: number, taskId: number, updateOwnTaskDto: UpdateOwnTaskDto) {
    const assignment = await this.prisma.task_assignment.findFirst({
      where: {
        task_id: taskId,
        user_id: userId,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette tâche');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
      updated_by_user_id: userId,
    };

    if (updateOwnTaskDto.status !== undefined) {
      updateData['status'] = updateOwnTaskDto.status;
      if (updateOwnTaskDto.status === 'DONE' && !updateOwnTaskDto.completed_at) {
        updateData['completed_at'] = new Date();
      } else if (updateOwnTaskDto.status !== 'DONE') {
        updateData['completed_at'] = null;
      }
    }

    if (updateOwnTaskDto.completed_at !== undefined) {
      updateData['completed_at'] = updateOwnTaskDto.completed_at
        ? new Date(updateOwnTaskDto.completed_at)
        : null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true },
        },
        task_column: {
          select: { id: true, name: true },
        },
        task_assignment: {
          where: { user_id: userId },
          select: { id: true, role: true, assigned_at: true },
        },
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
    });
  }

  async getMyTeam(userId: number) {
    return this.prisma.user.findMany({
      where: { manager_user_id: userId },
      select: {
        id: true,
        full_name: true,
        work_email: true,
        profile_photo_url: true,
        active: true,
        hire_date: true,
        position: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { full_name: 'asc' },
    });
  }

  async getMyTeamTasks(userId: number) {
    const teamMembers = await this.prisma.user.findMany({
      where: { manager_user_id: userId },
      select: { id: true },
    });

    const teamIds = teamMembers.map((member) => member.id);

    if (teamIds.length === 0) {
      return [];
    }

    return this.prisma.task.findMany({
      where: {
        task_assignment: {
          some: {
            user_id: { in: teamIds },
          },
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        task_column: {
          select: { id: true, name: true },
        },
        task_assignment: {
          include: {
            user: {
              select: { id: true, full_name: true, profile_photo_url: true },
            },
          },
        },
        user_task_created_by_user_idTouser: {
          select: { id: true, full_name: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
      ],
    });
  }

  async getMyTeamStats(userId: number) {
    const teamMembers = await this.prisma.user.findMany({
      where: { manager_user_id: userId },
      select: {
        id: true,
        active: true,
      },
    });

    const teamIds = teamMembers.map((member) => member.id);
    const activeMembers = teamMembers.filter((member) => member.active).length;
    const inactiveMembers = teamMembers.length - activeMembers;

    let pendingLeaves = 0;
    let upcomingLeaves = 0;
    let openTasks = 0;

    if (teamIds.length > 0) {
      pendingLeaves = await this.prisma.application.count({
        where: {
          user_id: { in: teamIds },
          status: application_status.Pending,
        },
      });

      upcomingLeaves = await this.prisma.application.count({
        where: {
          user_id: { in: teamIds },
          status: application_status.Approved,
          start_date: { gte: new Date() },
        },
      });

      openTasks = await this.prisma.task.count({
        where: {
          task_assignment: {
            some: {
              user_id: { in: teamIds },
            },
          },
          status: {
            notIn: ['DONE', 'ARCHIVED'],
          },
        },
      });
    }

    return {
      totalTeamMembers: teamMembers.length,
      activeTeamMembers: activeMembers,
      inactiveTeamMembers: inactiveMembers,
      pendingLeaves,
      upcomingLeaves,
      openTasks,
    };
  }

  async getEmploymentHistory(employeeId: number) {
    return this.prisma.user_employment_history.findMany({
      where: { user_id: employeeId },
      orderBy: { effective_date: 'desc' },
    });
  }

  async getMyEmploymentHistory(userId: number) {
    return this.getEmploymentHistory(userId);
  }

  async getMyAnnouncements(userId: number) {
    console.log(`🔍 getMyAnnouncements called for user ${userId}`);
    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department_id: true },
    });

    if (!employee) {
      console.error(`❌ Employee not found for user ${userId}`);
      throw new NotFoundException('Employé non trouvé');
    }

    const now = new Date();
    console.log(`📊 Searching for announcements. Dept: ${employee.department_id}, Now: ${now.toISOString()}`);

    const announcements = await this.prisma.announcement.findMany({
      where: {
        is_published: true,
        OR: [
          { expire_date: null },
          { expire_date: { gte: now } },
        ],
        AND: [
          {
            OR: [
              { target_all: true },
              { department_id: employee.department_id || 0 }, // If no department, only target_all matches (0 won't match any valid department usually)
            ],
          },
        ],
      },
      include: {
        author: {
          select: { id: true, full_name: true, profile_photo_url: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { priority: 'desc' }, // High priority first
        { publish_date: 'desc' }, // Then most recent
        { created_at: 'desc' },
      ],
    });

    console.log(`✅ Found ${announcements.length} announcements`);
    return announcements;
  }

  async deleteDocument(documentId: number) {
    const document = await this.prisma.user_document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    await this.prisma.user_document.delete({
      where: { id: documentId },
    });

    return { message: 'Document supprimé avec succès' };
  }

  // Recherche d'employés
  async search(query: string) {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { full_name: { contains: query } },
          { username: { contains: query } },
          { work_email: { contains: query } },
          {
            user_personal_info: {
              some: {
                OR: [
                  { mobile: { contains: query } },
                  { email_address: { contains: query } },
                ]
              }
            }
          },
          {
            department: {
              name: { contains: query }
            }
          },
          {
            position: {
              title: { contains: query }
            }
          }
        ]
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, title: true, level: true },
        },
        role_relation: {
          select: { id: true, name: true, color: true, icon: true },
        },
        user_personal_info: true,
      },
      orderBy: { full_name: 'asc' },
      take: 50, // Limiter les résultats pour les performances
    });
  }

  // Organigramme - Récupérer la hiérarchie des employés
  async getOrganizationChart() {
    const employees = await this.prisma.user.findMany({
      where: { active: true },
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, title: true, level: true },
        },
      },
      orderBy: [
        { department_id: 'asc' },
        { full_name: 'asc' }
      ],
    });

    // Organiser par département et hiérarchie
    const organizationMap = new Map();

    employees.forEach(employee => {
      const deptId = employee.department_id || 0;
      const deptName = employee.department?.name || 'Sans département';

      if (!organizationMap.has(deptId)) {
        organizationMap.set(deptId, {
          id: deptId,
          name: deptName,
          employees: [],
          managers: [],
          subordinates: []
        });
      }

      const dept = organizationMap.get(deptId);
      dept.employees.push({
        id: employee.id,
        full_name: employee.full_name,
        position: employee.position?.title || 'Poste non défini',
        level: employee.position?.level,
        manager_user_id: employee.manager_user_id,
        profile_photo_url: employee.profile_photo_url,
        work_email: employee.work_email,
      });
    });

    return Array.from(organizationMap.values());
  }

  // Profil employé pour l'employé connecté
  async getMyProfile(userId: number) {
    return this.findOne(userId);
  }

  async updateOwnProfile(
    userId: number,
    updateOwnProfileDto: UpdateOwnProfileDto,
    profilePhotoPath?: string,
  ) {
    const {
      full_name,
      work_email,
      date_of_birth,
      gender,
      marital_status,
      id_number,
      address,
      city,
      country,
      mobile,
      phone,
      email_address,
      spouse_name,
      emergency_contact_primary_name,
      emergency_contact_primary_relation,
      emergency_contact_primary_phone,
      emergency_contact_secondary_name,
      emergency_contact_secondary_relation,
      emergency_contact_secondary_phone,
    } = updateOwnProfileDto;

    return this.prisma.$transaction(async (prisma) => {
      const userUpdateData: Record<string, any> = {
        updated_at: new Date(),
      };

      if (full_name !== undefined) {
        userUpdateData.full_name = full_name;
      }
      if (work_email !== undefined) {
        userUpdateData.work_email = work_email;
      }
      if (profilePhotoPath) {
        // Ensure path starts with / for proper URL construction
        let photoUrl = profilePhotoPath.replace(/\\/g, '/');
        if (!photoUrl.startsWith('/')) {
          photoUrl = '/' + photoUrl;
        }
        userUpdateData.profile_photo_url = photoUrl;
      }

      if (Object.keys(userUpdateData).length > 1 || profilePhotoPath) {
        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      const personalData: Record<string, any> = {};
      if (date_of_birth !== undefined) {
        personalData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
      }
      if (gender !== undefined) {
        personalData.gender = gender;
      }
      if (marital_status !== undefined) {
        personalData.marital_status = marital_status;
      }
      if (id_number !== undefined) {
        personalData.id_number = id_number || null;
      }
      if (address !== undefined) {
        personalData.address = address || null;
      }
      if (city !== undefined) {
        personalData.city = city || null;
      }
      if (country !== undefined) {
        personalData.country = country || null;
      }
      if (mobile !== undefined) {
        personalData.mobile = mobile || null;
      }
      if (phone !== undefined) {
        personalData.phone = phone || null;
      }
      if (email_address !== undefined) {
        personalData.email_address = email_address || null;
      }
      if (spouse_name !== undefined) {
        personalData.spouse_name = spouse_name || null;
      }
      if (emergency_contact_primary_name !== undefined) {
        personalData.emergency_contact_primary_name = emergency_contact_primary_name || null;
      }
      if (emergency_contact_primary_relation !== undefined) {
        personalData.emergency_contact_primary_relation = emergency_contact_primary_relation || null;
      }
      if (emergency_contact_primary_phone !== undefined) {
        personalData.emergency_contact_primary_phone = emergency_contact_primary_phone || null;
      }
      if (emergency_contact_secondary_name !== undefined) {
        personalData.emergency_contact_secondary_name = emergency_contact_secondary_name || null;
      }
      if (emergency_contact_secondary_relation !== undefined) {
        personalData.emergency_contact_secondary_relation = emergency_contact_secondary_relation || null;
      }
      if (emergency_contact_secondary_phone !== undefined) {
        personalData.emergency_contact_secondary_phone = emergency_contact_secondary_phone || null;
      }

      if (Object.keys(personalData).length > 0) {
        const existingPersonalInfo = await prisma.user_personal_info.findFirst({
          where: { user_id: userId },
        });

        if (existingPersonalInfo) {
          await prisma.user_personal_info.update({
            where: { id: existingPersonalInfo.id },
            data: personalData,
          });
        } else {
          await prisma.user_personal_info.create({
            data: {
              user_id: userId,
              ...personalData,
            },
          });
        }
      }

      return this.findOne(userId);
    });
  }

  // Statistiques
  async getStats() {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      employeesByDepartment,
      recentHires,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.user.count({ where: { active: false } }),
      this.prisma.user.groupBy({
        by: ['department_id'],
        _count: { id: true },
        where: { department_id: { not: null } },
      }),
      this.prisma.user.count({
        where: {
          hire_date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      employeesByDepartment,
      recentHires,
    };
  }
}

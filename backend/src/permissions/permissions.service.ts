import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/create-menu-item.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // ============== PERMISSIONS ==============

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ group_name: 'asc' }, { sort_order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { role_permission: true },
        },
      },
    });
  }

  async findPermissionsByGroup() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ group_name: 'asc' }, { sort_order: 'asc' }],
    });

    // Grouper par group_name
    const groups: Record<string, { icon: string; permissions: typeof permissions }> = {};
    
    for (const perm of permissions) {
      const groupName = perm.group_name || 'Autres';
      if (!groups[groupName]) {
        groups[groupName] = {
          icon: perm.group_icon || '📋',
          permissions: [],
        };
      }
      groups[groupName].permissions.push(perm);
    }

    return groups;
  }

  async findOnePermission(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        role_permission: {
          include: {
            role: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission non trouvée');
    }

    return permission;
  }

  async createPermission(dto: CreatePermissionDto) {
    // Vérifier si le nom existe déjà
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`La permission "${dto.name}" existe déjà`);
    }

    return this.prisma.permission.create({
      data: {
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Permission non trouvée');
    }

    // Vérifier si le nouveau nom existe déjà (si changement de nom)
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.permission.findUnique({
        where: { name: dto.name },
      });
      if (nameExists) {
        throw new ConflictException(`La permission "${dto.name}" existe déjà`);
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  async deletePermission(id: number) {
    const existing = await this.prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Permission non trouvée');
    }

    // Supprimer les associations role_permission d'abord
    await this.prisma.role_permission.deleteMany({
      where: { permission_id: id },
    });

    return this.prisma.permission.delete({ where: { id } });
  }

  // ============== MENU ITEMS ==============

  async findAllMenuItems() {
    return this.prisma.menu_item.findMany({
      where: { parent_id: null }, // Seulement les menus racine
      orderBy: [{ section: 'asc' }, { sort_order: 'asc' }],
      include: {
        permission: { select: { id: true, name: true, label: true } },
        children: {
          orderBy: { sort_order: 'asc' },
          include: {
            permission: { select: { id: true, name: true, label: true } },
          },
        },
      },
    });
  }

  async findMenuItemsForUser(userPermissions: string[]) {
    // Récupérer tous les menus actifs
    const allMenus = await this.prisma.menu_item.findMany({
      where: { is_active: true },
      orderBy: [{ section: 'asc' }, { sort_order: 'asc' }],
      include: {
        permission: { select: { name: true } },
        children: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
          include: {
            permission: { select: { name: true } },
          },
        },
      },
    });

    // Filtrer selon les permissions de l'utilisateur
    const filteredMenus = allMenus
      .filter((menu) => {
        // Si pas de permission requise, accessible à tous
        if (!menu.permission) return true;
        // Sinon, vérifier si l'utilisateur a la permission
        return userPermissions.includes(menu.permission.name);
      })
      .map((menu) => ({
        ...menu,
        children: menu.children.filter((child) => {
          if (!child.permission) return true;
          return userPermissions.includes(child.permission.name);
        }),
      }))
      // Ne garder que les menus qui ont soit un path, soit des enfants visibles
      .filter((menu) => menu.path || menu.children.length > 0);

    return filteredMenus;
  }

  async findOneMenuItem(id: number) {
    const menuItem = await this.prisma.menu_item.findUnique({
      where: { id },
      include: {
        permission: true,
        parent: { select: { id: true, name: true } },
        children: {
          orderBy: { sort_order: 'asc' },
          include: { permission: { select: { id: true, name: true } } },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu non trouvé');
    }

    return menuItem;
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    return this.prisma.menu_item.create({
      data: {
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        permission: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async updateMenuItem(id: number, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menu_item.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Menu non trouvé');
    }

    // Empêcher un menu d'être son propre parent
    if (dto.parent_id === id) {
      throw new ConflictException('Un menu ne peut pas être son propre parent');
    }

    return this.prisma.menu_item.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
      include: {
        permission: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async deleteMenuItem(id: number) {
    const existing = await this.prisma.menu_item.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!existing) {
      throw new NotFoundException('Menu non trouvé');
    }

    // Mettre les enfants orphelins (parent_id = null)
    if (existing.children.length > 0) {
      await this.prisma.menu_item.updateMany({
        where: { parent_id: id },
        data: { parent_id: null },
      });
    }

    return this.prisma.menu_item.delete({ where: { id } });
  }

  async reorderMenuItems(items: { id: number; sort_order: number; parent_id?: number | null }[]) {
    const updates = items.map((item) =>
      this.prisma.menu_item.update({
        where: { id: item.id },
        data: {
          sort_order: item.sort_order,
          parent_id: item.parent_id,
          updated_at: new Date(),
        },
      }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  // ============== PERMISSION GROUPS ==============

  async getPermissionGroups() {
    const groups = await this.prisma.permission.findMany({
      select: { group_name: true, group_icon: true },
      distinct: ['group_name'],
      where: { group_name: { not: null } },
    });

    return groups.map((g) => ({
      name: g.group_name,
      icon: g.group_icon || '📋',
    }));
  }

  // ============== SEED INITIAL DATA ==============

  async seedDefaultPermissionsAndMenus() {
    const now = new Date();

    // Permissions par défaut avec groupes
    const defaultPermissions = [
      // Utilisateurs
      { name: 'users.view', label: 'Voir les utilisateurs', group_name: 'Utilisateurs', group_icon: '👤', sort_order: 1 },
      { name: 'users.create', label: 'Créer des utilisateurs', group_name: 'Utilisateurs', group_icon: '👤', sort_order: 2 },
      { name: 'users.edit', label: 'Modifier des utilisateurs', group_name: 'Utilisateurs', group_icon: '👤', sort_order: 3 },
      { name: 'users.delete', label: 'Supprimer des utilisateurs', group_name: 'Utilisateurs', group_icon: '👤', sort_order: 4 },
      { name: 'users.view_salary', label: 'Voir les salaires', group_name: 'Utilisateurs', group_icon: '👤', sort_order: 5 },
      
      // Rôles
      { name: 'roles.view', label: 'Voir les rôles', group_name: 'Rôles', group_icon: '🔐', sort_order: 1 },
      { name: 'roles.manage', label: 'Gérer les rôles', group_name: 'Rôles', group_icon: '🔐', sort_order: 2 },
      
      // Départements
      { name: 'departments.view', label: 'Voir les départements', group_name: 'Organisation', group_icon: '🏢', sort_order: 1 },
      { name: 'departments.manage', label: 'Gérer les départements', group_name: 'Organisation', group_icon: '🏢', sort_order: 2 },
      { name: 'positions.view', label: 'Voir les postes', group_name: 'Organisation', group_icon: '🏢', sort_order: 3 },
      { name: 'positions.manage', label: 'Gérer les postes', group_name: 'Organisation', group_icon: '🏢', sort_order: 4 },
      
      // Congés
      { name: 'leaves.view', label: 'Voir ses congés', group_name: 'Congés', group_icon: '🏖️', sort_order: 1 },
      { name: 'leaves.view_all', label: 'Voir tous les congés', group_name: 'Congés', group_icon: '🏖️', sort_order: 2 },
      { name: 'leaves.approve', label: 'Approuver les congés', group_name: 'Congés', group_icon: '🏖️', sort_order: 3 },
      { name: 'leaves.manage', label: 'Gérer les congés', group_name: 'Congés', group_icon: '🏖️', sort_order: 4 },
      
      // Annonces
      { name: 'announcements.view', label: 'Voir les annonces', group_name: 'Annonces', group_icon: '📢', sort_order: 1 },
      { name: 'announcements.manage', label: 'Gérer les annonces', group_name: 'Annonces', group_icon: '📢', sort_order: 2 },
      
      // Projets
      { name: 'projects.view', label: 'Voir ses projets', group_name: 'Projets', group_icon: '📂', sort_order: 1 },
      { name: 'projects.view_all', label: 'Voir tous les projets', group_name: 'Projets', group_icon: '📂', sort_order: 2 },
      { name: 'projects.manage', label: 'Gérer les projets', group_name: 'Projets', group_icon: '📂', sort_order: 3 },
      
      // Rapports
      { name: 'reports.view', label: 'Voir les rapports', group_name: 'Rapports', group_icon: '📊', sort_order: 1 },
      
      // Administration
      { name: 'system.admin', label: 'Administration système', group_name: 'Système', group_icon: '⚙️', sort_order: 1 },
      { name: 'system.settings', label: 'Paramètres application', group_name: 'Système', group_icon: '⚙️', sort_order: 2 },
    ];

    // Mettre à jour ou créer les permissions
    for (const perm of defaultPermissions) {
      await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: {
          label: perm.label,
          group_name: perm.group_name,
          group_icon: perm.group_icon,
          sort_order: perm.sort_order,
          updated_at: now,
        },
        create: {
          ...perm,
          created_at: now,
          updated_at: now,
        },
      });
    }

    return { success: true, message: 'Permissions initialisées' };
  }
}

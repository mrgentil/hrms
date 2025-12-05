import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  user?: {
    id: number;
    full_name: string;
  };
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // Créer un log d'audit
  async log(data: {
    user_id?: number;
    action: string;
    entity_type: string;
    entity_id?: number;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    return this.prisma.audit_log.create({
      data: {
        user_id: data.user_id || null,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id || null,
        old_values: data.old_values ? JSON.stringify(data.old_values) : null,
        new_values: data.new_values ? JSON.stringify(data.new_values) : null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
      },
    });
  }

  // Récupérer tous les logs avec filtres
  async findAll(filters?: {
    user_id?: number;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.action) where.action = { contains: filters.action };
    if (filters?.entity_type) where.entity_type = filters.entity_type;
    
    if (filters?.start_date || filters?.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at.gte = new Date(filters.start_date);
      if (filters.end_date) where.created_at.lte = new Date(filters.end_date);
    }

    const [logs, total] = await Promise.all([
      this.prisma.audit_log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      this.prisma.audit_log.count({ where }),
    ]);

    return {
      data: logs.map(log => ({
        ...log,
        old_values: log.old_values ? JSON.parse(log.old_values as string) : null,
        new_values: log.new_values ? JSON.parse(log.new_values as string) : null,
      })),
      total,
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
    };
  }

  // Statistiques
  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLogs, todayLogs, weekLogs, monthLogs, byAction, byEntity] = await Promise.all([
      this.prisma.audit_log.count(),
      this.prisma.audit_log.count({ where: { created_at: { gte: today } } }),
      this.prisma.audit_log.count({ where: { created_at: { gte: thisWeek } } }),
      this.prisma.audit_log.count({ where: { created_at: { gte: thisMonth } } }),
      this.prisma.audit_log.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.audit_log.groupBy({
        by: ['entity_type'],
        _count: true,
        orderBy: { _count: { entity_type: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total: totalLogs,
      today: todayLogs,
      thisWeek: weekLogs,
      thisMonth: monthLogs,
      byAction: byAction.map(a => ({ action: a.action, count: a._count })),
      byEntity: byEntity.map(e => ({ entity: e.entity_type, count: e._count })),
    };
  }

  // Actions courantes
  async logLogin(userId: number, ip?: string, userAgent?: string) {
    return this.log({
      user_id: userId,
      action: 'LOGIN',
      entity_type: 'auth',
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  async logLogout(userId: number) {
    return this.log({
      user_id: userId,
      action: 'LOGOUT',
      entity_type: 'auth',
    });
  }

  async logCreate(userId: number, entityType: string, entityId: number, newValues?: any) {
    return this.log({
      user_id: userId,
      action: 'CREATE',
      entity_type: entityType,
      entity_id: entityId,
      new_values: newValues,
    });
  }

  async logUpdate(userId: number, entityType: string, entityId: number, oldValues?: any, newValues?: any) {
    return this.log({
      user_id: userId,
      action: 'UPDATE',
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
    });
  }

  async logDelete(userId: number, entityType: string, entityId: number, oldValues?: any) {
    return this.log({
      user_id: userId,
      action: 'DELETE',
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
    });
  }
}

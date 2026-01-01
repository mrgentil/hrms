import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface OrgChartNode {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  profile_photo_url: string | null;
  work_email: string | null;
  children: OrgChartNode[];
}

@Injectable()
export class OrgchartService {
  constructor(private prisma: PrismaService) {}

  async getOrgChart(): Promise<OrgChartNode[]> {
    // Récupérer tous les utilisateurs actifs avec leurs relations
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        full_name: true,
        manager_user_id: true,
        profile_photo_url: true,
        work_email: true,
        position: {
          select: { title: true },
        },
        department: {
          select: { name: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    // Créer un map pour accès rapide
    const userMap = new Map<number, OrgChartNode & { managerId: number | null }>();

    // Initialiser tous les nœuds
    for (const user of users) {
      userMap.set(user.id, {
        id: String(user.id),
        full_name: user.full_name,
        position: user.position?.title || null,
        department: user.department?.name || null,
        profile_photo_url: user.profile_photo_url,
        work_email: user.work_email,
        children: [],
        managerId: user.manager_user_id,
      });
    }

    // Construire l'arbre récursivement
    const rootNodes: OrgChartNode[] = [];

    for (const [userId, node] of userMap) {
      if (node.managerId === null) {
        // Pas de manager = nœud racine
        rootNodes.push(this.buildNodeWithChildren(node, userMap));
      } else if (!userMap.has(node.managerId)) {
        // Manager n'existe pas ou inactif = traiter comme racine
        rootNodes.push(this.buildNodeWithChildren(node, userMap));
      }
    }

    // Ajouter les enfants aux nœuds qui ont un manager valide
    for (const [userId, node] of userMap) {
      if (node.managerId !== null && userMap.has(node.managerId)) {
        const parent = userMap.get(node.managerId)!;
        parent.children.push(this.buildNodeWithChildren(node, userMap));
      }
    }

    // Nettoyer les propriétés internes et retourner les racines
    return this.cleanNodes(rootNodes);
  }

  private buildNodeWithChildren(
    node: OrgChartNode & { managerId: number | null },
    userMap: Map<number, OrgChartNode & { managerId: number | null }>,
  ): OrgChartNode {
    // Retourne le nœud sans la propriété managerId
    const { managerId, ...cleanNode } = node;
    return cleanNode;
  }

  private cleanNodes(nodes: OrgChartNode[]): OrgChartNode[] {
    return nodes.map((node) => {
      const { ...cleanNode } = node as any;
      delete cleanNode.managerId;
      return {
        ...cleanNode,
        children: this.cleanNodes(cleanNode.children || []),
      };
    });
  }

  async getOrgChartOptimized(): Promise<OrgChartNode[]> {
    // Version optimisée avec construction récursive en une passe
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        full_name: true,
        manager_user_id: true,
        profile_photo_url: true,
        work_email: true,
        position: {
          select: { title: true },
        },
        department: {
          select: { name: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    // Map userId -> children userIds
    const childrenMap = new Map<number | null, number[]>();
    const userDataMap = new Map<number, (typeof users)[0]>();

    for (const user of users) {
      userDataMap.set(user.id, user);

      const managerId = user.manager_user_id;
      if (!childrenMap.has(managerId)) {
        childrenMap.set(managerId, []);
      }
      childrenMap.get(managerId)!.push(user.id);
    }

    // Fonction récursive pour construire l'arbre
    const buildTree = (parentId: number | null): OrgChartNode[] => {
      const childIds = childrenMap.get(parentId) || [];
      return childIds.map((childId) => {
        const user = userDataMap.get(childId)!;
        return {
          id: String(user.id),
          full_name: user.full_name,
          position: user.position?.title || null,
          department: user.department?.name || null,
          profile_photo_url: user.profile_photo_url,
          work_email: user.work_email,
          children: buildTree(childId),
        };
      });
    };

    // Commencer par les nœuds racines (manager_user_id = null)
    const rootNodes = buildTree(null);

    // Ajouter aussi les nœuds dont le manager n'existe pas dans la liste active
    const activeUserIds = new Set(users.map((u) => u.id));
    for (const user of users) {
      if (
        user.manager_user_id !== null &&
        !activeUserIds.has(user.manager_user_id)
      ) {
        // Ce nœud a un manager inactif/inexistant, l'ajouter comme racine
        const isAlreadyInTree = rootNodes.some(
          (n) => n.id === String(user.id),
        );
        if (!isAlreadyInTree) {
          rootNodes.push({
            id: String(user.id),
            full_name: user.full_name,
            position: user.position?.title || null,
            department: user.department?.name || null,
            profile_photo_url: user.profile_photo_url,
            work_email: user.work_email,
            children: buildTree(user.id),
          });
        }
      }
    }

    return rootNodes;
  }
}

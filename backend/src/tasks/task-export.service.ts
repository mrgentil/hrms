import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TaskExportService {
  constructor(private prisma: PrismaService) {}

  async exportProjectTasksToExcel(projectId: number): Promise<Buffer> {
    // Récupérer le projet et ses tâches
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        task: {
          include: {
            task_assignment: {
              include: {
                user: {
                  select: { full_name: true },
                },
              },
            },
            task_column: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!project) {
      throw new Error('Projet non trouvé');
    }

    // Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HRMS';
    workbook.created = new Date();

    // Feuille principale des tâches
    const worksheet = workbook.addWorksheet('Tâches', {
      headerFooter: {
        firstHeader: `Projet: ${project.name}`,
      },
    });

    // Définir les colonnes
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Titre', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Priorité', key: 'priority', width: 12 },
      { header: 'Colonne', key: 'column', width: 15 },
      { header: 'Assignés', key: 'assignees', width: 30 },
      { header: 'Date de début', key: 'start_date', width: 15 },
      { header: 'Date d\'échéance', key: 'due_date', width: 15 },
      { header: 'Terminée le', key: 'completed_at', width: 15 },
      { header: 'Créée le', key: 'created_at', width: 15 },
    ];

    // Styliser l'en-tête
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF465FFF' }, // Couleur primary
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Mappings pour les labels
    const statusLabels: Record<string, string> = {
      TODO: 'À faire',
      IN_PROGRESS: 'En cours',
      IN_REVIEW: 'En révision',
      DONE: 'Terminé',
    };

    const priorityLabels: Record<string, string> = {
      LOW: 'Basse',
      MEDIUM: 'Moyenne',
      HIGH: 'Haute',
      URGENT: 'Urgente',
    };

    // Ajouter les données
    for (const task of project.task) {
      const assignees = task.task_assignment
        .map((a) => a.user?.full_name)
        .filter(Boolean)
        .join(', ');

      const row = worksheet.addRow({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: statusLabels[task.status] || task.status,
        priority: priorityLabels[task.priority] || task.priority,
        column: task.task_column?.name || '',
        assignees: assignees || 'Non assigné',
        start_date: task.start_date ? new Date(task.start_date).toLocaleDateString('fr-FR') : '',
        due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '',
        completed_at: task.completed_at ? new Date(task.completed_at).toLocaleDateString('fr-FR') : '',
        created_at: new Date(task.created_at).toLocaleDateString('fr-FR'),
      });

      // Couleur de la priorité
      const priorityCell = row.getCell('priority');
      switch (task.priority) {
        case 'CRITICAL':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          priorityCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'HIGH':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
          break;
        case 'MEDIUM':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
          priorityCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'LOW':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9CA3AF' } };
          break;
      }

      // Couleur du statut
      const statusCell = row.getCell('status');
      switch (task.status) {
        case 'DONE':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
          statusCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'IN_PROGRESS':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
          statusCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'BLOCKED':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
          break;
      }
    }

    // Ajouter des bordures
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `K${project.task.length + 1}`,
    };

    // Feuille de statistiques
    const statsSheet = workbook.addWorksheet('Statistiques');
    
    const totalTasks = project.task.length;
    const doneTasks = project.task.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = project.task.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = project.task.filter((t) => t.status === 'TODO').length;

    statsSheet.addRow(['Statistiques du projet', project.name]);
    statsSheet.addRow([]);
    statsSheet.addRow(['Total des tâches', totalTasks]);
    statsSheet.addRow(['Tâches terminées', doneTasks]);
    statsSheet.addRow(['Tâches en cours', inProgressTasks]);
    statsSheet.addRow(['Tâches à faire', todoTasks]);
    statsSheet.addRow(['Taux de complétion', `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%`]);
    statsSheet.addRow([]);
    statsSheet.addRow(['Exporté le', new Date().toLocaleString('fr-FR')]);

    // Styliser
    statsSheet.getRow(1).font = { bold: true, size: 14 };
    statsSheet.getColumn(1).width = 25;
    statsSheet.getColumn(2).width = 20;

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

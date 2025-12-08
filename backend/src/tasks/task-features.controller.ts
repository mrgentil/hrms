import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TaskFeaturesService } from './task-features.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskFeaturesController {
  constructor(private readonly taskFeaturesService: TaskFeaturesService) {}

  // ============================================
  // COMMENTAIRES
  // ============================================

  @Get(':taskId/comments')
  async getComments(@Param('taskId', ParseIntPipe) taskId: number) {
    const comments = await this.taskFeaturesService.getComments(taskId);
    return { success: true, data: comments };
  }

  @Post(':taskId/comments')
  async addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() user: any,
    @Body() body: { content: string; parent_comment_id?: number },
  ) {
    const comment = await this.taskFeaturesService.addComment(
      taskId, 
      user.id, 
      body.content,
      body.parent_comment_id,
    );
    return { success: true, data: comment, message: 'Commentaire ajouté' };
  }

  @Patch('comments/:commentId')
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const comment = await this.taskFeaturesService.updateComment(commentId, user.id, content);
    return { success: true, data: comment, message: 'Commentaire mis à jour' };
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: any,
  ) {
    await this.taskFeaturesService.deleteComment(commentId, user.id);
    return { success: true, message: 'Commentaire supprimé' };
  }

  // ============================================
  // PIÈCES JOINTES
  // ============================================

  @Get(':taskId/attachments')
  async getAttachments(@Param('taskId', ParseIntPipe) taskId: number) {
    const attachments = await this.taskFeaturesService.getAttachments(taskId);
    return { success: true, data: attachments };
  }

  @Post(':taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tasks',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async addAttachment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    const attachment = await this.taskFeaturesService.addAttachment(taskId, user.id, {
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType: file.mimetype,
    });
    return { success: true, data: attachment, message: 'Fichier uploadé' };
  }

  @Delete('attachments/:attachmentId')
  async deleteAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.taskFeaturesService.deleteAttachment(attachmentId, user.id);
    // TODO: Supprimer le fichier physique
    return { success: true, message: 'Fichier supprimé' };
  }

  // ============================================
  // CHECKLISTS
  // ============================================

  @Get(':taskId/checklists')
  async getChecklists(@Param('taskId', ParseIntPipe) taskId: number) {
    const checklists = await this.taskFeaturesService.getChecklists(taskId);
    return { success: true, data: checklists };
  }

  @Post(':taskId/checklists')
  async createChecklist(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() user: any,
    @Body('title') title: string,
  ) {
    const checklist = await this.taskFeaturesService.createChecklist(taskId, user.id, title);
    return { success: true, data: checklist, message: 'Checklist créée' };
  }

  @Patch('checklists/:checklistId')
  async updateChecklist(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Body('title') title: string,
  ) {
    const checklist = await this.taskFeaturesService.updateChecklist(checklistId, title);
    return { success: true, data: checklist, message: 'Checklist mise à jour' };
  }

  @Delete('checklists/:checklistId')
  async deleteChecklist(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser() user: any,
  ) {
    await this.taskFeaturesService.deleteChecklist(checklistId, user.id);
    return { success: true, message: 'Checklist supprimée' };
  }

  @Post('checklists/:checklistId/items')
  async addChecklistItem(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser() user: any,
    @Body('title') title: string,
  ) {
    const item = await this.taskFeaturesService.addChecklistItem(checklistId, user.id, title);
    return { success: true, data: item, message: 'Élément ajouté' };
  }

  @Patch('checklist-items/:itemId/toggle')
  async toggleChecklistItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: any,
  ) {
    const item = await this.taskFeaturesService.toggleChecklistItem(itemId, user.id);
    return { success: true, data: item };
  }

  @Delete('checklist-items/:itemId')
  async deleteChecklistItem(@Param('itemId', ParseIntPipe) itemId: number) {
    await this.taskFeaturesService.deleteChecklistItem(itemId);
    return { success: true, message: 'Élément supprimé' };
  }

  // ============================================
  // SOUS-TÂCHES
  // ============================================

  @Get(':taskId/subtasks')
  async getSubtasks(@Param('taskId', ParseIntPipe) taskId: number) {
    const subtasks = await this.taskFeaturesService.getSubtasks(taskId);
    return { success: true, data: subtasks };
  }

  @Post(':taskId/subtasks')
  async createSubtask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() user: any,
    @Body() data: { title: string; description?: string; priority?: string; assignee_ids?: number[] },
  ) {
    const subtask = await this.taskFeaturesService.createSubtask(taskId, user.id, data);
    return { success: true, data: subtask, message: 'Sous-tâche créée' };
  }

  @Patch('subtasks/:subtaskId')
  async updateSubtask(
    @Param('subtaskId', ParseIntPipe) subtaskId: number,
    @CurrentUser() user: any,
    @Body() data: { 
      title?: string; 
      description?: string; 
      priority?: string; 
      status?: string;
      assignee_ids?: number[];
    },
  ) {
    const subtask = await this.taskFeaturesService.updateSubtask(subtaskId, user.id, data);
    return { success: true, data: subtask, message: 'Sous-tâche mise à jour' };
  }

  @Delete('subtasks/:subtaskId')
  async deleteSubtask(
    @Param('subtaskId', ParseIntPipe) subtaskId: number,
    @CurrentUser() user: any,
  ) {
    await this.taskFeaturesService.deleteSubtask(subtaskId, user.id);
    return { success: true, message: 'Sous-tâche supprimée' };
  }

  // ============================================
  // HISTORIQUE D'ACTIVITÉ
  // ============================================

  @Get(':taskId/activities')
  async getActivities(@Param('taskId', ParseIntPipe) taskId: number) {
    const activities = await this.taskFeaturesService.getActivities(taskId);
    return { success: true, data: activities };
  }

  // ============================================
  // VUE LISTE
  // ============================================

  @Get('project/:projectId/list')
  async getTasksList(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tasks = await this.taskFeaturesService.getTasksList(projectId, {
      status,
      priority,
      assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      search,
      startDate,
      endDate,
    });
    return { success: true, data: tasks };
  }

  // ============================================
  // VUE CALENDRIER
  // ============================================

  @Get('project/:projectId/calendar')
  async getTasksCalendar(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    const tasks = await this.taskFeaturesService.getTasksCalendar(projectId, year, month);
    return { success: true, data: tasks };
  }

  @Get('project/:projectId/calendar/range')
  async getTasksForDateRange(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const tasks = await this.taskFeaturesService.getTasksForDateRange(projectId, startDate, endDate);
    return { success: true, data: tasks };
  }

  // ============================================
  // TABLEAU DE BORD - PROGRESSION PAR MEMBRE
  // ============================================

  @Get('project/:projectId/members-progress')
  async getMembersProgress(@Param('projectId', ParseIntPipe) projectId: number) {
    const progress = await this.taskFeaturesService.getMembersProgress(projectId);
    return { success: true, data: progress };
  }

  @Get('project/:projectId/activity-log')
  async getProjectActivityLog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('limit') limit?: string,
  ) {
    const activities = await this.taskFeaturesService.getProjectActivityLog(
      projectId,
      limit ? parseInt(limit) : 50,
    );
    return { success: true, data: activities };
  }

  // ============================================
  // MES TÂCHES - Pour l'utilisateur connecté
  // ============================================

  @Get('my-tasks')
  async getMyTasks(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const tasks = await this.taskFeaturesService.getUserTasks(user.id, { status, priority });
    return { success: true, data: tasks };
  }

  @Get('my-tasks/stats')
  async getMyTasksStats(@CurrentUser() user: any) {
    const stats = await this.taskFeaturesService.getUserTasksStats(user.id);
    return { success: true, data: stats };
  }

  @Patch('my-tasks/:taskId/status')
  async updateMyTaskStatus(
    @CurrentUser() user: any,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body('status') status: string,
  ) {
    const task = await this.taskFeaturesService.updateUserTaskStatus(user.id, taskId, status);
    return { success: true, data: task, message: 'Statut mis à jour' };
  }
}

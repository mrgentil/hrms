import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { TasksService } from './tasks.service';
import { TaskExportService } from './task-export.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  CreateColumnDto,
  UpdateColumnDto,
} from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskExportService: TaskExportService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(user.id, createTaskDto);
    return {
      success: true,
      data: task,
      message: 'Tâche créée avec succès',
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('project_id', ParseIntPipe) projectId: number,
  ) {
    const tasks = await this.tasksService.findAll(projectId, user.id);
    return {
      success: true,
      data: tasks,
    };
  }

  @Get('board/:projectId')
  async getBoard(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: any,
  ) {
    const board = await this.tasksService.getBoard(projectId, user.id);
    return {
      success: true,
      data: board,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const task = await this.tasksService.findOne(id, user.id);
    return {
      success: true,
      data: task,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(id, user.id, updateTaskDto);
    return {
      success: true,
      data: task,
      message: 'Tâche mise à jour avec succès',
    };
  }

  @Patch(':id/move')
  async moveTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) moveTaskDto: MoveTaskDto,
  ) {
    const task = await this.tasksService.moveTask(id, user.id, moveTaskDto);
    return {
      success: true,
      data: task,
      message: 'Tâche déplacée avec succès',
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.tasksService.remove(id, user.id);
    return {
      success: true,
      ...result,
    };
  }

  // Endpoints pour les colonnes
  @Post('columns')
  async createColumn(
    @CurrentUser() user: any,
    @Body(ValidationPipe) createColumnDto: CreateColumnDto,
  ) {
    const column = await this.tasksService.createColumn(user.id, createColumnDto);
    return {
      success: true,
      data: column,
      message: 'Colonne créée avec succès',
    };
  }

  @Patch('columns/:id')
  async updateColumn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) updateColumnDto: UpdateColumnDto,
  ) {
    const column = await this.tasksService.updateColumn(id, user.id, updateColumnDto);
    return {
      success: true,
      data: column,
      message: 'Colonne mise à jour avec succès',
    };
  }

  @Delete('columns/:id')
  async deleteColumn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.tasksService.deleteColumn(id, user.id);
    return {
      success: true,
      ...result,
    };
  }

  // ============================================
  // EXPORT
  // ============================================

  @Get('project/:projectId/export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportProjectToExcel(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Res() res: Response,
  ) {
    const buffer = await this.taskExportService.exportProjectTasksToExcel(projectId);
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=taches-projet-${projectId}-${new Date().toISOString().split('T')[0]}.xlsx`,
    );
    
    res.send(buffer);
  }
}

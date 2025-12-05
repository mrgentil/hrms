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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body(ValidationPipe) createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectsService.create(user.id, createProjectDto);
    return {
      success: true,
      data: project,
      message: 'Projet créé avec succès',
    };
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const projects = await this.projectsService.findAll(user.id);
    return {
      success: true,
      data: projects,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const project = await this.projectsService.findOne(id, user.id);
    return {
      success: true,
      data: project,
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.projectsService.getProjectStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.update(id, user.id, updateProjectDto);
    return {
      success: true,
      data: project,
      message: 'Projet mis à jour avec succès',
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.projectsService.remove(id, user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseIntPipe) projectId: number,
    @CurrentUser() user: any,
    @Body(ValidationPipe) addMemberDto: AddProjectMemberDto,
  ) {
    const member = await this.projectsService.addMember(projectId, user.id, addMemberDto);
    return {
      success: true,
      data: member,
      message: 'Membre ajouté avec succès',
    };
  }

  @Delete(':projectId/members/:memberId')
  async removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.projectsService.removeMember(projectId, memberId, user.id);
    return {
      success: true,
      ...result,
    };
  }
}

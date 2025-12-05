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
} from '@nestjs/common';
import { TagsService, TAG_COLORS } from './tags.service';
import { CreateTagDto, UpdateTagDto, AssignTagsDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  async create(@Body(ValidationPipe) createTagDto: CreateTagDto) {
    const tag = await this.tagsService.create(createTagDto);
    return {
      success: true,
      data: tag,
      message: 'Tag créé avec succès',
    };
  }

  @Get()
  async findAll() {
    const tags = await this.tagsService.findAll();
    return {
      success: true,
      data: tags,
    };
  }

  @Get('colors')
  getColors() {
    return {
      success: true,
      data: TAG_COLORS,
    };
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const tags = await this.tagsService.search(query || '');
    return {
      success: true,
      data: tags,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const tag = await this.tagsService.findOne(id);
    return {
      success: true,
      data: tag,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.tagsService.update(id, updateTagDto);
    return {
      success: true,
      data: tag,
      message: 'Tag mis à jour',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.tagsService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  // Project tags
  @Get('project/:projectId')
  async getProjectTags(@Param('projectId', ParseIntPipe) projectId: number) {
    const tags = await this.tagsService.getProjectTags(projectId);
    return {
      success: true,
      data: tags,
    };
  }

  @Post('project/:projectId')
  async setProjectTags(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body(ValidationPipe) dto: AssignTagsDto,
  ) {
    const tags = await this.tagsService.setProjectTags(projectId, dto);
    return {
      success: true,
      data: tags,
      message: 'Tags du projet mis à jour',
    };
  }

  @Post('project/:projectId/tag/:tagId')
  async addProjectTag(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    const tag = await this.tagsService.addProjectTag(projectId, tagId);
    return {
      success: true,
      data: tag,
    };
  }

  @Delete('project/:projectId/tag/:tagId')
  async removeProjectTag(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    const result = await this.tagsService.removeProjectTag(projectId, tagId);
    return {
      success: true,
      ...result,
    };
  }

  // Task tags
  @Get('task/:taskId')
  async getTaskTags(@Param('taskId', ParseIntPipe) taskId: number) {
    const tags = await this.tagsService.getTaskTags(taskId);
    return {
      success: true,
      data: tags,
    };
  }

  @Post('task/:taskId')
  async setTaskTags(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body(ValidationPipe) dto: AssignTagsDto,
  ) {
    const tags = await this.tagsService.setTaskTags(taskId, dto);
    return {
      success: true,
      data: tags,
      message: 'Tags de la tâche mis à jour',
    };
  }

  @Post('task/:taskId/tag/:tagId')
  async addTaskTag(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    const tag = await this.tagsService.addTaskTag(taskId, tagId);
    return {
      success: true,
      data: tag,
    };
  }

  @Delete('task/:taskId/tag/:tagId')
  async removeTaskTag(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    const result = await this.tagsService.removeTaskTag(taskId, tagId);
    return {
      success: true,
      ...result,
    };
  }

  // Find or create
  @Post('find-or-create')
  async findOrCreate(@Body() body: { name: string; color?: string }) {
    const tag = await this.tagsService.findOrCreate(body.name, body.color);
    return {
      success: true,
      data: tag,
    };
  }
}

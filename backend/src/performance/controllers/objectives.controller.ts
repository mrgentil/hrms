import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ObjectivesService } from '../services/objectives.service';
import {
  CreateObjectiveDto,
  UpdateObjectiveDto,
  UpdateProgressDto,
  LinkObjectiveToReviewDto,
  ObjectiveQueryDto,
  CreateKeyResultDto,
} from '../dto/objective.dto';

@Controller('performance/objectives')
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  @Post()
  async create(@Body() dto: CreateObjectiveDto, @Request() req: any) {
    const objective = await this.objectivesService.create(dto, req.user.id);
    return {
      success: true,
      data: objective,
      message: 'Objectif créé avec succès',
    };
  }

  @Get()
  async findAll(@Query() query: ObjectiveQueryDto) {
    const result = await this.objectivesService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('my')
  async findMy(@Request() req: any) {
    const objectives = await this.objectivesService.findMy(req.user.id);
    return {
      success: true,
      data: objectives,
    };
  }

  @Get('team')
  async findTeam(@Request() req: any) {
    const objectives = await this.objectivesService.findTeam(req.user.id);
    return {
      success: true,
      data: objectives,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const objective = await this.objectivesService.findOne(id);
    return {
      success: true,
      data: objective,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjectiveDto,
    @Request() req: any,
  ) {
    const objective = await this.objectivesService.update(id, dto, req.user.id);
    return {
      success: true,
      data: objective,
      message: 'Objectif mis à jour',
    };
  }

  @Patch(':id/progress')
  async updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressDto,
    @Request() req: any,
    @Query('as_manager') asManager?: string,
  ) {
    const isManager = asManager === 'true';
    const objective = await this.objectivesService.updateProgress(
      id,
      dto,
      req.user.id,
      isManager,
    );
    return {
      success: true,
      data: objective,
      message: 'Progression mise à jour',
    };
  }

  @Post(':id/link-review')
  async linkToReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkObjectiveToReviewDto,
    @Request() req: any,
  ) {
    const objective = await this.objectivesService.linkToReview(id, dto, req.user.id);
    return {
      success: true,
      data: objective,
      message: 'Objectif lié à la review',
    };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.objectivesService.delete(id, req.user.id);
    return {
      success: true,
      message: 'Objectif supprimé',
    };
  }

  @Post(':id/key-results')
  async addKeyResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateKeyResultDto,
  ) {
    const keyResult = await this.objectivesService.addKeyResult(id, dto);
    return {
      success: true,
      data: keyResult,
      message: 'Key Result ajouté',
    };
  }

  @Patch(':objectiveId/key-results/:krId')
  async updateKeyResult(
    @Param('objectiveId', ParseIntPipe) objectiveId: number,
    @Param('krId', ParseIntPipe) krId: number,
    @Body() dto: any,
  ) {
    const keyResult = await this.objectivesService.updateKeyResult(krId, dto);
    return {
      success: true,
      data: keyResult,
      message: 'Key Result mis à jour',
    };
  }

  @Delete(':objectiveId/key-results/:krId')
  async deleteKeyResult(
    @Param('objectiveId', ParseIntPipe) objectiveId: number,
    @Param('krId', ParseIntPipe) krId: number,
  ) {
    await this.objectivesService.deleteKeyResult(krId);
    return {
      success: true,
      message: 'Key Result supprimé',
    };
  }
}

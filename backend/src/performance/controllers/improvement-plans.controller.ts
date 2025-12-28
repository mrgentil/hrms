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
import { ImprovementPlansService } from '../services/improvement-plans.service';
import {
  CreateImprovementPlanDto,
  UpdateImprovementPlanDto,
  AddActionDto,
  UpdateActionDto,
  ImprovementPlanQueryDto,
} from '../dto/improvement-plan.dto';

@Controller('performance/improvement-plans')
export class ImprovementPlansController {
  constructor(private readonly plansService: ImprovementPlansService) {}

  @Post()
  async create(@Body() dto: CreateImprovementPlanDto, @Request() req: any) {
    const plan = await this.plansService.create(dto, req.user.id);
    return {
      success: true,
      data: plan,
      message: 'Plan d\'amélioration créé',
    };
  }

  @Get()
  async findAll(@Query() query: ImprovementPlanQueryDto) {
    const result = await this.plansService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('my')
  async findMy(@Request() req: any) {
    const plans = await this.plansService.findMy(req.user.id);
    return {
      success: true,
      data: plans,
    };
  }

  @Get('team')
  async findTeam(@Request() req: any) {
    const plans = await this.plansService.findTeam(req.user.id);
    return {
      success: true,
      data: plans,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const plan = await this.plansService.findOne(id);
    return {
      success: true,
      data: plan,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImprovementPlanDto,
    @Request() req: any,
  ) {
    const plan = await this.plansService.update(id, dto, req.user.id);
    return {
      success: true,
      data: plan,
      message: 'Plan mis à jour',
    };
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const plan = await this.plansService.activate(id, req.user.id);
    return {
      success: true,
      data: plan,
      message: 'Plan activé',
    };
  }

  @Post(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const plan = await this.plansService.complete(id, req.user.id);
    return {
      success: true,
      data: plan,
      message: 'Plan complété',
    };
  }

  @Get(':id/progress')
  async getProgress(@Param('id', ParseIntPipe) id: number) {
    const progress = await this.plansService.getProgress(id);
    return {
      success: true,
      data: progress,
    };
  }

  @Post(':id/actions')
  async addAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddActionDto,
    @Request() req: any,
  ) {
    const action = await this.plansService.addAction(id, dto, req.user.id);
    return {
      success: true,
      data: action,
      message: 'Action ajoutée',
    };
  }

  @Patch(':planId/actions/:actionId')
  async updateAction(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('actionId', ParseIntPipe) actionId: number,
    @Body() dto: UpdateActionDto,
    @Request() req: any,
    @Query('as_manager') asManager?: string,
  ) {
    const isManager = asManager === 'true';
    const action = await this.plansService.updateAction(
      planId,
      actionId,
      dto,
      req.user.id,
      isManager,
    );
    return {
      success: true,
      data: action,
      message: 'Action mise à jour',
    };
  }

  @Delete(':planId/actions/:actionId')
  async deleteAction(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('actionId', ParseIntPipe) actionId: number,
    @Request() req: any,
  ) {
    await this.plansService.deleteAction(planId, actionId, req.user.id);
    return {
      success: true,
      message: 'Action supprimée',
    };
  }
}

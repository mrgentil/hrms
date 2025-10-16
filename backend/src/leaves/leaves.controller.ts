import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_CREATE)
  async create(
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) createLeaveDto: CreateLeaveDto,
  ) {
    const leave = await this.leavesService.create(currentUser.id, createLeaveDto);
    return {
      success: true,
      data: leave,
      message: 'Demande de congé créée avec succès',
    };
  }

  @Get('my')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN)
  async findMy(@CurrentUser() currentUser: any) {
    const leaves = await this.leavesService.findMy(currentUser.id);
    return {
      success: true,
      data: leaves,
    };
  }

  @Get('balance')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN)
  async getMyBalances(@CurrentUser() currentUser: any) {
    const balances = await this.leavesService.getMyBalances(currentUser.id);
    return {
      success: true,
      data: balances,
    };
  }

  @Get('approvers')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN)
  async getPotentialApprovers(@CurrentUser() currentUser: any) {
    const approvers = await this.leavesService.getApprovers(currentUser.id);
    return {
      success: true,
      data: approvers,
    };
  }

  @Get('team')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_TEAM)
  async findTeamLeaves(@CurrentUser() currentUser: any) {
    const leaves = await this.leavesService.findTeamLeaves(currentUser.id);
    return {
      success: true,
      data: leaves,
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async findAllLeaves() {
    const leaves = await this.leavesService.findAllLeaves();
    return {
      success: true,
      data: leaves,
    };
  }

  @Patch(':id/status')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_APPROVE)
  async updateStatus(
    @Param('id', ParseIntPipe) leaveId: number,
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) updateLeaveStatusDto: UpdateLeaveStatusDto,
  ) {
    const updated = await this.leavesService.updateStatus(
      leaveId,
      currentUser.id,
      updateLeaveStatusDto,
    );
    return {
      success: true,
      data: updated,
      message: 'Statut de la demande mis à jour.',
    };
  }

  @Get('types')
  async getLeaveTypes() {
    const leaveTypes = await this.leavesService.getLeaveTypes();
    return {
      success: true,
      data: leaveTypes,
    };
  }

  @Get('application-types')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN)
  async getApplicationTypes() {
    const applicationTypes = this.leavesService.getApplicationTypeOptions();
    return {
      success: true,
      data: applicationTypes,
    };
  }
}

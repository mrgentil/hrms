import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { UpdateOwnLeaveDto } from './dto/update-own-leave.dto';
import { CancelOwnLeaveDto } from './dto/cancel-own-leave.dto';
import { CreateLeaveMessageDto } from './dto/create-leave-message.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { application_status } from '@prisma/client';

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

  @Get('my/updates')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_OWN)
  async findMyUpdates(@CurrentUser() currentUser: any) {
    const updates = await this.leavesService.findMyUpdates(currentUser.id);
    return {
      success: true,
      data: updates,
    };
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) leaveId: number,
    @CurrentUser() currentUser: any,
  ) {
    const messages = await this.leavesService.getLeaveMessages(leaveId, currentUser.id);
    return {
      success: true,
      data: messages,
    };
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id', ParseIntPipe) leaveId: number,
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) createLeaveMessageDto: CreateLeaveMessageDto,
  ) {
    const message = await this.leavesService.createLeaveMessage(
      leaveId,
      currentUser.id,
      createLeaveMessageDto.message,
    );
    return {
      success: true,
      data: message,
      message: 'Message ajoute avec succes.',
    };
  }

  @Patch('my/:id')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_CREATE)
  async updateMyLeave(
    @Param('id', ParseIntPipe) leaveId: number,
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) updateOwnLeaveDto: UpdateOwnLeaveDto,
  ) {
    const updated = await this.leavesService.updateOwnLeave(
      currentUser.id,
      leaveId,
      updateOwnLeaveDto,
    );
    return {
      success: true,
      data: updated,
      message: 'Demande de congé mise à jour avec succès.',
    };
  }

  @Patch('my/:id/cancel')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_CREATE)
  async cancelMyLeave(
    @Param('id', ParseIntPipe) leaveId: number,
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) cancelOwnLeaveDto: CancelOwnLeaveDto,
  ) {
    const updated = await this.leavesService.cancelOwnLeave(
      currentUser.id,
      leaveId,
      cancelOwnLeaveDto,
    );
    return {
      success: true,
      data: updated,
      message: 'Demande de congé annulée.',
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

  @Get('balances/all')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_VIEW_ALL)
  async getAllBalances(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const balances = await this.leavesService.getAllBalances(yearNum);
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

  @Get('assigned')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_APPROVE)
  async findAssignedLeaves(
    @CurrentUser() currentUser: any,
    @Query('status') status?: string,
  ) {
    const normalizedStatus = this.normalizeStatus(status);
    const leaves = await this.leavesService.findAssignedLeaves(
      currentUser.id,
      normalizedStatus,
    );

    return {
      success: true,
      data: leaves,
    };
  }

  @Get('assigned/pending-count')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_APPROVE)
  async getPendingAssignedCount(@CurrentUser() currentUser: any) {
    const pending = await this.leavesService.countPendingApprovals(currentUser.id);
    return {
      success: true,
      data: {
        pending,
      },
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

  @Post('types')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES)
  async createLeaveType(@Body(ValidationPipe) createLeaveTypeDto: CreateLeaveTypeDto) {
    const created = await this.leavesService.createLeaveType(createLeaveTypeDto);
    return {
      success: true,
      data: created,
      message: 'Type de congé créé.',
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

  @Patch('types/:id')
  @RequirePermissions(SYSTEM_PERMISSIONS.LEAVES_MANAGE_TYPES)
  async updateLeaveType(
    @Param('id', ParseIntPipe) leaveTypeId: number,
    @Body(ValidationPipe) updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    const updated = await this.leavesService.updateLeaveType(leaveTypeId, updateLeaveTypeDto);
    return {
      success: true,
      data: updated,
      message: 'Type de congé mis à jour.',
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

  private normalizeStatus(
    status?: string,
  ): application_status | 'all' | undefined {
    if (!status) {
      return undefined;
    }

    const trimmed = status.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    if (trimmed.toLowerCase() === 'all') {
      return 'all';
    }

    const match = Object.values(application_status).find(
      (value) => value.toLowerCase() === trimmed.toLowerCase(),
    );

    if (!match) {
      throw new BadRequestException('Statut de conge invalide.');
    }

    return match;
  }
}

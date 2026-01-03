import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) { }

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.POSITIONS_CREATE)
  async create(
    @CurrentUser() currentUser: User,
    @Body(ValidationPipe) createPositionDto: CreatePositionDto,
  ) {
    const position = await this.positionsService.create(currentUser.company_id, createPositionDto);
    return {
      success: true,
      data: position,
      message: 'Poste créé avec succès',
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.POSITIONS_VIEW)
  async findAll(
    @CurrentUser() currentUser: User,
    @Query(ValidationPipe) query: QueryPositionDto,
  ) {
    const result = await this.positionsService.findAll(currentUser.company_id, query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.POSITIONS_VIEW)
  async findOne(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const position = await this.positionsService.findOne(currentUser.company_id, id);
    return {
      success: true,
      data: position,
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.POSITIONS_EDIT)
  async update(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePositionDto: UpdatePositionDto,
  ) {
    const position = await this.positionsService.update(currentUser.company_id, id, updatePositionDto);
    return {
      success: true,
      data: position,
      message: 'Poste mis à jour avec succès',
    };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.POSITIONS_DELETE)
  async remove(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.positionsService.remove(currentUser.company_id, id);
    return {
      success: true,
      ...result,
    };
  }
}

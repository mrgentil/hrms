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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.DEPARTMENTS_CREATE)
  async create(
    @CurrentUser() user: User,
    @Body(ValidationPipe) createDepartmentDto: CreateDepartmentDto,
  ) {
    const department = await this.departmentsService.create(user.company_id, createDepartmentDto);
    return {
      success: true,
      data: department,
      message: 'Département créé avec succès',
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW)
  async findAll(
    @CurrentUser() user: User,
    @Query(ValidationPipe) query: QueryDepartmentDto,
  ) {
    const result = await this.departmentsService.findAll(user.company_id, query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.DEPARTMENTS_VIEW)
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const department = await this.departmentsService.findOne(user.company_id, id);
    return {
      success: true,
      data: department,
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.DEPARTMENTS_EDIT)
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(user.company_id, id, updateDepartmentDto);
    return {
      success: true,
      data: department,
      message: 'Département mis à jour avec succès',
    };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.DEPARTMENTS_DELETE)
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response = await this.departmentsService.remove(user.company_id, id);
    return {
      success: true,
      ...response,
    };
  }
}

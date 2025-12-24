import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) { }

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_CREATE)
  create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.create(createContractDto, user.id);
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  findAll(
    @Query('user_id') userId?: string,
    @Query('status') status?: string,
    @Query('contract_type') contractType?: string,
    @Query('expiring_soon') expiringSoon?: string,
    @CurrentUser() user?: any,
  ) {
    return this.contractsService.findAll(
      {
        user_id: userId ? parseInt(userId) : undefined,
        status: status as any,
        contract_type: contractType,
        expiring_soon: expiringSoon === 'true',
      },
      user,
    );
  }

  @Get('stats')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  getStats() {
    return this.contractsService.getStats();
  }

  @Get('expiring')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  getExpiring() {
    return this.contractsService.findAll({ expiring_soon: true });
  }

  @Get('user/:userId')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.contractsService.findByUser(userId);
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Patch(':id/terminate')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  terminate(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ) {
    return this.contractsService.terminate(id, notes);
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.remove(id);
  }
}

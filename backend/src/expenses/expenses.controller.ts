import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, UpdateExpenseStatusDto, MarkAsPaidDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { expense_report_status } from '@prisma/client';

type UploadedFileType = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
};

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  // ==========================================
  // ENDPOINTS EMPLOYÉ (self-service)
  // ==========================================

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CreateExpenseDto,
  ) {
    const expense = await this.expensesService.create(user.id, dto);
    return {
      success: true,
      data: expense,
      message: 'Note de frais créée avec succès',
    };
  }

  @Post('upload-receipt')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/receipts';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `receipt-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpg|jpeg|png|pdf/;
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mimeType = /image\/(jpeg|png)|application\/pdf/.test(file.mimetype);
        if (extName && mimeType) {
          cb(null, true);
        } else {
          cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou PDF.'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadReceipt(@UploadedFile() file: UploadedFileType) {
    if (!file) {
      return { success: false, message: 'Aucun fichier fourni' };
    }
    return {
      success: true,
      data: {
        url: `/uploads/receipts/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
      },
      message: 'Justificatif uploadé avec succès',
    };
  }

  @Get('my')
  async findMy(
    @CurrentUser() user: any,
    @Query('status') status?: expense_report_status,
  ) {
    const expenses = await this.expensesService.findMy(user.id, status);
    return { success: true, data: expenses };
  }

  @Get('my/stats')
  async getMyStats(@CurrentUser() user: any) {
    const stats = await this.expensesService.getStats(user.id);
    return { success: true, data: stats };
  }

  @Get('my/:id')
  async findMyOne(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const expense = await this.expensesService.findOne(id, user.id);
    return { success: true, data: expense };
  }

  @Patch('my/:id')
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.update(id, user.id, dto);
    return {
      success: true,
      data: expense,
      message: 'Note de frais mise à jour',
    };
  }

  @Post('my/:id/submit')
  async submit(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const expense = await this.expensesService.submit(id, user.id);
    return {
      success: true,
      data: expense,
      message: 'Note de frais soumise pour approbation',
    };
  }

  @Post('my/:id/cancel')
  async cancel(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const expense = await this.expensesService.cancel(id, user.id);
    return {
      success: true,
      data: expense,
      message: 'Note de frais annulée',
    };
  }

  @Delete('my/:id')
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.expensesService.remove(id, user.id);
    return { success: true, ...result };
  }

  // ==========================================
  // ENDPOINTS ADMIN / RH
  // ==========================================

  @Get('pending')
  @RequirePermissions(SYSTEM_PERMISSIONS.EXPENSES_APPROVE)
  async findPending(@CurrentUser() user: any) {
    const expenses = await this.expensesService.findPending(user);
    return { success: true, data: expenses };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findAll(
    @Query('status') status?: expense_report_status,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const expenses = await this.expensesService.findAll({
      status,
      userId: userId ? parseInt(userId) : undefined,
      startDate,
      endDate,
    }, user);
    return { success: true, data: expenses };
  }

  @Get('stats')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getStats(@CurrentUser() user: any) {
    const stats = await this.expensesService.getStats(undefined, user);
    return { success: true, data: stats };
  }

  @Get('stats/monthly')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getMonthlyStats(@CurrentUser() user: any) {
    const stats = await this.expensesService.getMonthlyStats(user);
    return { success: true, data: stats };
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const expense = await this.expensesService.findOne(id);
    return { success: true, data: expense };
  }

  @Patch(':id/status')
  @RequirePermissions(SYSTEM_PERMISSIONS.EXPENSES_APPROVE)
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateExpenseStatusDto,
  ) {
    const expense = await this.expensesService.updateStatus(id, user.id, dto);
    return {
      success: true,
      data: expense,
      message: dto.status === 'APPROVED' ? 'Note approuvée' : 'Note rejetée',
    };
  }

  @Patch(':id/paid')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  async markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: MarkAsPaidDto,
  ) {
    const expense = await this.expensesService.markAsPaid(id, dto);
    return {
      success: true,
      data: expense,
      message: 'Note marquée comme payée',
    };
  }

  // Catégories disponibles
  @Get('categories/list')
  getCategories() {
    return {
      success: true,
      data: [
        { value: 'TRANSPORT', label: 'Transport', icon: '🚗' },
        { value: 'MEALS', label: 'Repas', icon: '🍽️' },
        { value: 'ACCOMMODATION', label: 'Hébergement', icon: '🏨' },
        { value: 'OFFICE_SUPPLIES', label: 'Fournitures', icon: '📎' },
        { value: 'EQUIPMENT', label: 'Équipement', icon: '💻' },
        { value: 'TRAINING', label: 'Formation', icon: '📚' },
        { value: 'TRAVEL', label: 'Voyage', icon: '✈️' },
        { value: 'CLIENT_ENTERTAINMENT', label: 'Clients', icon: '🤝' },
        { value: 'COMMUNICATION', label: 'Communication', icon: '📱' },
        { value: 'OTHER', label: 'Autre', icon: '📦' },
      ],
    };
  }
}

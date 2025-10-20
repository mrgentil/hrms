import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
};

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_CREATE)
  async create(
    @Body(ValidationPipe) createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() currentUser: any,
  ) {
    const employee = await this.employeesService.create(createEmployeeDto);
    return {
      success: true,
      data: employee,
      message: 'Employé créé avec succès',
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('department_id') department_id?: number,
  ) {
    const result = await this.employeesService.findAll(
      +page,
      +limit,
      search,
      department_id ? +department_id : undefined,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.employeesService.getStats();
    return {
      success: true,
      data: stats,
      message: 'Statistiques récupérées avec succès',
    };
  }

  @Get('search')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async search(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: 'La requête de recherche doit contenir au moins 2 caractères',
        data: [],
      };
    }

    const employees = await this.employeesService.search(query.trim());
    return {
      success: true,
      data: employees,
      message: `${employees.length} employé(s) trouvé(s)`,
    };
  }

  @Get('organization-chart')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async getOrganizationChart() {
    const chart = await this.employeesService.getOrganizationChart();
    return {
      success: true,
      data: chart,
      message: 'Organigramme récupéré avec succès',
    };
  }

  @Get('my-profile')
  async getMyProfile(@CurrentUser() currentUser: any) {
    const profile = await this.employeesService.getMyProfile(currentUser.id);
    return {
      success: true,
      data: profile,
      message: 'Profil recupere avec succes',
    };
  }

  @Patch('my-profile')
  @RequirePermissions(SYSTEM_PERMISSIONS.PROFILE_EDIT_OWN)
  @UseInterceptors(
    FileInterceptor('profile_photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/profile-photos';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpg|jpeg|png|gif/;
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype.toLowerCase());
        if (extName && mimeType) {
          cb(null, true);
        } else {
          cb(new Error('Type de fichier non supporte'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async updateMyProfile(
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) updateOwnProfileDto: UpdateOwnProfileDto,
    @UploadedFile() profilePhoto: UploadedFile | undefined,
  ) {
    const profile = await this.employeesService.updateOwnProfile(
      currentUser.id,
      updateOwnProfileDto,
      profilePhoto ? profilePhoto.path : undefined,
    );
    return {
      success: true,
      data: profile,
      message: 'Profil mis a jour avec succes',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const employee = await this.employeesService.findOne(id);
    return {
      success: true,
      data: employee,
      message: 'Employé récupéré avec succès',
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employee = await this.employeesService.update(id, updateEmployeeDto);
    return {
      success: true,
      data: employee,
      message: 'Employé mis à jour avec succès',
    };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_DELETE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.employeesService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  // Gestion des contrats
  @Post(':id/contracts')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  async createContract(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) createContractDto: CreateContractDto,
  ) {
    const contract = await this.employeesService.createContract(id, createContractDto);
    return {
      success: true,
      data: contract,
      message: 'Contrat créé avec succès',
    };
  }

  @Get(':id/contracts')
  async getContracts(@Param('id', ParseIntPipe) id: number) {
    const contracts = await this.employeesService.getContracts(id);
    return {
      success: true,
      data: contracts,
      message: 'Contrats récupérés avec succès',
    };
  }

  @Patch('contracts/:contractId')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  async updateContract(
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body(ValidationPipe) updateData: Partial<CreateContractDto>,
  ) {
    const contract = await this.employeesService.updateContract(contractId, updateData);
    return {
      success: true,
      data: contract,
      message: 'Contrat mis à jour avec succès',
    };
  }

  @Delete('contracts/:contractId')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_DELETE)
  async deleteContract(@Param('contractId', ParseIntPipe) contractId: number) {
    const result = await this.employeesService.deleteContract(contractId);
    return {
      success: true,
      ...result,
    };
  }

  // Gestion des documents
  @Post(':id/documents')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        
        if (mimeType && extName) {
          return cb(null, true);
        } else {
          cb(new Error('Type de fichier non autorisé'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async createDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: UploadedFile | undefined,
    @CurrentUser() currentUser: any,
  ) {
    if (file) {
      createDocumentDto.file_path = file.path;
    }

    const document = await this.employeesService.createDocument(
      id,
      currentUser.id,
      createDocumentDto,
    );
    return {
      success: true,
      data: document,
      message: 'Document créé avec succès',
    };
  }

  @Get(':id/documents')
  async getDocuments(@Param('id', ParseIntPipe) id: number) {
    const documents = await this.employeesService.getDocuments(id);
    return {
      success: true,
      data: documents,
      message: 'Documents récupérés avec succès',
    };
  }

  @Get('my-documents')
  async getMyDocuments(@CurrentUser() currentUser: any) {
    const documents = await this.employeesService.getMyDocuments(currentUser.id);
    return {
      success: true,
      data: documents,
      message: 'Documents rǸcupǸrǸs avec succ��s',
    };
  }

  @Delete('documents/:documentId')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_DELETE)
  async deleteDocument(@Param('documentId', ParseIntPipe) documentId: number) {
    const result = await this.employeesService.deleteDocument(documentId);
    return {
      success: true,
      ...result,
    };
  }
}

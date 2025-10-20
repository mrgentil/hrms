import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SYSTEM_PERMISSIONS } from '../roles/roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type UploadedFileType = {
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

const documentUploadOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/documents';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `document-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    req: unknown,
    file: UploadedFileType,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
    const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype.toLowerCase());

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorise'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  async create(
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: UploadedFileType | undefined,
  ) {
    if (file) {
      createDocumentDto.file_path = file.path.replace(/\\/g, '/');
    }

    const document = await this.documentService.create(currentUser.id, createDocumentDto);
    return {
      success: true,
      data: document,
      message: 'Document cree avec succes',
    };
  }

  @Get()
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findAll() {
    const documents = await this.documentService.findAll();
    return {
      success: true,
      data: documents,
      message: 'Documents recuperes avec succes',
    };
  }

  @Get('user/:userId')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    const documents = await this.documentService.findByUser(userId);
    return {
      success: true,
      data: documents,
      message: 'Documents recuperes avec succes',
    };
  }

  @Get(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_VIEW)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const document = await this.documentService.findOne(id);
    return {
      success: true,
      data: document,
      message: 'Document recupere avec succes',
    };
  }

  @Patch(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_EDIT)
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDocumentDto: UpdateDocumentDto,
    @UploadedFile() file: UploadedFileType | undefined,
  ) {
    if (file) {
      updateDocumentDto.file_path = file.path.replace(/\\/g, '/');
    }

    const document = await this.documentService.update(id, updateDocumentDto);
    return {
      success: true,
      data: document,
      message: 'Document mis a jour avec succes',
    };
  }

  @Delete(':id')
  @RequirePermissions(SYSTEM_PERMISSIONS.USERS_DELETE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.documentService.remove(id);
    return {
      success: true,
      ...result,
    };
  }
}

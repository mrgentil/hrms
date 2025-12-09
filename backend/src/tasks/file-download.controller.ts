import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileDownloadController {
  @Get('tasks/:filename')
  async downloadTaskFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads/tasks', filename);
    
    return res.download(filePath, (err) => {
      if (err) {
        res.status(404).json({ 
          success: false, 
          message: 'Fichier non trouvé' 
        });
      }
    });
  }

  @Get('tasks/attachments/:filename')
  async downloadTaskAttachment(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads/tasks/attachments', filename);
    
    return res.download(filePath, (err) => {
      if (err) {
        res.status(404).json({ 
          success: false, 
          message: 'Fichier non trouvé' 
        });
      }
    });
  }
}

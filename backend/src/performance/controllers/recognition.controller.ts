import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { RecognitionService } from '../services/recognition.service';
import { CreateRecognitionDto, RecognitionQueryDto } from '../dto/recognition.dto';

@Controller('performance/recognitions')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) { }

  @Post()
  async create(@Body() dto: CreateRecognitionDto, @Request() req: any) {
    const recognition = await this.recognitionService.create(dto, req.user.id);
    return {
      success: true,
      data: recognition,
      message: 'Reconnaissance envoyée!',
    };
  }

  @Get()
  async findAll(@Query() query: RecognitionQueryDto) {
    const result = await this.recognitionService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('feed')
  async getPublicFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.recognitionService.findPublicFeed(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('my')
  async findMy(@Request() req: any) {
    const result = await this.recognitionService.findMy(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('limit') limit?: string,
  ) {
    const result = await this.recognitionService.getLeaderboard(
      period || 'month',
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('badges')
  async getBadges() {
    const badges = await this.recognitionService.getBadgesList();
    return {
      success: true,
      data: badges,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const recognition = await this.recognitionService.findOne(id);
    return {
      success: true,
      data: recognition,
    };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.recognitionService.delete(id, req.user.id);
    return {
      success: true,
      message: 'Reconnaissance supprimée',
    };
  }
}

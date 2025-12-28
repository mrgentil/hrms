import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { CampaignsService } from '../services/campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
} from '../dto/campaign.dto';

@Controller('performance/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  async create(@Body() dto: CreateCampaignDto, @Request() req: any) {
    const campaign = await this.campaignsService.create(dto, req.user.id);
    return {
      success: true,
      data: campaign,
      message: 'Campagne créée avec succès',
    };
  }

  @Get()
  async findAll(@Query() query: CampaignQueryDto) {
    const result = await this.campaignsService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const campaign = await this.campaignsService.findOne(id);
    return {
      success: true,
      data: campaign,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    const campaign = await this.campaignsService.update(id, dto);
    return {
      success: true,
      data: campaign,
      message: 'Campagne mise à jour',
    };
  }

  @Post(':id/launch')
  async launch(@Param('id', ParseIntPipe) id: number) {
    const campaign = await this.campaignsService.launch(id);
    return {
      success: true,
      data: campaign,
      message: 'Campagne lancée',
    };
  }

  @Post(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    const campaign = await this.campaignsService.close(id);
    return {
      success: true,
      data: campaign,
      message: 'Campagne clôturée',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.campaignsService.remove(id);
    return {
      success: true,
      message: 'Campagne supprimée avec succès',
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.campaignsService.getStats(id);
    return {
      success: true,
      data: stats,
    };
  }
}

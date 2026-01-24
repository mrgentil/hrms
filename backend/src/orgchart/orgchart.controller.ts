import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrgchartService, OrgChartNode } from './orgchart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orgchart')
@UseGuards(JwtAuthGuard)
export class OrgchartController {
  constructor(private readonly orgchartService: OrgchartService) { }

  @Get()
  async getOrgChart(@CurrentUser() currentUser: any): Promise<{ success: boolean; data: OrgChartNode[] }> {
    const data = await this.orgchartService.getOrgChartOptimized(currentUser);
    return {
      success: true,
      data,
    };
  }
}

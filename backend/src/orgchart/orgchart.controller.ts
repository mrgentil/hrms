import { Controller, Get } from '@nestjs/common';
import { OrgchartService, OrgChartNode } from './orgchart.service';

@Controller('orgchart')
export class OrgchartController {
  constructor(private readonly orgchartService: OrgchartService) {}

  @Get()
  async getOrgChart(): Promise<{ success: boolean; data: OrgChartNode[] }> {
    const data = await this.orgchartService.getOrgChartOptimized();
    return {
      success: true,
      data,
    };
  }
}

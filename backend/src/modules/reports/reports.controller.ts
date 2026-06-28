import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportReason } from '../../database/entities/report.entity';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @CurrentUser('sub') userId: string,
    @Body('reportedUserId') reportedUserId: string,
    @Body('reason') reason: ReportReason,
    @Body('description') description?: string,
    @Body('messageId') messageId?: string,
    @Body('evidenceUrls') evidenceUrls?: string,
  ) {
    return this.reportsService.createReport(
      userId, reportedUserId, reason, description, messageId, evidenceUrls,
    );
  }

  @Get()
  async getMyReports(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getMyReports(userId, page, limit);
  }

  @Get(':id')
  async getReportStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.reportsService.getReportStatus(reportId, userId);
  }
}

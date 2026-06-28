import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportReason, ReportStatus } from '../../database/entities/report.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReport(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string,
    messageId?: string,
    evidenceUrls?: string,
  ): Promise<Report> {
    const reportedUser = await this.userRepository.findOne({ where: { id: reportedUserId } });
    if (!reportedUser) throw new NotFoundException('Reported user not found');

    const report = this.reportRepository.create({
      reporterId,
      reportedUserId,
      reason,
      description,
      messageId,
      evidenceUrls,
      status: ReportStatus.PENDING,
    });

    return this.reportRepository.save(report);
  }

  async getMyReports(userId: string, page = 1, limit = 20) {
    const [reports, total] = await this.reportRepository.findAndCount({
      where: { reporterId: userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: reports,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getReportStatus(reportId: string, userId: string): Promise<any> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, reporterId: userId },
    });
    if (!report) throw new NotFoundException('Report not found');

    return {
      id: report.id,
      status: report.status,
      reason: report.reason,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      resolutionNotes: report.resolutionNotes,
    };
  }
}

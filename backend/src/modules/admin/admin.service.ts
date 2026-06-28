import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Match } from '../../database/entities/match.entity';
import { Report, ReportStatus } from '../../database/entities/report.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Message } from '../../database/entities/message.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getDashboardStats(): Promise<any> {
    const [
      totalUsers, verifiedUsers, totalMatches, totalReports,
      activeSubscriptions, messagesToday,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isVerified: true } }),
      this.matchRepository.count({ where: { isActive: true } }),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.subscriptionRepository.count({ where: { isActive: true } }),
      this.messageRepository.count({
        where: {
          createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        },
      }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const usersByStatus = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    return {
      totalUsers,
      verifiedUsers,
      verificationRate: totalUsers ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : '0',
      totalMatches,
      pendingReports: totalReports,
      activeSubscriptions,
      messagesToday,
      usersByRole,
      usersByStatus,
    };
  }

  async getAllUsers(page = 1, limit = 20, filters?: { status?: string; role?: string; search?: string }) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }
    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR profile.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      items: users,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getUserDetails(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'profile', 'profile.interests', 'photos', 'subscription',
        'settings',
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    const matchesCount = await this.matchRepository.count({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
    });

    const reportsCount = await this.reportRepository.count({
      where: { reportedUserId: userId },
    });

    return {
      ...user,
      matchesCount,
      reportsCount,
    };
  }

  async suspendUser(userId: string, reason?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.SUSPENDED;
    await this.userRepository.save(user);
  }

  async banUser(userId: string, reason?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.BANNED;
    await this.userRepository.save(user);
  }

  async activateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);
  }

  async changeUserRole(userId: string, role: UserRole): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.role = role;
    await this.userRepository.save(user);
  }

  async getReports(page = 1, limit = 20, status?: ReportStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await this.reportRepository.findAndCount({
      where,
      relations: ['reporter', 'reportedUser', 'reportedUser.profile'],
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

  async resolveReport(reportId: string, adminId: string, resolution: string, action?: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = ReportStatus.RESOLVED;
    report.resolvedById = adminId;
    report.resolutionNotes = resolution;
    report.resolvedAt = new Date();

    if (action === 'suspend') {
      await this.suspendUser(report.reportedUserId, resolution);
    } else if (action === 'ban') {
      await this.banUser(report.reportedUserId, resolution);
    }

    await this.reportRepository.save(report);
  }

  async dismissReport(reportId: string, adminId: string, reason?: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = ReportStatus.DISMISSED;
    report.resolvedById = adminId;
    report.resolutionNotes = reason || 'Dismissed';
    report.resolvedAt = new Date();

    await this.reportRepository.save(report);
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const now = endDate || new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      newUsers, newMatches, newMessages, revenue,
    ] = await Promise.all([
      this.userRepository.count({
        where: { createdAt: Between(start, now) },
      }),
      this.matchRepository.count({
        where: { createdAt: Between(start, now) },
      }),
      this.messageRepository.count({
        where: { createdAt: Between(start, now) },
      }),
      this.subscriptionRepository.find({
        where: { createdAt: Between(start, now), isActive: true },
      }),
    ]);

    const totalRevenue = revenue.reduce(
      (sum, sub) => sum + Number(sub.price || 0), 0,
    );

    return {
      period: { start, end: now },
      newUsers,
      newMatches,
      newMessages,
      revenue: totalRevenue,
      subscriptionCount: revenue.length,
    };
  }

  async getAnalytics(): Promise<any> {
    const now = new Date();

    const dailyActiveUsers = await this.userRepository.count({
      where: {
        lastActiveAt: MoreThan(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        status: UserStatus.ACTIVE,
      },
    });

    const weeklyActiveUsers = await this.userRepository.count({
      where: {
        lastActiveAt: MoreThan(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
        status: UserStatus.ACTIVE,
      },
    });

    const monthlyActiveUsers = await this.userRepository.count({
      where: {
        lastActiveAt: MoreThan(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
        status: UserStatus.ACTIVE,
      },
    });

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      retentionRate: 'N/A',
      averageSessionTime: 'N/A',
    };
  }
}

function MoreThan(date: Date) { return date; }
function Between(start: Date, end: Date) { return [start, end]; }

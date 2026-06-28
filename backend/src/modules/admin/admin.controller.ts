import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { ReportStatus } from '../../database/entities/report.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(page, limit, { status, role, search });
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.suspendUser(id, reason);
  }

  @Patch('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.banUser(id, reason);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  async changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.changeUserRole(id, role);
  }

  @Get('reports')
  async getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ReportStatus,
  ) {
    return this.adminService.getReports(page, limit, status);
  }

  @Post('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @CurrentUser('sub') adminId: string,
    @Param('id') reportId: string,
    @Body('resolution') resolution: string,
    @Body('action') action?: string,
  ) {
    return this.adminService.resolveReport(reportId, adminId, resolution, action);
  }

  @Post('reports/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissReport(
    @CurrentUser('sub') adminId: string,
    @Param('id') reportId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.dismissReport(reportId, adminId, reason);
  }

  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}

import {
  Controller, Get, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  async updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(userId, dto);
  }

  @Get('me/settings')
  async getSettings(@CurrentUser('sub') userId: string) {
    return this.usersService.getSettings(userId);
  }

  @Put('me/settings')
  async updateSettings(@CurrentUser('sub') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(userId, dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('location')
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
    @Body('city') city?: string,
    @Body('country') country?: string,
  ) {
    return this.usersService.updateLocation(userId, latitude, longitude, city, country);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@CurrentUser('sub') userId: string) {
    return this.usersService.deactivateAccount(userId);
  }
}

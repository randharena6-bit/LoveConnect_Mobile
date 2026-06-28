import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddPhotosDto } from './dto/add-photos.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';

@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.profilesService.getProfile(userId);
  }

  @Post('me')
  async createProfile(@CurrentUser('sub') userId: string, @Body() dto: CreateProfileDto) {
    return this.profilesService.createProfile(userId, dto);
  }

  @Put('me')
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateProfile(userId, dto);
  }

  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    return this.profilesService.getProfileByUserId(userId);
  }

  @Post('me/photos')
  async addPhotos(@CurrentUser('sub') userId: string, @Body() dto: AddPhotosDto) {
    return this.profilesService.addPhotos(userId, dto);
  }

  @Delete('me/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(@CurrentUser('sub') userId: string, @Param('photoId') photoId: string) {
    return this.profilesService.deletePhoto(userId, photoId);
  }

  @Put('me/photos/reorder')
  async reorderPhotos(@CurrentUser('sub') userId: string, @Body() dto: ReorderPhotosDto) {
    return this.profilesService.reorderPhotos(userId, dto.photoIds);
  }

  @Put('me/photos/:photoId/profile-picture')
  async setProfilePicture(@CurrentUser('sub') userId: string, @Param('photoId') photoId: string) {
    return this.profilesService.updateProfilePicture(userId, photoId);
  }

  @Get('interests/all')
  async getAllInterests() {
    return this.profilesService.getAllInterests();
  }

  @Get('interests/search')
  async searchInterests(@Query('q') query: string) {
    return this.profilesService.searchInterests(query);
  }
}

import {
  Controller, Get, Post, Param, Query, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SwipeDirection } from '../../database/entities/swipe.entity';

@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('cards')
  async getCards(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('minAge') minAge?: number,
    @Query('maxAge') maxAge?: number,
    @Query('maxDistance') maxDistance?: number,
    @Query('gender') gender?: string,
    @Query('interests') interests?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.discoveryService.getDiscoveryCards(
      userId,
      {
        minAge: minAge ? Number(minAge) : undefined,
        maxAge: maxAge ? Number(maxAge) : undefined,
        maxDistance: maxDistance ? Number(maxDistance) : undefined,
        gender,
        interests: interests?.split(','),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      },
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('suggestions')
  async getSuggestions(@CurrentUser('sub') userId: string) {
    return this.discoveryService.getDailySuggestions(userId);
  }

  @Get('likes')
  async getWhoLikedMe(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.discoveryService.getWhoLikedMe(userId, page, limit);
  }

  @Post('swipe')
  @HttpCode(HttpStatus.OK)
  async swipe(
    @CurrentUser('sub') userId: string,
    @Body('targetUserId') targetUserId: string,
    @Body('direction') direction: SwipeDirection,
  ) {
    return this.discoveryService.swipe(userId, targetUserId, direction);
  }

  @Post('super-like')
  @HttpCode(HttpStatus.OK)
  async superLike(
    @CurrentUser('sub') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    return this.discoveryService.superLike(userId, targetUserId);
  }
}

import {
  Controller, Get, Delete, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.matchesService.getMatches(userId, page, limit);
  }

  @Get('new/count')
  async getNewMatchesCount(@CurrentUser('sub') userId: string) {
    return this.matchesService.getNewMatchesCount(userId);
  }

  @Get(':id')
  async getMatch(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.matchesService.getMatchById(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unmatch(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.matchesService.unmatch(userId, id);
  }
}

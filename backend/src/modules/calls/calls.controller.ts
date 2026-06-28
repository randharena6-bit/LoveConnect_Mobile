import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CallType } from '../../database/entities/call.entity';

@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get('history')
  async getHistory(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.callsService.getCallHistory(userId, page, limit);
  }

  @Post('initiate')
  async initiateCall(
    @CurrentUser('sub') userId: string,
    @Body('calleeId') calleeId: string,
    @Body('callType') callType: CallType,
  ) {
    return this.callsService.initiateCall(userId, calleeId, callType);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptCall(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.callsService.acceptCall(id, userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectCall(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.callsService.rejectCall(id, userId);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  async endCall(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.callsService.endCall(id, userId);
  }
}

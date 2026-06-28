import {
  Controller, Get, Post, Delete, Param, Query, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessageContentType } from '../../database/entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getConversations(userId, page, limit);
  }

  @Post('conversations/:matchId')
  async createConversation(
    @CurrentUser('sub') userId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.chatService.getOrCreateConversation(userId, matchId);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(userId, conversationId, page, limit);
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      userId,
      conversationId,
      dto.content,
      dto.contentType || MessageContentType.TEXT,
      dto.replyToId,
    );
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.chatService.markAsRead(userId, conversationId, dto.messageIds);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @CurrentUser('sub') userId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(userId, messageId);
  }
}

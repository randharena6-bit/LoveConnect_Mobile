import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ChatService } from './chat.service';
import { MessageContentType } from '../../database/entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'default_secret');
      const payload = jwt.verify(token, secret) as any;
      client.userId = payload.sub;

      client.join(`user:${payload.sub}`);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      this.server.emit('user:online', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
          this.server.emit('user:offline', { userId: client.userId });
        }
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string; contentType?: MessageContentType; replyToId?: string },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        client.userId!,
        data.conversationId,
        data.content,
        data.contentType || MessageContentType.TEXT,
        data.replyToId,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:new', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:start', { userId: client.userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:stop', { userId: client.userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageIds: string[] },
  ) {
    try {
      await this.chatService.markAsRead(client.userId!, data.conversationId, data.messageIds);
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:read', { userId: client.userId, messageIds: data.messageIds });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; offer: any; callType: string },
  ) {
    client.to(`user:${data.targetUserId}`).emit('call:offer', {
      fromUserId: client.userId,
      offer: data.offer,
      callType: data.callType,
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; answer: any },
  ) {
    client.to(`user:${data.targetUserId}`).emit('call:answer', {
      fromUserId: client.userId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; candidate: any },
  ) {
    client.to(`user:${data.targetUserId}`).emit('call:ice-candidate', {
      fromUserId: client.userId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string },
  ) {
    client.to(`user:${data.targetUserId}`).emit('call:end', {
      fromUserId: client.userId,
    });
  }
}

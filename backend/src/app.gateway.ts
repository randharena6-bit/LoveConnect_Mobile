import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query?.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);
      this.server.emit('user:online', { userId, timestamp: new Date() });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query?.userId as string;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('user:offline', { userId, timestamp: new Date() });
        }
      }
    }
  }

  @SubscribeMessage('presence:online')
  handlePresenceOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.server.emit('presence:status', { userId: data.userId, status: 'online' });
  }

  @SubscribeMessage('presence:offline')
  handlePresenceOffline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.server.emit('presence:status', { userId: data.userId, status: 'offline' });
  }

  @SubscribeMessage('events:subscribe')
  handleSubscribeToEvents(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    client.join(`events:${data.userId}`);
  }

  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }
}

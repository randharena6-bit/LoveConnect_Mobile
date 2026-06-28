import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message, MessageContentType } from '../../database/entities/message.entity';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { Notification, NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getOrCreateConversation(userId: string, matchId: string): Promise<Conversation> {
    const match = await this.matchRepository.findOne({ where: { id: matchId, isActive: true } });
    if (!match) throw new NotFoundException('Match not found');

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this match');
    }

    let conversation = await this.conversationRepository.findOne({
      where: { matchId },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({ matchId });
      conversation = await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    contentType: MessageContentType = MessageContentType.TEXT,
    replyToId?: string,
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['match'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const match = conversation.match;
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;

    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      contentType,
      content,
      replyToId: replyToId || undefined,
    });
    const savedMessage = await this.messageRepository.save(message);

    conversation.lastMessageId = savedMessage.id;
    conversation.lastMessageContent = content;
    conversation.lastMessageAt = savedMessage.createdAt;
    await this.conversationRepository.save(conversation);

    const notification = this.notificationRepository.create({
      userId: otherUserId,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nouveau message',
      body: content.substring(0, 100),
      data: { conversationId, messageId: savedMessage.id, senderId: userId },
    });
    await this.notificationRepository.save(notification);

    return savedMessage;
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 50) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['match'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const match = conversation.match;
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['sender', 'sender.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: messages.reverse().map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.sender?.profile?.name,
        senderPicture: msg.sender?.profile?.profilePictureUrl,
        contentType: msg.contentType,
        content: msg.content,
        replyToId: msg.replyToId,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      })),
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async markAsRead(userId: string, conversationId: string, messageIds: string[]): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['match'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const match = conversation.match;
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    await this.messageRepository.update(
      { id: In(messageIds), conversationId, senderId: Not(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.match'],
    });
    if (!message) throw new NotFoundException('Message not found');

    const match = message.conversation.match;
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this conversation');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';
    await this.messageRepository.save(message);
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    const matchIds = await this.matchRepository.find({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
      select: ['id'],
    });

    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: { matchId: In(matchIds.map((m) => m.id)) },
      relations: [
        'match', 'match.user1', 'match.user1.profile',
        'match.user2', 'match.user2.profile',
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { lastMessageAt: 'DESC', updatedAt: 'DESC' },
    });

    const formatted = conversations.map((conv) => {
      const otherUser = conv.match.user1Id === userId
        ? conv.match.user2
        : conv.match.user1;
      return {
        id: conv.id,
        matchId: conv.matchId,
        user: {
          id: otherUser.id,
          name: otherUser.profile?.name,
          profilePictureUrl: otherUser.profile?.profilePictureUrl,
          isOnline: otherUser.isOnline,
        },
        lastMessage: conv.lastMessageContent,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: 0,
      };
    });

    return {
      items: formatted,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

function In(ids: string[]) { return ids; }
function Not(value: string) { return value; }

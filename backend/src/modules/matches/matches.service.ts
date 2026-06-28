import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Match } from '../../database/entities/match.entity';
import { Like } from '../../database/entities/like.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { User } from '../../database/entities/user.entity';
import { Notification, NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getMatches(userId: string, page = 1, limit = 20) {
    const [matches, total] = await this.matchRepository.findAndCount({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
      relations: [
        'user1', 'user1.profile',
        'user2', 'user2.profile',
        'conversation',
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const formatted = matches.map((match) => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        matchId: match.id,
        user: {
          id: otherUser.id,
          name: otherUser.profile?.name,
          age: otherUser.profile?.age,
          profilePictureUrl: otherUser.profile?.profilePictureUrl,
          isOnline: otherUser.isOnline,
          lastActiveAt: otherUser.lastActiveAt,
        },
        conversation: match.conversation
          ? {
              id: match.conversation.id,
              lastMessageContent: match.conversation.lastMessageContent,
              lastMessageAt: match.conversation.lastMessageAt,
            }
          : null,
        matchedAt: match.createdAt,
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

  async getMatchById(userId: string, matchId: string): Promise<any> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, isActive: true },
      relations: [
        'user1', 'user1.profile',
        'user2', 'user2.profile',
        'conversation',
      ],
    });

    if (!match) throw new NotFoundException('Match not found');

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this match');
    }

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;

    return {
      id: match.id,
      user: {
        id: otherUser.id,
        name: otherUser.profile?.name,
        age: otherUser.profile?.age,
        profilePictureUrl: otherUser.profile?.profilePictureUrl,
        bio: otherUser.profile?.bio,
        isOnline: otherUser.isOnline,
      },
      matchedAt: match.createdAt,
      conversationId: match.conversation?.id,
    };
  }

  async unmatch(userId: string, matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, isActive: true },
    });

    if (!match) throw new NotFoundException('Match not found');

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not part of this match');
    }

    match.isActive = false;
    await this.matchRepository.save(match);
  }

  async getNewMatchesCount(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'lastActiveAt'],
    });

    if (!user?.lastActiveAt) return 0;

    return this.matchRepository.count({
      where: [
        { user1Id: userId, createdAt: In([user.lastActiveAt]) },
        { user2Id: userId, createdAt: In([user.lastActiveAt]) },
      ],
    });
  }
}

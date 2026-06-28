import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In, Not, Brackets } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Swipe, SwipeDirection } from '../../database/entities/swipe.entity';
import { Like, LikeType } from '../../database/entities/like.entity';
import { Match } from '../../database/entities/match.entity';
import { Block } from '../../database/entities/block.entity';
import { Interest } from '../../database/entities/interest.entity';

interface DiscoveryFilters {
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
  gender?: string;
  interests?: string[];
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  async getDiscoveryCards(userId: string, filters: DiscoveryFilters, page = 1, limit = 20) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.interests', 'settings'],
    });
    if (!user) throw new NotFoundException('User not found');

    const blockedUserIds = await this.getBlockedUserIds(userId);
    const swipedUserIds = await this.getSwipedUserIds(userId);
    const likedUserIds = await this.getLikedUserIds(userId);

    const excludeIds = [...blockedUserIds, ...swipedUserIds, ...likedUserIds, userId];

    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.interests', 'interests')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.id NOT IN (:...excludeIds)', { excludeIds })
      .andWhere('profile.gender != :userGender', { userGender: user.profile?.gender })
      .select()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('profile.popularityScore', 'DESC')
      .addOrderBy('user.lastActiveAt', 'DESC');

    if (filters.minAge) {
      queryBuilder.andWhere('profile.age >= :minAge', { minAge: filters.minAge });
    }
    if (filters.maxAge) {
      queryBuilder.andWhere('profile.age <= :maxAge', { maxAge: filters.maxAge });
    }
    if (filters.gender) {
      queryBuilder.andWhere('profile.gender = :gender', { gender: filters.gender });
    }
    if (filters.latitude && filters.longitude && filters.maxDistance) {
      const earthRadius = 6371;
      const latRad = (filters.latitude * Math.PI) / 180;
      queryBuilder.andWhere(
        `(
          ${earthRadius} * acos(
            cos(radians(:lat)) * cos(radians(user.latitude)) *
            cos(radians(user.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(user.latitude))
          )
        ) <= :maxDistance`,
        {
          lat: filters.latitude,
          lng: filters.longitude,
          maxDistance: filters.maxDistance,
        },
      );
    }
    if (filters.interests?.length) {
      queryBuilder.andWhere(
        'interests.id IN (:...interestIds)',
        { interestIds: filters.interests },
      );
    }

    const [profiles, total] = await queryBuilder.getManyAndCount();

    const recommendations = profiles.map((profile) => ({
      id: profile.userId,
      profile: {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        bio: profile.bio,
        photos: [],
        interests: profile.interests,
        profilePictureUrl: profile.profilePictureUrl,
        profession: profile.profession,
        education: profile.education,
        distance: this.calculateDistance(
          user.latitude, user.longitude,
          profile.user.latitude, profile.user.longitude,
        ),
      },
      compatibilityScore: this.calculateCompatibility(user.profile, profile),
    }));

    return {
      items: recommendations,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async swipe(userId: string, targetUserId: string, direction: SwipeDirection): Promise<any> {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot swipe on yourself');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, status: UserStatus.ACTIVE },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    const existingSwipe = await this.swipeRepository.findOne({
      where: { userId, targetUserId },
    });
    if (existingSwipe) {
      throw new BadRequestException('Already swiped on this user');
    }

    const swipe = this.swipeRepository.create({
      userId,
      targetUserId,
      direction,
    });
    await this.swipeRepository.save(swipe);

    if (direction === SwipeDirection.RIGHT) {
      const like = this.likeRepository.create({
        fromUserId: userId,
        toUserId: targetUserId,
        type: LikeType.LIKE,
      });
      await this.likeRepository.save(like);

      const reciprocal = await this.likeRepository.findOne({
        where: { fromUserId: targetUserId, toUserId: userId },
      });

      if (reciprocal) {
        await this.likeRepository.update(
          { fromUserId: userId, toUserId: targetUserId },
          { isMatch: true },
        );
        await this.likeRepository.update(
          { fromUserId: targetUserId, toUserId: userId },
          { isMatch: true },
        );

        const match = this.matchRepository.create({
          user1Id: userId,
          user2Id: targetUserId,
          isActive: true,
        });
        const savedMatch = await this.matchRepository.save(match);

        return { match: true, matchId: savedMatch.id, direction: 'right' };
      }

      return { match: false, direction: 'right' };
    }

    return { match: false, direction: 'left' };
  }

  async superLike(userId: string, targetUserId: string): Promise<any> {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot super like yourself');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, status: UserStatus.ACTIVE },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    const like = this.likeRepository.create({
      fromUserId: userId,
      toUserId: targetUserId,
      type: LikeType.SUPER_LIKE,
    });
    await this.likeRepository.save(like);

    const reciprocal = await this.likeRepository.findOne({
      where: { fromUserId: targetUserId, toUserId: userId },
    });

    if (reciprocal) {
      await this.likeRepository.update(
        { fromUserId: userId, toUserId: targetUserId },
        { isMatch: true },
      );
      await this.likeRepository.update(
        { fromUserId: targetUserId, toUserId: userId },
        { isMatch: true },
      );

      const match = this.matchRepository.create({
        user1Id: userId,
        user2Id: targetUserId,
        isActive: true,
      });
      const savedMatch = await this.matchRepository.save(match);

      return { match: true, matchId: savedMatch.id, type: 'super_like' };
    }

    return { match: false, type: 'super_like' };
  }

  async getDailySuggestions(userId: string): Promise<any> {
    return this.getDiscoveryCards(userId, {}, 1, 10);
  }

  async getWhoLikedMe(userId: string, page = 1, limit = 20) {
    const [likes, total] = await this.likeRepository.findAndCount({
      where: { toUserId: userId, isMatch: false },
      relations: ['fromUser', 'fromUser.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const users = likes.map((like) => ({
      id: like.fromUserId,
      name: like.fromUser.profile?.name,
      age: like.fromUser.profile?.age,
      profilePictureUrl: like.fromUser.profile?.profilePictureUrl,
      type: like.type,
      likedAt: like.createdAt,
    }));

    return {
      items: users,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.blockRepository.find({
      where: { blockerId: userId },
      select: ['blockedId'],
    });
    const blockedBy = await this.blockRepository.find({
      where: { blockedId: userId },
      select: ['blockerId'],
    });
    return [
      ...blocks.map((b) => b.blockedId),
      ...blockedBy.map((b) => b.blockerId),
    ];
  }

  private async getSwipedUserIds(userId: string): Promise<string[]> {
    const swipes = await this.swipeRepository.find({
      where: { userId },
      select: ['targetUserId'],
    });
    return swipes.map((s) => s.targetUserId);
  }

  private async getLikedUserIds(userId: string): Promise<string[]> {
    const likes = await this.likeRepository.find({
      where: { fromUserId: userId },
      select: ['toUserId'],
    });
    return likes.map((l) => l.toUserId);
  }

  private calculateDistance(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number | null {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calculateCompatibility(userProfile?: Profile, targetProfile?: Profile): number {
    if (!userProfile || !targetProfile) return 50;
    let score = 50;

    if (userProfile.interests?.length && targetProfile.interests?.length) {
      const userInterestIds = new Set(userProfile.interests.map((i) => i.id));
      const common = targetProfile.interests.filter((i) => userInterestIds.has(i.id));
      score += Math.min(common.length * 5, 20);
    }

    const ageDiff = Math.abs((userProfile.age || 25) - (targetProfile.age || 25));
    if (ageDiff <= 3) score += 10;
    else if (ageDiff <= 7) score += 5;

    if (userProfile.education && targetProfile.education &&
        userProfile.education === targetProfile.education) {
      score += 5;
    }

    if (userProfile.languages?.length && targetProfile.languages?.length) {
      const commonLangs = userProfile.languages.filter((l) =>
        targetProfile.languages?.includes(l),
      );
      if (commonLangs.length > 0) score += 10;
    }

    return Math.min(score, 100);
  }
}

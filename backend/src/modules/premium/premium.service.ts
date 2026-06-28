import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionProvider } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { userId, isActive: true } });
  }

  async subscribe(
    userId: string,
    plan: SubscriptionPlan,
    provider: SubscriptionProvider,
    providerSubscriptionId?: string,
    providerCustomerId?: string,
  ): Promise<Subscription> {
    const existing = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (existing) {
      throw new ConflictException('Already have an active subscription');
    }

    const prices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.PREMIUM]: 9.99,
      [SubscriptionPlan.GOLD]: 19.99,
      [SubscriptionPlan.PLATINUM]: 29.99,
    };

    const boosts: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.PREMIUM]: 5,
      [SubscriptionPlan.GOLD]: 15,
      [SubscriptionPlan.PLATINUM]: 30,
    };

    const superLikes: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.PREMIUM]: 5,
      [SubscriptionPlan.GOLD]: 10,
      [SubscriptionPlan.PLATINUM]: 20,
    };

    const durationDays: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.PREMIUM]: 30,
      [SubscriptionPlan.GOLD]: 30,
      [SubscriptionPlan.PLATINUM]: 30,
    };

    const subscription = this.subscriptionRepository.create({
      userId,
      plan,
      provider,
      providerSubscriptionId,
      providerCustomerId,
      price: prices[plan],
      currency: 'USD',
      boostsRemaining: boosts[plan],
      superLikesRemaining: superLikes[plan],
      startDate: new Date(),
      endDate: new Date(Date.now() + durationDays[plan] * 24 * 60 * 60 * 1000),
      isActive: true,
      autoRenew: true,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription) throw new NotFoundException('No active subscription');

    subscription.autoRenew = false;
    await this.subscriptionRepository.save(subscription);
  }

  async getPlanFeatures(plan: SubscriptionPlan): Promise<Record<string, boolean | number>> {
    const features = {
      [SubscriptionPlan.PREMIUM]: {
        unlimitedLikes: true,
        seeWhoLikedYou: true,
        visibilityBoost: false,
        extraSuperLikes: 5,
        advancedFilters: true,
        invisibleMode: false,
        unlimitedRewind: false,
        monthlyBoosts: 5,
      },
      [SubscriptionPlan.GOLD]: {
        unlimitedLikes: true,
        seeWhoLikedYou: true,
        visibilityBoost: true,
        extraSuperLikes: 10,
        advancedFilters: true,
        invisibleMode: true,
        unlimitedRewind: false,
        monthlyBoosts: 15,
      },
      [SubscriptionPlan.PLATINUM]: {
        unlimitedLikes: true,
        seeWhoLikedYou: true,
        visibilityBoost: true,
        extraSuperLikes: 20,
        advancedFilters: true,
        invisibleMode: true,
        unlimitedRewind: true,
        monthlyBoosts: 30,
      },
    };

    return features[plan];
  }

  async purchaseBoosts(userId: string, quantity: number): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription) throw new BadRequestException('No active subscription');

    subscription.boostsRemaining += quantity;
    await this.subscriptionRepository.save(subscription);
  }

  async purchaseSuperLikes(userId: string, quantity: number): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription) throw new BadRequestException('No active subscription');

    subscription.superLikesRemaining += quantity;
    await this.subscriptionRepository.save(subscription);
  }

  async useBoost(userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription || subscription.boostsRemaining <= 0) {
      throw new BadRequestException('No boosts available');
    }

    subscription.boostsRemaining -= 1;
    await this.subscriptionRepository.save(subscription);
  }

  async useSuperLike(userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription || subscription.superLikesRemaining <= 0) {
      throw new BadRequestException('No super likes available');
    }

    subscription.superLikesRemaining -= 1;
    await this.subscriptionRepository.save(subscription);
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    if (!subscription) return false;

    const features = await this.getPlanFeatures(subscription.plan);
    return features[feature] === true || (typeof features[feature] === 'number' && features[feature] > 0);
  }
}

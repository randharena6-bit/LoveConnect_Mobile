import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PremiumService } from './premium.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionPlan, SubscriptionProvider } from '../../database/entities/subscription.entity';

@UseGuards(JwtAuthGuard)
@Controller('premium')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get('subscription')
  async getSubscription(@CurrentUser('sub') userId: string) {
    return this.premiumService.getSubscription(userId);
  }

  @Post('subscribe')
  async subscribe(
    @CurrentUser('sub') userId: string,
    @Body('plan') plan: SubscriptionPlan,
    @Body('provider') provider: SubscriptionProvider,
    @Body('providerSubscriptionId') providerSubscriptionId?: string,
    @Body('providerCustomerId') providerCustomerId?: string,
  ) {
    return this.premiumService.subscribe(
      userId, plan, provider, providerSubscriptionId, providerCustomerId,
    );
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser('sub') userId: string) {
    return this.premiumService.cancelSubscription(userId);
  }

  @Get('plans/:plan')
  async getPlanFeatures(@Param('plan') plan: SubscriptionPlan) {
    return this.premiumService.getPlanFeatures(plan);
  }

  @Get('features/:feature')
  async checkFeatureAccess(
    @CurrentUser('sub') userId: string,
    @Param('feature') feature: string,
  ) {
    return this.premiumService.checkFeatureAccess(userId, feature);
  }

  @Post('boosts')
  @HttpCode(HttpStatus.OK)
  async purchaseBoosts(
    @CurrentUser('sub') userId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.premiumService.purchaseBoosts(userId, quantity);
  }

  @Post('super-likes')
  @HttpCode(HttpStatus.OK)
  async purchaseSuperLikes(
    @CurrentUser('sub') userId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.premiumService.purchaseSuperLikes(userId, quantity);
  }

  @Post('use-boost')
  @HttpCode(HttpStatus.OK)
  async useBoost(@CurrentUser('sub') userId: string) {
    return this.premiumService.useBoost(userId);
  }

  @Post('use-super-like')
  @HttpCode(HttpStatus.OK)
  async useSuperLike(@CurrentUser('sub') userId: string) {
    return this.premiumService.useSuperLike(userId);
  }
}

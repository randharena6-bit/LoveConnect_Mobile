import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

export enum SubscriptionPlan {
  PREMIUM = 'premium',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum SubscriptionProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  STRIPE = 'stripe',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.subscription, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionProvider,
    default: SubscriptionProvider.STRIPE,
  })
  provider: SubscriptionProvider;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  providerSubscriptionId: string;

  @Column({ nullable: true })
  providerCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: 0 })
  boostsRemaining: number;

  @Column({ default: 0 })
  superLikesRemaining: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

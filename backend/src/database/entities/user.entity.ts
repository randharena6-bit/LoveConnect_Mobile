import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, OneToMany, Index
} from 'typeorm';
import { Profile } from './profile.entity';
import { Photo } from './photo.entity';
import { Like } from './like.entity';
import { Match } from './match.entity';
import { Message } from './message.entity';
import { Block } from './block.entity';
import { Report } from './report.entity';
import { Subscription } from './subscription.entity';
import { Notification } from './notification.entity';
import { UserSettings } from './settings.entity';
import { Swipe } from './swipe.entity';
import { Call } from './call.entity';

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  PHONE = 'phone',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  email: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  authProviderId: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isIdentityVerified: boolean;

  @Column({ nullable: true })
  verificationSelfieUrl: string;

  @Column({ nullable: true })
  identityDocUrl: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastActiveAt: Date;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => Photo, (photo) => photo.user, { cascade: true })
  photos: Photo[];

  @OneToMany(() => Like, (like) => like.fromUser)
  likesGiven: Like[];

  @OneToMany(() => Like, (like) => like.toUser)
  likesReceived: Like[];

  @OneToMany(() => Match, (match) => match.user1)
  matchesAsUser1: Match[];

  @OneToMany(() => Match, (match) => match.user2)
  matchesAsUser2: Match[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Block, (block) => block.blocker)
  blocksMade: Block[];

  @OneToMany(() => Block, (block) => block.blocked)
  blocksReceived: Block[];

  @OneToMany(() => Report, (report) => report.reporter)
  reportsMade: Report[];

  @OneToMany(() => Report, (report) => report.reportedUser)
  reportsReceived: Report[];

  @OneToOne(() => Subscription, (subscription) => subscription.user, { cascade: true })
  subscription: Subscription;

  @OneToMany(() => Notification, (notification) => notification.user, { cascade: true })
  notifications: Notification[];

  @OneToOne(() => UserSettings, (settings) => settings.user, { cascade: true })
  settings: UserSettings;

  @OneToMany(() => Swipe, (swipe) => swipe.user)
  swipes: Swipe[];

  @OneToMany(() => Call, (call) => call.caller)
  callsMade: Call[];

  @OneToMany(() => Call, (call) => call.callee)
  callsReceived: Call[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  NEW_LIKE = 'new_like',
  NEW_MATCH = 'new_match',
  NEW_MESSAGE = 'new_message',
  PROFILE_VISIT = 'profile_visit',
  SUPER_LIKE = 'super_like',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  BOOST_EXPIRED = 'boost_expired',
  ADMIN_MESSAGE = 'admin_message',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

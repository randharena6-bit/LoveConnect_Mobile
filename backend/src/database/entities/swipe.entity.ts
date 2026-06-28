import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

@Entity('swipes')
@Index(['userId', 'targetUserId'], { unique: true })
export class Swipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.swipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column()
  targetUserId: string;

  @Column({
    type: 'enum',
    enum: SwipeDirection,
  })
  direction: SwipeDirection;

  @CreateDateColumn()
  createdAt: Date;
}

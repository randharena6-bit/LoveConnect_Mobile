import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';

export enum LikeType {
  LIKE = 'like',
  SUPER_LIKE = 'super_like',
}

@Entity('likes')
@Index(['fromUserId', 'toUserId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.likesGiven, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @Column()
  fromUserId: string;

  @ManyToOne(() => User, (user) => user.likesReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @Column()
  toUserId: string;

  @Column({
    type: 'enum',
    enum: LikeType,
    default: LikeType.LIKE,
  })
  type: LikeType;

  @Column({ default: false })
  isMatch: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

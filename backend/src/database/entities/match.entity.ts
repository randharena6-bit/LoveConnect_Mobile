import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToOne, OneToMany
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.matchesAsUser1, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1_id' })
  user1: User;

  @Column()
  user1Id: string;

  @ManyToOne(() => User, (user) => user.matchesAsUser2, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2_id' })
  user2: User;

  @Column()
  user2Id: string;

  @Column({ default: false })
  isActive: boolean;

  @OneToOne(() => Conversation, (conversation) => conversation.match, { cascade: true })
  conversation: Conversation;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ default: true })
  showAge: boolean;

  @Column({ default: true })
  showDistance: boolean;

  @Column({ default: false })
  showOnlineStatus: boolean;

  @Column({ default: true })
  readReceipts: boolean;

  @Column({ default: 50 })
  discoveryRadius: number;

  @Column({ default: 18 })
  minAgePreference: number;

  @Column({ default: 60 })
  maxAgePreference: number;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: true })
  newLikeNotification: boolean;

  @Column({ default: true })
  newMatchNotification: boolean;

  @Column({ default: true })
  newMessageNotification: boolean;

  @Column({ default: false })
  profileVisitNotification: boolean;

  @Column({ default: false })
  invisibleMode: boolean;

  @Column({ default: false })
  showGender: boolean;

  @Column({ nullable: true })
  preferredGender: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

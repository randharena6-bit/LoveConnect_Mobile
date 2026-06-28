import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  MISSED = 'missed',
  REJECTED = 'rejected',
}

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.callsMade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caller_id' })
  caller: User;

  @Column()
  callerId: string;

  @ManyToOne(() => User, (user) => user.callsReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callee_id' })
  callee: User;

  @Column()
  calleeId: string;

  @Column({
    type: 'enum',
    enum: CallType,
  })
  callType: CallType;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.INITIATED,
  })
  status: CallStatus;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, ManyToMany, JoinTable, OneToOne
} from 'typeorm';
import { User } from './user.entity';
import { Interest } from './interest.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
}

export enum Orientation {
  HETEROSEXUAL = 'heterosexual',
  HOMOSEXUAL = 'homosexual',
  BISEXUAL = 'bisexual',
  PANSEXUAL = 'pansexual',
  ASEXUAL = 'asexual',
  OTHER = 'other',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'int', default: 0 })
  age: number;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: Orientation,
    default: Orientation.HETEROSEXUAL,
  })
  orientation: Orientation;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  education: string;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column('simple-array', { nullable: true })
  languages: string[];

  @Column({ nullable: true })
  religion: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  favoriteMusic: string;

  @Column({ nullable: true })
  hobbies: string;

  @Column({ default: 0 })
  popularityScore: number;

  @ManyToMany(() => Interest)
  @JoinTable({
    name: 'profile_interests',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests: Interest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

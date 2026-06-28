import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  iconUrl: string;

  @ManyToMany(() => Profile, (profile) => profile.interests)
  profiles: Profile[];

  @CreateDateColumn()
  createdAt: Date;
}

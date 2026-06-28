import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Match } from '../../database/entities/match.entity';
import { Report } from '../../database/entities/report.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Message } from '../../database/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Match, Report, Subscription, Message]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

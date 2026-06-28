import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Swipe } from '../../database/entities/swipe.entity';
import { Like } from '../../database/entities/like.entity';
import { Match } from '../../database/entities/match.entity';
import { Block } from '../../database/entities/block.entity';
import { Interest } from '../../database/entities/interest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Swipe, Like, Match, Block, Interest]),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { UserSettings } from '../../database/entities/settings.entity';
import { Profile } from '../../database/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSettings, Profile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

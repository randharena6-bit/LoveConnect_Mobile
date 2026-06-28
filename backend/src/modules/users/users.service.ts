import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { UserSettings } from '../../database/entities/settings.entity';
import { Profile } from '../../database/entities/profile.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { status: UserStatus.ACTIVE },
      relations: ['profile', 'photos'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'profile', 'profile.interests', 'photos', 'subscription',
        'settings',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email) user.email = dto.email;
    if (dto.phone) user.phone = dto.phone;
    if (dto.city) user.city = dto.city;
    if (dto.country) user.country = dto.country;
    if (dto.latitude !== undefined) user.latitude = dto.latitude;
    if (dto.longitude !== undefined) user.longitude = dto.longitude;

    return this.userRepository.save(user);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }

    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const settings = await this.settingsRepository.findOne({ where: { userId } });
    if (!settings) {
      return this.settingsRepository.save(
        this.settingsRepository.create({ userId }),
      );
    }
    return settings;
  }

  async uploadSelfie(userId: string, selfieUrl: string): Promise<void> {
    await this.userRepository.update(userId, {
      verificationSelfieUrl: selfieUrl,
    });
  }

  async verifySelfie(userId: string, verified: boolean): Promise<void> {
    await this.userRepository.update(userId, {
      isVerified: verified,
    });
  }

  async verifyIdentity(userId: string, docUrl: string): Promise<void> {
    await this.userRepository.update(userId, {
      identityDocUrl: docUrl,
    });
  }

  async approveIdentity(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isIdentityVerified: true,
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number, city?: string, country?: string): Promise<void> {
    await this.userRepository.update(userId, {
      latitude,
      longitude,
      city,
      country,
    });
  }

  async deactivateAccount(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      status: UserStatus.INACTIVE,
      isOnline: false,
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.userRepository.softDelete(userId);
  }
}

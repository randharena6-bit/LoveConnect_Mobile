import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, Gender, Orientation } from '../../database/entities/profile.entity';
import { Interest } from '../../database/entities/interest.entity';
import { Photo } from '../../database/entities/photo.entity';
import { User } from '../../database/entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddPhotosDto } from './dto/add-photos.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['interests', 'user'],
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile> {
    return this.getProfile(userId);
  }

  async createProfile(userId: string, dto: CreateProfileDto): Promise<Profile> {
    const existing = await this.profileRepository.findOne({ where: { userId } });
    if (existing) throw new ConflictException('Profile already exists');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const birthDate = new Date(dto.birthDate);
    const age = this.calculateAge(birthDate);

    const profile = this.profileRepository.create({
      userId,
      name: dto.name,
      birthDate,
      age,
      gender: dto.gender as Gender,
      orientation: (dto.orientation as Orientation) || Orientation.HETEROSEXUAL,
      profession: dto.profession,
      education: dto.education,
      height: dto.height,
      languages: dto.languages,
      religion: dto.religion,
      bio: dto.bio,
      favoriteMusic: dto.favoriteMusic,
      hobbies: dto.hobbies,
    });

    const saved = await this.profileRepository.save(profile);

    if (dto.interests?.length) {
      const interests = await this.interestRepository.findByIds(dto.interests);
      saved.interests = interests;
      await this.profileRepository.save(saved);
    }

    return saved;
  }

  async updateProfile(userId: string, dto: Partial<CreateProfileDto>): Promise<Profile> {
    const profile = await this.getProfile(userId);

    if (dto.name !== undefined) profile.name = dto.name;
    if (dto.birthDate !== undefined) {
      profile.birthDate = new Date(dto.birthDate);
      profile.age = this.calculateAge(profile.birthDate);
    }
    if (dto.gender !== undefined) profile.gender = dto.gender as Gender;
    if (dto.orientation !== undefined) profile.orientation = dto.orientation as Orientation;
    if (dto.profession !== undefined) profile.profession = dto.profession;
    if (dto.education !== undefined) profile.education = dto.education;
    if (dto.height !== undefined) profile.height = dto.height;
    if (dto.languages !== undefined) profile.languages = dto.languages;
    if (dto.religion !== undefined) profile.religion = dto.religion;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.favoriteMusic !== undefined) profile.favoriteMusic = dto.favoriteMusic;
    if (dto.hobbies !== undefined) profile.hobbies = dto.hobbies;

    if (dto.interests !== undefined) {
      const interests = await this.interestRepository.findByIds(dto.interests);
      profile.interests = interests;
    }

    return this.profileRepository.save(profile);
  }

  async addPhotos(userId: string, dto: AddPhotosDto): Promise<Photo[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingCount = await this.photoRepository.count({ where: { userId } });
    if (existingCount + dto.photos.length > 9) {
      throw new BadRequestException('Maximum 9 photos allowed');
    }

    const photos = dto.photos.map((url, index) =>
      this.photoRepository.create({
        userId,
        url,
        sortOrder: existingCount + index,
      }),
    );

    return this.photoRepository.save(photos);
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.photoRepository.remove(photo);
  }

  async reorderPhotos(userId: string, photoIds: string[]): Promise<void> {
    const photos = await this.photoRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC' },
    });

    const photoMap = new Map(photos.map((p) => [p.id, p]));
    for (let i = 0; i < photoIds.length; i++) {
      const photo = photoMap.get(photoIds[i]);
      if (photo) {
        photo.sortOrder = i;
        await this.photoRepository.save(photo);
      }
    }
  }

  async getAllInterests(): Promise<Interest[]> {
    return this.interestRepository.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  async searchInterests(query: string): Promise<Interest[]> {
    return this.interestRepository
      .createQueryBuilder('interest')
      .where('interest.name ILIKE :query', { query: `%${query}%` })
      .orderBy('interest.name', 'ASC')
      .take(20)
      .getMany();
  }

  async updateProfilePicture(userId: string, photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.profileRepository.update(
      { userId },
      { profilePictureUrl: photo.url },
    );
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

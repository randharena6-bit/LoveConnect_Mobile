import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User, AuthProvider, UserRole, UserStatus } from '../../database/entities/user.entity';
import { UserSettings } from '../../database/entities/settings.entity';
import { JwtPayload, AuthTokens } from '../../common/interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string, name: string): Promise<AuthTokens> {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepository.create({
      email,
      passwordHash,
      authProvider: AuthProvider.EMAIL,
      isVerified: false,
    });
    const savedUser = await this.userRepository.save(user);

    await this.settingsRepository.save(
      this.settingsRepository.create({ userId: savedUser.id }),
    );

    await this.userRepository.update(savedUser.id, {
      profile: { name, userId: savedUser.id } as any,
    });

    return this.generateTokens(savedUser);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { email, authProvider: AuthProvider.EMAIL },
      select: ['id', 'email', 'passwordHash', 'role', 'status', 'isTwoFactorEnabled'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is suspended or banned');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, {
      lastActiveAt: new Date(),
      isOnline: true,
    });

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'refreshToken', 'role', 'status'],
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is suspended or banned');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: null as any,
      isOnline: false,
    });
  }

  async handleOAuthLogin(provider: AuthProvider, providerId: string, email: string, name: string, picture?: string): Promise<AuthTokens> {
    let user = await this.userRepository.findOne({
      where: { authProvider: provider, authProviderId: providerId },
      relations: ['profile'],
    });

    if (!user && email) {
      user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        user.authProvider = provider;
        user.authProviderId = providerId;
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      user = this.userRepository.create({
        email,
        authProvider: provider,
        authProviderId: providerId,
        isVerified: true,
      });
      const savedUser = await this.userRepository.save(user);

      await this.settingsRepository.save(
        this.settingsRepository.create({ userId: savedUser.id }),
      );
    }

    await this.userRepository.update(user.id, {
      lastActiveAt: new Date(),
      isOnline: true,
    });

    return this.generateTokens(user);
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isVerified: true });
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = speakeasy.generateSecret({
      name: `Loveo:${userId}`,
    });

    await this.userRepository.update(userId, {
      twoFactorSecret: secret.base32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return { secret: secret.base32, qrCodeUrl };
  }

  async enableTwoFactor(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorSecret'],
    });

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('2FA not set up');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.userRepository.update(userId, { isTwoFactorEnabled: true });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null as any,
    });
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'twoFactorSecret'],
    });

    if (!user?.twoFactorSecret) return false;

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { passwordHash: newHash });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    this.logger.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await this.userRepository.update(payload.sub, { passwordHash });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.interests', 'photos', 'subscription', 'settings'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '30d' },
    );

    await this.userRepository.update(user.id, { refreshToken });

    return { accessToken, refreshToken };
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID') || '',
      teamID: configService.get<string>('APPLE_TEAM_ID') || '',
      keyID: configService.get<string>('APPLE_KEY_ID') || '',
      privateKeyLocation: configService.get<string>('APPLE_PRIVATE_KEY') || '',
      callbackURL: 'http://localhost:3000/auth/apple/callback',
      scope: ['email', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const user = {
      email: profile.email,
      name: profile.name?.firstName
        ? `${profile.name.firstName} ${profile.name.lastName || ''}`
        : 'Apple User',
      provider: 'apple',
      providerId: profile.id || profile.sub,
    };
    done(null, user);
  }
}

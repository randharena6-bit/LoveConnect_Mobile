import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: 'http://localhost:3000/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: `${name?.givenName} ${name?.familyName}`,
      picture: photos?.[0]?.value,
      provider: 'facebook',
      providerId: profile.id,
    };
    done(null, user);
  }
}

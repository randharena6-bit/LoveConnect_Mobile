export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

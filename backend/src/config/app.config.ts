import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  encryptionKey: process.env.ENCRYPTION_KEY || 'default_encryption_key_32chars',
  twoFactorAuthEnabled: process.env.TWO_FACTOR_AUTH_ENABLED === 'true',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'loveo',
  password: process.env.DATABASE_PASSWORD || 'loveo_secret',
  name: process.env.DATABASE_NAME || 'loveo_db',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));

export const s3Config = registerAs('s3', () => ({
  region: process.env.S3_REGION || 'us-east-1',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  bucket: process.env.S3_BUCKET || 'loveo-uploads',
}));

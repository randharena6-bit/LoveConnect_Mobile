import {
  IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsNotEmpty,
} from 'class-validator';
import { AuthProvider } from '../../../database/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  userId: string;

  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class SetupTwoFactorDto {
  @IsString()
  @IsOptional()
  method?: string;
}

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class OAuthLoginDto {
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  providerId: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  picture?: string;
}

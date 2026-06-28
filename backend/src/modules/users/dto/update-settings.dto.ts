import { IsBoolean, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsBoolean()
  @IsOptional()
  showAge?: boolean;

  @IsBoolean()
  @IsOptional()
  showDistance?: boolean;

  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;

  @IsBoolean()
  @IsOptional()
  readReceipts?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  discoveryRadius?: number;

  @IsNumber()
  @IsOptional()
  @Min(18)
  @Max(99)
  minAgePreference?: number;

  @IsNumber()
  @IsOptional()
  @Min(18)
  @Max(99)
  maxAgePreference?: number;

  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  newLikeNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  newMatchNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  newMessageNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  profileVisitNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  invisibleMode?: boolean;

  @IsString()
  @IsOptional()
  preferredGender?: string;
}

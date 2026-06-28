import {
  IsString, IsDateString, IsEnum, IsOptional, IsNumber,
  IsArray, MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'non_binary', 'other'])
  gender?: string;

  @IsOptional()
  @IsEnum(['heterosexual', 'homosexual', 'bisexual', 'pansexual', 'asexual', 'other'])
  orientation?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  favoriteMusic?: string;

  @IsOptional()
  @IsString()
  hobbies?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

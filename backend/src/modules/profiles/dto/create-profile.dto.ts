import {
  IsString, IsDateString, IsEnum, IsOptional, IsNumber,
  IsArray, MinLength, MaxLength, Min, Max,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(['male', 'female', 'non_binary', 'other'])
  gender: string;

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
  @Min(50)
  @Max(250)
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

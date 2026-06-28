import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class AddPhotosDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(9)
  photos: string[];
}

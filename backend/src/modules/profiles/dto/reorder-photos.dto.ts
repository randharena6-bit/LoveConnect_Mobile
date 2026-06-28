import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderPhotosDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  photoIds: string[];
}

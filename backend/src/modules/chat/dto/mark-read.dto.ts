import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  messageIds: string[];
}

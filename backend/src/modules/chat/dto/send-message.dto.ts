import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MessageContentType } from '../../../database/entities/message.entity';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageContentType)
  contentType?: MessageContentType;

  @IsOptional()
  @IsString()
  replyToId?: string;
}

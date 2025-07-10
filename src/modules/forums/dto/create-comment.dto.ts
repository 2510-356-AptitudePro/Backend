import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Yo pasé por la misma situación...', description: 'Contenido del comentario' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del post' })
  @IsUUID()
  postId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID del comentario padre (para respuestas)' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
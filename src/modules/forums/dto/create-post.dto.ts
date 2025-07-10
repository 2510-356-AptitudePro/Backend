import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: '¿Cómo elegir entre ingeniería y medicina?', description: 'Título del post' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'Estoy indeciso entre estas dos carreras...', description: 'Contenido del post' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del foro' })
  @IsUUID()
  forumId: string;
}
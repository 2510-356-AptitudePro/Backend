import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateForumDto {
  @ApiProperty({ example: 'Orientación Vocacional General', description: 'Nombre del foro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Foro para discutir temas generales de orientación vocacional', description: 'Descripción del foro' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'General', description: 'Categoría del foro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
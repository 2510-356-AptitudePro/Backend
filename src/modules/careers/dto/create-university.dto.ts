import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEmail,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUniversityDto {
  @ApiProperty({ example: 'Universidad Nacional Mayor de San Marcos', description: 'Nombre de la universidad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Universidad pública fundada en...', description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Pública', description: 'Tipo de universidad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional({ example: 'Av. Universitaria 1801', description: 'Dirección' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'Lima', description: 'Ciudad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Lima', description: 'Región' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ example: 'https://unmsm.edu.pe', description: 'Sitio web' })
  @IsOptional()
  @IsUrl()
  @MaxLength(100)
  website?: string;

  @ApiPropertyOptional({ example: '+51-1-6197000', description: 'Teléfono' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'info@unmsm.edu.pe', description: 'Email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: ['SUNEDU'], description: 'Acreditaciones' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accreditations?: string[];
}
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobProspectsDto {
  @ApiProperty({ example: 3500, description: 'Salario promedio mensual' })
  @IsNumber()
  @Min(0)
  averageSalary: number;

  @ApiProperty({ example: 85, description: 'Tasa de empleabilidad en porcentaje' })
  @IsNumber()
  @Min(0)
  @Max(100)
  employmentRate: number;

  @ApiProperty({ example: 'Alto', description: 'Proyección de crecimiento' })
  @IsString()
  @IsNotEmpty()
  growthProjection: string;

  @ApiProperty({ example: ['Desarrollador', 'Analista'], description: 'Trabajos comunes' })
  @IsArray()
  @IsString({ each: true })
  commonJobs: string[];
}

export class CreateCareerDto {
  @ApiProperty({ example: 'Ingeniería de Software', description: 'Nombre de la carrera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Carrera enfocada en desarrollo de software...', description: 'Descripción detallada' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Ingeniería y Tecnología', description: 'Campo de estudio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fieldOfStudy: string;

  @ApiPropertyOptional({ example: ['programación', 'lógica', 'matemáticas'], description: 'Habilidades requeridas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ type: JobProspectsDto, description: 'Perspectivas laborales' })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobProspectsDto)
  jobProspects?: JobProspectsDto;

  @ApiPropertyOptional({ example: 5, description: 'Duración en años' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  duration?: number = 4;

  @ApiPropertyOptional({ example: 'Ingeniería', description: 'Tipo de título' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  degreeType?: string;

  @ApiPropertyOptional({ example: 'Matemáticas, Programación...', description: 'Plan de estudios' })
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiPropertyOptional({ example: ['Matemáticas básicas'], description: 'Prerequisitos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ example: ['123e4567-e89b-12d3-a456-426614174000'], description: 'IDs de universidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universityIds?: string[];
}
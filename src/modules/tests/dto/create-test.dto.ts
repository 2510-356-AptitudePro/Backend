import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestType } from 'src/common/enums/test-type.enum';


export class CreateOptionDto {
  @ApiProperty({ example: 'Opción A', description: 'Contenido de la opción' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @ApiPropertyOptional({ example: false, description: 'Si es la respuesta correcta' })
  @IsOptional()
  isCorrect?: boolean = false;

  @ApiPropertyOptional({ example: 1, description: 'Puntos asignados a esta opción' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number = 0;

  @ApiPropertyOptional({ example: 1, description: 'Orden de la opción' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderIndex?: number = 1;
}

export class CreateQuestionDto {
  @ApiProperty({ example: '¿Cuál es tu materia favorita?', description: 'Contenido de la pregunta' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'URL de imagen opcional' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Intereses', description: 'Categoría de la pregunta' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 1, description: 'Puntos de la pregunta' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number = 1;

  @ApiPropertyOptional({ example: 1, description: 'Orden de la pregunta' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderIndex?: number = 1;

  @ApiProperty({ type: [CreateOptionDto], description: 'Opciones de respuesta' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateTestDto {
  @ApiProperty({ example: 'Test de Orientación Vocacional', description: 'Título del test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Este test te ayudará a descubrir tu vocación', description: 'Descripción del test' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: TestType, example: TestType.VOCATIONAL, description: 'Tipo de test' })
  @IsEnum(TestType)
  type: TestType;

  @ApiPropertyOptional({ example: 30, description: 'Duración en minutos (0 = sin límite)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  duration?: number = 0;

  @ApiPropertyOptional({ example: 'Lee cada pregunta cuidadosamente...', description: 'Instrucciones del test' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ type: [CreateQuestionDto], description: 'Preguntas del test' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
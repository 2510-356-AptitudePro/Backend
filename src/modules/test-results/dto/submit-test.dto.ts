import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la pregunta' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID de la opción seleccionada' })
  @IsOptional()
  @IsUUID()
  selectedOptionId?: string;

  @ApiPropertyOptional({ example: 'Mi respuesta abierta', description: 'Respuesta de texto libre' })
  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class SubmitTestDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del test' })
  @IsUUID()
  testId: string;

  @ApiProperty({ type: [SubmitAnswerDto], description: 'Respuestas del test' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @ApiPropertyOptional({ example: 1800, description: 'Tiempo empleado en segundos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number = 0;
}
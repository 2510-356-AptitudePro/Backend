import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del psicólogo' })
  @IsUUID()
  psychologistId: string;

  @ApiProperty({ example: '2024-06-15T10:00:00Z', description: 'Fecha y hora programada' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ example: 'Necesito orientación sobre...', description: 'Notas del estudiante' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  studentNotes?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duración en minutos' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(120)
  duration?: number = 60;
}
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus } from '../../../common/enums/consultation-status.enum';

export class UpdateConsultationDto {
  @ApiPropertyOptional({ enum: ConsultationStatus, description: 'Estado de la consulta' })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @ApiPropertyOptional({ example: 'Notas del psicólogo...', description: 'Notas del psicólogo' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  psychologistNotes?: string;

  @ApiPropertyOptional({ example: 'Recomendaciones...', description: 'Recomendaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendations?: string;

  @ApiPropertyOptional({ example: 4, description: 'Calificación (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Excelente atención...', description: 'Comentarios' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/xxx', description: 'URL de la reunión' })
  @IsOptional()
  @IsString()
  meetingUrl?: string;
}